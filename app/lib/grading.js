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
  // 経過勘定: 公式表では「前払保険料（前払費用の各勘定）」のように1行で書かれている。
  // これは「前払保険料・前払利息…のように費用ごとに科目を作る(まとめて前払費用でもよい)」という意味なので、
  // 費用・収益の科目から「前払○○・未払○○・未収○○・前受○○」を作り、前払費用などを許容科目にする
  const expenses = new Set();
  const revenues = new Set();
  const families = [];
  for (const grade of Object.values(official.grades)) {
    for (const [a] of grade['費用'] ?? []) expenses.add(a);
    for (const [a] of grade['収益'] ?? []) revenues.add(a);
    for (const rows of Object.values(grade)) {
      for (const [a] of rows) {
        const m = a.match(/^(.+?)（(.+?)の各勘定）$/);
        if (m) families.push({ example: m[1], group: m[2] });
      }
    }
  }
  const ACCRUAL_BASE = /(料|利息|家賃|地代|手数料|給料)$/;
  for (const f of families) {
    const isExpense = f.group.endsWith('費用');
    const prefix = f.group.replace(/(費用|収益)$/, '');
    const bases = new Set([f.example.slice(prefix.length)]);
    for (const n of isExpense ? expenses : revenues) {
      const b = n.replace(isExpense ? /^支払/ : /^受取/, '');
      if (ACCRUAL_BASE.test(b) && !/[()（）]/.test(b)) bases.add(b);
    }
    for (const b of bases) {
      const name = prefix + b;
      names.add(name);
      officialNames.add(name);
      addAlt(name, [f.group]);
    }
  }
  // 「普通預金○○銀行」「〇〇商店」のように、○○ に口座名・取引先名が入る科目
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [...officialNames]
    .filter((n) => /[○〇]{2}/.test(n))
    .map((n) => {
      const [pre, post] = n.split(/[○〇]{2}/);
      return { template: n, re: new RegExp(`^${esc(pre)}[^\\s]{1,12}${esc(post)}$`) };
    });
  return { names, official: officialNames, supplement: supplementNames, alternatives, patterns };
}

/** 公式表(または補助リスト)にある科目か。「普通預金A銀行」のような ○○ の形の科目も認める */
export function isKnownAccount(index, name) {
  if (index.names.has(name)) return true;
  return index.patterns.some((p) => p.re.test(name) && !/[○〇]{2}/.test(name));
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

// ---------- 伝票(入金伝票・出金伝票・振替伝票) ----------
// 伝票の形:
//   { kind: 'in',  account, amount }   入金伝票(借方は必ず現金。科目欄は相手の科目)
//   { kind: 'out', account, amount }   出金伝票(貸方は必ず現金。科目欄は相手の科目)
//   { kind: 'transfer', debit: { account, amount }, credit: { account, amount } }  振替伝票

export const SLIP_KINDS = { in: '入金伝票', out: '出金伝票', transfer: '振替伝票' };

function cleanSlip(s) {
  const read = (acc, amt) => {
    const account = (acc ?? '').trim();
    const amount = typeof amt === 'number' ? amt : parseAmount(amt);
    const empty = !account && (amt == null || String(amt).trim() === '');
    return { account, amount, empty, ok: !!account && amount != null && amount > 0 };
  };
  if (s.kind === 'transfer') {
    const d = read(s.debit?.account, s.debit?.amount);
    const c = read(s.credit?.account, s.credit?.amount);
    if (d.empty && c.empty) return { slip: null };
    if (!d.ok || !c.ok) return { slip: null, incomplete: true };
    return {
      slip: { kind: 'transfer', debit: { account: d.account, amount: d.amount }, credit: { account: c.account, amount: c.amount } },
    };
  }
  if (s.kind !== 'in' && s.kind !== 'out') return { slip: null, incomplete: true };
  const r = read(s.account, s.amount);
  if (r.empty) return { slip: null };
  if (!r.ok) return { slip: null, incomplete: true };
  return { slip: { kind: s.kind, account: r.account, amount: r.amount } };
}

function slipMatches(index, u, a) {
  if (u.kind !== a.kind) return false;
  if (u.kind === 'transfer') {
    return (
      u.debit.amount === a.debit.amount &&
      u.credit.amount === a.credit.amount &&
      accountAccepted(index, u.debit.account, a.debit.account) &&
      accountAccepted(index, u.credit.account, a.credit.account)
    );
  }
  return u.amount === a.amount && accountAccepted(index, u.account, a.account);
}

function matchSlips(userSlips, answerSlips, index) {
  const used = new Array(answerSlips.length).fill(false);
  const marks = userSlips.map((u) => {
    const k = answerSlips.findIndex((a, j) => !used[j] && slipMatches(index, u, a));
    if (k >= 0) used[k] = true;
    return { ...u, ok: k >= 0 };
  });
  return { marks, missing: answerSlips.filter((_, j) => !used[j]) };
}

export function sameSlips(a, b, index) {
  if (a.length !== b.length) return false;
  const r = matchSlips(a, b, index);
  return r.missing.length === 0 && r.marks.every((m) => m.ok);
}

/** 伝票の起票問題の採点。slips: 入力された伝票の配列 */
export function gradeSlips(q, slips, index) {
  const issues = [];
  const clean = [];
  let incomplete = false;
  for (const s of slips ?? []) {
    const c = cleanSlip(s);
    if (c.incomplete) incomplete = true;
    if (c.slip) clean.push(c.slip);
  }
  if (incomplete) issues.push('科目か金額が入っていない伝票があります。');
  for (const s of clean) {
    if (s.kind === 'transfer' && s.debit.amount !== s.credit.amount) {
      issues.push('振替伝票の借方と貸方の金額が違います(1枚の振替伝票は左右同じ金額)。');
    }
  }
  if (!clean.length && !incomplete) issues.push('伝票が入力されていません。');
  const r = matchSlips(clean, q.answer, index);
  const correct = issues.length === 0 && r.missing.length === 0 && r.marks.every((m) => m.ok);
  const mistake = correct ? null : (q.mistakes ?? []).find((m) => m.slips && sameSlips(clean, m.slips, index)) ?? null;
  return { correct, issues, marks: r.marks, missing: r.missing, mistake, slips: clean };
}

/** 伝票の束を、勘定ごとの増減(借方をプラス)にまとめる。現金は入金・出金伝票から自動で数える */
export function slipsNet(slips) {
  const net = new Map();
  const add = (acc, v) => net.set(acc, (net.get(acc) ?? 0) + v);
  for (const s of slips) {
    if (s.kind === 'in') {
      add('現金', s.amount);
      add(s.account, -s.amount);
    } else if (s.kind === 'out') {
      add(s.account, s.amount);
      add('現金', -s.amount);
    } else {
      add(s.debit.account, s.debit.amount);
      add(s.credit.account, -s.credit.amount);
    }
  }
  for (const [k, v] of net) if (v === 0) net.delete(k);
  return net;
}

/** 仕訳を、勘定ごとの増減(借方をプラス)にまとめる */
export function entryNet(entry) {
  const net = new Map();
  for (const l of entry.debit) net.set(l.account, (net.get(l.account) ?? 0) + l.amount);
  for (const l of entry.credit) net.set(l.account, (net.get(l.account) ?? 0) - l.amount);
  for (const [k, v] of net) if (v === 0) net.delete(k);
  return net;
}

// ---------- 複数選択(補助簿の選択など) ----------

const sortedUnique = (xs) => [...new Set(xs)].sort((a, b) => a - b);
const sameSet = (a, b) => {
  const x = sortedUnique(a);
  const y = sortedUnique(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
};

/** 複数選択の採点。selected: 選んだ選択肢の番号の配列 */
export function gradeMulti(q, selected) {
  const sel = sortedUnique(selected ?? []);
  const correct = sameSet(sel, q.answer);
  const mistake = correct ? null : (q.mistakes ?? []).find((m) => m.options && sameSet(m.options, sel)) ?? null;
  return { correct, mistake, selected: sel, issues: sel.length ? [] : ['選択肢を選んでください。'] };
}

// ---------- 表の穴埋め(出納帳・商品有高帳・精算表など) ----------
// table: { title, columns: [{ label, align }], rows: [[セル, ...], ...] }
// セル: 文字 | 数 | null(何も書かない欄)
//      | { blank: true, kind: 'number', answer: 数 または null(空欄のままが正解) }
//      | { blank: true, kind: 'select', options: [...], answer: 文字 }

export const cellKey = (r, c) => `${r},${c}`;
const isBlank = (cell) => !!cell && typeof cell === 'object' && cell.blank === true;

/** 空欄の一覧 [{ r, c, cell }] */
export function tableBlanks(table) {
  const out = [];
  table.rows.forEach((row, r) => row.forEach((cell, c) => isBlank(cell) && out.push({ r, c, cell })));
  return out;
}

/** 正解を入れたときの、セルの数値(数でなければ 0) */
export function tableValue(table, r, c) {
  const cell = table.rows[r]?.[c];
  if (typeof cell === 'number') return cell;
  if (isBlank(cell) && cell.kind === 'number') return cell.answer ?? 0;
  return 0;
}

/** 表の中の計算(合計・差額)が正しいか。check: { label, op, args: [数 または [行, 列]], result: [行, 列] } */
export function verifyTableCheck(table, check, ops) {
  const vals = check.args.map((a) => (Array.isArray(a) ? tableValue(table, a[0], a[1]) : a));
  return ops[check.op].run(vals) === tableValue(table, check.result[0], check.result[1]);
}

/** 表の穴埋めの採点。input: { "行,列": 入力した文字 } */
export function gradeTable(q, input) {
  const cells = {};
  let filled = 0;
  for (const { r, c, cell } of tableBlanks(q.table)) {
    const key = cellKey(r, c);
    const raw = String(input?.[key] ?? '').trim();
    if (raw) filled++;
    let value;
    let ok;
    if (cell.kind === 'select') {
      value = raw || null;
      ok = value === cell.answer;
    } else {
      value = raw ? parseAmount(raw) : null;
      ok = raw && value == null ? false : value === cell.answer;
    }
    cells[key] = { ok, value, answer: cell.answer };
  }
  const list = Object.values(cells);
  const okCount = list.filter((x) => x.ok).length;
  const correct = okCount === list.length && list.length > 0;
  const hits = correct
    ? []
    : (q.mistakes ?? []).filter((m) => {
        const x = m.cell && cells[cellKey(m.cell[0], m.cell[1])];
        return x && !x.ok && x.value === m.value;
      });
  return {
    correct,
    cells,
    okCount,
    total: list.length,
    mistake: hits[0] ?? null,
    mistakes: hits,
    issues: filled ? [] : ['表に記入してください。'],
  };
}

/** テスト・表示用: 正解をすべて入れた入力 */
export function tableAnswerInput(table) {
  const out = {};
  for (const { r, c, cell } of tableBlanks(table)) out[cellKey(r, c)] = cell.answer == null ? '' : String(cell.answer);
  return out;
}

export function gradeQuestion(q, answer, index) {
  if (q.type === 'table') return gradeTable(q, answer);
  if (q.type === 'journal') return gradeJournal(q, answer, index);
  if (q.type === 'choice') return gradeChoice(q, answer);
  if (q.type === 'numeric') return gradeNumeric(q, answer);
  if (q.type === 'slips') return gradeSlips(q, answer, index);
  if (q.type === 'multi') return gradeMulti(q, answer);
  throw new Error(`未知の問題形式: ${q.type}`);
}
