// C21 決算整理と精算表(2級) の問題(10問)
// 仕訳5問・数値3問・表1問(精算表8桁の一部)・複数選択1問。金額はすべて step() で計算する。
// 棚卸減耗・評価替、貸倒引当金(個別 + 一括)、減価償却(定額法 + 200%定率法)、有価証券の評価替(税効果あり)、
// 法人税等、決算整理後の当期純利益、精算表。

import { blankNum, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C21';

/** 精算表の列(勘定科目 + 4つの欄 × 借方・貸方) */
const WS_COLUMNS = [
  { label: '勘定科目' },
  ...['試算表', '修正記入', '損益計算書', '貸借対照表'].flatMap((group) => [
    { label: '借方', group, align: 'right' },
    { label: '貸方', group, align: 'right' },
  ]),
];
// 列の番号: 1 試算表借方 2 試算表貸方 3 修正借方 4 修正貸方 5 P/L借方 6 P/L貸方 7 B/S借方 8 B/S貸方

/** 精算表の1行。cells は { 列番号: 値 } */
function wsRow(name, cells) {
  const row = [name, null, null, null, null, null, null, null, null];
  for (const [k, v] of Object.entries(cells)) row[Number(k)] = v;
  return row;
}

export default function build() {
  const questions = [];

  // 1〜2・8. 商品(共通の資料)
  const g = { begin: 250000, purchases: 3200000, bookQty: 500, cost: 600, realQty: 470, market: 560 };
  const gData = `期首商品棚卸高は ${yen(g.begin)}、決算整理前の仕入は ${yen(g.purchases)}。期末商品は、帳簿 ${g.bookQty}個(原価 ¥${g.cost})、実地 ${g.realQty}個、時価 ¥${g.market}。`;
  const book = step('期末の帳簿棚卸高(帳簿数量 × 原価)', 'mul', [g.bookQty, g.cost]);
  const lostQ = step('減った数量(帳簿 − 実地)', 'sub', [g.bookQty, g.realQty]);
  const loss = step('棚卸減耗損(原価 × 減った数量)', 'mul', [g.cost, lostQ.value]);
  const drop = step('1個あたりの値下がり(原価 − 時価)', 'sub', [g.cost, g.market]);
  const val = step('商品評価損(値下がり × 実地数量)', 'mul', [drop.value, g.realQty]);
  const endInv = step('整理後の繰越商品(時価 × 実地数量)', 'mul', [g.market, g.realQty]);
  const p1 = step('仕入 + 期首商品', 'add', [g.purchases, g.begin]);
  const cogs = step('売上原価(− 期末の帳簿棚卸高)', 'sub', [p1.value, book.value]);
  {
    const wrong = step('誤答: 実地数量 × 原価(評価損を引かない)', 'mul', [g.realQty, g.cost]);
    questions.push(
      numericQ({
        id: 'C21-001',
        topic: T,
        difficulty: 2,
        prompt: `${gData}決算整理後残高試算表の繰越商品の金額はいくらか。`,
        answer: endInv.value,
        calc: [book, lostQ, loss, drop, val, endInv],
        explanation: `帳簿 ${yen(book.value)} から、棚卸減耗損 ${yen(loss.value)} と商品評価損 ${yen(val.value)} を引いた残り。時価 ¥${g.market} × 実地 ${g.realQty}個 = ${yen(endInv.value)} と同じ。`,
        mistakes: [
          { value: wrong.value, calc: [wrong], why: '時価が原価より下がっているので、商品評価損も引く。時価 × 実地数量。' },
          { value: book.value, calc: [book], why: '帳簿の金額から、棚卸減耗損と商品評価損を引く。' },
        ],
        ref: { topic: T, anchor: 'inventory' },
      }),
    );
  }
  {
    const c2 = step('売上原価 + 棚卸減耗損', 'add', [cogs.value, loss.value]);
    const all = step('整理後の仕入(+ 商品評価損)', 'add', [c2.value, val.value]);
    questions.push(
      numericQ({
        id: 'C21-002',
        topic: T,
        difficulty: 3,
        prompt: `${gData}売上原価は仕入の行で計算し、棚卸減耗損と商品評価損は売上原価に含める。決算整理後残高試算表の仕入の金額はいくらか。`,
        answer: all.value,
        calc: [book, p1, cogs, lostQ, loss, drop, val, c2, all],
        explanation: `${yen(g.purchases)} + 期首 ${yen(g.begin)} − 期末帳簿 ${yen(book.value)} = ${yen(cogs.value)}。売上原価に含める指示なので、棚卸減耗損 ${yen(loss.value)} と商品評価損 ${yen(val.value)} も仕入に振り替えて ${yen(all.value)}。`,
        mistakes: [{ value: cogs.value, calc: [book, p1, cogs], why: '「売上原価に含める」指示があるので、棚卸減耗損と商品評価損も仕入に加える。' }],
        ref: { topic: T, anchor: 'inventory' },
      }),
    );
  }

  // 3. 貸倒引当金(個別評価 + 一括評価)
  {
    const ar = 900000;
    const bad = 120000;
    const bal = 12000;
    const ind = step('個別評価(B社の売掛金 × 50%)', 'mul', [bad, 50]);
    const indV = step('個別評価(÷ 100)', 'div', [ind.value, 100]);
    const rest = step('一括評価の対象(売掛金 − B社)', 'sub', [ar, bad]);
    const grm = step('一括評価(対象 × 2%)', 'mul', [rest.value, 2]);
    const gr = step('一括評価(÷ 100)', 'div', [grm.value, 100]);
    const est = step('見積額(個別 + 一括)', 'add', [indV.value, gr.value]);
    const add = step('繰入額(見積額 − 残高)', 'sub', [est.value, bal]);
    const wm = step('誤答: 売掛金全体 × 2%', 'mul', [ar, 2]);
    const we = step('誤答: 全体に2%をかけた見積額(÷ 100)', 'div', [wm.value, 100]);
    const wrong = step('誤答: その見積額 − 残高', 'sub', [we.value, bal]);
    questions.push(
      journalQ({
        id: 'C21-003',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、売掛金 ${yen(ar)} に貸倒引当金を設定する(差額補充法)。このうち B社の ${yen(bad)} は回収が難しいので 50% を、残りには 2% を見積もる。貸倒引当金の残高は ${yen(bal)}。`,
        choices: ['貸倒引当金繰入', '貸倒引当金', '貸倒損失', '売掛金', '貸倒引当金戻入', '償却債権取立益'],
        debit: [line('貸倒引当金繰入', add.value)],
        credit: [line('貸倒引当金', add.value)],
        calc: [ind, indV, rest, grm, gr, est, add],
        explanation: `個別評価 ${yen(indV.value)} + 一括評価(${yen(rest.value)} × 2%)${yen(gr.value)} = ${yen(est.value)}。残高 ${yen(bal)} との差 ${yen(add.value)} を繰り入れる。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金繰入', wrong.value)], credit: [line('貸倒引当金', wrong.value)] },
            why: '回収が難しい B社の分は個別に 50% を見積もる。一括評価は残りの売掛金に対して計算する。',
            calc: [wm, we, wrong],
          },
        ],
        ref: { topic: T, anchor: 'allowance' },
      }),
    );
  }

  // 4. 減価償却(定額法 + 200%定率法)
  {
    const bld = 3000000;
    const life = 30;
    const eq = 800000;
    const acc = 320000;
    const b = step('建物の減価償却費(取得原価 ÷ 耐用年数)', 'div', [bld, life]);
    const bookV = step('備品の期首帳簿価額(取得原価 − 累計額)', 'sub', [eq, acc]);
    const em = step('備品の減価償却費(帳簿価額 × 4)', 'mul', [bookV.value, 4]);
    const e = step('備品の減価償却費(÷ 10。償却率 0.4)', 'div', [em.value, 10]);
    const total = step('減価償却費の合計', 'add', [b.value, e.value]);
    const wm = step('誤答: 備品の取得原価 × 4', 'mul', [eq, 4]);
    const we = step('誤答: 取得原価に償却率をかけた額(÷ 10)', 'div', [wm.value, 10]);
    const wt = step('誤答: その合計', 'add', [b.value, we.value]);
    questions.push(
      journalQ({
        id: 'C21-004',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、減価償却を行う。建物(取得原価 ${yen(bld)})は定額法(耐用年数 ${life}年、残存価額 0)、備品(取得原価 ${yen(eq)}、減価償却累計額 ${yen(acc)})は 200%定率法(償却率 0.4)。記帳は間接法。`,
        choices: ['減価償却費', '建物減価償却累計額', '備品減価償却累計額', '建物', '備品', '修繕費'],
        debit: [line('減価償却費', total.value)],
        credit: [line('建物減価償却累計額', b.value), line('備品減価償却累計額', e.value)],
        calc: [b, bookV, em, e, total],
        explanation: `建物 ${yen(bld)} ÷ ${life}年 = ${yen(b.value)}。備品は期首の帳簿価額 ${yen(bookV.value)} × 0.4 = ${yen(e.value)}。合計 ${yen(total.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', wt.value)], credit: [line('建物減価償却累計額', b.value), line('備品減価償却累計額', we.value)] },
            why: '定率法は、取得原価ではなく期首の帳簿価額(取得原価 − 累計額)に償却率をかける。',
            calc: [wm, we, wt],
          },
        ],
        ref: { topic: T, anchor: 'depreciation' },
      }),
    );
  }

  // 5. その他有価証券(税効果あり)
  {
    const cost = 700000;
    const fair = 760000;
    const diff = step('評価差額(時価 − 取得原価)', 'sub', [fair, cost]);
    const tm = step('繰延税金負債(評価差額 × 30)', 'mul', [diff.value, 30]);
    const tax = step('繰延税金負債(÷ 100)', 'div', [tm.value, 100]);
    const net = step('その他有価証券評価差額金(評価差額 − 繰延税金負債)', 'sub', [diff.value, tax.value]);
    questions.push(
      journalQ({
        id: 'C21-005',
        topic: T,
        difficulty: 3,
        prompt: `決算にあたり、その他有価証券(取得原価 ${yen(cost)})を時価 ${yen(fair)} に評価替えする。全部純資産直入法により、税効果会計を適用する(実効税率 30%)。`,
        choices: ['その他有価証券', '繰延税金負債', 'その他有価証券評価差額金', '繰延税金資産', '有価証券評価益', '法人税等調整額'],
        debit: [line('その他有価証券', diff.value)],
        credit: [line('繰延税金負債', tax.value), line('その他有価証券評価差額金', net.value)],
        calc: [diff, tm, tax, net],
        explanation: `評価差額 ${yen(diff.value)} のうち、30% の ${yen(tax.value)} を **繰延税金負債**、残り ${yen(net.value)} を **その他有価証券評価差額金**(純資産)にする。損益には入れないので、法人税等調整額は使わない。`,
        mistakes: [
          {
            entry: { debit: [line('その他有価証券', diff.value)], credit: [line('有価証券評価益', diff.value)] },
            why: 'その他有価証券の評価差額は損益にしない(全部純資産直入法)。純資産のその他有価証券評価差額金にする。',
          },
          {
            entry: { debit: [line('その他有価証券', diff.value)], credit: [line('法人税等調整額', tax.value), line('その他有価証券評価差額金', net.value)] },
            why: '評価差額を純資産に直接入れるので、税効果も損益(法人税等調整額)を通さず、繰延税金負債だけを計上する。',
          },
        ],
        ref: { topic: T, anchor: 'securities' },
      }),
    );
  }

  // 6. 売買目的有価証券の評価替
  {
    const bookV = 520000;
    const fair = 490000;
    const loss2 = step('評価損(帳簿価額 − 時価)', 'sub', [bookV, fair]);
    questions.push(
      journalQ({
        id: 'C21-006',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、売買目的有価証券(帳簿価額 ${yen(bookV)})を時価 ${yen(fair)} に評価替えする。`,
        choices: ['有価証券評価損', '売買目的有価証券', '有価証券評価益', 'その他有価証券評価差額金', '有価証券売却損', 'その他有価証券'],
        debit: [line('有価証券評価損', loss2.value)],
        credit: [line('売買目的有価証券', loss2.value)],
        calc: [loss2],
        explanation: `時価が ${yen(loss2.value)} 下がったので、売買目的有価証券を減らし、**有価証券評価損**(営業外費用)にする。`,
        mistakes: [
          {
            entry: { debit: [line('その他有価証券評価差額金', loss2.value)], credit: [line('売買目的有価証券', loss2.value)] },
            why: '売買目的有価証券の評価差額は、純資産ではなく損益(有価証券評価損益)にする。',
          },
        ],
        ref: { topic: T, anchor: 'list' },
      }),
    );
  }

  // 7. 法人税等
  {
    const tax = 420000;
    const prepaid = 180000;
    const unpaid = step('未払法人税等(法人税等 − 仮払法人税等)', 'sub', [tax, prepaid]);
    questions.push(
      journalQ({
        id: 'C21-007',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、当期の法人税、住民税及び事業税 ${yen(tax)} を計上する。中間納付した ${yen(prepaid)} は仮払法人税等で処理してある。`,
        choices: ['法人税、住民税及び事業税', '仮払法人税等', '未払法人税等', '未払金', '租税公課', '法人税等調整額'],
        debit: [line('法人税、住民税及び事業税', tax)],
        credit: [line('仮払法人税等', prepaid), line('未払法人税等', unpaid.value)],
        calc: [unpaid],
        explanation: `中間納付した ${yen(prepaid)}(仮払法人税等)を差し引き、残り ${yen(unpaid.value)} を **未払法人税等** にする。`,
        mistakes: [
          {
            entry: { debit: [line('法人税、住民税及び事業税', tax)], credit: [line('未払法人税等', tax)] },
            why: '中間納付した分は仮払法人税等にあるので、それを差し引いた残りだけが未払法人税等。',
          },
        ],
        ref: { topic: T, anchor: 'tax' },
      }),
    );
  }

  // 8. 精算表(一部)
  {
    const ar = 900000;
    const allow = 12000;
    const est0 = step('貸倒引当金の見積額(売掛金 × 2)', 'mul', [ar, 2]);
    const est = step('貸倒引当金の見積額(÷ 100)', 'div', [est0.value, 100]);
    const add = step('繰入額(見積額 − 残高)', 'sub', [est.value, allow]);
    const invCr1 = step('繰越商品の修正貸方(期首 + 棚卸減耗損)', 'add', [g.begin, loss.value]);
    const invCr = step('繰越商品の修正貸方(+ 商品評価損)', 'add', [invCr1.value, val.value]);
    const wrongInv = step('誤答: 評価損を引かない繰越商品(実地数量 × 原価)', 'mul', [g.realQty, g.cost]);
    questions.push(
      tableQ({
        id: 'C21-008',
        topic: T,
        format: 'q3_statements',
        difficulty: 3,
        prompt: `次の精算表(一部)の空欄を埋めなさい。決算整理事項は、①売掛金の期末残高に 2% の貸倒引当金を差額補充法で設定する、②${gData}売上原価は仕入の行で計算し、棚卸減耗損と商品評価損は独立の科目で表示する。何も書かない欄は空けたままにする。`,
        table: {
          title: '精算表(一部)',
          columns: WS_COLUMNS,
          rows: [
            wsRow('売掛金', { 1: ar, 7: blankNum(ar) }),
            wsRow('貸倒引当金', { 2: allow, 4: blankNum(add.value), 8: blankNum(est.value) }),
            wsRow('繰越商品', { 1: g.begin, 3: blankNum(book.value), 4: blankNum(invCr.value), 7: blankNum(endInv.value) }),
            wsRow('仕入', { 1: g.purchases, 3: blankNum(g.begin), 4: blankNum(book.value), 5: blankNum(cogs.value) }),
            wsRow('貸倒引当金繰入', { 3: blankNum(add.value), 5: blankNum(add.value) }),
            wsRow('棚卸減耗損', { 3: blankNum(loss.value), 5: blankNum(loss.value) }),
            wsRow('商品評価損', { 3: blankNum(val.value), 5: blankNum(val.value) }),
          ],
        },
        checks: [
          { label: '売掛金: 試算表 = 貸借対照表', op: 'add', args: [[0, 1], 0], result: [0, 7] },
          { label: '貸倒引当金: 試算表 + 修正貸方', op: 'add', args: [[1, 2], [1, 4]], result: [1, 8] },
          { label: '繰越商品: 試算表 + 修正借方 − 修正貸方', op: 'add', args: [[2, 1], [2, 3], ['-', 2, 4]], result: [2, 7] },
          { label: '仕入: 試算表 + 修正借方 − 修正貸方', op: 'add', args: [[3, 1], [3, 3], ['-', 3, 4]], result: [3, 5] },
          { label: '繰越商品の修正借方 = 仕入の修正貸方', op: 'add', args: [[3, 4], 0], result: [2, 3] },
          { label: '繰越商品の修正貸方 = 仕入の修正借方 + 棚卸減耗損 + 商品評価損', op: 'add', args: [[3, 3], [5, 3], [6, 3]], result: [2, 4] },
          { label: '貸倒引当金の修正貸方 = 繰入', op: 'add', args: [[4, 3], 0], result: [1, 4] },
          { label: '繰入: 修正借方 = 損益計算書', op: 'add', args: [[4, 3], 0], result: [4, 5] },
          { label: '棚卸減耗損: 修正借方 = 損益計算書', op: 'add', args: [[5, 3], 0], result: [5, 5] },
          { label: '商品評価損: 修正借方 = 損益計算書', op: 'add', args: [[6, 3], 0], result: [6, 5] },
        ],
        calc: [est0, est, add, book, lostQ, loss, drop, val, endInv, invCr1, invCr, p1, cogs],
        explanation: `貸倒引当金: 見積 ${yen(est.value)} − 残高 ${yen(allow)} = 繰入 ${yen(add.value)}。繰越商品: 修正借方は期末帳簿 ${yen(book.value)}、修正貸方は期首 ${yen(g.begin)} + 減耗 ${yen(loss.value)} + 評価損 ${yen(val.value)} = ${yen(invCr.value)}。貸借対照表は ${yen(endInv.value)}(時価 × 実地数量)。仕入は ${yen(cogs.value)}。`,
        mistakes: [
          {
            cell: [2, 7],
            value: wrongInv.value,
            calc: [wrongInv],
            why: '時価が下がっているので商品評価損も引く。貸借対照表の繰越商品は時価 × 実地数量。',
          },
          {
            cell: [2, 4],
            value: g.begin,
            why: '繰越商品の修正貸方には、期首の振替に加えて、棚卸減耗損と商品評価損の分も入る。',
          },
        ],
        ref: { topic: T, anchor: 'worksheet' },
      }),
    );
  }

  // 9. 決算整理後の当期純利益(数値)
  {
    const rev = 6400000;
    const exp = 5600000;
    const items = { 貸倒引当金繰入: 6000, 減価償却費: 192000, 棚卸減耗損: 18000, 商品評価損: 18800, 有価証券評価益: 20000, 前払保険料: 24000 };
    const pre = step('整理前の利益(収益 − 費用)', 'sub', [rev, exp]);
    const minus = step('整理で増える費用(繰入 + 減価償却費 + 減耗損 + 評価損)', 'add', [items.貸倒引当金繰入, items.減価償却費, items.棚卸減耗損, items.商品評価損]);
    const plus = step('整理で増える利益(評価益 + 保険料の繰延)', 'add', [items.有価証券評価益, items.前払保険料]);
    const a1 = step('整理前の利益 − 増える費用', 'sub', [pre.value, minus.value]);
    const ni = step('決算整理後の税引前当期純利益(+ 増える利益)', 'add', [a1.value, plus.value]);
    const wrong = step('誤答: 評価益と前払も引いた額', 'sub', [a1.value, plus.value]);
    questions.push(
      numericQ({
        id: 'C21-009',
        topic: T,
        difficulty: 3,
        prompt: `決算整理前の収益の合計は ${yen(rev)}、費用の合計は ${yen(exp)}(仕入は売上原価を計算したあとの金額)。決算整理で、貸倒引当金繰入 ${yen(items.貸倒引当金繰入)}、減価償却費 ${yen(items.減価償却費)}、棚卸減耗損 ${yen(items.棚卸減耗損)}、商品評価損 ${yen(items.商品評価損)}、有価証券評価益 ${yen(items.有価証券評価益)} を計上し、支払った保険料のうち ${yen(items.前払保険料)} を前払保険料として繰り延べた。決算整理後の税引前当期純利益はいくらか。`,
        answer: ni.value,
        calc: [pre, minus, plus, a1, ni],
        explanation: `整理前の利益 ${yen(pre.value)} から、増える費用 ${yen(minus.value)} を引き、有価証券評価益と保険料の繰延(費用が減る)の ${yen(plus.value)} を足して ${yen(ni.value)}。`,
        mistakes: [{ value: wrong.value, calc: [pre, minus, plus, a1, wrong], why: '有価証券評価益は収益。前払保険料の繰延は費用(保険料)を減らすので、どちらも利益を増やす。' }],
        ref: { topic: T, anchor: 'after' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C21-010',
      topic: T,
      difficulty: 2,
      prompt: '2級の決算整理と精算表について、正しいものをすべて選びなさい。',
      options: [
        '決算整理後の繰越商品は、時価が原価より低いとき、時価 × 実地数量になる',
        '200%定率法の減価償却費は、取得原価に償却率をかけて毎年計算する',
        'その他有価証券の評価差額に税効果を適用するときは、繰延税金負債(または資産)とその他有価証券評価差額金に分ける',
        '仮払法人税等は、決算整理後残高試算表にもそのまま残る',
        '精算表で、資産の行は「試算表 + 修正借方 − 修正貸方」を貸借対照表の借方に書く',
      ],
      answer: [0, 2, 4],
      explanation: '定率法は期首の帳簿価額に償却率をかける。仮払法人税等は法人税等に振り替えるので、整理後は残らない。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '定率法は、取得原価ではなく期首の帳簿価額(取得原価 − 累計額)に償却率をかける。' },
        { options: [0, 2, 3, 4], why: '仮払法人税等は、決算整理で法人税等の計上と一緒に消す。' },
        { options: [0, 2], why: '資産の行は、試算表の借方に修正借方を足し、修正貸方を引く。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'worksheet' },
    }),
  );

  return { topic: T, questions };
}
