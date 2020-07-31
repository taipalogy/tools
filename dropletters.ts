import * as fs from 'fs';
import * as readline from 'readline';

import { Client } from '../taipa/src/client';
import { graphAnalyzeTonal } from '../taipa/src/tonal/analyzer';
import {
  TonalLetterTags,
  lowerLettersTonal,
  TonalSoundTags,
} from '../taipa/src/tonal/version2';
import { AlphabeticGrapheme, Sound, AlphabeticLetter } from '../taipa/src/unit';
import { eighthToFourthFinals } from '../taipa/src/tonal/collections';
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
    for (const tok of tokens) {
      // const gs = graphAnalyzeTonal(tok);
      const seqs = cli.processTonal(tok).soundSequences;
      // console.log(seqs);
      const syls: TonalSyllable[] = [];
      for (let seq of seqs) {
        let s: TonalSyllable = new TonalSyllable(
          seq.map(it => new AlphabeticLetter(it.characters))
        );
        const fnls = seq.filter(it => it.name === TonalSoundTags.stopFinal);
        const tnls = seq.filter(it => it.name === TonalSoundTags.checkedTonal);
        if (fnls.length == 1 && tnls.length == 1) {
          const got = eighthToFourthFinals.get(fnls[0].toString());
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
        const len = tok.length;
        let head = '';
        let tail = '';

        if (aLine.length == 0) {
          idx = l.indexOf(tok);
          head = l.slice(0, idx);
          tail = l.slice(idx + len);
        } else if (aLine.length > 0) {
          idx = aLine.indexOf(tok);
          head = aLine.slice(0, idx);
          tail = aLine.slice(idx + len);
        }
        aLine = head + wordAfter + tail;
      }
    }
  } else {
    aLine = l;
  }
  buffer.push(aLine);
});

readInterface.on('close', () => {
  for (let i in buffer) {
    fs.appendFileSync(path, buffer[i] + '\n', {
      flag: 'a+',
    });
  }
});
