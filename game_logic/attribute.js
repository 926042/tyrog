export default class Attribute {
    constructor(name) {
        this.name = name;
    }
    toString() {
        return `${this.name}`; 
    }
    is_weak_to(catalysor_attribute) {
        return Object.keys(reaction_chart[this.name] || {}).includes(catalysor_attribute.name);
    }
    reaction(catalysor_attribute) {
        return (reaction_chart[this.name] || {})[catalysor_attribute.name] || '';
    }
}

const reaction_chart = {
    'Wet': {'Burn': 'Vaporized', 'Shock': 'Electrocute', 'Frost': 'Freeze'},
    'Burn': {'Wet': 'Extinguished', 'Bloom': 'Scorched', 'Frost': 'Melt'},
    'Bloom': {'Burn': 'Scorched'},
    'Shock': {'Wet': 'Electrocute'},
    'Frost': {'Wet': 'Freeze', 'Burn': 'Melt'}
};

export const WET = new Attribute('Wet');
export const BURN = new Attribute('Burn');
export const BLOOM = new Attribute('Bloom');
export const SHOCK = new Attribute('Shock');
export const FROST = new Attribute('Frost');