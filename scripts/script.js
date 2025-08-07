import { all_upgraders, flame_thrower, floral_infuser, soaker, zapper } from '../game_logic/upgrader.js';
import { all_skills, cleanse, rewind, steam_engine, surge, vault } from '../game_logic/skill.js';
import { calculate_value, Game_Variables } from "../game_logic/game.js"
import Ore from '../game_logic/ore.js';
import { witch } from '../game_logic/character.js';
import { calculate_payout, choice, exclude, format_number, move_to_container, random_index, shuffle_array } from './utils.js';
import { get_current_cards, initialize_cards, pick_cards, create_card, pick_random_cards } from './card_utils.js';

let reroll_cost;

class Player_Info {
    constructor({name, upgraders = [], skills = [], character = null, money = 0}) {
        this.name = name;
        this.upgraders = upgraders;
        this.skills = skills;
        this.character = character;
        this.money = money;
        this.skill_slots = 5;
        this.upgrader_slots = 3;

        this.game_stage = 1;
    }
    has_available_slot(type) {
        return (type === 'skill')
            ? this.skills.length < this.skill_slots
            : this.upgraders.length < this.upgrader_slots;
    }
}

export const player = new Player_Info({
    name: 'test',
});

document.querySelectorAll('.disable-context').forEach((element) => {
    element.addEventListener('contextmenu', (event) => event.preventDefault());
});

function calc_value() {
    const skill_container = document.getElementById('skill-container');
    const upgrader_container = document.getElementById('upgrader-container');
    const skills = [...skill_container.children].map(skill => skill.skill);
    const upgraders = [...upgrader_container.children].map(upgrader => upgrader.upgrader);
    
    const ore = new Ore({
        name: 'Test Ore',
        base_value: 5,
    });

    const character = player.character;

    const gv = new Game_Variables({
        ore: ore,
        character: character,
        upgraders: upgraders,
        skills: skills,
        play_animations: true
    });

    const value = calculate_value({ gv });
    
    return value;
}

function change_scene(current, other) {
    current.style.display = 'none';
    other.style.display = 'flex';
}

function set_goal(value = 1000) {
    const goal = document.getElementById('goal-display');
    goal.value = value;
    goal.innerHTML = goal.value;
}
/**
 * @returns {boolean} true if goal met, false if not
*/
function check_goal(value = 0) {
    const goal = document.getElementById('goal-display');
    
    const goal_text = goal.querySelector('p.goal-text') || document.createElement('p');
    goal_text.classList.add('goal-text');
    
    goal_text.textContent = (value >= goal.value) 
        ? 'goal met' 
        : 'goal not met';
    
    if (!goal.contains(goal_text)) {
        goal.appendChild(goal_text);
    }
    
    const goal_met = value >= goal.value;
    return goal_met;
}


export function update_money_display() {
    const money_display = document.getElementById('shop-money');
    money_display.textContent = format_number(player.money);
}

function shop() {
    const shop_scene = document.getElementById('shop');
    const gameround = document.getElementById('gameround');
    change_scene(gameround, shop_scene);
    
    console.log('Inside shop');

    update_money_display()

    const upgraders_skills_container = document.getElementById('shop-skill-upgrader-container');
    const general_upgrade_container = document.getElementById('shop-general-upgrades-container');
    const upgrade_packs_container = document.getElementById('shop-upgrade-packs-container');

    const skill_container = document.getElementById('skill-container-shop');
    const upgrader_container = document.getElementById('upgrader-container-shop');

    const reroll_button = document.getElementById('shop-reroll-button');
    reroll_button.dataset.price = 5;
    if (!reroll_button.dataset.has_event_listener) {
        reroll_button.dataset.has_event_listener = true;
        reroll_button.addEventListener('click', reroll_shop);
    }
    
    const reroll_price = document.getElementById('shop-reroll-price');
    reroll_price.innerHTML = `$${reroll_button.dataset.price}`;
    
    // clear containers from previous shop visits
    skill_container.replaceChildren();
    upgrader_container.replaceChildren();
    upgraders_skills_container.replaceChildren();

    initialize_cards(player.upgraders, upgrader_container, 'upgrader', 'shop_current');
    initialize_cards(player.skills, skill_container, 'skill', 'shop_current');

    function initialize_cards_shop() {
        upgraders_skills_container.replaceChildren();

        let types = ['skill', 'skill', 'skill', 'upgrader', 'upgrader'];
        types = shuffle_array(types);
        types.shift();
        
        // the player is allowed to have multiples of upgraders
        // but not of skills since that can cause infinite-loop issues
        const exclude = [...player.skills];
        
        for (let i = 0; i < 4; i++) {
            const skill_or_upgrader = pick_random_cards(types[i], 1, exclude, [...player.upgraders])[0];
            const card = create_card(i, skill_or_upgrader, types[i], 'shop_buy');
            upgraders_skills_container.appendChild(card);
            exclude.push(skill_or_upgrader);
        }
    }
    
    function reroll_shop() {
        if (player.money >= Number(reroll_button.dataset.price)) {
            player.money -= Number(reroll_button.dataset.price);
            update_money_display();
            
            reroll_button.dataset.price = Number(reroll_button.dataset.price) + 1;
            reroll_price.innerHTML = `$${reroll_button.dataset.price}`;

            initialize_cards_shop();
        }
    }

    initialize_cards_shop();


    // thing to get general upgrade and upgrade packs
}

function initialize_shop() {
    console.log('Entering shop...');
    reroll_cost = 5;

    shop();
    const shop_button = document.getElementById('shop-proceed-button');
    
    shop_button.onmouseup = (event) => {
        if (event.button === 0) {
            // hide shop and show gameround
            console.log('Leaving shop');

            const shop_scene = document.getElementById('shop');
            const gameround = document.getElementById('gameround');

            player.game_stage++;
            
            initialize_gameround();
            change_scene(shop_scene, gameround);
        }
    } 
}
function initialize_card_pick() {
    console.log('Picking cards...');
    pick_cards();
    document.getElementById('finish-picking-button').addEventListener('click', () => {
        console.log('Picking finished');

        // hide card-picking and show gameround
        const card_select = document.getElementById('cards-selector');
        const gameround = document.getElementById('gameround');

        const skill_container = document.getElementById('skill-container-picked');
        const upgrader_container = document.getElementById('upgrader-container-picked');
        player.skills = [...skill_container.children].map(skill => skill.skill);
        player.upgraders = [...upgrader_container.children].map(upgrader => upgrader.upgrader);
        initialize_gameround();
        change_scene(card_select, gameround);
    })
}

function initialize_gameround() {
    console.log('Initializing round...');
    const skill_container = document.getElementById('skill-container');
    const upgrader_container = document.getElementById('upgrader-container');

    initialize_cards(player.skills, skill_container, 'skill', 'gameround');
    initialize_cards(player.upgraders, upgrader_container, 'upgrader', 'gameround');
    document.getElementById('goal-display').classList.add('value');
    
    const target_value = 5 * player.game_stage**2 - player.game_stage + 1;
    set_goal(target_value.toFixed(0));
    
    const run_button = document.getElementById('run-button');
    run_button.onmouseup = () => {
        const value = calc_value();
        const value_display = document.getElementById('value-display');
        value_display.textContent = `${format_number(value)}`; 
    
        const goal_met = check_goal(value);    

        if (goal_met === true) {
            const results_container = document.getElementById('results-container');
            const results_text = document.getElementById('results-text');
            const results_run_button = document.getElementById('results-shop-button');
            
            const money = calculate_payout(value, target_value);
            
            results_text.textContent = `Money earned: ${money}$`;

            results_container.style.display = 'flex';

            results_run_button.onmouseup = () => {
                player.money += money;
                initialize_shop();
                results_container.style.display = 'none';
            }      
        }
    };
}


document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded. Initializing round...');

    // start the game by picking starting cards
    initialize_card_pick();
});
