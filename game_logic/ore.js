import { WET, BURN, BLOOM, SHOCK } from './attribute.js';
import Activation, { attribute_added, attribute_removed, ore_value_increased, ore_value_multiplied } from './activation.js';
import { handle_new_triggers } from './game.js';
import { reaction_triggered } from './activation.js';
import play_animation, { anim_add_attribute, anim_increase_ore_value, anim_multiply_ore_value } from './animations.js';
import { capitalize } from '../scripts/utils.js';

export default class Ore {
    constructor({name, base_value = 1, attributes = []}) {
        this.name = name;
        this.base_value = base_value;
        this.value = base_value;
        this.attributes = attributes;
    }

    toString() {
        return `${this.name}`;
    }

    increase_value({gv, type, value, source = null, activations = null}) {
        let passive_skill = '';
        for (const skill of gv.skills) {
            if (skill.passive) { // 1 = active, 0 = inactive
                if (skill.type ==! 'passive') continue;
                
                let {value: increased_value, passive_skill: new_passive_skill} = skill.apply_skill_passive({ gv, type, value, source });

                if (value !== increased_value) passive_skill = new_passive_skill;
                value = increased_value;
            }
        };

        if (type === '+') {
            this.value += value;

            if (gv.play_animations) play_animation(anim_increase_ore_value({ amount: value, source }));

            activations.push(ore_value_increased({ value, id: gv.activation_id++, source }));
            console.log(`${source.card_type === 'upgrader' ? `Upgrader [${source.name}]` : source.card_type === 'skill' ? `Skill [${source.name}]` : source.card_type === 'character' ? `Character [${source.name}]` : 'SOMETHING WENT WRONG'} (ID ${source.id}) increased Ore [${this.name}]'s value by ${value} ${passive_skill !== '' ? `(Boosted by Skill [${passive_skill.name}])` : ''}`);
        } else if (type === '*') {
            this.value *= value;
        
            if (gv.play_animations) play_animation(anim_multiply_ore_value({ amount: value, source }));

            activations.push(ore_value_multiplied({ value, id: gv.activation_id++, source }));
            console.log(`${source.card_type === 'upgrader' ? `Upgrader [${source.name}]` : source.card_type === 'skill' ? `Skill [${source.name}]` : source.card_type === 'character' ? `Character [${source.name}]` : 'SOMETHING WENT WRONG'} (ID ${source.id}) multiplied Ore [${this.name}]'s value by ${value} ${passive_skill !== '' ? `(Boosted by Skill [${passive_skill.name}])` : ''}`);
        }
    }

    add_attribute({attribute, amount = 1, source, gv, activations}) {
        const prev_attribute_amount = this.attributes.length;

        if (gv.play_animations) play_animation(anim_add_attribute({ amount, source }));

        activations.push(attribute_added({ attribute, amount, id: gv.activation_id++, source }));

        for (let i = 0; i < amount; i++) {
            this.attributes.push(attribute);
        }
        console.log(`${capitalize(source.card_type)} [${source.name}] (ID ${source.id}) added ${amount} [${attribute.name}] attribute${amount > 1 ? 's' : ''} to Ore [${this.name}]`)

        let offset = prev_attribute_amount;
        for (let i = 0; i < prev_attribute_amount; i++) {
            if (this.attributes.length < 2) break;
            
            const attribute = this.attributes[offset]
            const other_attribute = this.attributes[i]

            if (attribute === undefined || other_attribute === undefined) break;
            
            if (other_attribute.is_weak_to(attribute)) {
                const reaction = {
                    other_attribute: other_attribute, 
                    attribute: attribute, 
                    reaction: attribute.reaction(other_attribute),
                    source: source
                };

                this.remove_attribute({ attribute: this.attributes[i--], source, gv, activations, is_reaction: true });
                this.remove_attribute({ attribute: this.attributes[offset---1], source, gv, activations, is_reaction: true });
                apply_reaction({ gv, activations, reaction });
            }
        }
    }

    remove_attribute({attribute, amount = 1, source, gv, activations, is_reaction = false }) {
        if (this.attributes.includes(attribute)) {
            for (let i = 0; i < amount; i++) {
                if (this.attributes.includes(attribute)) {
                    this.attributes.splice(this.attributes.indexOf(attribute), 1);
                }
                if (!is_reaction) activations.push(attribute_removed({ attribute, source, id: gv.activation_id++, source }));
            };
        } else {
            console.log(`Failed to remove Attribute [${attribute}] from Ore [${this.name}], attribute not found on ore.`);
        }
    }

    has_attribute(attribute) {
        return this.attributes.includes(attribute);
    }

    attribute_amount(attribute) {
        return this.attributes.filter(attr => attr === attribute).length;
    }
}

export function apply_reaction({gv, activations, reaction}) {
    if (gv.debug === true) console.log('\n### apply_reaction ###');

    // play_animation()

    activations.push(reaction_triggered({ R_attributes: [reaction.other_attribute, reaction.attribute], reaction: reaction.reaction, id: gv.activation_id++, source: reaction.source }));
    console.log(`Adding 1 [${reaction.attribute}] attribute to Ore [${gv.ore.name}] triggered the [${reaction.attribute.reaction(reaction.other_attribute)}] reaction`);
    console.log(`  Current value: ${gv.ore.value}. Attributes: ${gv.ore.attributes}`);

    handle_new_triggers({ gv, activations });
}


export const water_stone = new Ore({
    name: 'Water Stone', 
    base_value: 5,
    attributes: new Array(3).fill(WET)
});