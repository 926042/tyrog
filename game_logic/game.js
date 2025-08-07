import { animation_delay_tracker } from "./animations.js";

export class Game_Variables {
    constructor({ ore = null, character = null, upgraders = [], skills = [], reactions = [], game_stage = 'MAIN', debug = false, play_animations = false }) {
        this.ore = ore;
        this.character = character;
        this.upgraders = upgraders;
        this.skills = skills;
        this.reactions = reactions;
        this.game_stage = game_stage;
        this.activation_id = 1
        this.debug = debug;
        this.play_animations = play_animations;
    }
}

export default function play_gameround({ gv }) {

    // 1: calculate ore value
    let value = calculate_value({ gv });
    return value;

    // 2: seller
    // not implemented yet

    // 3: Shop
    //    - Could buy a thing to check optimal layout of upgraders and skills
    //      Or for more balancing, check how optimal your layout is
    //    - Some vendors to upgrade dropper, upgraders, and seller
    //    - Buy new skills and upgrades. 
    //      - possibly dropper, but that could be the "deck"
    //      - possibly ore, could have different ores and 
    //        amounts of ore like in peglin

    // 4: New round
}

export function calculate_value({ gv }) {
    // 1: drop ore
    console.log(`Dropped ore [${gv.ore.name}]. Value: ${gv.ore.value}. Attributes: ${gv.ore.attributes}`);
    console.log(`Upgraders: ${gv.upgraders.toString()}`);
    console.log(`Skills: ${gv.skills.toString()}`);
    console.log(`\n${gv.game_stage} Phase`);

    for (const i in gv.upgraders) {
        gv.upgraders[i] = gv.upgraders[i].clone();
        gv.upgraders[i].id = i;
    }
    for (const i in gv.skills) {
        gv.skills[i] = gv.skills[i].clone();
        gv.skills[i].id = i;
    }
    if (gv.character) gv.character.id = 0;

    const activations = [];

    // 2: go through upgraders and apply effects
    for (const upgrader of gv.upgraders) {
        activations.length = 0;
        upgrader.process_ore({ gv, activations });
        handle_new_triggers({ gv, activations });
        console.log('');
        activations.length = 0;
    };

    // 3: activate static skills
    activations.length = 0; // this might cause issue but shouldn't 
    gv.game_stage = 'END';
    console.log(`${gv.game_stage} Phase`);
    for (const skill of gv.skills) {
        if (skill.type === 'static') {
            gv.game_stage = 'END';
            skill.apply_skill({ gv, activations });
            gv.game_stage = 'MAIN';
            handle_new_triggers({ gv, activations });
        }
    }

    // reset for next round
    for (const skill of gv.skills) {
        skill.passive = 0;
        skill.activation_stacks = 0;
        skill.state = 0;
        skill.activated_ids.length = 0;
        gv.activated_ids = [1];
    };
    if (gv.character) gv.character.activated_ids.length = 0;
    animation_delay_tracker.delay = 0;
    
    // log final values
    console.log('________');
    console.log(`Final value: ${gv.ore.value.toLocaleString('en-US')}. Attributes: ${gv.ore.attributes}`);

    return gv.ore.value;
}

export function handle_new_triggers({ gv, activations }) {
    if (!activations || activations.length === 0) return;
    if (gv.debug === true) console.log('\n### handle_new_triggers ###');

    let temp_activations = [];

    function check_trigger_activation(activation) {
        let activated = false;
        
        if (gv.character) {
            for (const skill_trigger of gv.character.triggers) {
                if (skill_trigger.equals(activation) || gv.character.triggers.includes(activation)) {
                    const skill_activated = gv.character.apply_passive({ gv, activations: temp_activations, activation });
                    if (skill_activated) {
                        activated = true;
                        
                        // Immediately process new activations if any were generated
                        if (temp_activations.length > 0) {
                            if (gv.debug) console.log('- - - - - Processing new new activations, character');
                            
                            const temp_temp_activations = [...temp_activations];
                            handle_new_triggers({ gv, activations: temp_temp_activations });
                            
                            if (gv.debug) console.log('- - - - - Done processing new new activations, character');
                        }
                    }
                }
            }
        }

        for (const skill of gv.skills) {
            for (const skill_trigger of skill.triggers) {
                if (skill_trigger.equals(activation) || skill.triggers.includes(activation)) {
                    if (gv.debug) console.log('- - - - activating', skill.name, skill.id, activation.toString());
                    const skill_activated = skill.apply_skill({ gv, activations: temp_activations, activation });
                    if (skill_activated) {
                        activated = true;

                        // Immediately process new activations if any were generated
                        if (temp_activations.length > 0) {
                            if (gv.debug) console.log('- - - - - Processing new new activations, skill');
                            
                            const temp_temp_activations = [...temp_activations];
                            handle_new_triggers({ gv, activations: temp_temp_activations });
                            
                            if (gv.debug) console.log('- - - - - Done processing new new activations, skill');
                        }
                    }
                }
            }
        }

        return activated;
    }
    
    for (let i = 0; i < activations.length; i++) {
        const activation = activations[i];

        if (gv.debug) {
            console.log('- activations:');
            for (const t of activations) {
                console.log('- - -', t.toString());
            }
            console.log('- checking activation', activation.toString());
        }

        if (!check_trigger_activation(activation)) {
            // remove activation if it didn't trigger anything, to prevent excessive looping and improve performance
            if (gv.debug) console.log('- - didn\'t activate, removing...');
            activations.splice(i, 1);
            i--; // adjust the index after removal so it doesn't skip over an activation
        }
    }

    temp_activations.length = 0;
    activations.length = 0;
}