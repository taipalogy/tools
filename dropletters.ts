import * as fs from 'fs';
import * as readline from 'readline';
import { Client } from '../taipa/src/client';
import { graphAnalyzeTonal } from '../taipa/src/tonal/analyzer';
import {
  TonalLetterTags,
  lowerLettersTonal,
} from '../taipa/src/tonal/version2';
import { AlphabeticGrapheme } from '../taipa/src/unit';
import { eighthToFourthFinals } from '../taipa/src/tonal/collections';

/**
 * drop one letter of stop finals for the third and fifth checked tones.
 */

let path = './markdowns/output.md';

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
      const gs = graphAnalyzeTonal(tok);
      const checkedFinals = gs.filter(it =>
        eighthToFourthFinals.has(it.letter.literal)
      );
      const thirdFifthTonals = gs.filter(
        it =>
          it.letter.literal === TonalLetterTags.x ||
          it.letter.literal === TonalLetterTags.w
      );
      if (checkedFinals.length > 0 && thirdFifthTonals.length > 0) {
        const gsAfter = gs.map(it => {
          const got = eighthToFourthFinals.get(it.letter.literal);
          if (got) {
            return new AlphabeticGrapheme(lowerLettersTonal.get(got));
          } else {
            return it;
          }
        });
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
        aLine = head + gsAfter.map(it => it.letter.literal).join('') + tail;
      }
    }
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
