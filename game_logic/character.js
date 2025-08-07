import Activation, { attribute_added, reaction_triggered, ore_value_increased, effect_activated } from "./activation.js";
import { SHOCK } from "./attribute.js";

export default class Character {
    constructor({name, description, triggers, value = 0, activation_stacks = 0, max_stacks = 0, activated_ids = [], id = 0}) {
        this.name = name;
        this.card_type = 'character';
        this.description = description;
        this.triggers = triggers;
        this.value = value;
        this.activation_stacks = activation_stacks;
        this.max_stacks = max_stacks;
        this.activated_ids = activated_ids;
        this.id = id;
    }
    toString() {
        return `${this.name}`;
    }
    apply_passive({gv, activations = [], activation = null}) {
        if (activation !== undefined && this.activated_ids.includes(activation.id)) return false;
        
        const passive_activated = this.activate_passive({ gv, activations, activation });
        if (passive_activated !== not_activated)
            if (activation !== undefined) this.activated_ids.push(activation.id);
            activations.push(effect_activated({ id: gv.activation_id++, source: this }))
            console.log(`  Current value: ${gv.ore.value.toLocaleString('en-US')}. Attributes: ${gv.ore.attributes}`);
            
            return true;
        return false;
    }
}

const not_activated = false;

class Mechanic extends Character {
    activate_passive({gv, activations = [], activation = null}) {
        this.activation_stacks += 1;
        if (this.activation_stacks >= this.max_stacks) {
            console.log(`[Charge] has reached ${this.max_stacks} :`);
            gv.ore.increase_value({ gv, type: '*', value: this.value, source: this, activations });
            this.activation_stacks -= this.max_stacks;
        } else {
            console.log(`Character [${this.name}]'s character passive gained 1 [Charge]. [Charge] stacks: ${this.activation_stacks}/${this.max_stacks}`);
            return not_activated;
        }
    }
}
export const mechanic = new Mechanic({
    name: 'Mechanic',
    description: 'If a [Shock] attribute is added to the Ore: Gains 1 [Charge]. Once 3 [Charge] is accumulated, consumes 3 [Charge] and multiplies the Ore\'s value by 5',
    triggers: [attribute_added({ attribute: SHOCK })],
    max_stacks: 3,
    value: 5
});

class Witch extends Character {
    activate_passive({gv, activations = [], activation = null}) {
        gv.ore.increase_value({ gv, type: '+', value: this.value, source: this, activations });
    }
}
export const witch = new Witch({
    name: 'Witch',
    description: 'If reaction is triggered: Increases Ore\'s value by 100',
    triggers: [reaction_triggered({})],
    value: 100
});
