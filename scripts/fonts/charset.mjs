// アプリで表示する文字の一覧を作る(日本語フォントのサブセット用)。
// 参考書・問題・論点名・公式の勘定科目名・画面の文字 + かな・記号の基本セット。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rel = (...p) => path.join(ROOT, ...p);

function filesIn(dir, ext) {
  if (!fs.existsSync(rel(dir))) return [];
  const out = [];
  for (const name of fs.readdirSync(rel(dir)).sort()) {
    const p = path.posix.join(dir, name);
    if (fs.statSync(rel(p)).isDirectory()) out.push(...filesIn(p, ext));
    else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

/** 表示される文章が入っているファイル */
export function contentFiles() {
  return [
    ...filesIn('textbook', '.md').filter((f) => !f.startsWith('textbook/src/')),
    ...filesIn('data/questions', '.json'),
    'data/topics.json',
    'data/official/accounts_2027.json',
    'data/accounts_supplement.json',
    ...filesIn('app', '.js'),
    'index.html',
    'manifest.webmanifest',
  ].filter((f) => fs.existsSync(rel(f)));
}

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String.fromCodePoint(a + i));

/** いつも入れておく文字: 半角英数記号、かな、和文の句読点・括弧、全角英数、よく使う記号 */
export function baseChars() {
  return new Set([
    ...range(0x20, 0x7e),
    ...range(0x3000, 0x303f), // 和文の句読点・括弧
    ...range(0x3041, 0x3096), // ひらがな
    ...range(0x309b, 0x309e),
    ...range(0x30a0, 0x30ff), // カタカナ
    ...range(0xff01, 0xff5e), // 全角英数・記号
    ...'¥￥×÷−±〜…‥・※○●◎△▲□■◇◆→←↑↓⇒―‐“”‘’',
  ]);
}

/** 日本語として表示に必ず必要な文字か(フォントに入っていないとテストで失敗させる範囲) */
export function isJapaneseChar(ch) {
  const c = ch.codePointAt(0);
  return (
    (c >= 0x3000 && c <= 0x30ff) || // 和文記号・かな
    (c >= 0x3400 && c <= 0x4dbf) || // 漢字(拡張A)
    (c >= 0x4e00 && c <= 0x9fff) || // 漢字
    (c >= 0xf900 && c <= 0xfaff) || // 互換漢字
    (c >= 0xff01 && c <= 0xff9f) // 全角英数・半角カナ
  );
}

/** 表示に使う文字すべて */
export function requiredChars() {
  const chars = baseChars();
  for (const f of contentFiles()) {
    for (const ch of fs.readFileSync(rel(f), 'utf8')) {
      const c = ch.codePointAt(0);
      if (c >= 0x20 && !(c >= 0xd800 && c <= 0xdfff)) chars.add(ch);
    }
  }
  return chars;
}
