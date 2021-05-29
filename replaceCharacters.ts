import * as fs from 'fs';
import * as readline from 'readline';

import { Client } from '../taipa/src/client';
import {
  lowerLettersTonal,
  TonalSoundTags,
  TonalLetterTags,
} from '../taipa/src/tonal/version2';
import { AlphabeticLetter } from '../taipa/src/unit';
import { TonalSyllable } from '../taipa/src/unchange/unit';
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

const mapping = new Map<string, string>()
  .set('v', 'p')
  .set('d', 't')
  .set('q', 'k')
  .set('ppw', 'pw')
  .set('ttw', 'tw')
  .set('kkw', 'kw')
  .set('oa', 'ua')
  .set('oai', 'uai')
  .set('oe', 'ue')
  .set('eng', 'ing');

const regexPtk = /p|t|k/g;
const regexChecked35 = /ttw|ppw|kkw|ttx|ppx|kkx/g;
const regexFywxzPtk = /fp|yp|wp|xp|zp|ft|yt|wt|xt|zt|fk|yk|wk|xk|zk/g;
const regexVdq = /v|d|q/g;
const regexOaoe = /oa|oe/g;
const regexEng = /eng/g;

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
      let boolPtk = regexPtk.test(tokens[i].toLowerCase());
      let boolChecked35 = regexChecked35.test(tokens[i].toLowerCase());
      const matchedPtk = tokens[i].toLowerCase().match(regexPtk);
      const matchedChecked35 = tokens[i].toLowerCase().match(regexChecked35);
      // console.log(tokens[i].toLowerCase(),boolPtk,boolChecked35,matchedPtk,matchedChecked35);

      // ttw -> tw, ppw -> pw, kkw -> kw
      // ttx -> tx, ppx -> px, kkx -> kx
      let tok = tokens[i].toLowerCase();
      while (boolPtk && boolChecked35) {
        const indexPtk = tokens[i].toLowerCase().search(regexPtk);
        const index35 = tokens[i].toLowerCase().search(regexChecked35);
        // console.log(indexPtk, index35);
        if (indexPtk == index35) {
          const got = mapping.get(tokens[i].toLowerCase().substr(index35, 3));
          if (got) {
            tok = tokens[i]
              .toLowerCase()
              .replace(tokens[i].toLowerCase().substr(index35, 3), got);
          }
          // console.log(got, tok);
        }
        boolPtk = regexPtk.test(tok);
        boolChecked35 = regexChecked35.test(tok);
      }

      // initial. p -> ph, t -> th, k -> kh.
      const splited: string[] = [];
      let remained = '';
      let indexFywxzPtk = 0;
      remained = tok.substr(indexFywxzPtk, tok.length);
      indexFywxzPtk = remained.search(regexFywxzPtk);
      while (indexFywxzPtk != -1) {
        // console.log(tok, indexFywxzPtk, remained.match(regexFywxzPtk));

        splited.push(remained.substr(0, indexFywxzPtk + 1));
        remained = remained.substring(splited.join('').length);

        indexFywxzPtk = remained.search(regexFywxzPtk);
      }
      splited.push(remained);
      for (let i = 0; i < splited.length; i++) {
        if (splited[i].charAt(0).search(regexPtk) != -1) {
          const initial = splited[i][0];
          const sliced = splited[i].slice(1);
          splited[i] = initial + TonalLetterTags.h + sliced;
        }
      }
      tok = splited.join('');

      // v -> p, d -> t, q -> k
      let indexVdq = tok.search(regexVdq);
      while (indexVdq != -1) {
        const got = mapping.get(tok.substr(indexVdq, 1));
        if (got) {
          tok = tok.replace(tok.substr(indexVdq, 1), got);
        }
        // console.log(got, tok);
        indexVdq = tok.search(regexVdq);
      }

      // oa -> ua, oe -> ue
      let indexOaoe = tok.search(regexOaoe);
      while (indexOaoe != -1) {
        const got = mapping.get(tok.substr(indexOaoe, 2));
        if (got) {
          tok = tok.replace(tok.substr(indexOaoe, 2), got);
        }
        // console.log(got, tok);
        indexOaoe = tok.search(regexOaoe);
      }

      // eng -> ing
      let indexEng = tok.search(regexEng);
      while (indexEng != -1) {
        const got = mapping.get(tok.substr(indexEng, 3));
        if (got) {
          tok = tok.replace(tok.substr(indexEng, 3), got);
        }
        // console.log(got, tok);
        indexEng = tok.search(regexEng);
      }

      const seqs = cli.processTonal(tokens[i].toLowerCase()).soundSequences;

      const word = seqs.map(x => x.map(y => y.toString()).join('')).join('');
      const wordAfter = tok;
      console.log(tokens[i], wordAfter);
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

        let wordAfterWCapital = '';
        if (tokens[i].charAt(0) !== tokens[i].charAt(0).toLowerCase()) {
          const initial = tokens[i].charAt(0);
          const capital = initial.toUpperCase();
          wordAfterWCapital = capital + tokens[i].slice(1);
        }
        // console.log(wordAfterWCapital);
        if (wordAfterWCapital.length > 0)
          aLine = head + wordAfterWCapital + tail;
        else aLine = head + tok + tail;
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
