// 問題データを作るための部品。
// 金額は必ずコードで計算する(step を使う)。手で計算した数字を直接書かない。

import { makeStep } from '../../app/lib/calc.js';
import { fmt, yen } from '../../app/lib/format.js';

export { fmt, yen };

/** 計算ステップ。例: step('未払金', 'sub', [360000, 120000]) → value 240000 */
export const step = makeStep;

/** 仕訳の1行 */
export const line = (account, amount) => ({ account, amount });

function common(o) {
  for (const k of ['id', 'topic', 'difficulty', 'prompt', 'explanation', 'mistakes', 'ref']) {
    if (o[k] === undefined) throw new Error(`${o.id ?? '?'}: ${k} がありません`);
  }
  if (o.needs_review && !o.needs_review_reason) {
    throw new Error(`${o.id}: needs_review には根拠(needs_review_reason)が必要です`);
  }
}

function tail(o) {
  const out = {
    calc: o.calc ?? [],
    explanation: o.explanation,
    mistakes: o.mistakes,
    ref: o.ref,
    needs_review: !!o.needs_review,
  };
  if (o.needs_review) out.needs_review_reason = o.needs_review_reason;
  return out;
}

/** 仕訳問題(本試験の第1問・第4問(1)形式) */
export function journalQ(o) {
  common(o);
  return {
    id: o.id,
    topic: o.topic,
    format: o.format ?? 'q1_journal',
    type: 'journal',
    difficulty: o.difficulty,
    prompt: o.prompt,
    choices: o.choices,
    answer: { debit: o.debit, credit: o.credit },
    ...tail(o),
  };
}

/** 選択問題(基礎確認) */
export function choiceQ(o) {
  common(o);
  return {
    id: o.id,
    topic: o.topic,
    format: o.format ?? 'basic_check',
    type: 'choice',
    difficulty: o.difficulty,
    prompt: o.prompt,
    options: o.options,
    answer: o.answer,
    ...tail(o),
  };
}

/** 伝票(入金・出金・振替)。in/out は相手の科目、transfer は借方・貸方 */
export const slipIn = (account, amount) => ({ kind: 'in', account, amount });
export const slipOut = (account, amount) => ({ kind: 'out', account, amount });
export const slipTransfer = (debitAccount, debitAmount, creditAccount, creditAmount = debitAmount) => ({
  kind: 'transfer',
  debit: { account: debitAccount, amount: debitAmount },
  credit: { account: creditAccount, amount: creditAmount },
});

/** 伝票の起票問題。entry は取引そのものの仕訳(伝票の束と同じ増減になることをテストで確かめる) */
export function slipsQ(o) {
  common(o);
  if (!o.entry) throw new Error(`${o.id}: entry(取引の仕訳)が必要です`);
  return {
    id: o.id,
    topic: o.topic,
    format: o.format ?? 'basic_check',
    type: 'slips',
    difficulty: o.difficulty,
    prompt: o.prompt,
    choices: o.choices,
    answer: o.slips,
    entry: o.entry,
    ...tail(o),
  };
}

/** 複数選択問題(補助簿の選択など)。answer は正解の選択肢の番号の配列 */
export function multiQ(o) {
  common(o);
  return {
    id: o.id,
    topic: o.topic,
    format: o.format ?? 'basic_check',
    type: 'multi',
    difficulty: o.difficulty,
    prompt: o.prompt,
    options: o.options,
    answer: [...o.answer].sort((a, b) => a - b),
    ...tail(o),
  };
}

/** 表の空欄。answer が null の数値欄は「空欄のままが正解」 */
export const blankNum = (answer) => ({ blank: true, kind: 'number', answer });
export const blankSelect = (options, answer) => ({ blank: true, kind: 'select', options, answer });

/**
 * 表の穴埋め問題(出納帳・商品有高帳など)。
 * checks: 表の中の合計・差額の関係 [{ label, op, args: [数 または [行, 列]], result: [行, 列] }]。テストで計算し直す
 */
export function tableQ(o) {
  common(o);
  if (!o.table || !o.checks?.length) throw new Error(`${o.id}: table と checks(表の中の計算)が必要です`);
  return {
    id: o.id,
    topic: o.topic,
    format: o.format ?? 'basic_check',
    type: 'table',
    difficulty: o.difficulty,
    prompt: o.prompt,
    table: o.table,
    checks: o.checks,
    ...tail(o),
  };
}

/** 数値入力問題 */
export function numericQ(o) {
  common(o);
  return {
    id: o.id,
    topic: o.topic,
    format: o.format ?? 'basic_check',
    type: 'numeric',
    difficulty: o.difficulty,
    prompt: o.prompt,
    unit: o.unit ?? '円',
    answer: o.answer,
    ...tail(o),
  };
}
