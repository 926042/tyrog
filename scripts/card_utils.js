import { all_upgraders } from "../game_logic/upgrader.js";
import { all_skills } from "../game_logic/skill.js";
import { choice, exclude, move_to_container, px_to_vh, px_to_vw, remove_card_by_name } from "./utils.js"
import { player, update_money_display } from "./script.js";
import { calculate_value } from "../game_logic/game.js";


/**
 * Retrieves the player's current skills or upgraders.
 * 
 * @param {string} type The type of cards to retrieve ('Skill' or 'Upgrader').
 * @returns {Array} An array of the current cards, or an empty array if the type is invalid or the container is not found.

 * 
 * @example
 * const current_cards = get_current_cards('Skill');
 * console.log(current_cards); // Output: (3) [Surge, Rewind, Cleanse]
 *
 * // Card container:
 * <div id="skill-container" class="card-container">
 *     <card class="skill" data-index="0" style="">
 *        <div class="text-container" style="">
 *            <p>Surge</p>
 *        </div>
 *        <div class="card-controls">...</div>
 *    </card>
 *    <card class="skill" data-index="1" style="">
 *        <div class="text-container">
 *            <p>Rewind</p>
 *        </div>
 *        <div class="card-controls">...</div>
 *    </card>
 *    <card class="skill" data-index="2" style="">
 *        <div class="text-container">
 *            <p>Cleanse</p>
 *        </div>
 *        <div class="card-controls">...</div>
 *    </card>
 * </div>
*/
export function get_current_cards(type) {
    const valid_types = ['skill', 'upgrader'];
    if (!valid_types.includes(type)) {
        console.error(`Invalid type "${type}" passed to get_current_cards. Expected one of: ${valid_types.join(', ')}`);
        return [];
    }

    const container_id = (type === 'skill') ? 'skill-container' : 'upgrader-container';
    const container = document.getElementById(container_id)
    
    if (!container) {
        console.error(`Container element not found for type: ${type}`);
        return [];
    }

    const cards = (type === 'skill')
        ? [...container.children].map(card => card.skill)
        : [...container.children].map(card => card.upgrader);

    return cards;
}


export function initialize_cards(cards, container, type, func) {
    container.replaceChildren();
    
    for (let i = 0; i < cards.length; i++) {
        const card = create_card(i, cards[i], type, func);
        container.appendChild(card);
    }
}

export function pick_cards() {
    const upgrader_container = document.getElementById('upgrader-container-pick');
    const skill_container = document.getElementById('skill-container-pick');
    const upgraders = pick_random_cards('upgrader', 3);
    const skills = pick_random_cards('skill', 5);

    initialize_cards(upgraders, upgrader_container, 'upgrader', 'picking');
    initialize_cards(skills, skill_container, 'skill', 'picking');
    
}

export function pick_random_cards(type, amount, excluded_cards = [], weight_down = []) {
    const picked_cards = [];
    const cards = (type === 'skill') 
        ? all_skills
        : all_upgraders;
    const possible_picks = exclude([...cards], excluded_cards);

    const rarity_weights = {
        'C': 1,
        'UC': 0.8,
        'R': 0.6,
        'SR': 0.4,
        'SSR': 0.2
    };

    const card_weights = possible_picks.map(card => {
        const rarity_weight = rarity_weights[card.rarity] || 1; // Default weight if rarity is missing
        const down_weight = weight_down.includes(card) ? 0.05 : 1;
        return rarity_weight * down_weight;
    });

    for (let _ = 0; _ < amount; _++) {
        const total_weight = card_weights.reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * total_weight;

        let cumulative_weight = 0;
        let picked_card;
        for (let i = 0; i < possible_picks.length; i++) {
            cumulative_weight += card_weights[i];
            if (random <= cumulative_weight) {
                picked_card = possible_picks[i];
                possible_picks.splice(i, 1); // Remove card from possible picks
                card_weights.splice(i, 1); // Remove weight for the card
                break;
            }
        }
        picked_cards.push(picked_card);
    }

    return picked_cards;
}

export function create_card(index, skill_or_upgrader, type, func) {    
    const card = document.createElement('card'); // doing card instead of div since funny
    card.classList.add(type);  // type = 'skill' || 'upgrader'
    card.dataset.index = index;
    card.dataset.name = skill_or_upgrader.name;
    
    if (card.classList.contains('skill')) card.skill = skill_or_upgrader;
    if (card.classList.contains('upgrader')) card.upgrader = skill_or_upgrader;    
    
    const text_container = document.createElement('div');
    text_container.classList.add('text-container', 'flex-3')

    const card_text = document.createElement('p');
    card_text.textContent = `${skill_or_upgrader.name}`;
    
    text_container.appendChild(card_text);
    card.appendChild(text_container);

    if (func === 'gameround') {
        const controls = document.createElement('div');
        controls.classList.add('card-controls', 'flex-1');

        const left_arrow = document.createElement('button');
        left_arrow.classList.add('arrow');
        left_arrow.textContent = '←';
        left_arrow.onclick = () => move_card(card, 'l');

        const right_arrow = document.createElement('button');
        right_arrow.classList.add('arrow');
        right_arrow.textContent = '→';
        right_arrow.onclick = () => move_card(card, 'r');

        controls.appendChild(left_arrow);
        controls.appendChild(right_arrow);
        card.appendChild(controls);
    } else if (func === 'shop_buy') {
        const prices = {
            'C': 100,
            'UC': 150,
            'R': 200,
            'SR': 250,
            'SSR': 300
        };
        const price = prices[skill_or_upgrader.rarity];
    
        const price_text = document.createElement('p');
        price_text.textContent = `$${price}`;
        card.appendChild(price_text);

        const buy_button = document.createElement('button');
        buy_button.classList.add('shop-buy-button');
        buy_button.textContent = 'buy';        
        card.appendChild(buy_button);

        function can_buy() {
            return player.money >= price && player.has_available_slot(type);

        }
        
        function buy_card() {
            player.money -= price;
            update_money_display();

            const container = (type === 'skill') 
                ? document.getElementById('skill-container-shop')
                : document.getElementById('upgrader-container-shop');
            
            const bought_card_index = container.childElementCount;
            const bought_card = create_card(bought_card_index, skill_or_upgrader, type, 'shop_current');
            container.appendChild(bought_card);

            player[type === 'skill' ? 'skills' : 'upgraders'].push(skill_or_upgrader);
            
            const shop_container = document.getElementById('shop-skill-upgrader-container')
            remove_card_by_name(shop_container, skill_or_upgrader.name, type)   
        }

        buy_button.addEventListener('click', () => {
            if (can_buy()) buy_card();
            else console.log('Cannot buy, not enough space or money.');
        });

    } else if (func === 'shop_current') {
        // base sell prices 
        // TODO: increase value if card has modifiers
        const sell_prices = {
            'C': 70,
            'UC': 100,
            'R': 130,
            'SR': 170,
            'SSR': 200
        };
        const sell_price = sell_prices[skill_or_upgrader.rarity];
    
        const price_text = document.createElement('p');
        price_text.textContent = `$${sell_price}`;
        card.appendChild(price_text);

        const sell_button = document.createElement('button');
        sell_button.classList.add('shop-sell-button');
        sell_button.textContent = 'sell';        
        card.appendChild(sell_button);

        function can_sell() {
            if (type === 'upgrader' && get_current_cards('upgrader').length > 0) return true;
            if (type === 'skill' && get_current_cards('skill').length > 0) return true;
            return false

        }
        function sell_card() {
            player.money += sell_price;
            update_money_display();

            const container = (type === 'skill') 
                ? document.getElementById('skill-container-shop')
                : document.getElementById('upgrader-container-shop');

            player[type === 'skill' ? 'skills' : 'upgraders'].splice(player[type === 'skill' ? 'skills' : 'upgraders'].indexOf(skill_or_upgrader), 1);
            
            remove_card_by_name(container, skill_or_upgrader.name, type)   
        }
        
        sell_button.addEventListener('click', () => {
            if (can_sell()) {
                sell_card();
            } else {
                console.log('Cannot sell');
            }
        });
    }
    

    card.onmousedown = (event) => {
        switch(func) {
            case 'gameround':
                if (event.button === 0 || event.button === 2) { // right click
                    const overlay = document.getElementById('effect-overlay');
                    const effect_text = document.getElementById('effect-text');
                    show_effect(overlay, effect_text, skill_or_upgrader.effect, card, 'above');
                }
                break;
            
            case 'picking':
                const pick_card_container = (type === 'skill')
                    ? document.getElementById('skill-container-pick')
                    : document.getElementById('upgrader-container-pick');
                const picked_card_container = (type === 'skill')
                    ? document.getElementById('skill-container-picked')
                    : document.getElementById('upgrader-container-picked');

                if (event.button === 0) { // left click
                    // add to skill or upgrader container
                    let current_container, other_container;

                    if (pick_card_container.contains(card)) {
                        current_container = pick_card_container;
                        other_container = picked_card_container;
                    } else {
                        current_container = picked_card_container;
                        other_container = pick_card_container;
                    }

                    // true if the user hasn't picked a card of that type yet
                    const can_move_card = other_container === pick_card_container || other_container.children.length < 1;

                    
                    if (can_move_card) move_to_container(card, current_container, other_container);
                } else if (event.button === 2) { // right click
                    const overlay = document.getElementById('effect-overlay-picking');
                    const effect_text = document.getElementById('effect-text-picking');
                    show_effect(overlay, effect_text, skill_or_upgrader.effect, card, 'above');
                }
                
                break;
            
            default:
                break;
        }
    }

    if (['shop_buy', 'shop_current'].includes(func)) {
        const overlay = document.getElementById('shop-effect-overlay');
        const effect_text = document.getElementById('shop-effect-text');
        card.onmouseover = () => {
            
            if (func === 'shop_buy') {
                const buy_button = card.querySelector('.shop-buy-button');
                buy_button.style.display = 'block';
            } else if (func === 'shop_current') {
                const sell_button = card.querySelector('.shop-sell-button');
                sell_button.style.display = 'block';
            }
            show_effect(overlay, effect_text, skill_or_upgrader.effect, overlay, 'in_container');
        }
        card.onmouseout = () => {
            if (func === 'shop_buy') {
                const buy_button = card.querySelector('.shop-buy-button')
                buy_button.style.display = 'none';
            } else if (func === 'shop_current') {
                const sell_button = card.querySelector('.shop-sell-button');
                sell_button.style.display = 'none';
            }
            hide_effect(overlay, effect_text, 'in_container')
        }; 
    }

    if (func === 'gameround') {
        
        const overlay = document.getElementById('effect-overlay');
        card.onmouseup = () => hide_effect(overlay);
    } else if (func === 'picking') {
        const overlay = document.getElementById('effect-overlay-picking');
        card.onmouseup = () => hide_effect(overlay);
    }

    return card;
}

export function move_card(card, direction) {
    const container = card.classList.contains('skill')
        ? document.getElementById('skill-container') 
        : document.getElementById('upgrader-container');
    
    const index = [...container.children].indexOf(card);

    if (direction === 'l' && index > 0) {
        const other_card = [...container.children][index - 1]
        other_card.dataset.index = Number(other_card.dataset.index) + 1;
        card.dataset.index = Number(card.dataset.index) - 1;

        container.insertBefore(card, container.children[index - 1])
    } else if (direction === 'r' && index < container.children.length - 1) {
        const other_card = [...container.children][index + 1]
        other_card.dataset.index = Number(other_card.dataset.index) - 1;
        card.dataset.index = Number(card.dataset.index) + 1;
        
        container.insertBefore(container.children[index + 1], card);
        
    }
    if (card.classList.contains('skill')) {
        player.skills = get_current_cards('skill');
    } else {
        player.upgraders = get_current_cards('upgrader');
    }
}

function format_effect(effect) {
    // Add a line break before "At the end of the turn"
    effect = effect.replace('At the end of the turn', '<br>At the end of the turn');
    if (effect.substring(0, 4) === '<br>') effect = effect.slice(4); 

    const colours = {
        // attributes
        'Wet': 'hsl(220, 100%, 70%)',
        'Burn': 'hsl(20, 100%, 60%)',
        'Bloom': 'hsl(120, 80%, 40%)',
        'Shock': 'hsl(250, 100%, 80%)',
        'Frost': 'hsl(180, 60%, 70%)',

        // reactions
        'Scorched': 'hsl(10, 90%, 50%)',
        'Electrocute': 'hsl(190, 100%, 50%)',

        // skill related (counters, states, etc.)
        'Kindling': 'hsl(20, 90%, 70%)',
        'Charred': 'hsl(0, 70%, 50%)',
        'Ignition': 'hsl(25, 95%, 65%)',
        'Ripple': 'hsl(220, 95%, 75%)',
        'Growth': 'hsl(85, 80%, 45%)',
        'Erupt': 'hsl(15, 85%, 45%)',

    };

    // Add coloured spans to attribute keywords
    for (const [text, colour] of Object.entries(colours)) {
        // Remove special characters [] in attribute for the regex to work
        const escaped_text = text.replace(/[\[\]]/g, '\\$&');
        effect = effect.replace(
            new RegExp(`${escaped_text}`, 'g'),
            `<span style="color: ${colour};">${text}</span>`
        );
    }
    
    return effect;
}

function show_effect(overlay, effect_text, effect, card, type = 'in_container') {
    if (overlay) {
        const formatted_effect = format_effect(effect);
        effect_text.innerHTML = formatted_effect;
        
        if (type === 'in_container') {
            effect_text.style.display = 'block';
            return;
        }
        const card_rect = card.getBoundingClientRect(); // Get the position and size of the card


        

        const width = 200
        // Position the overlay above the card
        overlay.style.display = 'flex'; // Show the overlay
        overlay.style.position = 'absolute';
        overlay.style.top = `${card_rect.top - overlay.offsetHeight}px`; // Above the card
        overlay.style.left = `${card_rect.left - width / 2}px`;
        overlay.style.width = `${card_rect.width + width }px`;

    } else {
        console.error("Effect display element not found.");
    }
}

function hide_effect(overlay, effect_text, type = '') {
    if (overlay) {
        if (type === 'in_container') {
            effect_text.style.display = 'none';
        } else {
            overlay.style.display = 'none';
        }
    }
}