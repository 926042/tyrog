import Ore, {water_stone} from './ore.js';
import Upgrader, {soaker, flame_thrower, floral_infuser, zapper, freezer} from './upgrader.js';
import Skill, {surge, steam_engine, rewind, storm_conduit, current, unwavering_flame, vault, catalyst, rising_flame, cleanse, scorched_amplifier, all_skills, double_strike, ignite, cascade, quench, budding_blossom, bountiful_infusion, volcano, overflow, resonance, attribute_duplication} from './skill.js';
import Character, {mechanic, witch} from './character.js';
import play_gameround, {Game_Variables} from './game.js';

/// file to debug ore value calculation ///
/// mainly to test if skills work properly ///

function main() {
    const ore = new Ore({
        name: 'Test Ore',
        base_value: 5,
    });

    const character = witch; //mechanic
    const upgraders = [flame_thrower, floral_infuser, flame_thrower]; //soaker, zapper, flame_thrower
    const skills = [rising_flame, ignite, attribute_duplication, scorched_amplifier]; //storm_conduit, double_strike, current, cleanse, rewind
    
        
    const gv = new Game_Variables({
        ore: ore,
        character: character,
        upgraders: upgraders,
        skills: skills,
        debug: false,
        play_animations: false
    });

    play_gameround({ gv });
}
main();