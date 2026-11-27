// B05 商品売買②売上原価対立法 の問題(8問)
// 仕訳4問・選択1問・数値2問・表(三分法との比較、科目を選ぶ)1問。金額はすべて step() で計算する。

import { blankSelect, choiceQ, journalQ, line, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B05';
const METHOD = '商品売買は、販売のつど売上原価勘定に振り替える方法(売上原価対立法)で記帳している。';

export default function build() {
  const questions = [];

  // 1. 仕入
  {
    const amt = 85000;
    questions.push(
      journalQ({
        id: 'B05-001',
        topic: T,
        difficulty: 1,
        prompt: `${METHOD}商品 ${yen(amt)} を仕入れ、代金は掛けとした。`,
        choices: ['現金', '商品', '仕入', '売上原価', '繰越商品', '買掛金'],
        debit: [line('商品', amt)],
        credit: [line('買掛金', amt)],
        explanation: '売上原価対立法では、仕入れた商品を **商品(資産)** として記録する。三分法の「仕入」は使わない。',
        mistakes: [
          {
            entry: { debit: [line('仕入', amt)], credit: [line('買掛金', amt)] },
            why: 'これは三分法の仕訳。売上原価対立法では、仕入れたときは商品(資産)を増やす。',
          },
          {
            entry: { debit: [line('売上原価', amt)], credit: [line('買掛金', amt)] },
            why: '売上原価にするのは、売れたとき。仕入れた時点では、まだ在庫の商品(資産)。',
          },
        ],
        ref: { topic: T, anchor: 'purchase' },
      }),
    );
  }

  // 2. 売上(売価と原価の2行)
  {
    const price = 70000;
    const cost = 48000;
    questions.push(
      journalQ({
        id: 'B05-002',
        topic: T,
        difficulty: 2,
        prompt: `${METHOD}原価 ${yen(cost)} の商品を ${yen(price)} で売り上げ、代金は掛けとした。`,
        choices: ['売掛金', '売上', '売上原価', '商品', '仕入', '繰越商品'],
        debit: [line('売掛金', price), line('売上原価', cost)],
        credit: [line('売上', price), line('商品', cost)],
        explanation: `売価 ${yen(price)} で「売掛金 / 売上」、原価 ${yen(cost)} で「**売上原価 / 商品**」の2行を書く。売れた商品の原価を、資産(商品)から費用(売上原価)へ移す。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', price)], credit: [line('売上', price)] },
            why: '売上原価対立法では、売るたびに原価も振り替える。「売上原価 / 商品」が抜けている。',
          },
          {
            entry: { debit: [line('売掛金', price), line('売上原価', price)], credit: [line('売上', price), line('商品', price)] },
            why: `売上原価と商品は原価(${yen(cost)})で書く。売価で書くと、もうけが消えてしまう。`,
          },
        ],
        ref: { topic: T, anchor: 'sale' },
      }),
    );
  }

  // 3. 売上の返品
  {
    const price = 15000;
    const cost = 10000;
    questions.push(
      journalQ({
        id: 'B05-003',
        topic: T,
        difficulty: 2,
        prompt: `${METHOD}先日掛けで売り上げた商品のうち、売価 ${yen(price)}(原価 ${yen(cost)})が品違いのため返品された。`,
        choices: ['売掛金', '売上', '売上原価', '商品', '仕入', '買掛金'],
        debit: [line('売上', price), line('商品', cost)],
        credit: [line('売掛金', price), line('売上原価', cost)],
        explanation: `売価 ${yen(price)} で売上を取り消し(売上 / 売掛金)、原価 ${yen(cost)} で売上原価を取り消して在庫に戻す(**商品 / 売上原価**)。`,
        mistakes: [
          {
            entry: { debit: [line('売上', price)], credit: [line('売掛金', price)] },
            why: '商品が戻ってきたので、原価の分も取り消す。「商品 / 売上原価」が抜けている。',
          },
          {
            entry: { debit: [line('売上', price), line('商品', price)], credit: [line('売掛金', price), line('売上原価', price)] },
            why: `商品と売上原価は原価(${yen(cost)})で戻す。売価で戻すと、在庫が多くなりすぎる。`,
          },
        ],
        ref: { topic: T, anchor: 'returns' },
      }),
    );
  }

  // 4. 仕入の返品
  {
    const amt = 7000;
    questions.push(
      journalQ({
        id: 'B05-004',
        topic: T,
        difficulty: 1,
        prompt: `${METHOD}先日掛けで仕入れた商品のうち ${yen(amt)} を、品違いのため仕入先に返品した。`,
        choices: ['商品', '仕入', '売上原価', '買掛金', '売掛金', '現金'],
        debit: [line('買掛金', amt)],
        credit: [line('商品', amt)],
        explanation: '仕入れたときの「商品 / 買掛金」の逆を書く。在庫(**商品**)が減り、まだ払っていない代金(買掛金)も減る。',
        mistakes: [
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('仕入', amt)] },
            why: 'これは三分法の返品。売上原価対立法では、仕入れた商品は商品勘定にあるので、商品を減らす。',
          },
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('売上原価', amt)] },
            why: 'まだ売れていない商品の返品なので、売上原価ではなく商品を減らす。',
          },
        ],
        ref: { topic: T, anchor: 'returns' },
      }),
    );
  }

  // 5. 決算で必要な仕訳
  questions.push(
    choiceQ({
      id: 'B05-005',
      topic: T,
      difficulty: 2,
      prompt: `${METHOD}決算で、売上原価を計算するために必要な仕訳はどれか。`,
      options: [
        '「仕入 / 繰越商品」と「繰越商品 / 仕入」',
        '期末の在庫の分の「売上原価 / 商品」',
        '期末の在庫の分の「商品 / 売上原価」',
        '売上原価を計算するための仕訳はいらない',
      ],
      answer: 3,
      explanation:
        '売るたびに原価を売上原価に振り替えているので、決算の時点で **売上原価勘定はすでに売上原価、商品勘定はすでに期末の在庫** になっている。だから決算で計算する仕訳はいらない。',
      mistakes: [
        { option: 0, why: 'これは三分法の決算整理(しーくりくりしー)。売上原価対立法では使わない。' },
        { option: 1, why: '期末の在庫はまだ売れていないので、売上原価にはしない。商品のまま残す。' },
        { option: 2, why: '売上原価勘定には売れた分の原価だけが入っているので、在庫の分を戻す必要はない。' },
      ],
      ref: { topic: T, anchor: 'compare' },
    }),
  );

  // 6. 売上原価勘定の残高
  {
    const sales = [120000, 85000, 64000];
    const returned = 9000;
    const total = step('売れた商品の原価の合計', 'add', sales);
    const net = step('売上原価の残高(合計 − 返品の原価)', 'sub', [total.value, returned]);
    const wrongAdd = step('誤答: 返品の原価を足した', 'add', [total.value, returned]);
    questions.push(
      numericQ({
        id: 'B05-006',
        topic: T,
        difficulty: 2,
        prompt: `${METHOD}当期に売り上げた商品の原価は、${sales.map(yen).join('、')} だった。また、売り上げた商品のうち原価 ${yen(returned)} の分が返品された。期末の売上原価勘定の残高はいくらか。`,
        answer: net.value,
        calc: [total, net],
        explanation: `売るたびに原価を売上原価に振り替えている(合計 ${yen(total.value)})。返品された分は「商品 / 売上原価」で取り消すので差し引く。`,
        mistakes: [
          { value: total.value, calc: [total], why: '返品された分は売上原価を取り消している(商品 / 売上原価)。差し引く。' },
          { value: wrongAdd.value, calc: [total, wrongAdd], why: '返品は売上原価を減らす取引。足すのではなく引く。' },
        ],
        ref: { topic: T, anchor: 't-accounts' },
      }),
    );
  }

  // 7. 期末の商品勘定の残高
  {
    const begin = 30000;
    const purchases = 250000;
    const purchaseReturn = 5000;
    const cost = 210000;
    const salesReturnCost = 4000;
    const s1 = step('期首 + 仕入', 'add', [begin, purchases]);
    const s2 = step('− 仕入の返品', 'sub', [s1.value, purchaseReturn]);
    const s3 = step('− 売れた商品の原価', 'sub', [s2.value, cost]);
    const end = step('+ 返品で戻ってきた商品の原価(= 商品の残高)', 'add', [s3.value, salesReturnCost]);
    const noReturns = step('誤答: 返品を無視', 'sub', [s1.value, cost]);
    const wrongSign = step('誤答: 戻ってきた商品を引いた', 'sub', [s3.value, salesReturnCost]);
    questions.push(
      numericQ({
        id: 'B05-007',
        topic: T,
        difficulty: 3,
        prompt: `${METHOD}期首の商品は ${yen(begin)}。当期に商品 ${yen(purchases)} を仕入れ、そのうち ${yen(purchaseReturn)} を仕入先に返品した。売り上げた商品の原価は ${yen(cost)} で、そのうち原価 ${yen(salesReturnCost)} の分が得意先から返品された。期末の商品勘定の残高はいくらか。`,
        answer: end.value,
        calc: [s1, s2, s3, end],
        explanation:
          '商品勘定は、仕入れると増え(借方)、仕入先への返品で減り、売れると原価で減り(売上原価へ)、得意先からの返品で原価分が戻る(増える)。残高はそのまま期末の在庫になる。',
        mistakes: [
          { value: noReturns.value, calc: [noReturns], why: '2つの返品も商品勘定を動かす。仕入の返品は減らし、得意先からの返品は戻す(増やす)。' },
          { value: wrongSign.value, calc: [s1, s2, s3, wrongSign], why: '得意先から返品された商品は手元に戻ってくるので、商品は増える。' },
        ],
        ref: { topic: T, anchor: 't-accounts' },
      }),
    );
  }

  // 8. 三分法との比較(科目を選ぶ表)
  {
    const A = ['仕入', '商品', '繰越商品', '売上原価', '買掛金', '(仕訳なし)'];
    const sel = (ans) => blankSelect(A, ans);
    questions.push(
      tableQ({
        id: 'B05-008',
        topic: T,
        difficulty: 2,
        prompt:
          '次の場面で、三分法と売上原価対立法では、それぞれどの科目で仕訳するか。空欄に当てはまる科目を選びなさい。仕訳をしない場合は「(仕訳なし)」を選ぶ。',
        table: {
          title: '三分法と売上原価対立法の比較',
          columns: [
            { label: '場面' },
            { label: '三分法 借方' },
            { label: '三分法 貸方' },
            { label: '対立法 借方' },
            { label: '対立法 貸方' },
          ],
          rows: [
            ['商品を掛けで仕入れた', '仕入', '買掛金', sel('商品'), sel('買掛金')],
            ['売れた商品の原価について', sel('(仕訳なし)'), sel('(仕訳なし)'), sel('売上原価'), sel('商品')],
            ['決算: 期末の在庫について', sel('繰越商品'), sel('仕入'), sel('(仕訳なし)'), sel('(仕訳なし)')],
          ],
        },
        explanation:
          '三分法は「仕入」で記録して決算でまとめて売上原価を計算する(期末の在庫は 繰越商品 / 仕入)。売上原価対立法は「商品」で記録して、売るたびに「売上原価 / 商品」を書くので、決算での計算はいらない。',
        mistakes: [
          { cell: [0, 3], value: '仕入', why: '売上原価対立法では、仕入れたときは商品(資産)を増やす。' },
          { cell: [2, 1], value: '仕入', why: '期末の在庫は、仕入から差し引いて繰越商品にする(繰越商品 / 仕入)。借方は繰越商品。' },
          { cell: [1, 3], value: '商品', why: '売れた商品の原価は、商品(貸方)から売上原価(借方)へ移す。左右が逆。' },
        ],
        ref: { topic: T, anchor: 'compare' },
      }),
    );
  }

  return { topic: T, questions };
}
