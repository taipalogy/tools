import * as fs from 'fs';
import * as readline from 'readline';
import { Client } from '../taipa/src/client';
import { graphAnalyzeTonal } from '../taipa/src/tonal/analyzer';
import {
  TonalLetterTags,
  lowerLettersTonal,
} from '../taipa/src/tonal/version2';
import { AlphabeticGrapheme } from '../taipa/src/unit';

/**
 * drop one letter of stop finals for the third and fifth checked tones.
 */

let path = '../markdowns/output.md';

const readInterface = readline.createInterface(
  fs.createReadStream('../markdowns/example.md')
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
      // console.log(gs)
      const thirdsFifths = gs.filter(
        it => it.letter.literal === TonalLetterTags.hh
      );
      if (thirdsFifths.length > 0) {
        const gsAfter = gs.map(it => {
          if (it.letter.literal === TonalLetterTags.hh) {
            return new AlphabeticGrapheme(
              lowerLettersTonal.get(TonalLetterTags.h)
            );
          } else {
            return it;
          }
        });
        // console.log(gsAfter);
        aLine += gsAfter.map(it => it.letter.literal).join('');
      } else {
        aLine += tok;
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
