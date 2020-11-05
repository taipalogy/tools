import * as fs from 'fs';
import * as readline from 'readline';

import { Client } from '../taipa/src/client';
import {
  lowerLettersTonal,
  TonalSpellingTags,
  TonalLetterTags,
} from '../taipa/src/tonal/version2';
import { AlphabeticLetter } from '../taipa/src/unit';
import { TonalSyllable } from '../taipa/src/tonal/morpheme';
import { graphAnalyzeTonal } from '../taipa/src/tonal/analyzer';

/**
 * Replace letters v, d, and q with letters p, t, k. Replace letters p, t, and k with letters, ph, th, kh.
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

const vdqToPtk = new Map<string, string>()
  .set(TonalLetterTags.v, TonalLetterTags.p)
  .set(TonalLetterTags.d, TonalLetterTags.t)
  .set(TonalLetterTags.q, TonalLetterTags.k);

readInterface.on('line', (l: string) => {
  let aLine = '';
  // tokenizer
  const tokens = l.match(/\w+/g);
  if (tokens) {
    for (let i = 0; i < tokens.length; i++) {
      // const gs = graphAnalyzeTonal(tokens[i]);
      // console.log(tokens[i], gs.map(it => it.letter.literal).join(''));
      const seqs = cli.processTonal(tokens[i].toLowerCase()).letterSequences;
      // console.log(seqs);
      let isCapital: boolean[] = [];
      let len: number = -1; // length of all preceding letters
      const syls: TonalSyllable[] = [];
      for (let j = 0; j < seqs.length; j++) {
        let s: TonalSyllable = new TonalSyllable(
          seqs[j].map(it => new AlphabeticLetter(it.characters))
        );

        isCapital[j] = false; // defaulted as false
        const initsVdq = seqs[j].filter(
          it =>
            it.name === TonalSpellingTags.initial &&
            (it.toString() === TonalLetterTags.v ||
              it.toString() === TonalLetterTags.d ||
              it.toString() === TonalLetterTags.q)
        );
        const initsPtk = seqs[j].filter(
          it =>
            it.name === TonalSpellingTags.initial &&
            (it.toString() === TonalLetterTags.p ||
              it.toString() === TonalLetterTags.t ||
              it.toString() === TonalLetterTags.k)
        );

        len = seqs
          .map((val, k, arr) => (k < j ? val : []))
          .map(it => it.length)
          .reduce((prev, curr) => prev + curr);
        if (s.letters[0].literal.toUpperCase() === tokens[i].charAt(len)) {
          // if this letter is capital
          isCapital[j] = true;
        }

        if (initsVdq.length == 1) {
          const got = vdqToPtk.get(initsVdq[0].toString());
          if (got) {
            // to remove v, d, q from lowerLettersTonal
            s.replaceLetter(0, lowerLettersTonal.get(got));
            // console.log(`replacing with ${got} and get ${s.literal}`);
            syls.push(s);
          }
        } else if (initsPtk.length == 1) {
          // insert an h after p, t, k
          s.insertLetter(1, lowerLettersTonal.get(TonalLetterTags.h));
          // console.log(`replacing with ${initsPtk[0] + 'h'} and get ${s.literal}`);
          syls.push(s);
        } else {
          syls.push(s);
        }
      }
      const word = seqs.map(x => x.map(y => y.toString()).join('')).join('');
      const wordAfter = syls.map(it => it.literal).join('');
      // console.log(tokens[i], word, wordAfter);
      if (word !== wordAfter && tokens[i].length <= wordAfter.length) {
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

        // if the initial of this syllable is capital
        const wordAfterWCapital = syls
          .map((val, ind, arr) =>
            isCapital[ind]
              ? arr[ind].literal[0].toUpperCase() +
                arr[ind].literal.substring(1)
              : arr[ind].literal
          )
          .join('');
        // console.log(wordAfterWCapital);
        aLine = head + wordAfterWCapital + tail;
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
