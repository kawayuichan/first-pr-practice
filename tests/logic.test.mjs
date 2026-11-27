// 採点・復習スケジュール・Markdown 表示・金額の書式・ビルドの単体テスト

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, test } from 'node:test';
import { makeStep, verifyStep } from '../app/lib/calc.js';
import { fmt, parseAmount, yen } from '../app/lib/format.js';
import {
  entryNet,
  gradeJournal,
  gradeMulti,
  gradeNumeric,
  gradeSlips,
  gradeTable,
  isKnownAccount,
  accountAccepted,
  slipsNet,
  verifyTableCheck,
} from '../app/lib/grading.js';
import { OPS } from '../app/lib/calc.js';
import { renderMarkdown } from '../app/lib/markdown.js';
import { addDays, applyAnswer, dueQids, nextDue } from '../app/lib/srs.js';
import { topicStats, validateProgress } from '../app/lib/store.js';
import { buildAll } from '../scripts/build.mjs';
import { evaluate } from '../scripts/lib/template.mjs';
import { accountIndex, ROOT } from './helpers.mjs';

const L = (account, amount) => ({ account, amount });

describe('金額の書式', () => {
  test('カンマ区切りと円記号', () => {
    assert.equal(fmt(1234567), '1,234,567');
    assert.equal(fmt(-5000), '-5,000');
    assert.equal(yen(250000), '¥250,000');
    assert.throws(() => fmt(1.5));
  });
  test('入力の読み取り(全角数字・カンマ・円)', () => {
    assert.equal(parseAmount('２５０，０００'), 250000);
    assert.equal(parseAmount('¥ 1,000円'), 1000);
    assert.equal(parseAmount(''), null);
    assert.equal(parseAmount('12a'), null);
  });
});

describe('計算ステップと参考書の計算式', () => {
  test('ステップの計算と検算', () => {
    const s = makeStep('残額', 'sub', [360000, 120000]);
    assert.equal(s.value, 240000);
    assert.ok(verifyStep(s));
    assert.ok(!verifyStep({ ...s, value: 240001 }));
    assert.throws(() => makeStep('割り切れない', 'div', [100, 3]));
  });
  test('{{ }} の式は四則演算だけ', () => {
    assert.equal(evaluate('200,000 - 50,000'), 150000);
    assert.throws(() => evaluate('process.exit()'));
    assert.throws(() => evaluate('10 / 3'));
  });
});

describe('仕訳の採点', () => {
  const q = {
    type: 'journal',
    answer: { debit: [L('備品', 360000)], credit: [L('普通預金', 120000), L('未払金', 240000)] },
    mistakes: [{ entry: { debit: [L('備品', 360000)], credit: [L('普通預金', 120000), L('買掛金', 240000)] }, why: 'x' }],
  };
  test('行の順番が違っても正解', () => {
    const r = gradeJournal(q, { debit: [L('備品', '360,000')], credit: [L('未払金', '240000'), L('普通預金', '120,000')] }, accountIndex);
    assert.equal(r.correct, true);
  });
  test('空の行は無視する', () => {
    const r = gradeJournal(
      q,
      { debit: [L('備品', '360000'), L('', '')], credit: [L('普通預金', '120000'), L('未払金', '240000')] },
      accountIndex,
    );
    assert.equal(r.correct, true);
  });
  test('許容勘定科目(Ｂ欄)も正解', () => {
    const q2 = { type: 'journal', answer: { debit: [L('前払金', 1000)], credit: [L('普通預金', 1000)] }, mistakes: [] };
    const r = gradeJournal(q2, { debit: [L('前渡金', '1000')], credit: [L('銀行預金', '1000')] }, accountIndex);
    assert.equal(r.correct, true);
  });
  test('よくある誤答を見分ける', () => {
    const r = gradeJournal(q, q.mistakes[0].entry, accountIndex);
    assert.equal(r.correct, false);
    assert.equal(r.mistake, q.mistakes[0]);
  });
  test('同じ科目を2回使うと不正解', () => {
    const r = gradeJournal(
      q,
      { debit: [L('備品', '200000'), L('備品', '160000')], credit: [L('普通預金', '120000'), L('未払金', '240000')] },
      accountIndex,
    );
    assert.equal(r.correct, false);
    assert.ok(r.issues.some((x) => x.includes('2回')));
  });
  test('金額の入っていない行があると不正解', () => {
    const r = gradeJournal(
      q,
      { debit: [L('備品', '360000'), L('現金', '')], credit: [L('普通預金', '120000'), L('未払金', '240000')] },
      accountIndex,
    );
    assert.equal(r.correct, false);
    assert.ok(r.issues.length);
  });
  test('数値の採点', () => {
    const qn = { type: 'numeric', answer: 850000, mistakes: [{ value: 150000, why: 'x' }] };
    assert.equal(gradeNumeric(qn, '850,000').correct, true);
    assert.equal(gradeNumeric(qn, '150000').mistake, qn.mistakes[0]);
  });
});

describe('伝票の採点', () => {
  const q = {
    type: 'slips',
    answer: [
      { kind: 'in', account: '売上', amount: 30000 },
      { kind: 'transfer', debit: { account: '売掛金', amount: 70000 }, credit: { account: '売上', amount: 70000 } },
    ],
    mistakes: [{ slips: [{ kind: 'in', account: '現金', amount: 30000 }], why: 'x' }],
  };
  test('伝票の順番が違っても正解、金額は全角でもよい', () => {
    const r = gradeSlips(
      q,
      [
        { kind: 'transfer', debit: { account: '売掛金', amount: '７０，０００' }, credit: { account: '売上', amount: '70000' } },
        { kind: 'in', account: '売上', amount: '30,000' },
      ],
      accountIndex,
    );
    assert.equal(r.correct, true);
  });
  test('伝票の種類が違うと不正解', () => {
    const r = gradeSlips(q, [{ kind: 'out', account: '売上', amount: '30000' }, q.answer[1]], accountIndex);
    assert.equal(r.correct, false);
  });
  test('足りない伝票があると不正解', () => {
    assert.equal(gradeSlips(q, [q.answer[0]], accountIndex).correct, false);
  });
  test('振替伝票の左右の金額が違うと注意を出す', () => {
    const r = gradeSlips(q, [{ kind: 'transfer', debit: { account: '売掛金', amount: '70000' }, credit: { account: '売上', amount: '60000' } }], accountIndex);
    assert.ok(r.issues.some((x) => x.includes('振替伝票')));
  });
  test('よくある誤答を見分ける', () => {
    assert.equal(gradeSlips(q, q.mistakes[0].slips, accountIndex).mistake, q.mistakes[0]);
  });
  test('伝票の束と仕訳の増減が一致する', () => {
    const entry = { debit: [{ account: '現金', amount: 30000 }, { account: '売掛金', amount: 70000 }], credit: [{ account: '売上', amount: 100000 }] };
    assert.deepEqual(Object.fromEntries(slipsNet(q.answer)), Object.fromEntries(entryNet(entry)));
  });
});

describe('表の穴埋めの採点', () => {
  const q = {
    type: 'table',
    table: {
      columns: [{ label: '摘要' }, { label: '支払' }, { label: '通信費' }, { label: '消耗品費' }],
      rows: [
        ['切手', 800, { blank: true, kind: 'number', answer: 800 }, { blank: true, kind: 'number', answer: null }],
        ['用紙', 1200, { blank: true, kind: 'number', answer: null }, { blank: true, kind: 'number', answer: 1200 }],
        ['合計', { blank: true, kind: 'number', answer: 2000 }, 800, 1200],
      ],
    },
    mistakes: [{ cell: [1, 2], value: 1200, why: 'x' }],
  };
  const full = { '0,2': '800', '0,3': '', '1,2': '', '1,3': '1,200', '2,1': '２，０００' };
  test('すべて正しければ正解(空欄のままが正解の欄も含む)', () => {
    const r = gradeTable(q, full);
    assert.equal(r.correct, true);
    assert.equal(r.okCount, 5);
  });
  test('欄ごとに採点し、よくある誤答を見分ける', () => {
    const r = gradeTable(q, { ...full, '1,2': '1200' });
    assert.equal(r.correct, false);
    assert.equal(r.okCount, 4);
    assert.deepEqual(r.mistakes, [q.mistakes[0]]);
  });
  test('何も書いていないと注意を出す', () => assert.ok(gradeTable(q, {}).issues.length));
  test('表の中の合計の検算', () => {
    const ok = { label: '支払の合計', op: 'add', args: [[0, 1], [1, 1]], result: [2, 1] };
    assert.ok(verifyTableCheck(q.table, ok, OPS));
    assert.ok(!verifyTableCheck(q.table, { ...ok, args: [[0, 1]] }, OPS));
  });
  test("['-', 行, 列] でその欄を引ける(a + b − c)", () => {
    const t = { rows: [[10, 5, 3, 12]] };
    assert.ok(verifyTableCheck(t, { label: 'x', op: 'add', args: [[0, 0], [0, 1], ['-', 0, 2]], result: [0, 3] }, OPS));
    assert.ok(!verifyTableCheck(t, { label: 'x', op: 'add', args: [[0, 0], [0, 1], [0, 2]], result: [0, 3] }, OPS));
  });
});

describe('口座名・取引先名が入る勘定科目', () => {
  test('「普通預金○○銀行」「〇〇商店」の形を認める', () => {
    assert.ok(isKnownAccount(accountIndex, '普通預金A銀行'));
    assert.ok(isKnownAccount(accountIndex, '当座預金B銀行'));
    assert.ok(isKnownAccount(accountIndex, '東西商店'));
    assert.ok(!isKnownAccount(accountIndex, 'A銀行'));
    assert.ok(!isKnownAccount(accountIndex, '受取手形'));
  });
});

describe('経過勘定の科目(前払費用の各勘定など)', () => {
  test('「前払○○・未払○○・未収○○・前受○○」を科目として認める', () => {
    for (const n of ['前払保険料', '前払利息', '未払利息', '未払給料', '未収利息', '前受手数料', '前払リース料', '長期前払保険料']) {
      assert.ok(isKnownAccount(accountIndex, n), n);
    }
    assert.ok(!isKnownAccount(accountIndex, '前払固定資産売却損'));
    assert.ok(!isKnownAccount(accountIndex, '未収保険料'));
  });
  test('まとめた科目(前払費用など)も正解扱い', () => {
    assert.ok(accountAccepted(accountIndex, '前払費用', '前払保険料'));
    assert.ok(accountAccepted(accountIndex, '未払費用', '未払利息'));
    assert.ok(accountAccepted(accountIndex, '未収収益', '未収利息'));
    assert.ok(accountAccepted(accountIndex, '前受収益', '前受手数料'));
    assert.ok(!accountAccepted(accountIndex, '未払費用', '前払保険料'));
  });
});

describe('2段の見出しの表(精算表など)', () => {
  test('「試算表：借方」の形の見出しを2段にまとめる', () => {
    const md = '| 勘定科目 | 試算表：借方 | 試算表：貸方 | 修正記入：借方 |\n|---|--:|--:|--:|\n| 現金 | 100 | | |';
    const { html } = renderMarkdown(md);
    assert.match(html, /<th rowspan="2">勘定科目<\/th>/);
    assert.match(html, /<th colspan="2" class="al-center th-group">試算表<\/th>/);
    assert.match(html, /<th colspan="1" class="al-center th-group">修正記入<\/th>/);
    assert.equal((html.match(/<tr>/g) ?? []).length, 3);
    assert.ok(!html.includes('：'));
  });
});

describe('複数選択の採点', () => {
  const q = { type: 'multi', answer: [1, 3, 5], mistakes: [{ options: [1, 5], why: 'x' }] };
  test('選ぶ順番は問わない', () => assert.equal(gradeMulti(q, [5, 1, 3]).correct, true));
  test('足りない・多いは不正解', () => {
    assert.equal(gradeMulti(q, [1, 3]).correct, false);
    assert.equal(gradeMulti(q, [1, 3, 5, 6]).correct, false);
  });
  test('よくある誤答を見分ける', () => assert.equal(gradeMulti(q, [5, 1]).mistake, q.mistakes[0]));
  test('何も選んでいないと注意を出す', () => assert.ok(gradeMulti(q, []).issues.length));
});

describe('復習スケジュール(間違えた日から1日後・3日後・7日後)', () => {
  test('正解を続けると 1→3→7日後と進んで卒業', () => {
    let r = applyAnswer({}, 'B01-001', false, '2027-01-10');
    assert.deepEqual(r['B01-001'], { anchor: '2027-01-10', stage: 0, due: '2027-01-11' });
    r = applyAnswer(r, 'B01-001', true, '2027-01-11');
    assert.equal(r['B01-001'].due, '2027-01-13');
    r = applyAnswer(r, 'B01-001', true, '2027-01-13');
    assert.equal(r['B01-001'].due, '2027-01-17');
    r = applyAnswer(r, 'B01-001', true, '2027-01-17');
    assert.equal(r['B01-001'], undefined);
  });
  test('期日前に正解しても予定は変わらない', () => {
    const r = applyAnswer({}, 'X-001', false, '2027-01-10');
    assert.deepEqual(applyAnswer(r, 'X-001', true, '2027-01-10'), r);
  });
  test('遅れて解いたときは、過ぎた期日を翌日にずらす', () => {
    let r = applyAnswer({}, 'X-001', false, '2027-01-10');
    r = applyAnswer(r, 'X-001', true, '2027-01-15');
    assert.equal(r['X-001'].due, '2027-01-16');
  });
  test('復習で間違えたらその日から数え直す', () => {
    let r = applyAnswer({}, 'X-001', false, '2027-01-10');
    r = applyAnswer(r, 'X-001', true, '2027-01-11');
    r = applyAnswer(r, 'X-001', false, '2027-01-13');
    assert.deepEqual(r['X-001'], { anchor: '2027-01-13', stage: 0, due: '2027-01-14' });
  });
  test('期日の来た問題と次の予定', () => {
    const r = { a: { anchor: '', stage: 0, due: '2027-01-11' }, b: { anchor: '', stage: 0, due: '2027-01-09' }, c: { anchor: '', stage: 1, due: '2027-01-14' } };
    assert.deepEqual(dueQids(r, '2027-01-11'), ['b', 'a']);
    assert.deepEqual(nextDue(r, '2027-01-11'), { date: '2027-01-14', count: 1 });
  });
  test('月・年をまたぐ日付', () => {
    assert.equal(addDays('2027-01-31', 1), '2027-02-01');
    assert.equal(addDays('2027-12-28', 7), '2028-01-04');
  });
});

describe('学習記録', () => {
  test('形のおかしいデータは読み込まない', () => {
    assert.equal(validateProgress({ version: 2 }), null);
    assert.equal(validateProgress(null), null);
    const p = validateProgress({ version: 1, attempts: [{ q: 'B01-001', t: 'B01', c: 1 }, { bad: true }], review: {} });
    assert.equal(p.attempts.length, 1);
  });
  test('論点別の正答率', () => {
    const s = topicStats({ attempts: [{ q: 'B01-001', t: 'B01', c: 1 }, { q: 'B01-002', t: 'B01', c: 0 }], review: {} });
    assert.equal(s.B01.answered, 2);
    assert.equal(s.B01.rate, 0.5);
    assert.equal(s.B01.solved.size, 1);
  });
});

describe('Markdown 表示', () => {
  test('HTML はエスケープされる', () => {
    assert.ok(!renderMarkdown('<script>alert(1)</script>').html.includes('<script>'));
  });
  test('危険なリンクは作らない', () => {
    assert.ok(!renderMarkdown('[x](javascript:alert(1))').html.includes('href'));
  });
  test('見出しの id と仕訳の表', () => {
    const { html, headings } = renderMarkdown('## 要点 {#summary}\n\n| 借方科目 | 金額 | 貸方科目 | 金額 |\n|---|--:|---|--:|\n| 現金 | 1 | 売上 | 1 |', { idPrefix: 'tb-' });
    assert.ok(html.includes('id="tb-summary"'));
    assert.ok(html.includes('class="md-journal"'));
    assert.deepEqual(headings, [{ level: 2, text: '要点', id: 'summary' }]);
  });
});

describe('ビルド', () => {
  test('生成ファイル(問題・参考書・manifest)がリポジトリと一致する', async () => {
    const outputs = await buildAll();
    for (const [f, content] of outputs) {
      const p = path.join(ROOT, f);
      assert.ok(fs.existsSync(p), `${f} がない。npm run build を実行`);
      assert.equal(fs.readFileSync(p, 'utf8'), content, `${f} が古い。npm run build を実行`);
    }
  });
});
