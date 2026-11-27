// B04 商品売買①三分法 の問題(10問)
// 仕訳5問・数値2問・表の穴埋め2問(商品有高帳: 先入先出法・移動平均法)・選択1問。金額はすべて step() で計算する。

import { blankNum, choiceQ, journalQ, line, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B04';

// 商品有高帳の列
const LEDGER_COLUMNS = [
  { label: '日付・摘要' },
  ...['受入', '払出', '残高'].flatMap((g) => [
    { label: `${g}数量`, align: 'right' },
    { label: `${g}単価`, align: 'right' },
    { label: `${g}金額`, align: 'right' },
  ]),
];
// 列番号
const C = { inQ: 1, inP: 2, inA: 3, outQ: 4, outP: 5, outA: 6, balQ: 7, balP: 8, balA: 9 };
const empty3 = [null, null, null];

export default function build() {
  const questions = [];

  // 1. 仕入と引取運賃
  {
    const price = 240000;
    const freight = 6000;
    const cost = step('仕入の金額(代金 + 引取運賃)', 'add', [price, freight]);
    questions.push(
      journalQ({
        id: 'B04-001',
        topic: T,
        difficulty: 1,
        prompt: `商品 ${yen(price)} を掛けで仕入れた。引取運賃 ${yen(freight)} は現金で支払った。`,
        choices: ['現金', '買掛金', '仕入', '発送費', '売上', '未払金'],
        debit: [line('仕入', cost.value)],
        credit: [line('買掛金', price), line('現金', freight)],
        calc: [cost],
        explanation: `仕入れるためにかかった運賃(引取運賃)は、商品の原価の一部なので **仕入に含める**(${yen(cost.value)})。代金は掛け(買掛金)、運賃は現金で払った。`,
        mistakes: [
          {
            entry: { debit: [line('仕入', price), line('発送費', freight)], credit: [line('買掛金', price), line('現金', freight)] },
            why: '発送費は、商品を売るときに当社が払う送料。仕入れるときの運賃は仕入に含める。',
          },
          {
            entry: { debit: [line('仕入', cost.value)], credit: [line('買掛金', cost.value)] },
            why: '運賃は現金で払っている。掛け(買掛金)になるのは商品の代金だけ。',
          },
        ],
        ref: { topic: T, anchor: 'buy-sell' },
      }),
    );
  }

  // 2. 送料込みの売上
  {
    const price = 180000;
    const ship = 3000;
    const total = step('売上の金額(商品代金 + 送料)', 'add', [price, ship]);
    questions.push(
      journalQ({
        id: 'B04-002',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(price)} を売り上げ、送料 ${yen(ship)} を加えた合計額を掛けとした。また、配送業者に送料 ${yen(ship)} を現金で支払った。`,
        choices: ['現金', '売掛金', '売上', '発送費', '仕入', '立替金'],
        debit: [line('売掛金', total.value), line('発送費', ship)],
        credit: [line('売上', total.value), line('現金', ship)],
        calc: [total],
        explanation: `送料も買い手から受け取るので、**送料込みの ${yen(total.value)} を売上**(と売掛金)にする。配送業者に払った送料は、当社の費用(**発送費**)。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', total.value)], credit: [line('売上', price), line('現金', ship)] },
            why: '送料も含めた額を請求したので、売上は送料込みの額。配送業者に払った送料は発送費(費用)として借方に書く。',
          },
          {
            entry: { debit: [line('売掛金', price), line('発送費', ship)], credit: [line('売上', price), line('現金', ship)] },
            why: `送料を加えた合計額を掛けにしたので、売掛金と売上は ${yen(total.value)}。`,
          },
        ],
        ref: { topic: T, anchor: 'buy-sell' },
      }),
    );
  }

  // 3. 仕入の返品
  {
    const amt = 12000;
    questions.push(
      journalQ({
        id: 'B04-003',
        topic: T,
        difficulty: 1,
        prompt: `先日、掛けで仕入れた商品のうち ${yen(amt)} が品違いだったため、仕入先に返品した。`,
        choices: ['現金', '買掛金', '売掛金', '仕入', '売上', '前払金'],
        debit: [line('買掛金', amt)],
        credit: [line('仕入', amt)],
        explanation: '返品は、仕入れたときの仕訳(仕入 / 買掛金)の **逆** を書いて取り消す。払っていない代金(買掛金)が減り、仕入も減る。',
        mistakes: [
          {
            entry: { debit: [line('仕入', amt)], credit: [line('買掛金', amt)] },
            why: '左右が逆です。これは仕入れたときの仕訳。返品は逆の仕訳(買掛金 / 仕入)。',
          },
          {
            entry: { debit: [line('現金', amt)], credit: [line('仕入', amt)] },
            why: '掛けで仕入れた商品の返品なので、現金は戻ってこない。まだ払っていない代金(買掛金)が減る。',
          },
        ],
        ref: { topic: T, anchor: 'returns' },
      }),
    );
  }

  // 4. 売上の返品
  {
    const amt = 9000;
    questions.push(
      journalQ({
        id: 'B04-004',
        topic: T,
        difficulty: 2,
        prompt: `先日、掛けで売り上げた商品のうち ${yen(amt)} が、品違いのため得意先から返品された。`,
        choices: ['現金', '売掛金', '買掛金', '売上', '仕入', '前受金'],
        debit: [line('売上', amt)],
        credit: [line('売掛金', amt)],
        explanation: '売り上げたときの仕訳(売掛金 / 売上)の **逆** を書いて取り消す。売上が減り、まだ受け取っていない代金(売掛金)も減る。',
        mistakes: [
          {
            entry: { debit: [line('仕入', amt)], credit: [line('売掛金', amt)] },
            why: '商品が戻ってきても、仕入れたわけではない。売上を取り消す。',
          },
          {
            entry: { debit: [line('売掛金', amt)], credit: [line('売上', amt)] },
            why: '左右が逆です。これは売り上げたときの仕訳。返品は逆の仕訳(売上 / 売掛金)。',
          },
        ],
        ref: { topic: T, anchor: 'returns' },
      }),
    );
  }

  // 5. 決算: 期末商品の振替
  {
    const begin = 45000;
    const end = 52000;
    questions.push(
      journalQ({
        id: 'B04-005',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、売上原価を仕入勘定で計算する。期首商品棚卸高は ${yen(begin)}、期末商品棚卸高は ${yen(end)} である。このうち、**期末商品** についての決算整理仕訳を答えなさい。`,
        choices: ['繰越商品', '仕入', '売上', '売上原価', '商品', '現金'],
        debit: [line('繰越商品', end)],
        credit: [line('仕入', end)],
        explanation: `売れ残った期末商品 ${yen(end)} は、仕入から差し引いて(貸方)、資産の **繰越商品** にする(借方)。期首商品の仕訳(仕入 / 繰越商品)とセットで「しーくりくりしー」。`,
        mistakes: [
          {
            entry: { debit: [line('仕入', end)], credit: [line('繰越商品', end)] },
            why: '左右が逆です。この形(仕入 / 繰越商品)は期首商品の仕訳。期末商品は仕入から差し引く。',
          },
          {
            entry: { debit: [line('繰越商品', end)], credit: [line('売上', end)] },
            why: '期末商品は売上ではなく、仕入(売上原価)から差し引く。',
          },
        ],
        ref: { topic: T, anchor: 'cogs' },
      }),
    );
  }

  // 6. 売上原価
  {
    const begin = 45000;
    const purchases = 620000;
    const end = 52000;
    const s1 = step('期首商品 + 当期仕入', 'add', [begin, purchases]);
    const cogs = step('売上原価(期首商品 + 当期仕入 − 期末商品)', 'sub', [s1.value, end]);
    const wrongAddEnd = step('誤答: 期末商品も足した', 'add', [begin, purchases, end]);
    const wrongNoBegin = step('誤答: 期首商品を忘れた', 'sub', [purchases, end]);
    questions.push(
      numericQ({
        id: 'B04-006',
        topic: T,
        difficulty: 2,
        prompt: `期首商品棚卸高 ${yen(begin)}、当期の商品仕入高 ${yen(purchases)}、期末商品棚卸高 ${yen(end)} のとき、売上原価はいくらか。`,
        answer: cogs.value,
        calc: [s1, cogs],
        explanation: '売上原価 = 期首商品 + 当期仕入 − 期末商品。売れ残った期末商品は、まだ売れていないので差し引く。',
        mistakes: [
          { value: wrongAddEnd.value, calc: [wrongAddEnd], why: '期末商品は売れ残り。足すのではなく差し引く。' },
          { value: wrongNoBegin.value, calc: [wrongNoBegin], why: '前期から残っていた期首商品も、当期に売れた分に含まれる。期首商品を足す。' },
          { value: purchases, why: '当期仕入をそのまま売上原価にしている。期首商品と期末商品で調整する。' },
        ],
        ref: { topic: T, anchor: 'cogs' },
      }),
    );
  }

  // 7. 売上総利益
  {
    const sales = 860000;
    const begin = 40000;
    const purchases = 590000;
    const end = 35000;
    const s1 = step('期首商品 + 当期仕入', 'add', [begin, purchases]);
    const cogs = step('売上原価', 'sub', [s1.value, end]);
    const gp = step('売上総利益(売上高 − 売上原価)', 'sub', [sales, cogs.value]);
    const wrongPurch = step('誤答: 売上高 − 当期仕入', 'sub', [sales, purchases]);
    const swapped = step('期末商品 + 当期仕入(期首と期末を逆にした)', 'add', [end, purchases]);
    const wrongSign = step('誤答: 期首と期末を逆にした売上原価', 'sub', [swapped.value, begin]);
    const wrongGp2 = step('誤答: 売上高 − 逆にした売上原価', 'sub', [sales, wrongSign.value]);
    questions.push(
      numericQ({
        id: 'B04-007',
        topic: T,
        difficulty: 3,
        prompt: `当期の売上高は ${yen(sales)} だった。期首商品棚卸高 ${yen(begin)}、当期の商品仕入高 ${yen(purchases)}、期末商品棚卸高 ${yen(end)} のとき、売上総利益はいくらか。`,
        answer: gp.value,
        calc: [s1, cogs, gp],
        explanation: `まず売上原価(期首 + 仕入 − 期末 = ${yen(cogs.value)})を出し、**売上高 − 売上原価** で売上総利益(粗利)を求める。`,
        mistakes: [
          { value: wrongPurch.value, calc: [wrongPurch], why: '当期仕入ではなく、売上原価(期首 + 仕入 − 期末)を引く。' },
          {
            value: wrongGp2.value,
            calc: [swapped, wrongSign, wrongGp2],
            why: '期首商品と期末商品を逆にしている。期首は足し、期末(売れ残り)は引く。',
          },
        ],
        ref: { topic: T, anchor: 'cogs-box' },
      }),
    );
  }

  // 8. 商品有高帳(先入先出法)
  {
    // 1日 前月繰越 20個@150、8日 仕入 30個@160、15日 売上 25個、22日 仕入 10個@170、28日 売上 30個
    const a = { q: 20, p: 150 };
    const b = { q: 30, p: 160 };
    const c = { q: 10, p: 170 };
    const sale1 = 25;
    const sale2 = 30;
    const amt = (label, q, p) => step(label, 'mul', [q, p]);
    const aA = amt('前月繰越の金額', a.q, a.p);
    const bA = amt('8日の仕入の金額', b.q, b.p);
    const cA = amt('22日の仕入の金額', c.q, c.p);
    // 15日: @150 の20個 → 残り5個を @160 から
    const out15b = step('15日に @160 から払い出す数量', 'sub', [sale1, a.q]);
    const out15aA = amt('15日の払出(@150)', a.q, a.p);
    const out15bA = amt('15日の払出(@160)', out15b.value, b.p);
    const bal15 = step('15日の残高数量(@160)', 'sub', [b.q, out15b.value]);
    const bal15A = amt('15日の残高金額', bal15.value, b.p);
    // 28日: @160 の残り全部 → 残りを @170 から
    const out28c = step('28日に @170 から払い出す数量', 'sub', [sale2, bal15.value]);
    const out28bA = amt('28日の払出(@160)', bal15.value, b.p);
    const out28cA = amt('28日の払出(@170)', out28c.value, c.p);
    const bal28 = step('28日の残高数量(@170)', 'sub', [c.q, out28c.value]);
    const bal28A = amt('28日の残高金額', bal28.value, c.p);
    const outTotal = step('払出金額の合計(= 売上原価)', 'add', [out15aA.value, out15bA.value, out28bA.value, out28cA.value]);
    const wrong15 = amt('誤答: 2行目の5個を @150 で計算', out15b.value, a.p);
    const wrong28 = amt('誤答: 残高を @160 で計算', bal28.value, b.p);

    const rows = [
      ['1日 前月繰越', a.q, a.p, aA.value, ...empty3, a.q, a.p, aA.value],
      ['8日 仕入', b.q, b.p, bA.value, ...empty3, a.q, a.p, aA.value],
      ['', ...empty3, ...empty3, b.q, b.p, bA.value],
      ['15日 売上', ...empty3, a.q, a.p, blankNum(out15aA.value), ...empty3],
      ['', ...empty3, blankNum(out15b.value), b.p, blankNum(out15bA.value), blankNum(bal15.value), b.p, blankNum(bal15A.value)],
      ['22日 仕入', c.q, c.p, cA.value, ...empty3, bal15.value, b.p, bal15A.value],
      ['', ...empty3, ...empty3, c.q, c.p, cA.value],
      ['28日 売上', ...empty3, bal15.value, b.p, blankNum(out28bA.value), ...empty3],
      ['', ...empty3, blankNum(out28c.value), c.p, blankNum(out28cA.value), bal28.value, c.p, blankNum(bal28A.value)],
      ['払出の合計', ...empty3, null, null, blankNum(outTotal.value), ...empty3],
    ];
    const R = { r15a: 3, r15b: 4, r28a: 7, r28b: 8, total: 9 };
    const mulCheck = (r, qc, pc, ac, label) => ({ label, op: 'mul', args: [[r, qc], [r, pc]], result: [r, ac] });

    questions.push(
      tableQ({
        id: 'B04-008',
        topic: T,
        difficulty: 2,
        prompt:
          '商品Aの商品有高帳(**先入先出法**)の空欄を埋めなさい。15日に25個、28日に30個を売り上げた。払出の行が2行に分かれているところは、単価ごとに分けて記入する。最後の行には、払出金額の合計(売上原価)を記入する。',
        table: { title: '商品有高帳(商品A・先入先出法)', columns: LEDGER_COLUMNS, rows },
        checks: [
          mulCheck(R.r15a, C.outQ, C.outP, C.outA, '15日 払出(1行目)'),
          mulCheck(R.r15b, C.outQ, C.outP, C.outA, '15日 払出(2行目)'),
          mulCheck(R.r15b, C.balQ, C.balP, C.balA, '15日 残高'),
          mulCheck(R.r28a, C.outQ, C.outP, C.outA, '28日 払出(1行目)'),
          mulCheck(R.r28b, C.outQ, C.outP, C.outA, '28日 払出(2行目)'),
          mulCheck(R.r28b, C.balQ, C.balP, C.balA, '28日 残高'),
          { label: '8日の @160 の残り = 仕入 − 15日の払出', op: 'sub', args: [[2, C.balQ], [R.r15b, C.outQ]], result: [R.r15b, C.balQ] },
          { label: '22日の @170 の残り = 仕入 − 28日の払出', op: 'sub', args: [[6, C.balQ], [R.r28b, C.outQ]], result: [R.r28b, C.balQ] },
          {
            label: '払出金額の合計',
            op: 'add',
            args: [R.r15a, R.r15b, R.r28a, R.r28b].map((r) => [r, C.outA]),
            result: [R.total, C.outA],
          },
        ],
        calc: [out15b, out15aA, out15bA, bal15, bal15A, out28c, out28bA, out28cA, bal28, bal28A, outTotal],
        explanation: `先入先出法では、先に仕入れた商品から払い出す。15日は @150 の${a.q}個を全部出し、足りない${out15b.value}個を @160 から出す。28日は @160 の残り${bal15.value}個を全部出し、足りない${out28c.value}個を @170 から出す。払出金額の合計 ${yen(outTotal.value)} が、この商品の売上原価。`,
        mistakes: [
          {
            cell: [R.r15b, C.outA],
            value: wrong15.value,
            calc: [wrong15],
            why: '@150 の商品は1行目で全部払い出し済み。2行目の5個は、次に仕入れた @160 で計算する。',
          },
          {
            cell: [R.r28b, C.balA],
            value: wrong28.value,
            calc: [wrong28],
            why: '@160 の商品は28日にすべて払い出したので、残っているのは最後に仕入れた @170 の商品。',
          },
        ],
        ref: { topic: T, anchor: 'inventory-book' },
      }),
    );
  }

  // 9. 商品有高帳(移動平均法)
  {
    // 1日 前月繰越 40個@300、6日 仕入 60個@350、14日 売上 50個、20日 仕入 50個@370、27日 売上 70個
    const q0 = 40;
    const p0 = 300;
    const q1 = 60;
    const p1 = 350;
    const sale1 = 50;
    const q3 = 50;
    const p3 = 370;
    const sale2 = 70;
    const a0 = step('前月繰越の金額', 'mul', [q0, p0]);
    const a1 = step('6日の仕入の金額', 'mul', [q1, p1]);
    const bal1A = step('6日の残高金額', 'add', [a0.value, a1.value]);
    const bal1Q = step('6日の残高数量', 'add', [q0, q1]);
    const avg1 = step('6日の平均単価(残高金額 ÷ 残高数量)', 'div', [bal1A.value, bal1Q.value]);
    const out2A = step('14日の払出金額', 'mul', [sale1, avg1.value]);
    const bal2Q = step('14日の残高数量', 'sub', [bal1Q.value, sale1]);
    const bal2A = step('14日の残高金額', 'sub', [bal1A.value, out2A.value]);
    const a3 = step('20日の仕入の金額', 'mul', [q3, p3]);
    const bal3Q = step('20日の残高数量', 'add', [bal2Q.value, q3]);
    const bal3A = step('20日の残高金額', 'add', [bal2A.value, a3.value]);
    const avg3 = step('20日の平均単価', 'div', [bal3A.value, bal3Q.value]);
    const out4A = step('27日の払出金額', 'mul', [sale2, avg3.value]);
    const bal4Q = step('27日の残高数量', 'sub', [bal3Q.value, sale2]);
    const bal4A = step('27日の残高金額', 'sub', [bal3A.value, out4A.value]);
    const outTotal = step('払出金額の合計(= 売上原価)', 'add', [out2A.value, out4A.value]);
    const wrongAvgSum = step('単価どうしの合計', 'add', [p0, p1]);
    const wrongAvg = step('誤答: 単価どうしの平均', 'div', [wrongAvgSum.value, 2]);
    const wrongOut4 = step('誤答: 最後の仕入単価で払い出した', 'mul', [sale2, p3]);

    const rows = [
      ['1日 前月繰越', q0, p0, a0.value, ...empty3, q0, p0, a0.value],
      ['6日 仕入', q1, p1, a1.value, ...empty3, bal1Q.value, blankNum(avg1.value), blankNum(bal1A.value)],
      ['14日 売上', ...empty3, sale1, blankNum(avg1.value), blankNum(out2A.value), bal2Q.value, avg1.value, blankNum(bal2A.value)],
      ['20日 仕入', q3, p3, a3.value, ...empty3, bal3Q.value, blankNum(avg3.value), blankNum(bal3A.value)],
      ['27日 売上', ...empty3, sale2, avg3.value, blankNum(out4A.value), bal4Q.value, avg3.value, blankNum(bal4A.value)],
      ['払出の合計', ...empty3, null, null, blankNum(outTotal.value), ...empty3],
    ];
    questions.push(
      tableQ({
        id: 'B04-009',
        topic: T,
        difficulty: 3,
        prompt:
          '商品Bの商品有高帳(**移動平均法**)の空欄を埋めなさい。14日に50個、27日に70個を売り上げた。最後の行には、払出金額の合計(売上原価)を記入する。',
        table: { title: '商品有高帳(商品B・移動平均法)', columns: LEDGER_COLUMNS, rows },
        checks: [
          { label: '6日の残高金額', op: 'add', args: [[0, C.balA], [1, C.inA]], result: [1, C.balA] },
          { label: '6日の平均単価', op: 'div', args: [[1, C.balA], [1, C.balQ]], result: [1, C.balP] },
          { label: '14日の払出金額', op: 'mul', args: [[2, C.outQ], [2, C.outP]], result: [2, C.outA] },
          { label: '14日の残高金額', op: 'sub', args: [[1, C.balA], [2, C.outA]], result: [2, C.balA] },
          { label: '20日の残高金額', op: 'add', args: [[2, C.balA], [3, C.inA]], result: [3, C.balA] },
          { label: '20日の平均単価', op: 'div', args: [[3, C.balA], [3, C.balQ]], result: [3, C.balP] },
          { label: '27日の払出金額', op: 'mul', args: [[4, C.outQ], [4, C.outP]], result: [4, C.outA] },
          { label: '27日の残高金額', op: 'sub', args: [[3, C.balA], [4, C.outA]], result: [4, C.balA] },
          { label: '27日の残高 = 数量 × 単価', op: 'mul', args: [[4, C.balQ], [4, C.balP]], result: [4, C.balA] },
          { label: '払出金額の合計', op: 'add', args: [[2, C.outA], [4, C.outA]], result: [5, C.outA] },
        ],
        calc: [a0, a1, bal1A, bal1Q, avg1, out2A, bal2Q, bal2A, a3, bal3Q, bal3A, avg3, out4A, bal4Q, bal4A, outTotal],
        explanation: `仕入れるたびに、**残高の金額 ÷ 残高の数量** で平均単価を計算し直す。6日は ${yen(bal1A.value)} ÷ ${bal1Q.value}個 = @${avg1.value}、20日は ${yen(bal3A.value)} ÷ ${bal3Q.value}個 = @${avg3.value}。売上の行は、そのときの平均単価で払い出す。払出金額の合計 ${yen(outTotal.value)} が売上原価。`,
        mistakes: [
          {
            cell: [1, C.balP],
            value: wrongAvg.value,
            calc: [wrongAvgSum, wrongAvg],
            why: '単価どうしの平均ではなく、残高の金額の合計 ÷ 残高の数量の合計で計算する(数量の多い仕入の単価ほど重く効く)。',
          },
          {
            cell: [4, C.outA],
            value: wrongOut4.value,
            calc: [wrongOut4],
            why: '移動平均法では、払い出すときの単価は最後の仕入単価ではなく、その時点の平均単価。',
          },
        ],
        ref: { topic: T, anchor: 'inventory-book' },
      }),
    );
  }

  // 10. 商品有高帳の単価
  questions.push(
    choiceQ({
      id: 'B04-010',
      topic: T,
      difficulty: 1,
      prompt: '商品有高帳で、商品を売り上げたときの払出欄の「単価」に書くのはどれか。',
      options: ['売った値段(売価)', '仕入れたときの値段(原価)', '定価', '売った値段と原価の差額'],
      answer: 1,
      explanation:
        '商品有高帳は、在庫の数量と **原価** を管理する帳簿。売り上げたときも、払い出した商品の原価(仕入単価)で書く。売った値段は売上帳に書く。',
      mistakes: [
        { option: 0, why: '売った値段は売上帳に書く。商品有高帳はすべて原価で書く。' },
        { option: 2, why: '定価は使わない。商品有高帳は仕入れたときの原価で書く。' },
        { option: 3, why: '差額(もうけ)は商品有高帳には書かない。払出は原価で書く。' },
      ],
      ref: { topic: T, anchor: 'inventory-book' },
    }),
  );

  return { topic: T, questions };
}
