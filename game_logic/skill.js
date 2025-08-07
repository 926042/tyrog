import { choice, randint } from "../scripts/utils.js";
import Activation, {no_activation, attribute_added, attribute_removed, reaction_triggered, ore_value_increased, ore_value_multiplied, effect_activated} from "./activation.js";
import {WET, BURN, BLOOM, SHOCK, FROST} from "./attribute.js";

export default class Skill {
    constructor({name, effect, rarity, type, triggers = [], archetypes = [], value = 0, activation_stacks = 0, max_stacks = 0, passive = 0, activated_ids = [0], state = 0, id = 0, container}) {
        this.name = name;
        this.effect = effect;
        this.rarity = rarity;
        this.card_type = 'skill';
        this.type = type;
        this.triggers = triggers;
        this.archetypes = archetypes;
        this.value = value;
        this.activation_stacks = activation_stacks;
        this.max_stacks = max_stacks;
        this.passive = passive;
        this.activated_ids = activated_ids;
        this.id = id;

        // utility
        this.state = state;
        this.container = container;
    }   

    toString() {
        return `${this.name}`;
    }

    // This allows for multiples of a skill without their activation 
    // stacks and stuff overlapping between the copies.
    clone() { 
        return new this.constructor({
            name: this.name,
            effect: this.effect,
            rarity: this.rarity,
            type: this.type,
            triggers: [...this.triggers],
            archetypes: [...this.archetypes],
            value: this.value,
            activation_stacks: this.activation_stacks,
            max_stacks: this.max_stacks,
            passive: this.passive,
            activated_ids: [...this.activated_ids],
            state: this.state,
            id: this.id
        });
    }

    apply_skill({gv, activations, activation}) {
        if (activation !== undefined && this.activated_ids.includes(activation.id)) return false;

        const skill_activated = this.activate_effect({ gv, activations, activation });
        if (skill_activated !== not_activated) {
            if (activation !== undefined) this.activated_ids.push(activation.id);
            activations.push(effect_activated({ id: gv.activation_id++, source: this }));
            console.log(`  Current value: ${gv.ore.value}. Attributes: ${gv.ore.attributes}`);

            return true;
        }
        return false;
    }

    apply_skill_passive({gv, type, value, source}) {
        const {value: changed_value, passive_skill} = this.activate_effect_passive({ gv, type, value, source });
        return {value: changed_value, passive_skill};
    }
}

/**
 * Removes an activation from activations, if the activation exists inside it.
 * @param {Activation} activation - The activation to remove.
 * @param {Activation[]} activations - activations.
 */
function remove_activation(activation, activations) {
    for (const i in activations) {
        if (activation.equals(activations[i])) {
            activations.splice(i, 1);
            break;
        }
    }
}
// the value here doesn't matter so long as it's not undefined
const not_activated = false

// used to separate activation stacks and activated ids when the
// player has two or more of the same skill
const activation_stacks_ids_obj = { activation_stacks: 0, activated_ids: [0]}


/// on-trigger ///
class Surge extends Skill {
    activate_effect({gv, activations, activation}) {
        gv.ore.increase_value({gv, type: '+', value: this.value, source: this, activations });
    }
}
export const surge = new Surge({
    name: 'Surge',
    rarity: 'R',
    type: 'on_trigger',
    effect: 'If a Wet attribute is added to the Ore: Increases the Ore\'s value by 50.',
    triggers: [attribute_added({attribute: WET})],
    archetypes: ['wet', '+'],
    value: 50
});

class Steam_Engine extends Skill {
    activate_effect({gv, activations, activation}) {
        if (gv.ore.has_attribute(WET)) {
            gv.ore.remove_attribute({ attribute: WET, source: this, gv, activations });
            
            // removes 'attribute_added({ attribute: WET })' from activations and activations (if it exists),
            // because it doesn't make sense for skills that activate when an attribute is
            // added, to activate after that attribute has been removed.
            remove_activation(this.triggers[0], activations);
            
            console.log(`Skill [${this.name}] removed 1 [Wet] attribute from Ore [${gv.ore.name}]`);
            gv.ore.increase_value({ gv, type: '*', value: this.value, source: this, activations })
        } else {
            return not_activated;
        }
    }
};
export const steam_engine = new Steam_Engine({
    name: 'Steam Engine',
    rarity: 'R',
    type: 'on_trigger',
    effect: 'If a Wet attribute is added to the Ore by an Upgrader: Removes 1 Wet attribute from the Ore and multiplies the Ore\'s value by 2.',
    triggers: [attribute_added({attribute: WET, type: 'upgrader'})],
    archetypes: ['wet', '*', 'remove_attribute'],
    value: 2
});

class Rewind extends Skill {
    activate_effect({gv, activations, activation}) {
        console.log('REWIND:', activation.activation, activation.name)
        gv.ore.add_attribute({ attribute: activation.attribute, type: 'skill', source: this, gv, activations });
    }
}
export const rewind = new Rewind({
    name: 'Rewind',
    rarity: 'SR',
    type: 'on_trigger',
    effect: 'If an attribute is removed from the Ore by a Skill: Adds 1 of the same attribute to the Ore.',
    triggers: [attribute_removed({ type: 'skill' })]
});

class Storm_Conduit extends Skill {
    activate_effect({gv, activations, activation}) {
        gv.ore.add_attribute({ attribute: SHOCK, type: 'skill', source: this, gv, activations });
    }
}
export const storm_conduit = new Storm_Conduit({
    name: 'Storm Conduit',
    rarity: 'UC',
    type: 'on_trigger',
    effect: 'If the Electrocute reaction is triggered: Adds 1 Shock attribute to the Ore.',
    triggers: [reaction_triggered({reaction: 'Electrocute'})],
    archetypes: ['shock', 'reaction', 'add_attribute']
});

class Current extends Skill {
    activate_effect({gv, activations, activation}) {
        const shock_amount = gv.ore.attribute_amount(SHOCK);
        gv.ore.increase_value({ gv, type: '*', value: (1 + shock_amount), source: this, activations });
    }
}
export const current = new Current({
    name: 'Current',
    rarity: 'SSR',
    type: 'on_trigger',
    effect: 'If a Shock attribute is added to the Ore: Multiplies the Ore\'s value by 1 + the amount of Shock attributes on the Ore.',
    triggers: [attribute_added({attribute: SHOCK})],
    archetypes: ['shock', '*']
});

class Double_Strike extends Skill {
    activate_effect({gv, activations, activation}) {
        if (activation.source.name !== this.name) {
            gv.ore.add_attribute({ attribute: SHOCK, type: 'skill', source: this, gv, activations });
        } else {
            return not_activated;
        }
    }
}
export const double_strike = new Double_Strike({
    name: 'Double Strike',
    rarity: 'SR',
    type: 'on_trigger',
    effect: 'If a Shock attribute is added to the Ore, except by "Double Strike": Adds 1 Shock attribute to the Ore.',
    triggers: [attribute_added({attribute: SHOCK})],
    archetypes: ['shock', 'add_attribute']
});

class Unwavering_Flame extends Skill {
    activate_effect({gv, activations, activation}) {
        if (!(gv.ore.has_attribute(BURN))) {
            gv.ore.add_attribute({ attribute: BURN, type: 'skill', source: this, gv, activations });
            remove_activation(attribute_removed({ attribute: BURN }), activations)
            gv.ore.increase_value({ gv, type: '+', value: this.value, source: this, activations });
        } else {
            return not_activated;
        }
    }
}
export const unwavering_flame = new Unwavering_Flame({
    name: 'Unwavering Flame',
    rarity: 'SR',
    type: 'on_trigger',
    effect: 'If a Burn attribute is removed from the Ore (including by reactions), and the Ore does not have any Burn attributes: Adds 1 Burn attribute to the Ore and increases the Ore\'s value by 25.',
    triggers: [reaction_triggered({R_attributes: [BURN]}), attribute_removed({attribute: BURN})],
    archetypes: ['burn', '+', 'add_attribute'],
    value: 25
});

class Ignite extends Skill {
    activate_effect({gv, activations, activation}) {
        if (activation.source.name === this.name) return not_activated;

        if (!this.state && reaction_triggered({ reaction: 'Scorched' }).equals(activation)) {
            this.state = 1;
            console.log(`Skill [${this.name}] has entered the [Ignition] state.`);
            return not_activated;
        } else if (this.state && !reaction_triggered({ reaction: 'Scorched' }).equals(activation)) {
            gv.ore.add_attribute({ attribute: BURN, type: 'skill', source: this, gv, activations });
            return;
        }
        return not_activated;
    }
}
export const ignite = new Ignite({
    name: 'Ignite',
    rarity: 'SSR',
    type: 'on_trigger',
    effect: 'If the Scorched reaction is triggered: Enters the Ignition state; If an attribute is added to   the Ore, except by this Skill: Adds 1 Burn attribute to the Ore.',
    triggers: [reaction_triggered({ reaction: 'Scorched' }), attribute_added({})],
    archetypes: ['burn', 'reaction', 'add_attribute']
})

class Budding_Blossom extends Skill {
    activate_effect({gv, activations, activation}) {
        if (this.activation_stacks < this.max_stacks) {
            this.activation_stacks++;
            console.log(`Skill [${this.name}] gained 1 [Growth]: [Growth] stacks: ${this.activation_stacks}/${this.max_stacks}`);
        }
        if (this.activation_stacks >= this.max_stacks) {
            this.activation_stacks -= this.max_stacks;
            gv.ore.increase_value({ gv, type: '*', value: this.value, source: this, activations });
            gv.ore.add_attribute({ attribute: BLOOM, type: 'skill', source: this, gv, activations });
            return;
        }
        return not_activated
    }
}
export const budding_blossom = new Budding_Blossom({
    name: 'Budding Blossom',
    rarity: 'SR',
    type: 'on_trigger',
    effect: 'If a Wet attribute added to the Ore: Gains 1 Growth. If Growth reaches 2: Consumes 2 Growth; Multiplies the Ore\'s value by 2 and adds 1 Bloom attribute to the Ore.',
    triggers: [attribute_added({ attribute: WET })],
    archetypes: ['wet', 'bloom', '*', 'add_attribute'],
    max_stacks: 2,
    value: 2
});

class Bountiful_Infusion extends Skill {
    activate_effect({gv, activations, activation}) {
        const attribute = choice([WET, BURN, BLOOM, SHOCK, FROST]);           
        gv.ore.add_attribute({ attribute, type: 'skill', source: this, gv, activations });
    }
}
export const bountiful_infusion = new Bountiful_Infusion({
    name: 'Bountiful Infusion',
    rarity: 'SR',
    type: 'on_trigger',
    effect: 'If a reaction is triggered: Adds 1 Wet, Burn, Bloom, Shock, or Frost attribute to the Ore.',
    triggers: [no_activation()], // find some other trigger
    archetypes: ['reaction', 'add_attribute', 'rng']
});

class Overflow extends Skill {
    activate_effect({gv, activations, activation}) {
        gv.ore.add_attribute({ attribute: activation.attribute, type: 'skill', source: this, gv, activations });
    }
}
export const overflow = new Overflow({
    name: 'Overflow',
    rarity: 'R',
    type: 'on_trigger',
    effect: 'If two or more of the same attribute are added to the Ore simultaneously: Adds 1 attribute of the same type to the Ore.',
    triggers: [attribute_added({ amount: 2 })],
    archetypes: ['add_attribute']
});

class Volcano extends Skill {
    activate_effect({gv, activations, activation}) {

        if (this.activation_stacks < this.max_stacks) {
            this.activation_stacks++;
            console.log(`Skill [${this.name}] gained 1 Erupt. Erupt: ${this.activation_stacks}/${this.max_stacks}`)
        }
        if (this.activation_stacks >= this.max_stacks) {
            this.activation_stacks -= this.max_stacks;
            gv.ore.add_attribute({ attribute: BURN, amount: 2, type: 'skill', source: this, gv, activations });
            return;
        }
        return not_activated;
    }
}
export const volcano = new Volcano({
    name: 'Volcano',
    rarity: 'SR',
    type: 'on_trigger',
    effect: 'If a reaction is triggered: Gains 1 Erupt. If Erupt reaches 3: Consumes 3 Erupt; Adds 2 Burn attributes to the Ore.',
    triggers: [reaction_triggered({})],
    archetypes: ['burn', 'reaction', 'add_attribute'],
    max_stacks: 3
});

class Resonance extends Skill {
    activate_effect({gv, activations, activation}) {
        const attribute = choice(activation.R_attributes);
        gv.ore.add_attribute({ attribute, type: 'skill', source: this, gv, activations, activations });
    }
}
export const resonance = new Resonance({
    name: 'Resonance',
    rarity: 'R',
    type: 'on_trigger',
    effect: 'If a reaction is triggered: Adds 1 of the attributes involved in the reaction to the Ore.',
    triggers: [reaction_triggered({})],
    archetypes: ['reaction', 'add_attribute', 'rng']
});

class Amplifier extends Skill {
    activate_effect({gv, activations, activation}) {
        // it's faster to have this if statement instead
        // of a trigger for each value, total 9 triggers
        if (activation.value > 1 && activation.value < 11) {
            gv.ore.increase_value({ gv, type: '*', value: gv.activation.value, source: this, activations });
            return;
        }
        return not_activated;
    }
}
export const amplifier = new Amplifier({
    name: 'Amplifier',
    rarity: 'SR',
    type: 'on_trigger',
    effect: 'If the Ore\'s value is increased by a number between 1 and 11: Multiplies the Ore\'s value by that number.',
    triggers: [ore_value_increased({})],
    archetypes: ['*']
}) 





/// static ///
class Vault extends Skill {
    activate_effect({gv, activations, activation}) {
        if (gv.game_stage === 'MAIN' && activation.source.name !== this.name) {
            this.activation_stacks += activation.value;
            console.log(`Skill [${this.name}]'s recorded value increased by ${activation.value}. Total recorded value: ${this.activation_stacks}`);
            return not_activated;
        } else if (gv.game_stage === 'END') {
            gv.ore.increase_value({ gv, type: '+', value: this.activation_stacks, source: this, activations });
            this.activation_stacks = 0;
        } else {
            return not_activated;
        }

    }
}
export const vault = new Vault({
    name: 'Vault',
    rarity: 'UC',
    type: 'static',
    effect: 'If the Ore\'s value is increased by addition: Records the value increase. At the end of the turn: Increases the Ore\'s value by the total recorded value.',
    triggers: [ore_value_increased({})],
    value: 0
});

class Catalyst extends Skill {
    activate_effect({gv, activations, activation}) {
        if (gv.game_stage === 'MAIN' && activation.source.name !== this.name) {
            this.activation_stacks += activation.value;
            console.log(`Skill [${this.name}]'s recorded multiplier increased by ${activation.value}. Total recorded multiplier: ${this.activation_stacks}`);
            return not_activated;
        } else if (gv.game_stage === 'END') {
            if (this.activation_stacks === 0) this.activation_stacks = 1; // to prevent from multiplying by 0 if no multiplications happened in the round
            gv.ore.increase_value({ gv, type: '*', value: this.activation_stacks, source: this, activations });
            this.activation_stacks = 0;
        } else {
            return not_activated;
        }
    }
}
export const catalyst = new Catalyst({
    name: 'Catalyst',
    rarity: 'SR',
    type: 'static',
    effect: 'If the Ore\'s value is multiplied by a Skill or Character Skill: Records the multiplier. At the end of the turn: Multiplies the Ore\'s value by the total recorded multiplier if it isn\'t 0.',
    triggers: [ore_value_multiplied({ type: 'skill' }), ore_value_multiplied({ type: 'character' })],
    archetypes: ['*'],
    value: 0
})

class Rising_Flame extends Skill {
    activate_effect({gv, activations, activation}) {
        if (gv.game_stage === 'END' && activation === undefined) {
            gv.ore.increase_value({ gv, type: '*', value: (1 + this.activation_stacks), source: this, activations });
            this.activation_stacks = 0;
            return;
        } else {
            this.activation_stacks += activation.amount;
            console.log(`Skill [${this.name}] gained ${activation.amount} [Kindling]. [Kindling] stacks: ${this.activation_stacks}`);
        }
        return not_activated
    }
} 
export const rising_flame = new Rising_Flame({
    name: 'Rising Flame',
    rarity: 'SR',
    type: 'static',
    effect: 'If Burn attributes are added to the Ore: Gains 1 Kindling for each attribute added. At the end of the turn: Multiplies the Ore\'s value by 1 + the number of Kindling stacks.',
    triggers: [attribute_added({ attribute: BURN })],
    archetypes: ['burn', '*']
});

class Cleanse extends Skill {
    activate_effect({gv, activations, activation}) {
        if (gv.game_stage !== 'END') return not_activated;
        while (gv.ore.attributes.length > 0) {
            console.log(`Skill [${this.name}] removed 1 [${gv.ore.attributes[0].name}] attribute from Ore [${gv.ore.name}].`);
            gv.ore.remove_attribute({ attribute: gv.ore.attributes[0], source: this, gv, activations });
            this.activation_stacks++;
        };
        gv.ore.increase_value({ gv, type: '*', value: (1 + this.activation_stacks), source: this, activations });
        this.activation_stacks = 0;
    }
}
export const cleanse = new Cleanse({
    name: 'Cleanse',
    rarity: 'SSR',
    type: 'static',
    effect: 'At the end of the turn: Removes all attributes from the Ore and multiplies the Ore\'s value by 1 + the number of attributes removed.',
    triggers: [no_activation()],
    archetypes: ['*', 'remove_attribute']
});

class Cascade extends Skill {
    activate_effect({gv, activations, activation}) {
        if ((!(gv.game_stage === 'END') && activation === undefined) || activation !== undefined && activation.source.name === this.name && activation.source.id === this.id) return not_activated;

        if (gv.game_stage === 'MAIN' && activation.id !== undefined) {
            this.activation_stacks++;
            console.log(`Skill [${this.name}] (ID ${this.id}) gained 1 [Ripple]. [Ripple] stacks: ${this.activation_stacks}`);
        } else if (gv.game_stage === 'END' && activation === undefined ) { // activation === undefined to prevent it from triggering when it shouldn't
            gv.ore.increase_value({ gv, type: '*', value: 1 + 0.5 * this.activation_stacks, source: this, activations });
            this.activation_stacks = 0;
            return;
        }
        return not_activated;
        
    }
}
export const cascade = new Cascade({
    name: 'Cascade',
    rarity: 'SR',
    type: 'static',
    effect: 'If a Skill is activated, except this Skill: Gains 1 Ripple. At the end of the turn: Multiplies the Ore\'s value by 1 + 0.5 * the amount of Ripple stacks.',
    triggers: [effect_activated({ type: 'skill' })],
    archetypes: ['*']
});

class Quench extends Skill {
    activate_effect({gv, activations, activation}) {
        if (gv.ore.has_attribute(BURN)) {
            const burn_amount = gv.ore.attribute_amount(BURN);
            
            gv.ore.add_attribute({ attribute: WET, amount: burn_amount, type: 'skill', source: this, gv, activations});
            
        } else {
            return not_activated;
        }
    }
}
export const quench = new Quench({
    name: 'Quench',
    rarity: 'R',
    type: 'static',
    effect: 'At the end of the turn: Adds Wet attributes to the Ore, equal to the amount of Burn attributes on the Ore.',
    triggers: [no_activation()],
    archetypes: ['burn', 'wet', 'add_attribute']
});

class Attribute_Duplication extends Skill {
    activate_effect({gv, activations, activation}) {
        if (gv.ore.attributes.length <= 0) return not_activated;
        
        const attributes = [...gv.ore.attributes];
        for (const attribute of attributes) {
            gv.ore.add_attribute({ attribute, type: 'skill', source: this, gv, activations });
        }
    }
}
export const attribute_duplication = new Attribute_Duplication({
    name: 'Attribute Duplication',
    rarity: 'R',
    type: 'static',
    effect: 'At the end of the turn: Adds 1 of every attribute currently on the Ore to the Ore.',
    triggers: [no_activation({})],
    archetypes: ['add_attribute']
});





/// passive ///
class Scorched_Amplifier extends Skill {
    activate_effect({gv, activations, activation}) {
        if (!(this.passive)) this.passive = 1;  
        console.log(`Skill [${this.name}] has entered the [Scorched] state: All [Burn] type increases +100%`);
    }
    activate_effect_passive({gv, type, value, source}) {
        if (source.archetype === 'Burn') {
            value *= 2;
            return {value, passive_skill: this};
        };
        return {value, passive_skill: this}
    }
}
export const scorched_amplifier = new Scorched_Amplifier({
    name: 'Scorched Amplifier',
    rarity: 'SR',
    type: 'passive',
    effect: 'If the Scorched reaction is triggered: Enters the Charred state; All Burn related increases +100%.',
    triggers: [reaction_triggered({reaction: 'Scorched'})],
    archetypes: ['burn', 'reaction']
});


export const all_skills = [
    // on_trigger
    surge,
    steam_engine,
    rewind,
    storm_conduit,
    current,
    double_strike,
    unwavering_flame,
    ignite,
    budding_blossom,
    //bountiful_infusion, // you have to find some other trigger for this one
    overflow,
    volcano,
    resonance,
    
    // static
    vault,
    catalyst,
    rising_flame,
    cleanse,
    cascade,
    quench,
    attribute_duplication,

    // passive
    scorched_amplifier
];
// current amount of skills: 20
// console.log(all_skills.length)
