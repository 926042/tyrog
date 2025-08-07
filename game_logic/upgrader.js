import {attribute_added, attribute_removed, reaction_triggered, ore_value_increased, effect_activated} from "./activation.js";
import {WET, BURN, BLOOM, SHOCK, FROST} from "./attribute.js";

export default class Upgrader {
    constructor({name, type, rarity, addend = 0, multiplier = 1, effect = '', activation = null, archetype = null, id = 0}) {
        this.name = name;
        this.card_type = 'upgrader';
        this.type = type;
        this.rarity = rarity;
        this.addend = addend;
        this.multiplier = multiplier;
        this.effect = effect;
        this.activation = activation;
        this.archetype = archetype;
        this.id = id
    }

    toString() {
        return `${this.name}`;
    }

    clone() { 
        return new this.constructor({...this});
    }

    process_ore({gv, activations}) {
        let value_increase;
        if (this.type === '+') value_increase = {type: '+', value: this.addend};
        else value_increase = {type: '*', value: this.multiplier};

        gv.ore.increase_value({
            gv,
            type: value_increase.type, 
            value: value_increase.value,
            source: this,
            activations
        });

        this.activate_effect({ gv, activations });
        
        activations.push(effect_activated({ id: gv.activation_id++ }));
        
        console.log(`  Current value: ${gv.ore.value}. Attributes: ${gv.ore.attributes}`);
    }
}


class Soaker extends Upgrader {
    activate_effect({gv, activations}) {
        gv.ore.add_attribute({ attribute: WET, source: this, gv, activations });
    }
}
export const soaker = new Soaker({
    name: 'Soaker',
    type: '*',
    rarity: 'R',
    multiplier: 2,
    effect: 'Multiplies the Ore\'s value by 2, and adds 1 Wet attribute to the Ore.',
    archetypes: ['*', 'Wet']
});

class Flame_Thrower extends Upgrader {
    activate_effect({gv, activations}) {
        gv.ore.add_attribute({ attribute: BURN, source: this, gv, activations });
    }
}
export const flame_thrower = new Flame_Thrower({
    name: 'Flame Thrower',
    type: '*',
    rarity: 'R',
    multiplier: 2,
    effect: 'Multiplies the Ore\'s value by 2, and adds 1 Burn attribute to the Ore',
    archetypes: ['*', 'Burn']
});

class Floral_Infuser extends Upgrader {
    activate_effect({gv, activations}) {
        gv.ore.add_attribute({ attribute: BLOOM, source: this, gv, activations });
    }
}
export const floral_infuser = new Floral_Infuser({
    name: 'Floral Infuser',
    type: '*',
    rarity: 'R',
    multiplier: 2,
    effect: 'Multiplies the Ore\'s value by 2, and adds 1 Bloom attribute to the Ore.',
    archetypes: ['*', 'Bloom']
});

class Zapper extends Upgrader {
    activate_effect({gv, activations}) {
        gv.ore.add_attribute({ attribute: SHOCK, source: this, gv, activations });
    }
}
export const zapper = new Zapper({
    name: 'Zapper',
    type: '*',
    rarity: 'R',
    multiplier: 2,
    effect: 'Multiplies the Ore\'s value by 2, and adds 1 Shock attribute to the Ore.',
    archetypes: ['*', 'Shock']
});

class Freezer extends Upgrader {
    activate_effect({gv, activations}) {
        gv.ore.add_attribute({ attribute: FROST, source: this, gv, activations });
    }
}
export const freezer = new Freezer({
    name: 'Freezer',
    type: '*',
    rarity: 'R',
    multiplier: 2,
    effect: 'Multiplies the Ore\'s value by 2, and adds 1 Frost attribute to the Ore.',
    sarchetypes: ['*', 'Frost']
});

export const all_upgraders = [
    soaker,
    flame_thrower,
    floral_infuser,
    zapper,
    freezer
];