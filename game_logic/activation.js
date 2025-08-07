export default class Activation {
    constructor({ activation = null, attribute = null, value = null, amount = null, name = null, type = null, reaction = null, R_attributes = null, id = null, source = null}) {
        this.activation = activation;
        this.attribute = attribute;
        this.value = value;
        this.type = source !== null ? source.card_type : type;
        this.amount = amount;
        this.name = source !== null ? source.name : name;
        this.reaction = reaction;
        this.R_attributes = R_attributes;
        this.id = id;
        this.source = source;
    }

    toString() {
        const parts = [`activation: ${this.activation}`];
        if (this.attribute !== null) parts.push(`attribute: ${this.attribute}`);
        if (this.value !== null) parts.push(`value: ${this.value}`);
        if (this.type !== null) parts.push(`type: ${this.type}`);
        if (this.name !== null) parts.push(`name: ${this.name}`);
        if (this.reaction !== null) parts.push(`reaction: ${this.reaction}`);
        if (this.R_attributes !== null) parts.push(`R_attributes: ${this.R_attributes}`);
        return `Activation({${parts.join(', ')}})`;
    }

    equals(other) {
        if (!(other instanceof Activation)) return false;
        if (this.activation === 'none') return false; // some skills use 'none' to only activate at the end of the turn.
        if (this.activation !== null && other.activation !== null && this.activation !== other.activation) return false;
        if (this.activation !== null && other.activation === null) return false;
        if (this.attribute !== null && other.attribute !== null && this.attribute !== other.attribute) return false;
        if (this.attribute !== null && other.attribute === null) return false;
        if (this.value !== null && other.value !== null && this.value !== other.value) return false;
        if (this.value !== null && other.value === null) return false;
        if (this.type !== null && other.type !== null && this.type !== other.type) return false;
        if (this.type !== null && other.type === null) return false;
        if (this.amount !== null && other.amount === null) return false;
        if (this.amount !== null && other.amount !== null && this.amount > other.amount) return false;
        if (this.name !== null && other.name !== null && this.name !== other.name) return false;
        if (this.name !== null && other.name === null) return false;
        if (this.reaction !== null && other.reaction !== null && this.reaction !== other.reaction) return false;
        if (this.reaction !== null && other.reaction === null) return false;
        if (this.R_attributes !== null && other.R_attributes !== null && this.R_attributes.length !== 1 && this.R_attributes !== other.R_attributes) return false;
        if (this.R_attributes !== null && other.R_attributes !== null && this.R_attributes.length === 1 && !other.R_attributes.includes(this.R_attributes[0])) return false;
        if (this.R_attributes !== null && other.R_attributes === null) return false;
        return true;
    }
}

export function no_activation() {
    return new Activation({ activation: 'none' });
}
export function attribute_added({ attribute = null, amount = 1, type = null, name = null, id = null, source = null }) {
    return new Activation({ activation: 'attribute_added', attribute, amount, type, name, id, source });
}
export function attribute_removed({ attribute = null, amount = 1, type = null, name = null, id = null, source = null }) {
    return new Activation({ activation: 'attribute_removed', attribute, amount, type, name, id, source });
}
export function reaction_triggered({ R_attributes = null, reaction = null, type = null, name = null, id = null, source = null }) {
    return new Activation({ activation: 'reaction_triggered', R_attributes, reaction, type, name, id, source });
}
export function ore_value_increased({ value = null, type = null, name = null, id = null, source = null } = {}) {
    return new Activation({ activation: 'ore_value_increased', value, type, name, id, source });
}
export function ore_value_multiplied({ value = null, type = null, name = null, id = null, source = null } = {}) {
    return new Activation({ activation: 'ore_value_multiplied', value, type, name, id, source });
}
export function effect_activated({ type = null, name = null, id = null, source = null }) {
    return new Activation({ activation: 'effect_activated', type, name, id, source });
}