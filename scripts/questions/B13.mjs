// B13 決算① の問題(10問)
// 数値3問・複数選択1問・仕訳3問・表2問(精算表8桁)・選択1問。金額はすべて step() で計算する。
// 決めたこと: 精算表は本試験と同じ8桁(2段の見出し、横スクロール、行は少なめ)。月次決算は仕訳1問。
// 2級の決算整理(棚卸減耗・評価替・引当金など)と大きな精算表は C21 で扱う。

import { blankNum, choiceQ, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B13';

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

  // 1. 残高試算表の金額(数値)
  {
    const dr = 820000;
    const cr = 575000;
    const bal = step('残高(借方合計 − 貸方合計)', 'sub', [dr, cr]);
    const sum = step('誤答: 借方合計 + 貸方合計', 'add', [dr, cr]);
    questions.push(
      numericQ({
        id: 'B13-001',
        topic: T,
        difficulty: 1,
        prompt: `現金勘定の借方合計は ${yen(dr)}、貸方合計は ${yen(cr)} である。残高試算表の借方に記入する現金の金額はいくらか。`,
        answer: bal.value,
        calc: [bal],
        explanation: '残高試算表には、各勘定の **残高**(借方合計と貸方合計の差)を書く。現金は借方合計のほうが多いので、借方残高。',
        mistakes: [
          { value: dr, why: 'これは借方合計(合計試算表に書く金額)。残高試算表には、貸方合計を引いた残高を書く。' },
          { value: sum.value, calc: [sum], why: '借方と貸方は足さない。残高は借方合計 − 貸方合計。' },
        ],
        ref: { topic: T, anchor: 'trial-balance' },
      }),
    );
  }

  // 2. 試算表で見つけられる誤り(複数選択)
  questions.push(
    multiQ({
      id: 'B13-002',
      topic: T,
      difficulty: 2,
      prompt: '次の誤りのうち、試算表の借方合計と貸方合計が一致しないことで見つけられるものをすべて選びなさい。',
      options: [
        '仕訳の借方だけを転記し、貸方の転記を忘れた',
        '借方の金額を、仕訳と違う金額で転記した(貸方は正しい)',
        '取引の仕訳そのものを忘れた',
        '借方の科目を間違えて、別の勘定の借方に転記した(金額は正しい)',
        '同じ仕訳を2回転記した',
      ],
      answer: [0, 1],
      explanation:
        '試算表の貸借が合わなくなるのは、借方と貸方の **金額がずれる** 誤りだけ。仕訳を忘れた、科目を取り違えた、2回転記したなど、借方と貸方が同じだけずれる誤りは見つけられない。',
      mistakes: [
        { options: [0, 1, 2], why: '仕訳を忘れると、借方も貸方も同じだけ少なくなるので、合計は一致したまま。' },
        { options: [0, 1, 3], why: '借方の科目を間違えても、借方の合計は変わらないので見つけられない。' },
        { options: [0, 1, 4], why: '2回転記すると、借方も貸方も同じだけ多くなるので、合計は一致したまま。' },
      ],
      ref: { topic: T, anchor: 'trial-balance' },
    }),
  );

  // 3. 決算整理: 売上原価の計算
  {
    const begin = 85000;
    const end = 92000;
    questions.push(
      journalQ({
        id: 'B13-003',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、売上原価を仕入勘定で計算する。期首商品棚卸高は ${yen(begin)}、期末商品棚卸高は ${yen(end)} である。`,
        choices: ['仕入', '繰越商品', '売上原価', '売上', '商品', '損益'],
        debit: [line('仕入', begin), line('繰越商品', end)],
        credit: [line('繰越商品', begin), line('仕入', end)],
        explanation: `期首の在庫 ${yen(begin)} は当期に売れたものとして仕入に加え(仕入 / 繰越商品)、期末に残った ${yen(end)} は仕入から除いて繰越商品にする(繰越商品 / 仕入)。`,
        mistakes: [
          {
            entry: { debit: [line('繰越商品', begin), line('仕入', end)], credit: [line('仕入', begin), line('繰越商品', end)] },
            why: '期首と期末が逆。期首の在庫は仕入に足し(仕入 / 繰越商品)、期末の在庫は仕入から引く(繰越商品 / 仕入)。',
          },
          {
            entry: { debit: [line('売上原価', begin), line('繰越商品', end)], credit: [line('繰越商品', begin), line('売上原価', end)] },
            why: '「仕入勘定で計算する」指示なので、売上原価勘定は使わない。',
          },
        ],
        ref: { topic: T, anchor: 'adjustments' },
      }),
    );
  }

  // 4. 決算整理: 貸倒引当金(試算表の金額から)
  {
    const ar = 640000;
    const denshi = 360000;
    const bal = 8000;
    const base = step('売掛金 + 電子記録債権', 'add', [ar, denshi]);
    const x = step('× 2', 'mul', [base.value, 2]);
    const est = step('見積額(÷ 100)', 'div', [x.value, 100]);
    const add = step('繰入額(見積額 − 残高)', 'sub', [est.value, bal]);
    questions.push(
      journalQ({
        id: 'B13-004',
        topic: T,
        difficulty: 2,
        prompt: `決算整理前残高試算表の金額は、売掛金 ${yen(ar)}、電子記録債権 ${yen(denshi)}、貸倒引当金 ${yen(bal)} である。売掛金と電子記録債権の期末残高に対して2%の貸倒引当金を差額補充法で設定する。`,
        choices: ['貸倒引当金繰入', '貸倒引当金', '貸倒引当金戻入', '貸倒損失', '売掛金', '電子記録債権'],
        debit: [line('貸倒引当金繰入', add.value)],
        credit: [line('貸倒引当金', add.value)],
        calc: [base, x, est, add],
        explanation: `見積額は (売掛金 + 電子記録債権) × 2% = ${yen(est.value)}。試算表の残高 ${yen(bal)} との差額 ${yen(add.value)} を繰り入れる(B08)。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金繰入', est.value)], credit: [line('貸倒引当金', est.value)] },
            why: `試算表に残高 ${yen(bal)} がある。差額補充法では、見積額との差額だけを繰り入れる。`,
          },
        ],
        ref: { topic: T, anchor: 'adjustments' },
      }),
    );
  }

  // 5. 月次決算: 減価償却費の3月分
  {
    const yearly = 360000;
    const monthly = step('1か月分(年間見積額 ÷ 12)', 'div', [yearly, 12]);
    const eleven = step('計上済みの11か月分', 'mul', [monthly.value, 11]);
    questions.push(
      journalQ({
        id: 'B13-005',
        topic: T,
        difficulty: 2,
        prompt: `会計期間は4月1日から3月31日まで。備品の減価償却費は、年間見積額 ${yen(yearly)} を12か月で割った額を毎月計上しており(月次決算)、4月から2月までの分は計上済みである。決算にあたり、3月分を同じように計上する。記帳は間接法による。`,
        choices: ['減価償却費', '備品減価償却累計額', '備品', '未払金', '前払費用', '損益'],
        debit: [line('減価償却費', monthly.value)],
        credit: [line('備品減価償却累計額', monthly.value)],
        calc: [monthly, eleven],
        explanation: `4月〜2月の11か月分(${yen(eleven.value)})は計上済み。決算で計上するのは、残りの3月の1か月分 ${yen(monthly.value)} だけ。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', yearly)], credit: [line('備品減価償却累計額', yearly)] },
            why: '11か月分はすでに毎月計上している。1年分をもう一度計上すると、費用が多すぎる。3月分だけ計上する。',
          },
          {
            entry: { debit: [line('減価償却費', monthly.value)], credit: [line('備品', monthly.value)] },
            why: '記帳は間接法。備品を直接減らさず、備品減価償却累計額を使う。',
          },
        ],
        ref: { topic: T, anchor: 'monthly' },
      }),
    );
  }

  // 6. 精算表①(売上原価と減価償却)
  {
    const beginStock = 50000;
    const endStock = 65000;
    const equip = 300000;
    const acc = 90000;
    const life = 10;
    const sales = 700000;
    const purchases = 480000;
    const dep = step('減価償却費(取得原価 ÷ 10年)', 'div', [equip, life]);
    const accEnd = step('累計額(試算表 + 減価償却費)', 'add', [acc, dep.value]);
    const s1 = step('仕入 + 期首商品', 'add', [purchases, beginStock]);
    const cogs = step('損益計算書の仕入(− 期末商品)', 'sub', [s1.value, endStock]);
    const wrongCogs = step('誤答: 期首と期末を逆にした仕入', 'add', [purchases, endStock]);
    const wrongCogs2 = step('誤答: 期首と期末を逆にした仕入(− 期首)', 'sub', [wrongCogs.value, beginStock]);
    questions.push(
      tableQ({
        id: 'B13-006',
        topic: T,
        difficulty: 2,
        prompt: `次の精算表(一部)の空欄を埋めなさい。決算整理: (1) 期末商品棚卸高は ${yen(endStock)}。売上原価は仕入の行で計算する。(2) 備品は定額法(残存価額ゼロ、耐用年数${life}年)で減価償却する(間接法)。何も書かない欄は空けたままにする。`,
        table: {
          title: '精算表(一部)',
          columns: WS_COLUMNS,
          rows: [
            wsRow('繰越商品', { 1: beginStock, 3: blankNum(endStock), 4: blankNum(beginStock), 7: blankNum(endStock) }),
            wsRow('備品', { 1: equip, 7: blankNum(equip) }),
            wsRow('備品減価償却累計額', { 2: acc, 4: blankNum(dep.value), 8: blankNum(accEnd.value) }),
            wsRow('売上', { 2: sales, 6: blankNum(sales) }),
            wsRow('仕入', { 1: purchases, 3: blankNum(beginStock), 4: blankNum(endStock), 5: blankNum(cogs.value) }),
            wsRow('減価償却費', { 3: blankNum(dep.value), 5: blankNum(dep.value) }),
          ],
        },
        checks: [
          { label: '繰越商品: 試算表 + 修正借方 − 修正貸方', op: 'add', args: [[0, 1], [0, 3], ['-', 0, 4]], result: [0, 7] },
          { label: '備品: 試算表のまま', op: 'add', args: [[1, 1], 0], result: [1, 7] },
          { label: '累計額: 試算表 + 修正貸方', op: 'add', args: [[2, 2], [2, 4]], result: [2, 8] },
          { label: '売上: 試算表のまま', op: 'add', args: [[3, 2], 0], result: [3, 6] },
          { label: '仕入: 試算表 + 修正借方 − 修正貸方', op: 'add', args: [[4, 1], [4, 3], ['-', 4, 4]], result: [4, 5] },
          { label: '減価償却費: 修正借方のまま', op: 'add', args: [[5, 3], 0], result: [5, 5] },
          { label: '期首商品は繰越商品の貸方と仕入の借方に同じ額', op: 'add', args: [[0, 4], 0], result: [4, 3] },
          { label: '期末商品は繰越商品の借方と仕入の貸方に同じ額', op: 'add', args: [[0, 3], 0], result: [4, 4] },
        ],
        calc: [dep, accEnd, s1, cogs],
        explanation: `売上原価の計算(仕入 / 繰越商品 ${yen(beginStock)}、繰越商品 / 仕入 ${yen(endStock)})で、仕入は ${yen(cogs.value)} になり損益計算書へ。繰越商品は期末の ${yen(endStock)} が貸借対照表へ。減価償却費 ${yen(dep.value)} は損益計算書へ、累計額は ${yen(accEnd.value)} が貸借対照表の貸方へ。`,
        mistakes: [
          {
            cell: [4, 5],
            value: wrongCogs2.value,
            calc: [wrongCogs, wrongCogs2],
            why: '期首と期末が逆。期首の在庫を仕入に足し、期末の在庫を仕入から引く。',
          },
          {
            cell: [2, 8],
            value: dep.value,
            why: '累計額は、試算表の残高に当期の減価償却費を足した額。当期の分だけではない。',
          },
        ],
        ref: { topic: T, anchor: 'worksheet' },
      }),
    );
  }

  // 7. 精算表②(当期純利益まで)
  {
    const cash = 210000;
    const ar = 400000;
    const ap = 230000;
    const allow = 3000;
    const capital = 300000;
    const sales = 650000;
    const salary = 573000;
    const rate = 2;
    const tbDr = step('試算表の借方合計', 'add', [cash, ar, salary]);
    const tbCr = step('試算表の貸方合計', 'add', [ap, allow, capital, sales]);
    const ax = step('売掛金 × 2', 'mul', [ar, rate]);
    const est = step('貸倒引当金の見積額(÷ 100)', 'div', [ax.value, 100]);
    const add = step('貸倒引当金繰入(見積額 − 残高)', 'sub', [est.value, allow]);
    const plDr = step('損益計算書の費用(給料 + 繰入)', 'add', [salary, add.value]);
    const ni = step('当期純利益(売上 − 費用)', 'sub', [sales, plDr.value]);
    const bsDr = step('貸借対照表の借方合計', 'add', [cash, ar]);
    const bsCr = step('貸借対照表の貸方合計(負債・純資産 + 当期純利益)', 'add', [ap, est.value, capital, ni.value]);
    const noAdj = step('誤答: 繰入を入れない当期純利益', 'sub', [sales, salary]);
    questions.push(
      tableQ({
        id: 'B13-007',
        topic: T,
        difficulty: 3,
        prompt: `次の精算表の空欄を埋めなさい。決算整理は、売掛金の期末残高に対して${rate}%の貸倒引当金を差額補充法で設定することだけである。何も書かない欄は空けたままにする。`,
        table: {
          title: '精算表',
          columns: WS_COLUMNS,
          rows: [
            wsRow('現金', { 1: cash, 7: blankNum(cash) }),
            wsRow('売掛金', { 1: ar, 7: blankNum(ar) }),
            wsRow('買掛金', { 2: ap, 8: blankNum(ap) }),
            wsRow('貸倒引当金', { 2: allow, 4: blankNum(add.value), 8: blankNum(est.value) }),
            wsRow('資本金', { 2: capital, 8: blankNum(capital) }),
            wsRow('売上', { 2: sales, 6: blankNum(sales) }),
            wsRow('給料', { 1: salary, 5: blankNum(salary) }),
            wsRow('貸倒引当金繰入', { 3: blankNum(add.value), 5: blankNum(add.value) }),
            wsRow('当期純利益', { 5: blankNum(ni.value), 8: blankNum(ni.value) }),
            wsRow('合計', {
              1: tbDr.value,
              2: tbCr.value,
              3: blankNum(add.value),
              4: blankNum(add.value),
              5: blankNum(sales),
              6: blankNum(sales),
              7: blankNum(bsDr.value),
              8: blankNum(bsCr.value),
            }),
          ],
        },
        checks: [
          { label: '貸倒引当金: 試算表 + 修正貸方', op: 'add', args: [[3, 2], [3, 4]], result: [3, 8] },
          { label: '修正記入の借方合計', op: 'add', args: [[7, 3], 0], result: [9, 3] },
          { label: '修正記入の貸方合計', op: 'add', args: [[3, 4], 0], result: [9, 4] },
          { label: '損益計算書の借方合計(費用 + 当期純利益)', op: 'add', args: [[6, 5], [7, 5], [8, 5]], result: [9, 5] },
          { label: '損益計算書の貸方合計', op: 'add', args: [[5, 6], 0], result: [9, 6] },
          { label: '損益計算書の貸借一致', op: 'add', args: [[9, 5], 0], result: [9, 6] },
          { label: '貸借対照表の借方合計', op: 'add', args: [[0, 7], [1, 7]], result: [9, 7] },
          { label: '貸借対照表の貸方合計', op: 'add', args: [[2, 8], [3, 8], [4, 8], [8, 8]], result: [9, 8] },
          { label: '貸借対照表の貸借一致', op: 'add', args: [[9, 7], 0], result: [9, 8] },
          { label: '当期純利益は損益計算書と貸借対照表で同じ', op: 'add', args: [[8, 5], 0], result: [8, 8] },
        ],
        calc: [tbDr, tbCr, ax, est, add, plDr, ni, bsDr, bsCr],
        explanation: `貸倒引当金の見積額は ${yen(est.value)} なので、繰入は ${yen(add.value)}。損益計算書の欄は、収益 ${yen(sales)} − 費用(給料 + 繰入)${yen(plDr.value)} = 当期純利益 ${yen(ni.value)}。当期純利益を損益計算書の借方と貸借対照表の貸方に書くと、どちらの欄も貸借が一致する。`,
        mistakes: [
          {
            cell: [8, 5],
            value: noAdj.value,
            calc: [noAdj],
            why: '決算整理で計上した貸倒引当金繰入も費用。損益計算書の欄に入れてから差額を出す。',
          },
          {
            cell: [3, 8],
            value: allow,
            why: '貸倒引当金は、修正記入の繰入分を足した見積額が貸借対照表に行く。',
          },
        ],
        ref: { topic: T, anchor: 'worksheet' },
      }),
    );
  }

  // 8. 決算整理後の仕入(数値)
  {
    const purchases = 1350000;
    const begin = 120000;
    const end = 135000;
    const s1 = step('試算表の仕入 + 期首商品', 'add', [purchases, begin]);
    const after = step('決算整理後の仕入(− 期末商品)', 'sub', [s1.value, end]);
    const rev1 = step('誤答: 期末を足した', 'add', [purchases, end]);
    const rev = step('誤答: 期首と期末が逆', 'sub', [rev1.value, begin]);
    questions.push(
      numericQ({
        id: 'B13-008',
        topic: T,
        difficulty: 2,
        prompt: `決算整理前残高試算表の仕入は ${yen(purchases)}、繰越商品は ${yen(begin)} だった。期末商品棚卸高は ${yen(end)} で、売上原価は仕入勘定で計算する。決算整理後残高試算表の仕入の金額はいくらか。`,
        answer: after.value,
        calc: [s1, after],
        explanation: '試算表の繰越商品は期首の在庫。仕入 + 期首商品 − 期末商品 が決算整理後の仕入(= 売上原価)。',
        mistakes: [
          { value: rev.value, calc: [rev1, rev], why: '期首と期末が逆。期首の在庫は仕入に足し、期末の在庫は仕入から引く。' },
          { value: purchases, why: '決算整理で、期首の在庫を足して期末の在庫を引く。試算表の金額のままではない。' },
        ],
        ref: { topic: T, anchor: 'after-tb' },
      }),
    );
  }

  // 9. 当期純利益(数値)
  {
    const sales = 1100000;
    const purchases = 760000;
    const begin = 80000;
    const end = 95000;
    const salary = 248000;
    const allowAdd = 6000;
    const dep = 50000;
    const c1 = step('仕入 + 期首商品', 'add', [purchases, begin]);
    const cogs = step('売上原価(− 期末商品)', 'sub', [c1.value, end]);
    const costs = step('費用の合計(売上原価 + 給料 + 繰入 + 減価償却費)', 'add', [cogs.value, salary, allowAdd, dep]);
    const ni = step('当期純利益(売上 − 費用)', 'sub', [sales, costs.value]);
    const noCogs = step('誤答: 売上原価の調整をしない', 'sub', [sales, purchases, salary, allowAdd, dep]);
    const noDep = step('誤答: 減価償却費を引かない', 'sub', [sales, cogs.value, salary, allowAdd]);
    questions.push(
      numericQ({
        id: 'B13-009',
        topic: T,
        difficulty: 3,
        prompt: `決算整理前残高試算表の売上は ${yen(sales)}、仕入は ${yen(purchases)}、給料は ${yen(salary)}、繰越商品は ${yen(begin)} だった(ほかに収益・費用はない)。決算整理は、(1) 期末商品棚卸高 ${yen(end)}(売上原価は仕入勘定で計算)、(2) 貸倒引当金繰入 ${yen(allowAdd)}、(3) 減価償却費 ${yen(dep)} である。当期純利益はいくらか。`,
        answer: ni.value,
        calc: [c1, cogs, costs, ni],
        explanation: `売上原価は ${yen(cogs.value)}(仕入 + 期首 − 期末)。費用の合計 ${yen(costs.value)} を売上から引いた ${yen(ni.value)} が当期純利益。`,
        mistakes: [
          { value: noCogs.value, calc: [noCogs], why: '仕入のままでは売上原価にならない。期首の在庫を足し、期末の在庫を引いてから費用にする。' },
          { value: noDep.value, calc: [c1, cogs, noDep], why: '決算整理で計上した減価償却費も費用。' },
        ],
        ref: { topic: T, anchor: 'worksheet' },
      }),
    );
  }

  // 10. 精算表の当期純利益を書く欄(選択)
  questions.push(
    choiceQ({
      id: 'B13-010',
      topic: T,
      difficulty: 1,
      prompt: '精算表で、当期純利益(利益が出た場合)を書く欄はどれか。',
      options: [
        '損益計算書の借方と、貸借対照表の貸方',
        '損益計算書の貸方と、貸借対照表の借方',
        '修正記入の借方と貸方',
        '損益計算書の借方だけ',
      ],
      answer: 0,
      explanation:
        '利益が出ると、損益計算書の欄は収益(貸方)のほうが多いので、差額を **借方** に書いて合わせる。同じ金額を貸借対照表の **貸方** に書くと(純資産が増える)、貸借対照表の欄も一致する。',
      mistakes: [
        { option: 1, why: 'これは当期純損失のときの書き方。利益なら損益計算書の借方、貸借対照表の貸方。' },
        { option: 2, why: '当期純利益は決算整理の仕訳ではないので、修正記入には書かない。' },
        { option: 3, why: '貸借対照表の貸方にも同じ金額を書かないと、貸借対照表の欄の貸借が一致しない。' },
      ],
      ref: { topic: T, anchor: 'worksheet' },
    }),
  );

  return { topic: T, questions };
}
