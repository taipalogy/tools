import * as fs from 'fs';
import { getSubSyllableMembers } from '../apps/utility';

const stdin = process.openStdin();

if (process.argv.length == 3) {
  if (!fs.existsSync(process.argv[2])) {
    console.log('File not found');
  }
}

interface dictType {
  [key: string]: string[];
}

// Process command line input
stdin.addListener('data', function (data) {
  if (process.argv.length == 2) {
    // const letterSequence = data.toString().trim();
    // const result = analyzeSyllable(letterSequence);
  } else if (process.argv.length == 3) {
    if (!fs.existsSync(process.argv[2])) {
      console.log('File not found');
    } else {
      const fileContents = fs.readFileSync(process.argv[2], 'utf-8');
      const dict: dictType = JSON.parse(fileContents) || [];
      const keys = Object.keys(dict);

      const input = data.toString().trim();
      const result = getSubSyllableMembers(input, keys);

      // Output the sub-syllable members
      // console.log(result);
      console.info(
        result
          .map((val, ind) => (ind == 0 ? dict[val][0] : dict[val][1]))
          .join('')
      );
    }
  } else {
    // e.g. node out/transliterate.js ../dictionaries/fromhangul.json
    console.info('Usage: node path/to/transliterate.js from_lang.json');
  }
});
