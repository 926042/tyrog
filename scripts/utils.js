/**
 * Selects a random element from an array.
 * 
 * @param {Array} arr The array to select a random element from.
 * @returns {*} The randomly selected element from the array.
 *
 * @example
 * const fruit = ['apple', 'banana', 'orange'];
 * const random_item = choice(fruit);
 * console.log(random_item); // e.g. 'banana'
 */
export function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks a random index of an array
 * 
 * @param {*} arr - The array to get the random index of.
 * @returns {number} The randomly picked index.
 * 
 * @example
 * const letters = ['a', 'b', 'c', 'd', 'e'];
 * const index = random_index(letters);
 * console.log(index); // e.g. 2
 */
export function random_index(arr) {
    return Math.floor(Math.random() * arr.length);
}

/**
 * Generates a random integer between the specified min and max, both inclusive.
 *
 * @param {number} min - The minimum value of the random integer.
 * @param {number} max - The maximum value of the random integer.
 * @returns {number} A random integer between min and max, inclusive.
 * 
 * @example
 * const random_number = randint(1, 2);
 * console.log(random_number); // Output: 1 or 2
 */
export function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 *
 * @param {Array} arr - The array to be shuffled.
 * @returns {Array} The shuffled array.
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5];
 * shuffle_array(numbers);
 * console.log(numbers); // e.g. [3, 4, 2, 1, 5]
 */
export function shuffle_array(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const random_index = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[random_index]] = [arr[random_index], arr[i]];
    }
    return arr;
}

/**
 * Removes the specified elements from an array.
 * 
 * @param {Array} arr The original array.
 * @param {Array} exclude An array of the elements to exclude from the original array.
 * @returns {Array} A new array with the elements from `exclude` removed.
 * 
 * @example
 * const numbers = [1, 2, 3, 4, 5];
 * const toExclude = [2, 4];
 * const result = exclude(original, toExclude);
 * console.log(result); // Output: [1, 3, 5]
 */
export function exclude(arr, exclude) {
    return arr.filter(element => !exclude.includes(element));
}

/**
 * Returns the logarithm of a value with a specified base
 * 
 * @param {Number} base - The base of the logarithm (must be greater than 0 and not equal to 1).
 * @param {Number} value - The number to calculate the logarithm for (must be positive).
 * @returns {Number} The logaritm of the value with the specified base.
 * 
 * @example
 * console.log(log(2, 8)); // 3
 */
export function log(base = 10, value) {
    return Math.log(value) / Math.log(base);
}

/**
 * Calculates how much money the player earns based
 * on the ore value and the target ore value.
 * The result is rounded up.
 * Extra multipliers e.g. from skills are also applied.
 * 
 * @param {Number} value - The player's achieved ore value.
 * @param {Number} target - The target ore value.
 * @param {Number[]} [mult=[1]] - An optional array of extra multipliers. Multipliers with a value of 1 are ignored.

 * @returns {Number} The calculated payout.
 * 
 * @example 
 * // With no additional multipliers
 * console.log(calculate_payout(1500, 1000)); // Output: 362
 * 
 * // With extra multipliers
 * console.log(calculate_payout(1500, 1000, [2, 2])); // Output: 1446
 */
export function calculate_payout(value, target, mult = [1]) {
    if (!(mult.length === 1 && mult[0] === 1)) {
        mult = sum_array(exclude(mult, [1]));
    }
    const k = 100;
    const m = 30;
    const base = 1.5
    const P = Math.ceil(log(base, value/target * k) * m * mult);
    return P
}
// Adjusting k: If you want to make the payouts even 
//   higher or lower for exceeding the target, you can 
//   tweak the value of k.
// Adjusting multiplier: The multiplier controls the 
//   overall scale of the payout. If you want the 
//   to be larger or smaller, you can adjust this
//   value accordingly.

/**
 * Returns the sum of the numbers in an array.
 * 
 * @param {Array} arr - The array to sum numbers from.
 * @returns {Number} - The sum of the numbers in the array. NaN if the array includes anything else than a number
 * 
 * @example
 * const numbers = [1, 5, 2, 8];
 * console.log(sum_array(numbers)); // 16
 */
export function sum_array(arr) {
    let sum = 0;
    for (let value of arr) {
        if (value !== Number(value)) return NaN;
        sum += value;
    }
    return sum;
}

/**
 * Moves an html element to another container
 * @param {*} element html element to move
 * @param {*} current previous container of element
 * @param {*} other container to move element to  
 */
export function move_to_container(element, current, other) {
    if (current.contains(element)) {
        current.removeChild(element);
        other.appendChild(element);
    } else {
        console.error(`Element not found in container`)
    }
}

/**
 * Removes child elements from a parent element based on a dynamic property type and name match.
 *
 * @param {HTMLElement} parent - The parent element containing child elements.
 * @param {string} name - The name to match against the child's dynamic property (e.g., `skill.name` or `upgrader.name`).
 * @param {string} type - The dynamic property name to check on the child (e.g., `skill` or `upgrader`).
 * @param {number} [amount=1] - The number of matching children to remove.
 */
export function remove_card_by_name(parent, name, type, amount = 1) {
    let removed_count = 0;

    for (const child of [...parent.children]) {
        if (removed_count >= amount) break;

        if (child[type] && child[type].name === name) {
            parent.removeChild(child);
            removed_count++;
        }
    }
}


/**
 * Formats a number by adding dots every three digits (for numbers less than 10^9).
 * For numbers greater than or equal to 10^9, it uses scientific notation (e.g., 1.234e+9).
*
 * @param {number} num - The number to format.
 * @returns {string} - The formatted number as a string, either with dots or in scientific notation.
*
* @example
* format_number(123456789);    // "123.456.789"
* format_number(1000000000);   // "1.000e+9"
* format_number(12345);        // "12.345"
* format_number(1234567890);   // "1.234e+9"
*/
export function format_number(num) {
    let number = String(Math.ceil(num));
    
    if (number.includes('e')) { // if already e, reduce decimals
        let e = Number(number.slice(number.indexOf('e') + 2));
        
        number = number.slice(0, number.indexOf('e')).replace('.', '');
        if (number[4] >= 5) {
            number = String(Number(`${number.slice(0, 4)}`) + 1);
            if (number.length > 4) {
                number = number.slice(0, 4);
                e++;
            }
        }
        
        return `${number[0]}.${number.slice(1, 4)}e+${e}`;
    }
    
    if (number.length > 10) { // change to e at 10^9
        let e = number.length - 1;
       
        if (number[4] >= 5) { // round up 
            number = String(Number(number.slice(0, 4)) + 1)
            if (number.length > 4) {
                number = number.slice(0, 4);
                e++;
            }
        }
        
        return `${number[0]}.${number.slice(1, 4)}e+${e}`;
    }
    
    let result = '';
    for (let i = number.length - 1, j = 1; i >= 0; i--, j++) {
        result += number[i]
        if (!(j % 3) && i !== 0) result += '.';
    }
    
    return result.split('').reverse().join('');
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const px_to_vw = px => px / window.innerWidth * 100;
export const px_to_vh = px => px / window.innerHeight * 100;
