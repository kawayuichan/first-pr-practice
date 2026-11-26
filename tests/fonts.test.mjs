// 日本語フォントのテスト
// - 表示に使う日本語の文字(かな・漢字・和文記号・全角英数)がすべて同梱フォントに入っているか
//   (新しい論点で新しい漢字が増えたら npm run fonts が必要)
// - フォントファイルとライセンスがあり、CSS から使われているか

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isJapaneseChar, requiredChars } from '../scripts/fonts/charset.mjs';
import { exists, read, ROOT } from './helpers.mjs';
import fs from 'node:fs';
import path from 'node:path';

const FONTS = ['app/fonts/boki-jp-500.woff2', 'app/fonts/boki-jp-700.woff2'];

test('フォントファイルは WOFF2 形式', () => {
  for (const f of FONTS) {
    assert.ok(exists(f), `${f} がない。npm run fonts を実行`);
    const head = fs.readFileSync(path.join(ROOT, f)).subarray(0, 4).toString('latin1');
    assert.equal(head, 'wOF2');
  }
});

test('表示に使う日本語の文字は、すべて同梱フォントに入っている', () => {
  const covered = new Set(read('app/fonts/charset.txt'));
  const missing = [...requiredChars()].filter((ch) => isJapaneseChar(ch) && !covered.has(ch));
  assert.deepEqual(missing, [], `フォントにない文字: ${missing.join('')}。npm run fonts → npm run build を実行`);
});

test('フォントのライセンス(SIL Open Font License)を同梱している', () => {
  assert.ok(exists('app/fonts/OFL.txt'));
  assert.match(read('app/fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
});

test('CSS で同梱フォントを本文と太字に使っている', () => {
  const css = read('app/style.css');
  for (const f of FONTS) assert.ok(css.includes(f.replace('app/', '')), `${f} が CSS にない`);
  assert.match(css, /body\s*\{[^}]*font-family:\s*'BokiJP'/);
  assert.match(css, /body\s*\{[^}]*font-weight:\s*500/);
});
