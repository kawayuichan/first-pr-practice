// 論点IDが docs/scope.md(公式の出題区分表から作った論点リスト)と一致しているか

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readJSON, scopeFormats, scopeTopicIds, topics } from './helpers.mjs';

test('data/topics.json の論点IDは docs/scope.md の論点リストと完全に一致する', () => {
  const scope = scopeTopicIds();
  const ids = topics.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, '論点IDが重複しています');
  assert.deepEqual([...new Set(ids)].sort(), [...scope].sort());
  assert.equal(ids.length, 56);
});

test('論点のフェーズは定義済みのものだけ', () => {
  const phases = new Set(readJSON('data/topics.json').phases.map((p) => p.id));
  for (const t of topics) assert.ok(phases.has(t.phase), `${t.id} のフェーズ ${t.phase} が未定義`);
});

test('scope.md に出題形式(format)の一覧がある', () => {
  const f = scopeFormats();
  for (const name of ['q1_journal', 'q2_topic', 'q3_statements', 'q4_journal', 'q5_calc', 'basic_check']) {
    assert.ok(f.has(name), `scope.md 4-4 に ${name} がありません`);
  }
});
