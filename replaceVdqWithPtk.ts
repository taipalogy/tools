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
  .set(TonalLetterTags.q, TonalLetterTags.k)
  .set(TonalLetterTags.p, TonalLetterTags.p + TonalLetterTags.h) // to be changed to TonalLetterTags.ph
  .set(TonalLetterTags.t, TonalLetterTags.t + TonalLetterTags.h) // to be changed to TonalLetterTags.th
  .set(TonalLetterTags.k, TonalLetterTags.k + TonalLetterTags.h); // to be changed to TonalLetterTags.kh

readInterface.on('line', (l: string) => {
  let aLine = '';
  // tokenizer
  const tokens = l.match(/\w+/g);
  if (tokens) {
    for (let i = 0; i < tokens.length; i++) {
      // const gs = graphAnalyzeTonal(tokens[i]);
      // console.log(gs);
      const seqs = cli.processTonal(tokens[i]).letterSequences;
      // console.log(seqs);
      const syls: TonalSyllable[] = [];
      for (let seq of seqs) {
        let s: TonalSyllable = new TonalSyllable(
          seq.map(it => new AlphabeticLetter(it.characters))
        );

        const initsVdq = seq.filter(
          it =>
            it.name === TonalSpellingTags.initial &&
            (it.toString() === TonalLetterTags.v ||
              it.toString() === TonalLetterTags.d ||
              it.toString() === TonalLetterTags.q)
        );
        const initsPtk = seq.filter(
          it =>
            it.name === TonalSpellingTags.initial &&
            (it.toString() === TonalLetterTags.p ||
              it.toString() === TonalLetterTags.t ||
              it.toString() === TonalLetterTags.k)
        );

        if (initsVdq.length == 1) {
          const got = vdqToPtk.get(initsVdq[0].toString());
          if (got) {
            // to remove v, d, q from lowerLettersTonal
            s.replaceLetter(0, lowerLettersTonal.get(got));
            // console.log(`replacing with ${got} and get ${s.literal}`);
            syls.push(s);
          }
        } else if (initsPtk.length == 1) {
          const got = vdqToPtk.get(initsPtk[0].toString());
          if (got) {
            // to add ph, th, kh to lowerLettersTonal
            // the below line doesn't work before adding the above letters
            s.replaceLetter(0, lowerLettersTonal.get(got));
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
