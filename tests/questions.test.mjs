// すべての問題データの自動テスト
// - 必須項目(論点ID・難易度・正解・解説・よくある誤答・参考書リンク)
// - 仕訳の貸借一致、計算ステップの再計算(合計・差額の整合)
// - 論点IDが範囲内か、勘定科目が公式の勘定科目表(または補助リスト)にあるか
// - 旧基準・1級の用語が入っていないか
// - 自分の正解で採点すると正解、よくある誤答で採点すると不正解になり、その誤答として判定されるか

import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { verifyStep } from '../app/lib/calc.js';
import { gradeQuestion } from '../app/lib/grading.js';
import {
  accountIndex,
  allStrings,
  anchorsOf,
  exists,
  moneyNumbers,
  questionFiles,
  read,
  rules,
  scopeFormats,
  topicIds,
} from './helpers.mjs';

const files = questionFiles();
const formats = scopeFormats();
const sum = (ls) => ls.reduce((s, l) => s + l.amount, 0);
const isPosInt = (n) => Number.isSafeInteger(n) && n > 0;

test('問題データが1つ以上ある', () => assert.ok(files.length > 0));

test('問題IDは全体で重複しない', () => {
  const ids = files.flatMap((f) => f.data.questions.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length);
});

for (const { file, data } of files) {
  describe(`data/questions/${file}`, () => {
    test('ファイル名と論点IDが一致し、論点IDは scope.md の範囲内', () => {
      assert.equal(`${data.topic}.json`, file);
      assert.ok(topicIds.has(data.topic));
    });

    for (const q of data.questions) {
      describe(q.id, () => {
        const steps = [...(q.calc ?? []), ...(q.mistakes ?? []).flatMap((m) => m.calc ?? [])];

        test('必須項目がそろっている', () => {
          assert.match(q.id, new RegExp(`^${data.topic}-\\d{3}$`));
          assert.equal(q.topic, data.topic);
          assert.ok(topicIds.has(q.topic), '論点IDが範囲外');
          assert.ok(formats.has(q.format), `format ${q.format} は scope.md にない`);
          assert.ok([1, 2, 3].includes(q.difficulty), '難易度は1〜3');
          assert.ok(['journal', 'choice', 'numeric'].includes(q.type));
          for (const k of ['prompt', 'explanation']) assert.ok(typeof q[k] === 'string' && q[k].trim(), `${k} が空`);
          assert.ok(Array.isArray(q.mistakes) && q.mistakes.length >= 1, 'よくある誤答が必要');
          for (const m of q.mistakes) assert.ok(typeof m.why === 'string' && m.why.trim(), '誤答の理由が空');
          assert.equal(typeof q.needs_review, 'boolean');
          if (q.needs_review) assert.ok(q.needs_review_reason?.trim(), 'needs_review には根拠が必要');
        });

        test('計算ステップを計算し直すと一致する(合計・差額の整合)', () => {
          for (const s of steps) assert.ok(verifyStep(s), `${s.label}: ${JSON.stringify(s)}`);
        });

        test('参考書へのリンク先(見出し)が存在する', () => {
          assert.ok(topicIds.has(q.ref?.topic));
          const p = `textbook/src/${q.ref.topic}.md`;
          assert.ok(exists(p), `${p} がない`);
          assert.ok(anchorsOf(read(p)).has(q.ref.anchor), `見出し {#${q.ref.anchor}} がない`);
        });

        test('旧基準・1級の用語を使っていない', () => {
          const text = allStrings({ ...q, ref: null }).join('\n');
          for (const w of [...rules.old_standard.terms, ...rules.grade1.terms]) {
            assert.ok(!text.includes(w), `「${w}」が入っています`);
          }
        });

        test('解説・誤答の理由に出てくる金額は、問題文か計算ステップの数字だけ', () => {
          const allowed = new Set([
            ...moneyNumbers(q.prompt),
            ...moneyNumbers((q.options ?? []).join('\n')),
            ...steps.flatMap((s) => [s.value, ...s.args]),
            ...(q.type === 'journal' ? [...q.answer.debit, ...q.answer.credit].map((l) => l.amount) : []),
            ...(q.type === 'numeric' ? [q.answer] : []),
            ...q.mistakes.map((m) => m.value).filter((v) => v !== undefined),
          ]);
          const texts = [q.explanation, ...q.mistakes.map((m) => m.why)];
          for (const t of texts) {
            for (const n of moneyNumbers(t)) assert.ok(allowed.has(n), `根拠のない金額 ${n}: ${t}`);
          }
        });

        if (q.type === 'journal') {
          const lines = [...q.answer.debit, ...q.answer.credit];

          test('仕訳: 貸借が一致し、金額は正の整数', () => {
            assert.ok(q.answer.debit.length && q.answer.credit.length);
            for (const l of lines) assert.ok(isPosInt(l.amount), `${l.account} ${l.amount}`);
            assert.equal(sum(q.answer.debit), sum(q.answer.credit), '借方合計と貸方合計が違う');
          });

          test('仕訳: 正解の金額は、問題文に書いてある数字か、計算ステップの結果', () => {
            const given = new Set(moneyNumbers(q.prompt));
            const computed = new Set((q.calc ?? []).map((s) => s.value));
            for (const l of lines) {
              assert.ok(given.has(l.amount) || computed.has(l.amount), `${l.account} ${l.amount} の根拠がない`);
            }
          });

          test('仕訳: 勘定科目はすべて公式の勘定科目表(または補助リスト)にある', () => {
            assert.ok(q.choices.length >= 4 && q.choices.length <= 8, '選択肢は4〜8個');
            assert.equal(new Set(q.choices).size, q.choices.length, '選択肢が重複');
            for (const c of q.choices) assert.ok(accountIndex.names.has(c), `「${c}」は勘定科目表にない`);
            for (const l of lines) assert.ok(q.choices.includes(l.account), `正解の科目「${l.account}」が選択肢にない`);
          });

          test('仕訳: 同じ科目を同じ側で2回使っていない', () => {
            for (const side of ['debit', 'credit']) {
              const acc = q.answer[side].map((l) => l.account);
              assert.equal(new Set(acc).size, acc.length);
            }
          });

          if (/^[CK]/.test(q.topic)) {
            test('2級の論点では支払家賃・支払地代を使わない(支払リース料)', () => {
              const used = [...q.choices, ...q.mistakes.flatMap((m) => [...m.entry.debit, ...m.entry.credit].map((l) => l.account))];
              for (const a of rules.grade2_banned_accounts.accounts) assert.ok(!used.includes(a), a);
            });
          }

          test('採点: 正解は正解、誤答は不正解で、その誤答として判定される', () => {
            assert.equal(gradeQuestion(q, q.answer, accountIndex).correct, true);
            for (const m of q.mistakes) {
              assert.ok(m.entry, '仕訳問題の誤答には entry が必要');
              for (const l of [...m.entry.debit, ...m.entry.credit]) {
                assert.ok(q.choices.includes(l.account), `誤答の科目「${l.account}」が選択肢にない`);
                assert.ok(isPosInt(l.amount));
              }
              const r = gradeQuestion(q, m.entry, accountIndex);
              assert.equal(r.correct, false, `誤答が正解扱い: ${m.why}`);
              assert.equal(r.mistake, m, `誤答として判定されない: ${m.why}`);
            }
          });
        }

        if (q.type === 'choice') {
          test('選択: 正解の番号が範囲内で、間違いの選択肢すべてに理由がある', () => {
            assert.ok(q.options.length >= 2);
            assert.equal(new Set(q.options).size, q.options.length);
            assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
            const wrong = q.options.map((_, k) => k).filter((k) => k !== q.answer);
            assert.deepEqual(q.mistakes.map((m) => m.option).sort(), wrong.sort());
            assert.equal(gradeQuestion(q, q.answer, accountIndex).correct, true);
            for (const m of q.mistakes) assert.equal(gradeQuestion(q, m.option, accountIndex).mistake, m);
          });
        }

        if (q.type === 'numeric') {
          test('数値: 正解は計算ステップの最後の結果、誤答もコードで計算した値', () => {
            assert.ok(Number.isSafeInteger(q.answer));
            assert.ok(q.calc?.length, '数値問題には計算ステップが必要');
            assert.equal(q.calc.at(-1).value, q.answer);
            const values = q.mistakes.map((m) => m.value);
            assert.equal(new Set(values).size, values.length, '誤答の値が重複');
            for (const m of q.mistakes) {
              assert.ok(Number.isSafeInteger(m.value) && m.value !== q.answer);
              assert.ok(m.calc?.length && m.calc.at(-1).value === m.value, '誤答の値も計算ステップで出す');
              assert.equal(gradeQuestion(q, m.value, accountIndex).mistake, m);
            }
            assert.equal(gradeQuestion(q, q.answer, accountIndex).correct, true);
          });
        }
      });
    }
  });
}
