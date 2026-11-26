// 参考書の自動テスト
// - 構成: 要点3行 → 仕訳パターン → T勘定・ボックス図 → 引っかけポイント → 決算書ではここに出る → 確認問題
// - {{ 計算式 }} がすべて計算できる、仕訳の表の貸借が一致する
// - 旧基準・1級の用語は「範囲外」「旧基準」「1級」と同じ行でしか使わない

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { renderMarkdown } from '../app/lib/markdown.js';
import { renderTemplate } from '../scripts/lib/template.mjs';
import { anchorsOf, exists, list, read, rules, topics, topicIds } from './helpers.mjs';

const REQUIRED = ['summary', 'patterns', 't-account', 'traps', 'fs', 'check'];
const sources = list('textbook/src', '.md');

test('参考書が1つ以上ある', () => assert.ok(sources.length > 0));

/** 仕訳の表(借方科目|金額|貸方科目|金額)を取り出す */
function journalTables(md) {
  const lines = md.split('\n');
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\|\s*借方科目\s*\|\s*金額\s*\|\s*貸方科目\s*\|\s*金額\s*\|\s*$/.test(lines[i])) {
      const rows = [];
      let j = i + 2;
      while (j < lines.length && lines[j].startsWith('|')) rows.push(lines[j++]);
      tables.push({ line: i + 1, rows });
    }
  }
  return tables;
}

const num = (s) => (s.trim() === '' ? 0 : Number(s.replace(/,/g, '').trim()));

for (const file of sources) {
  const id = file.replace(/\.md$/, '');
  const src = read(`textbook/src/${file}`);
  describe(`textbook/src/${file}`, () => {
    test('論点IDが範囲内で、タイトルが「# ID 論点名」', () => {
      assert.ok(topicIds.has(id));
      const name = topics.find((t) => t.id === id).name;
      assert.equal(src.split('\n')[0], `# ${id} ${name}`);
    });

    test('決められた順番で見出しがある', () => {
      const h2 = [...src.matchAll(/^## .*\{#([\w-]+)\}\s*$/gm)].map((m) => m[1]);
      assert.deepEqual(h2, REQUIRED);
    });

    test('要点はちょうど3行', () => {
      const sec = src.split(/^## .*\{#summary\}\s*$/m)[1].split(/^## /m)[0];
      const items = sec.split('\n').filter((l) => /^\d+\.\s/.test(l));
      assert.equal(items.length, 3);
    });

    test('{{ 計算式 }} がすべて計算でき、生成された参考書と一致する', () => {
      const out = renderTemplate(src);
      assert.ok(!/\{\{|\}\}/.test(out));
      assert.ok(exists(`textbook/${id}.md`));
      assert.ok(read(`textbook/${id}.md`).endsWith(out), 'npm run build を実行してください');
    });

    test('仕訳の表は貸借が一致する', () => {
      const out = renderTemplate(src);
      const tables = journalTables(out);
      assert.ok(tables.length > 0, '仕訳パターンの表がない');
      for (const t of tables) {
        let dr = 0;
        let cr = 0;
        for (const r of t.rows) {
          const c = r.split('|').slice(1, -1);
          assert.equal(c.length, 4, `${t.line}行目付近: 列の数が4でない`);
          dr += num(c[1]);
          cr += num(c[3]);
          if (c[0].trim()) assert.ok(num(c[1]) > 0, `${t.line}行目付近: 借方の金額がない`);
          if (c[2].trim()) assert.ok(num(c[3]) > 0, `${t.line}行目付近: 貸方の金額がない`);
        }
        assert.ok(Number.isInteger(dr) && dr > 0);
        assert.equal(dr, cr, `${t.line}行目付近の仕訳の貸借が一致しない`);
      }
    });

    test('旧基準・1級の用語は「範囲外」「旧基準」「1級」の説明の行でだけ使う', () => {
      for (const [k, line] of src.split('\n').entries()) {
        if (/範囲外|旧基準|1級/.test(line)) continue;
        for (const w of [...rules.old_standard.terms, ...rules.grade1.terms]) {
          assert.ok(!line.includes(w), `${k + 1}行目に「${w}」`);
        }
      }
    });

    test('Markdown として表示でき、見出しの id が重複しない', () => {
      const { headings } = renderMarkdown(renderTemplate(src));
      const ids = headings.map((h) => h.id).filter(Boolean);
      assert.equal(new Set(ids).size, ids.length);
      assert.deepEqual(new Set(ids), anchorsOf(src));
    });
  });
}
