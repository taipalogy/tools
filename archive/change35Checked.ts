import * as fs from 'fs';
import * as readline from 'readline';

import { Client } from '../taipa/src/client';
import {
  lowerLettersTonal,
  TonalSpellingTags,
  TonalLetterTags,
} from '../taipa/src/tonal/version2';
import { AlphabeticLetter } from '../taipa/src/unit';
import { eighthToFourthFinalConsonants } from '../taipa/src/tonal/collections';
import { TonalSyllable } from '../taipa/src/tonal/morpheme';

/**
 * drop one letter of stop finals for the third and fifth checked tones.
 */

const path = './markdowns/output.md';

const readInterface = readline.createInterface(
  fs.createReadStream('./markdowns/example.md')
);

fs.appendFileSync(path, '', {
  flag: 'w',
});

const buffer: string[] = [];
const cli = new Client();

readInterface.on('line', (l: string) => {
  let aLine = '';
  // tokenizer
  const tokens = l.match(/\w+/g);
  if (tokens) {
    for (let i = 0; i < tokens.length; i++) {
      const seqs = cli.processTonal(tokens[i]).letterSequences;
      // console.log(seqs);
      const syls: TonalSyllable[] = [];
      for (let seq of seqs) {
        let s: TonalSyllable = new TonalSyllable(
          seq.map(it => new AlphabeticLetter(it.characters))
        );
        const fnls = seq.filter(it => it.name === TonalSpellingTags.stopFinal);
        const tnls = seq.filter(
          it =>
            it.name === TonalSpellingTags.checkedTonal &&
            (it.toString() === TonalLetterTags.x ||
              it.toString() === TonalLetterTags.w)
        );
        if (fnls.length == 1 && tnls.length == 1) {
          const got = eighthToFourthFinalConsonants.get(fnls[0].toString());
          if (got) {
            s.popLetter(); // pop the tonal
            s.popLetter(); // pop the final
            s.pushLetter(lowerLettersTonal.get(got)); // push the new final
            s.pushLetter(lowerLettersTonal.get(tnls[0].toString())); // push back the tonal

            syls.push(s);
          }
        } else {
          syls.push(s);
        }
      }
      const word = seqs.map(x => x.map(y => y.toString()).join('')).join('');
      const wordAfter = syls.map(it => it.literal).join('');
      // console.log(word, wordAfter);
      if (word !== wordAfter) {
        let idx = 0;
        const len = tokens[i].length;
        let head = '';
        let tail = '';

        if (aLine.length == 0) {
          idx = l.indexOf(tokens[i]);
          head = l.slice(0, idx);
          tail = l.slice(idx + len);
        } else if (aLine.length > 0) {
          idx = aLine.indexOf(tokens[i]);
          head = aLine.slice(0, idx);
          tail = aLine.slice(idx + len);
        }
        aLine = head + wordAfter + tail;
      }
    }
    if (aLine.length > 0 && aLine !== l) buffer.push(aLine);
    else buffer.push(l);
  } else {
    // console.log(l);
    aLine = l;
    buffer.push(aLine);
  }
});

readInterface.on('close', () => {
  for (let i in buffer) {
    fs.appendFileSync(path, buffer[i] + '\n', {
      flag: 'a+',
    });
  }
});
