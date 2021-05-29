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
// import { graphAnalyzeTonal } from '../taipa/src/unchange/analyzer';

/**
 * Replace eng with ing. Replace oa with ua, oai with uai, oe with ue.
 * Taipa v0.8.0
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

const stopWords: string[] = [''];

readInterface.on('line', (l: string) => {
  let aLine = '';
  // tokenizer
  const tokens = l.match(/\w+/g);
  if (tokens) {
    for (let i = 0; i < tokens.length; i++) {
      // const gs = graphAnalyzeTonal(tokens[i]);
      // console.log(tokens[i], gs.map(it => it.letter.literal).join(''));
      // when the token is an english word or stop word, it should be skipped.
      if (stopWords.includes(tokens[i])) continue;
      const seqs = cli.processTonal(tokens[i].toLowerCase()).letterSequences;

      let isCapital: boolean[] = [];
      let len: number = -1; // length of all preceding letters
      const syls: TonalSyllable[] = [];
      for (let j = 0; j < seqs.length; j++) {
        let s: TonalSyllable = new TonalSyllable(
          seqs[j].map(it => new AlphabeticLetter(it.characters))
        );

        isCapital[j] = false; // defaulted as false
        const medialE = seqs[j].filter(
          it =>
            it.name === TonalSpellingTags.vowel &&
            it.toString() === TonalLetterTags.e
        );
        const finalNG = seqs[j].filter(
          it =>
            it.name === TonalSpellingTags.nasalFinalConsonant &&
            it.toString() === TonalLetterTags.ng
        );
        const medialI = seqs[j].filter(
          it =>
            it.name === TonalSpellingTags.vowel &&
            it.toString() === TonalLetterTags.i
        );
        const medialOa = seqs[j].filter(
          it =>
            it.name === TonalSpellingTags.vowel &&
            (it.toString() === TonalLetterTags.o ||
              it.toString() === TonalLetterTags.a)
        );
        const medialOe = seqs[j].filter(
          it =>
            it.name === TonalSpellingTags.vowel &&
            (it.toString() === TonalLetterTags.o ||
              it.toString() === TonalLetterTags.e)
        );

        len = seqs
          .map((val, k, arr) => (k < j ? val : []))
          .map(it => it.length)
          .reduce((prev, curr) => prev + curr);
        if (s.letters[0].literal.toUpperCase() === tokens[i].charAt(len)) {
          // if this letter is capital
          isCapital[j] = true;
        }

        if (medialE.length == 1 && finalNG.length == 1 && medialI.length == 0) {
          if (s.letters[0].literal === TonalLetterTags.e)
            s.replaceLetter(0, lowerLettersTonal.get(TonalLetterTags.i));
          else if (s.letters[1].literal === TonalLetterTags.e)
            s.replaceLetter(1, lowerLettersTonal.get(TonalLetterTags.i));
          // console.log(`replacing with ${got} and get ${s.literal}`);
          syls.push(s);
        } else if (
          (medialOa.length == 2 &&
            medialOa[0].toString() === TonalLetterTags.o &&
            medialOa[1].toString() === TonalLetterTags.a) ||
          (medialOa.length == 3 &&
            medialOa[0].toString() === TonalLetterTags.o &&
            medialOa[1].toString() === TonalLetterTags.a &&
            medialOa[1].toString() === TonalLetterTags.i) ||
          (medialOe.length == 2 &&
            medialOe[0].toString() === TonalLetterTags.o &&
            medialOe[1].toString() === TonalLetterTags.e)
        ) {
          if (s.letters[0].literal === TonalLetterTags.o)
            s.replaceLetter(0, lowerLettersTonal.get(TonalLetterTags.u));
          else if (s.letters[1].literal === TonalLetterTags.o)
            s.replaceLetter(1, lowerLettersTonal.get(TonalLetterTags.u));
          // console.log(`replacing with ua and get ${s.literal}`);
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
