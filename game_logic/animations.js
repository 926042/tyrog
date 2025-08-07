// obj instead of number since somehow it still was a constant
// variable even though I used let animation_delay_tracker, so
// it gave an error when resetting it in game.js
export const animation_delay_tracker = {delay: 0};
const animation_stagger_interval = 0.4;

class Animation {
    constructor({amount, source}) {
        this.amount = amount,
        this.source = source
    }

    play() {        
        let card_el;
        let card_els = document.querySelectorAll(`#${this.source.card_type}-container .${this.source.card_type}`)
        for (const c_el of card_els) {
            if (Number(c_el.dataset.index) === Number(this.source.id)) {
                card_el = c_el;
                break;
            }
        }

        this.play_anim(card_el);
        
        animation_delay_tracker.delay += animation_stagger_interval;
    }
} 

function scale_up_down(card_el) {
    gsap.fromTo(card_el, 
        { scale: 1 }, 
        { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1, ease: 'easeInOut', delay: animation_delay_tracker.delay }
    );
}

class add_attribute extends Animation {
    play_anim(card_el) {
        scale_up_down(card_el);
    }
}
class remove_attribute extends Animation {
    play_anim(card_el) {
        scale_up_down(card_el);
    }
}
class increase_ore_value extends Animation {
    play_anim(card_el) {
        scale_up_down(card_el);
    }
}
class multiply_ore_value extends Animation {
    play_anim(card_el) {
        scale_up_down(card_el);
    }
}
class reaction extends Animation {
    play_anim(card_el) {
        scale_up_down(card_el);
    }
}
class gain_stack extends Animation {
    play_anim(card_el) {
        scale_up_down(card_el);
    }
}
class lose_stack extends Animation {
    play_anim(card_el) {
        scale_up_down(card_el);
    }
}


export default function play_animation(animation) {
    animation.play();
}

export function anim_add_attribute({amount = 1, source}) {
    return new add_attribute({ amount, source });
}

export function anim_remove_attribute({amount = 1, source}) {
    return new remove_attribute({ amount, source });
}

export function anim_increase_ore_value({amount = 0, source}) {
    return new increase_ore_value({ amount, source });
}

export function anim_multiply_ore_value({amount = 0, source}) {
    return new multiply_ore_value({ amount, source });
}

export function anim_reaction({source}) {
    return new reaction({ source });
}

export function anim_gain_stack({amount, source }) {
    return new gain_stack({ amount, source });
}

export function anim_lose_stack({amount, source}) {
    return new lose_stack({ amount, source });
}