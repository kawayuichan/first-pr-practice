// K01 工業簿記の基礎 の問題(10問)
// 仕訳5問・表2問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 工業簿記の科目(材料・賃金・給料・製造間接費・製品など)は「公式表外」の補助リスト(data/accounts_supplement.json)。

import { blankNum, blankSelect, choiceQ, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'K01';

export default function build() {
  const questions = [];

  // 1. 非原価項目(選択)
  questions.push(
    choiceQ({
      id: 'K01-001',
      topic: T,
      difficulty: 1,
      prompt: '次のうち、製品の原価に含めないもの(非原価項目)はどれか。',
      options: ['工場の電力料', '工場の機械の減価償却費', '借入金の支払利息', '間接工の賃金'],
      answer: 2,
      explanation: '支払利息は、お金を借りたことによる費用で、製品を作ることとは関係がない(**非原価項目**)。ほかは工場で製品を作るための原価(製造間接費)。',
      mistakes: [
        { option: 0, why: '工場の電力料は、製品を作るための間接経費(製造間接費)。' },
        { option: 1, why: '工場の機械の減価償却費は、製品を作るための間接経費。' },
        { option: 3, why: '間接工の賃金は、製品を作るための間接労務費。' },
      ],
      ref: { topic: T, anchor: 'non-cost' },
    }),
  );

  // 2. 原価の分類(表)
  {
    const K = ['直接材料費', '間接材料費', '直接労務費', '間接労務費', '直接経費', '間接経費'];
    const sel = (a) => blankSelect(K, a);
    questions.push(
      tableQ({
        id: 'K01-002',
        topic: T,
        difficulty: 2,
        prompt: '次の原価は、どの分類になるか。表の空欄に入る分類を選びなさい。',
        table: {
          title: '原価の分類',
          columns: [{ label: '原価' }, { label: '分類' }],
          rows: [
            ['製品の本体になる主要材料', sel('直接材料費')],
            ['工場で使う接着剤などの補助材料', sel('間接材料費')],
            ['直接工が製品を作った時間の賃金', sel('直接労務費')],
            ['工場の事務員の給料', sel('間接労務費')],
            ['特定の製品の加工を外部に頼んだ外注加工賃', sel('直接経費')],
            ['工場の電力料', sel('間接経費')],
          ],
        },
        explanation: 'どの製品にかかったかがはっきりわかれば **直接費**、わからなければ **間接費**。外注加工賃は特定の製品の加工なので直接経費、工場の事務員の給料は間接労務費。',
        mistakes: [
          { cell: [4, 1], value: '間接経費', why: '外注加工賃は、特定の製品の加工にかかった額がわかるので直接経費。' },
          { cell: [3, 1], value: '直接労務費', why: '工場の事務員は製品を直接作らないので、給料は間接労務費。' },
        ],
        ref: { topic: T, anchor: 'classes' },
      }),
    );
  }

  // 3. 材料の消費
  {
    const direct = 480000;
    const indirect = 70000;
    const total = step('材料の消費額(直接 + 間接)', 'add', [direct, indirect]);
    questions.push(
      journalQ({
        id: 'K01-003',
        topic: T,
        difficulty: 1,
        prompt: `材料 ${yen(total.value)} を消費した。このうち直接材料費は ${yen(direct)}、間接材料費は ${yen(indirect)} である。`,
        choices: ['仕掛品', '製造間接費', '材料', '製品', '売上原価', '買掛金'],
        debit: [line('仕掛品', direct), line('製造間接費', indirect)],
        credit: [line('材料', total.value)],
        calc: [total],
        explanation: '直接材料費は製品に直接入れるので **仕掛品**、間接材料費はいったん **製造間接費** に集める。',
        mistakes: [
          {
            entry: { debit: [line('仕掛品', total.value)], credit: [line('材料', total.value)] },
            why: '間接材料費は、仕掛品ではなく製造間接費に集める(あとで配賦する)。',
          },
          {
            entry: { debit: [line('製品', direct), line('製造間接費', indirect)], credit: [line('材料', total.value)] },
            why: '製造中のものは製品ではなく仕掛品。製品になるのは完成したとき。',
          },
        ],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 4. 賃金の消費
  {
    const direct = 360000;
    const indirect = 140000;
    const total = step('賃金の消費額(直接 + 間接)', 'add', [direct, indirect]);
    questions.push(
      journalQ({
        id: 'K01-004',
        topic: T,
        difficulty: 1,
        prompt: `賃金 ${yen(total.value)} を消費した。このうち直接労務費は ${yen(direct)}、間接労務費は ${yen(indirect)} である。`,
        choices: ['仕掛品', '製造間接費', '賃金・給料', '製品', '未払賃金', '普通預金'],
        debit: [line('仕掛品', direct), line('製造間接費', indirect)],
        credit: [line('賃金・給料', total.value)],
        calc: [total],
        explanation: '直接労務費は **仕掛品**、間接労務費は **製造間接費**。消費した賃金は賃金・給料勘定の貸方から振り替える。',
        mistakes: [
          {
            entry: { debit: [line('仕掛品', direct), line('製造間接費', indirect)], credit: [line('普通預金', total.value)] },
            why: '支払ったのではなく、消費した(製品に使った)仕訳。賃金・給料勘定から振り替える。',
          },
        ],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 5. 製造間接費の配賦
  {
    const amt = 320000;
    questions.push(
      journalQ({
        id: 'K01-005',
        topic: T,
        difficulty: 1,
        prompt: `製造間接費 ${yen(amt)} を、製品に配賦した。`,
        choices: ['仕掛品', '製造間接費', '製品', '売上原価', '材料', '賃金・給料'],
        debit: [line('仕掛品', amt)],
        credit: [line('製造間接費', amt)],
        explanation: '集めた製造間接費を製品に配る(配賦)と、製造中の製品の原価になるので **仕掛品** へ振り替える。',
        mistakes: [
          {
            entry: { debit: [line('製品', amt)], credit: [line('製造間接費', amt)] },
            why: '配賦先は、製造中の製品(仕掛品)。完成した製品ではない。',
          },
        ],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 6. 完成
  {
    const amt = 1150000;
    questions.push(
      journalQ({
        id: 'K01-006',
        topic: T,
        difficulty: 1,
        prompt: `製品が完成した。完成品の製造原価は ${yen(amt)} である。`,
        choices: ['製品', '仕掛品', '売上原価', '製造間接費', '材料', '売上'],
        debit: [line('製品', amt)],
        credit: [line('仕掛品', amt)],
        explanation: '完成したら、製造中(仕掛品)から完成品(**製品**)へ振り替える。',
        mistakes: [
          {
            entry: { debit: [line('売上原価', amt)], credit: [line('仕掛品', amt)] },
            why: '売上原価にするのは、製品が売れたとき。完成しただけなら製品。',
          },
        ],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 7. 販売(売上原価)
  {
    const price = 900000;
    const cost = 630000;
    questions.push(
      journalQ({
        id: 'K01-007',
        topic: T,
        difficulty: 1,
        prompt: `製品(製造原価 ${yen(cost)})を ${yen(price)} で売り、代金は掛けとした。売上原価への振替もあわせて行う。`,
        choices: ['売掛金', '売上', '売上原価', '製品', '仕掛品', '仕入'],
        debit: [line('売掛金', price), line('売上原価', cost)],
        credit: [line('売上', price), line('製品', cost)],
        explanation: `売上を計上するとともに、売れた製品の原価 ${yen(cost)} を製品から **売上原価** に振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', price)], credit: [line('売上', price)] },
            why: '売れた製品の原価(売上原価 / 製品)も振り替える。',
          },
          {
            entry: { debit: [line('売掛金', price), line('売上原価', cost)], credit: [line('売上', price), line('仕掛品', cost)] },
            why: '売れたのは完成した製品。減らすのは製品勘定。',
          },
        ],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 8. 当期製品製造原価(数値)
  {
    const mat = 560000;
    const lab = 430000;
    const exp = 210000;
    const begin = 80000;
    const end = 120000;
    const total = step('当期総製造費用(材料費 + 労務費 + 経費)', 'add', [mat, lab, exp]);
    const plus = step('期首仕掛品 + 当期総製造費用', 'add', [begin, total.value]);
    const cogm = step('当期製品製造原価(− 期末仕掛品)', 'sub', [plus.value, end]);
    const wrong = step('誤答: 期首と期末を逆にした額', 'add', [total.value, end]);
    const wrong2 = step('誤答: 期首と期末を逆にした額(− 期首仕掛品)', 'sub', [wrong.value, begin]);
    questions.push(
      numericQ({
        id: 'K01-008',
        topic: T,
        difficulty: 2,
        prompt: `当月の材料費は ${yen(mat)}、労務費は ${yen(lab)}、経費は ${yen(exp)} だった。月初仕掛品は ${yen(begin)}、月末仕掛品は ${yen(end)} である。当月の製品製造原価はいくらか。`,
        answer: cogm.value,
        calc: [total, plus, cogm],
        explanation: `当月総製造費用 ${yen(total.value)} に月初仕掛品を足し、月末仕掛品を引く。${yen(begin)} + ${yen(total.value)} − ${yen(end)} = ${yen(cogm.value)}。`,
        mistakes: [{ value: wrong2.value, calc: [wrong, wrong2], why: '月初仕掛品は足し、月末仕掛品は引く。逆にしない。' }],
        ref: { topic: T, anchor: 'report' },
      }),
    );
  }

  // 9. 製造原価報告書(表)
  {
    const mat = 500000;
    const lab = 380000;
    const exp = 170000;
    const begin = 60000;
    const end = 90000;
    const total = step('当期総製造費用', 'add', [mat, lab, exp]);
    const sum = step('合計(期首仕掛品 + 当期総製造費用)', 'add', [begin, total.value]);
    const cogm = step('当期製品製造原価(合計 − 期末仕掛品)', 'sub', [sum.value, end]);
    questions.push(
      tableQ({
        id: 'K01-009',
        topic: T,
        difficulty: 2,
        prompt: '次の製造原価報告書の空欄に金額を入れなさい。',
        table: {
          title: '製造原価報告書',
          columns: [{ label: '項目' }, { label: '金額', align: 'right' }],
          rows: [
            ['材料費', mat],
            ['労務費', lab],
            ['経費', exp],
            ['当期総製造費用', blankNum(total.value)],
            ['期首仕掛品棚卸高', begin],
            ['合計', blankNum(sum.value)],
            ['期末仕掛品棚卸高', end],
            ['当期製品製造原価', blankNum(cogm.value)],
          ],
        },
        checks: [
          { label: '当期総製造費用', op: 'add', args: [[0, 1], [1, 1], [2, 1]], result: [3, 1] },
          { label: '合計', op: 'add', args: [[3, 1], [4, 1]], result: [5, 1] },
          { label: '当期製品製造原価', op: 'sub', args: [[5, 1], [6, 1]], result: [7, 1] },
        ],
        calc: [total, sum, cogm],
        explanation: `材料費・労務費・経費の合計が当期総製造費用 ${yen(total.value)}。期首仕掛品を足して ${yen(sum.value)}、期末仕掛品を引いて当期製品製造原価 ${yen(cogm.value)}。`,
        mistakes: [{ cell: [7, 1], value: total.value, why: '当期総製造費用に、期首仕掛品を足して期末仕掛品を引いたものが当期製品製造原価。' }],
        ref: { topic: T, anchor: 'report' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K01-010',
      topic: T,
      difficulty: 2,
      prompt: '工業簿記の基礎について、正しいものをすべて選びなさい。',
      options: [
        '間接材料費は、製造間接費勘定に集めてから製品に配賦する',
        '支払利息は、製造間接費として製品の原価に含める',
        '製品が完成したら、仕掛品勘定から製品勘定に振り替える',
        '本社の事務員の給料は、製造原価の間接労務費である',
        '当期製品製造原価は、期首仕掛品 + 当期総製造費用 − 期末仕掛品で求める',
      ],
      answer: [0, 2, 4],
      explanation: '支払利息は非原価項目。本社の事務員の給料は一般管理費で、製造原価ではない(工場の事務員なら間接労務費)。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '支払利息は、製品を作ることと関係のない非原価項目。' },
        { options: [0, 2, 3, 4], why: '本社の事務員の給料は一般管理費。製造原価に入るのは工場の事務員の給料。' },
        { options: [0, 4], why: '完成したら、仕掛品から製品へ振り替える。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'flow-chart' },
    }),
  );

  return { topic: T, questions };
}
