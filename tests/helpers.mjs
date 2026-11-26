// テスト共通: リポジトリのデータを読み込む

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAccountIndex } from '../app/lib/grading.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
export const readJSON = (p) => JSON.parse(read(p));
export const exists = (p) => fs.existsSync(path.join(ROOT, p));
export const list = (dir, ext) =>
  exists(dir) ? fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(ext)).sort() : [];

export const topics = readJSON('data/topics.json').topics;
export const topicIds = new Set(topics.map((t) => t.id));
export const rules = readJSON('data/rules.json');
export const official = readJSON('data/official/accounts_2027.json');
export const supplement = readJSON('data/accounts_supplement.json');
export const accountIndex = buildAccountIndex(official, supplement);
export const scopeMd = read('docs/scope.md');

/** scope.md の論点リストの表にある論点ID */
export function scopeTopicIds() {
  const ids = new Set();
  for (const m of scopeMd.matchAll(/^\| ([BCK]\d{2}) \|/gm)) ids.add(m[1]);
  return ids;
}

/** scope.md の「出題形式」の表にある format 名 */
export function scopeFormats() {
  const sec = scopeMd.split('### 4-4.')[1]?.split('\n## ')[0] ?? '';
  return new Set([...sec.matchAll(/^\| `([a-z0-9_]+)` \|/gm)].map((m) => m[1]));
}

/** すべての問題データ: [{ file, data }] */
export function questionFiles() {
  return list('data/questions', '.json').map((f) => ({ file: f, data: readJSON(`data/questions/${f}`) }));
}

/** 文章中の金額らしい数字(¥つき、または3桁区切りのカンマつき)を整数で取り出す */
export function moneyNumbers(text) {
  const out = [];
  for (const m of String(text).matchAll(/¥\s?(\d[\d,]*)|(\d{1,3}(?:,\d{3})+)/g)) {
    out.push(Number((m[1] ?? m[2]).replace(/,/g, '')));
  }
  return out;
}

/** 見出しの {#id} の一覧 */
export function anchorsOf(md) {
  return new Set([...md.matchAll(/^#{1,4} .*\{#([\w-]+)\}\s*$/gm)].map((m) => m[1]));
}

/** 文字列を含むすべての値を集める(禁止語チェック用) */
export function allStrings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => allStrings(x, out));
  return out;
}
