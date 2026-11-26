// ビルド: 問題データ・参考書・目次(manifest)を生成する。
//   node scripts/build.mjs          … 生成してファイルに書く
//   node scripts/build.mjs --check  … 生成結果とリポジトリのファイルが一致するか確認だけする
//
// 生成するもの
//   scripts/questions/<ID>.mjs → data/questions/<ID>.json(金額はスクリプトで計算)
//   textbook/src/<ID>.md       → textbook/<ID>.md({{ 計算式 }} を数字に置換)
//   data/manifest.json         … アプリとオフライン用キャッシュが読む目次

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderTemplate } from './lib/template.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (...p) => path.join(ROOT, ...p);
const readJSON = (p) => JSON.parse(fs.readFileSync(rel(p), 'utf8'));
const listFiles = (dir, ext) =>
  fs.existsSync(rel(dir))
    ? fs.readdirSync(rel(dir)).filter((f) => f.endsWith(ext)).sort()
    : [];

// アプリ本体として常にキャッシュするファイル(オフライン用)
function shellFiles() {
  const files = ['index.html', 'manifest.webmanifest', 'data/official/accounts_2027.json', 'data/accounts_supplement.json'];
  const walk = (dir) => {
    for (const name of fs.readdirSync(rel(dir)).sort()) {
      const p = path.posix.join(dir, name);
      if (fs.statSync(rel(p)).isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk('app');
  return files;
}

const TEXTBOOK_HEADER = (id) =>
  `<!-- 自動生成ファイルです。直接編集せず textbook/src/${id}.md を編集して npm run build を実行してください -->\n`;

export async function buildAll() {
  const topics = readJSON('data/topics.json').topics;
  const known = new Set(topics.map((t) => t.id));
  const outputs = new Map();
  const info = new Map();

  for (const file of listFiles('scripts/questions', '.mjs')) {
    const id = path.basename(file, '.mjs');
    if (!known.has(id)) throw new Error(`scripts/questions/${file}: 論点ID ${id} は data/topics.json にありません`);
    const mod = await import(pathToFileURL(rel('scripts/questions', file)).href);
    const data = mod.default();
    if (data.topic !== id) throw new Error(`${file}: topic が ${data.topic} になっています`);
    outputs.set(`data/questions/${id}.json`, JSON.stringify(data, null, 2) + '\n');
    info.set(id, {
      ...info.get(id),
      questions: `data/questions/${id}.json`,
      count: data.questions.length,
      needs_review: data.questions.filter((q) => q.needs_review).length,
    });
  }

  for (const file of listFiles('textbook/src', '.md')) {
    const id = path.basename(file, '.md');
    if (!known.has(id)) throw new Error(`textbook/src/${file}: 論点ID ${id} は data/topics.json にありません`);
    const src = fs.readFileSync(rel('textbook/src', file), 'utf8');
    outputs.set(`textbook/${id}.md`, TEXTBOOK_HEADER(id) + renderTemplate(src));
    info.set(id, { ...info.get(id), textbook: `textbook/${id}.md` });
  }

  const files = [...outputs.keys()].sort();
  const hash = createHash('sha256');
  for (const f of files) hash.update(f).update('\0').update(outputs.get(f));
  for (const f of shellFiles()) {
    if (fs.existsSync(rel(f))) hash.update(f).update('\0').update(fs.readFileSync(rel(f)));
  }

  const manifest = {
    note: '自動生成ファイル(scripts/build.mjs)。アプリの目次とオフライン用キャッシュの一覧',
    version: hash.digest('hex').slice(0, 12),
    topics: topics.map((t) => {
      const i = info.get(t.id) ?? {};
      return {
        id: t.id,
        phase: t.phase,
        name: t.name,
        textbook: i.textbook ?? null,
        questions: i.questions ?? null,
        count: i.count ?? 0,
        needs_review: i.needs_review ?? 0,
      };
    }),
    shell: shellFiles(),
    files,
  };
  outputs.set('data/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  return outputs;
}

/** 生成されるはずなのに元ファイルがない古い生成物 */
function staleFiles(outputs) {
  const stale = [];
  for (const f of listFiles('data/questions', '.json')) {
    if (!outputs.has(`data/questions/${f}`)) stale.push(`data/questions/${f}`);
  }
  for (const f of listFiles('textbook', '.md')) {
    if (!outputs.has(`textbook/${f}`)) stale.push(`textbook/${f}`);
  }
  return stale;
}

async function main() {
  const check = process.argv.includes('--check');
  const outputs = await buildAll();
  if (check) {
    const diffs = [];
    for (const [f, content] of outputs) {
      const cur = fs.existsSync(rel(f)) ? fs.readFileSync(rel(f), 'utf8') : null;
      if (cur !== content) diffs.push(f);
    }
    const stale = staleFiles(outputs);
    if (diffs.length || stale.length) {
      if (diffs.length) console.error(`生成ファイルが古くなっています: ${diffs.join(', ')}`);
      if (stale.length) console.error(`元ファイルのない生成物があります: ${stale.join(', ')}`);
      console.error('npm run build を実行してください');
      process.exit(1);
    }
    console.log(`生成ファイルは最新です(${outputs.size}件)`);
    return;
  }
  for (const [f, content] of outputs) {
    fs.mkdirSync(path.dirname(rel(f)), { recursive: true });
    fs.writeFileSync(rel(f), content);
  }
  for (const f of staleFiles(outputs)) {
    fs.unlinkSync(rel(f));
    console.log(`削除: ${f}`);
  }
  console.log(`生成しました: ${[...outputs.keys()].join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
