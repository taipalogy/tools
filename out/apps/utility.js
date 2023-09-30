"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubSyllableMembers = void 0;
// Analyze a syllable and get sub-syllable members.
function getSubSyllableMembers(sequence, keys) {
    const result = [];
    let longestVal = '';
    while (sequence.length > 0) {
        keys.forEach((val) => {
            if (sequence.startsWith(val) && val.length > longestVal.length) {
                longestVal = val;
            }
        });
        if (longestVal.length == 0)
            break;
        // console.log('>' + sequence);
        sequence = sequence.slice(longestVal.length);
        // console.log('>' + sequence);
        result.push(longestVal);
        longestVal = '';
    }
    // console.log('>' + result + '>' + sequence);
    return result;
}
exports.getSubSyllableMembers = getSubSyllableMembers;
