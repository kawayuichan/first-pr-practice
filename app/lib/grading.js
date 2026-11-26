// 採点。アプリとテストで共通に使う(DOM を使わない)。

import { parseAmount } from './format.js';

/**
 * 勘定科目の索引を作る。
 * official: data/official/accounts_2027.json、supplement: data/accounts_supplement.json
 * 戻り値: { names: Set(使える科目名すべて), official: Set, supplement: Set, alternatives: Map(標準科目 → Set(許容科目)) }
 */
export function buildAccountIndex(official, supplement) {
  const names = new Set();
  const officialNames = new Set();
  const supplementNames = new Set();
  const alternatives = new Map();
  const addAlt = (a, bs) => {
    if (!alternatives.has(a)) alternatives.set(a, new Set());
    for (const b of bs) alternatives.get(a).add(b);
  };
  for (const grade of Object.values(official.grades)) {
    for (const rows of Object.values(grade)) {
      for (const [a, bs] of rows) {
        names.add(a);
        officialNames.add(a);
        for (const b of bs) {
          names.add(b);
          officialNames.add(b);
        }
        addAlt(a, bs);
      }
    }
  }
  for (const s of supplement?.accounts ?? []) {
    names.add(s.name);
    supplementNames.add(s.name);
    addAlt(s.name, s.alternatives ?? []);
  }
  return { names, official: officialNames, supplement: supplementNames, alternatives };
}

/** 解答の科目 user が、正解の科目 answer として認められるか(同じ名前か、正解の許容科目) */
export function accountAccepted(index, user, answer) {
  if (user === answer) return true;
  return !!index?.alternatives.get(answer)?.has(user);
}

/**
 * 入力欄の行を整える。科目も金額も空の行は無視する。
 * 戻り値: { lines: [{account, amount}], incomplete: boolean }
 */
export function cleanLines(rows) {
  const lines = [];
  let incomplete = false;
  for (const r of rows ?? []) {
    const account = (r.account ?? '').trim();
    const amount = typeof r.amount === 'number' ? r.amount : parseAmount(r.amount);
    const emptyAmount = r.amount == null || String(r.amount).trim() === '';
    if (!account && emptyAmount) continue;
    if (!account || amount == null || amount <= 0) {
      incomplete = true;
      continue;
    }
    lines.push({ account, amount });
  }
  return { lines, incomplete };
}

function matchSide(userLines, answerLines, index) {
  const used = new Array(answerLines.length).fill(false);
  const marks = userLines.map((u) => {
    const k = answerLines.findIndex(
      (a, j) => !used[j] && a.amount === u.amount && accountAccepted(index, u.account, a.account),
    );
    if (k >= 0) used[k] = true;
    return { ...u, ok: k >= 0 };
  });
  const missing = answerLines.filter((_, j) => !used[j]);
  return { marks, missing };
}

function duplicates(lines) {
  const seen = new Set();
  const dup = new Set();
  for (const l of lines) {
    if (seen.has(l.account)) dup.add(l.account);
    seen.add(l.account);
  }
  return [...dup];
}

/** 2つの仕訳が同じか(行の順番は問わない) */
export function sameEntry(a, b, index) {
  for (const side of ['debit', 'credit']) {
    const r = matchSide(a[side], b[side], index);
    if (r.missing.length || r.marks.some((m) => !m.ok)) return false;
  }
  return true;
}

/**
 * 仕訳問題の採点。
 * entry: { debit: [{account, amount}], credit: [...] }(amount は文字列でもよい)
 * 戻り値: { correct, issues: [文], sides: { debit: {marks, missing}, credit: {...} }, mistake }
 */
export function gradeJournal(q, entry, index) {
  const issues = [];
  const clean = {};
  for (const side of ['debit', 'credit']) {
    const c = cleanLines(entry?.[side]);
    clean[side] = c.lines;
    const label = side === 'debit' ? '借方' : '貸方';
    if (c.incomplete) issues.push(`${label}に、科目か金額が入っていない行があります。`);
    for (const d of duplicates(c.lines)) {
      issues.push(`${label}で「${d}」を2回使っています。同じ科目は借方・貸方それぞれ1回まで(金額を合計して1行にする)。`);
    }
  }
  if (!clean.debit.length && !clean.credit.length) issues.push('解答が入力されていません。');

  const sides = {
    debit: matchSide(clean.debit, q.answer.debit, index),
    credit: matchSide(clean.credit, q.answer.credit, index),
  };
  const allOk = ['debit', 'credit'].every(
    (s) => sides[s].missing.length === 0 && sides[s].marks.every((m) => m.ok),
  );
  const correct = allOk && issues.length === 0;
  let mistake = null;
  if (!correct) {
    mistake = (q.mistakes ?? []).find((m) => m.entry && sameEntry(clean, m.entry, index)) ?? null;
  }
  return { correct, issues, sides, mistake, entry: clean };
}

export function gradeChoice(q, selected) {
  const correct = selected === q.answer;
  const mistake = correct ? null : (q.mistakes ?? []).find((m) => m.option === selected) ?? null;
  return { correct, mistake, issues: selected == null ? ['選択肢を選んでください。'] : [] };
}

export function gradeNumeric(q, input) {
  const value = typeof input === 'number' ? input : parseAmount(input);
  const correct = value === q.answer;
  const mistake = correct ? null : (q.mistakes ?? []).find((m) => m.value === value) ?? null;
  return { correct, mistake, value, issues: value == null ? ['数字を入力してください。'] : [] };
}

export function gradeQuestion(q, answer, index) {
  if (q.type === 'journal') return gradeJournal(q, answer, index);
  if (q.type === 'choice') return gradeChoice(q, answer);
  if (q.type === 'numeric') return gradeNumeric(q, answer);
  throw new Error(`未知の問題形式: ${q.type}`);
}
