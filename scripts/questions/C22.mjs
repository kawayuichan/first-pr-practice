// C22 財務諸表の作成 の問題(10問)
// 数値5問・選択2問・表2問(報告式の損益計算書・貸借対照表の表示科目)・複数選択1問。金額はすべて step() で計算する。
// 報告式の損益計算書(段階利益)、損益の区分、区分表示の貸借対照表(表示科目・流動と固定・1年基準)。

import { blankNum, blankSelect, choiceQ, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C22';

export default function build() {
  const questions = [];

  // 1. 売上原価(報告式で表示する額)
  {
    const begin = 280000;
    const purchases = 3500000;
    const end = 320000;
    const loss = 12000;
    const val = 8000;
    const a = step('期首商品 + 当期仕入', 'add', [begin, purchases]);
    const b = step('− 期末商品', 'sub', [a.value, end]);
    const ans = step('売上原価(+ 棚卸減耗損 + 商品評価損)', 'add', [b.value, loss, val]);
    questions.push(
      numericQ({
        id: 'C22-001',
        topic: T,
        difficulty: 2,
        prompt: `期首商品棚卸高 ${yen(begin)}、当期商品仕入高 ${yen(purchases)}、期末商品棚卸高(帳簿)${yen(end)}。棚卸減耗損 ${yen(loss)} と商品評価損 ${yen(val)} は売上原価に含める。損益計算書の売上原価はいくらか。`,
        answer: ans.value,
        calc: [a, b, ans],
        explanation: `${yen(begin)} + ${yen(purchases)} − ${yen(end)} = ${yen(b.value)} に、売上原価に含める棚卸減耗損と商品評価損を加えて ${yen(ans.value)}。`,
        mistakes: [{ value: b.value, calc: [a, b], why: '「売上原価に含める」指示があるので、棚卸減耗損と商品評価損も加える。' }],
        ref: { topic: T, anchor: 'pl' },
      }),
    );
  }

  // 2. 経常利益(区分を判断する)
  {
    const gp = 1500000;
    const it = { 給料: 600000, 減価償却費: 120000, 貸倒引当金繰入: 10000, 支払利息: 30000, 受取配当金: 15000, 有価証券評価益: 25000, 固定資産売却益: 50000, 火災損失: 40000 };
    const sga = step('販売費及び一般管理費(給料 + 減価償却費 + 繰入)', 'add', [it.給料, it.減価償却費, it.貸倒引当金繰入]);
    const op = step('営業利益(売上総利益 − 販管費)', 'sub', [gp, sga.value]);
    const nonOpIn = step('営業外収益(受取配当金 + 有価証券評価益)', 'add', [it.受取配当金, it.有価証券評価益]);
    const o1 = step('営業利益 + 営業外収益', 'add', [op.value, nonOpIn.value]);
    const ord = step('経常利益(− 営業外費用の支払利息)', 'sub', [o1.value, it.支払利息]);
    const w1 = step('誤答: 経常利益 + 固定資産売却益', 'add', [ord.value, it.固定資産売却益]);
    const wrong = step('誤答: − 火災損失(特別損益まで入れた額)', 'sub', [w1.value, it.火災損失]);
    questions.push(
      numericQ({
        id: 'C22-002',
        topic: T,
        difficulty: 2,
        prompt: `売上総利益は ${yen(gp)}。ほかの決算整理後の金額は、給料 ${yen(it.給料)}、減価償却費 ${yen(it.減価償却費)}、貸倒引当金繰入(売掛金の分)${yen(it.貸倒引当金繰入)}、支払利息 ${yen(it.支払利息)}、受取配当金 ${yen(it.受取配当金)}、有価証券評価益 ${yen(it.有価証券評価益)}、固定資産売却益 ${yen(it.固定資産売却益)}、火災損失 ${yen(it.火災損失)}。経常利益はいくらか。`,
        answer: ord.value,
        calc: [sga, op, nonOpIn, o1, ord],
        explanation: `営業利益 = ${yen(gp)} − 販管費 ${yen(sga.value)} = ${yen(op.value)}。営業外収益 ${yen(nonOpIn.value)} を足し、営業外費用(支払利息)を引いて ${yen(ord.value)}。固定資産売却益と火災損失は特別損益なので入れない。`,
        mistakes: [{ value: wrong.value, calc: [w1, wrong], why: '固定資産売却益・火災損失は特別利益・特別損失。経常利益には入れない。' }],
        ref: { topic: T, anchor: 'pl-sections' },
      }),
    );
  }

  // 3. 当期純利益(法人税等調整額)
  {
    const pre = 800000;
    const tax = 260000;
    const adj = 20000;
    const t = step('税金の費用(法人税等 − 法人税等調整額の貸方残高)', 'sub', [tax, adj]);
    const ni = step('当期純利益(税引前 − 税金の費用)', 'sub', [pre, t.value]);
    const wt = step('誤答: 法人税等 + 法人税等調整額', 'add', [tax, adj]);
    const wrong = step('誤答: 税引前 − その合計', 'sub', [pre, wt.value]);
    questions.push(
      numericQ({
        id: 'C22-003',
        topic: T,
        difficulty: 2,
        prompt: `税引前当期純利益は ${yen(pre)}、法人税、住民税及び事業税は ${yen(tax)}、法人税等調整額は貸方残高 ${yen(adj)} である。当期純利益はいくらか。`,
        answer: ni.value,
        calc: [t, ni],
        explanation: `法人税等調整額の貸方残高は、税金の費用を減らす。${yen(tax)} − ${yen(adj)} = ${yen(t.value)} を税引前当期純利益から引いて ${yen(ni.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wt, wrong], why: '法人税等調整額が貸方残高なら、税金の費用から差し引く(足さない)。' }],
        ref: { topic: T, anchor: 'pl' },
      }),
    );
  }

  // 4〜5. 損益の区分(選択)
  const PL_SECTIONS = ['販売費及び一般管理費', '営業外収益', '営業外費用', '特別利益', '特別損失'];
  questions.push(
    choiceQ({
      id: 'C22-004',
      topic: T,
      difficulty: 1,
      prompt: '備品を売却して生じた固定資産売却益は、報告式の損益計算書のどの区分に表示するか。',
      options: PL_SECTIONS,
      answer: 3,
      explanation: '固定資産の売却は、毎期くり返す本業や財務の取引ではない、臨時の取引。**特別利益** に表示する。',
      mistakes: [
        { option: 0, why: '販売費及び一般管理費は費用の区分。売却益は収益。' },
        { option: 1, why: '営業外収益は、受取利息・受取配当金など毎期くり返し生じる収益。固定資産の売却は臨時なので特別利益。' },
        { option: 2, why: '売却益は収益。費用の区分には入れない。' },
        { option: 4, why: '売却損なら特別損失。売却益は特別利益。' },
      ],
      ref: { topic: T, anchor: 'pl-sections' },
    }),
  );
  questions.push(
    choiceQ({
      id: 'C22-005',
      topic: T,
      difficulty: 2,
      prompt: '取引先への貸付金に対して設定した貸倒引当金の繰入額は、報告式の損益計算書のどの区分に表示するか。',
      options: PL_SECTIONS,
      answer: 2,
      explanation: '貸付金は営業の取引から生じた債権ではない(営業外債権)。その貸倒引当金繰入は **営業外費用**。',
      mistakes: [
        { option: 0, why: '販売費及び一般管理費にするのは、売掛金など営業の債権に対する繰入。' },
        { option: 1, why: '繰入額は費用。収益の区分には入れない。' },
        { option: 3, why: '繰入額は費用。収益の区分には入れない。' },
        { option: 4, why: '貸倒引当金の繰入は毎期の決算で行うもので、臨時の損失ではない。' },
      ],
      ref: { topic: T, anchor: 'pl-sections' },
    }),
  );

  // 6. 貸借対照表の表示科目(表)
  {
    const NAMES = ['商品', '繰越商品', '有価証券', '売買目的有価証券', '投資有価証券', '前払費用', '長期前払費用', '未払費用'];
    const n = (a) => blankSelect(NAMES, a);
    questions.push(
      tableQ({
        id: 'C22-006',
        topic: T,
        format: 'q3_statements',
        difficulty: 2,
        prompt: '次の勘定科目を貸借対照表に書くときの表示科目を選びなさい。決算日は3月31日。',
        table: {
          title: '表示科目',
          columns: [{ label: '勘定科目' }, { label: '表示科目' }],
          rows: [
            ['繰越商品', n('商品')],
            ['売買目的有価証券', n('有価証券')],
            ['満期保有目的債券(満期は3年後)', n('投資有価証券')],
            ['前払保険料(翌期分)', n('前払費用')],
            ['前払保険料(翌々期以降の分)', n('長期前払費用')],
            ['未払利息', n('未払費用')],
          ],
        },
        explanation: '繰越商品は **商品**、売買目的有価証券は **有価証券**(流動資産)、満期保有目的債券は **投資有価証券**(固定資産の投資その他の資産)。前払保険料は、決算日の翌日から1年以内の分が前払費用(流動資産)、1年を超える分が長期前払費用(固定資産)。未払利息は未払費用(流動負債)。',
        mistakes: [
          { cell: [0, 1], value: '繰越商品', why: '貸借対照表では、繰越商品は「商品」と表示する。' },
          { cell: [4, 1], value: '前払費用', why: '決算日の翌日から1年を超える分は、1年基準で長期前払費用(固定資産)。' },
        ],
        ref: { topic: T, anchor: 'display' },
      }),
    );
  }

  // 7. 流動資産の合計(1年基準)
  {
    const it = { 現金預金: 420000, 売掛金: 600000, 貸倒引当金: 12000, 商品: 300000, 有価証券: 150000, 前払費用: 30000, 貸付金: 400000, 長期分: 300000 };
    const arNet = step('売掛金 − 貸倒引当金', 'sub', [it.売掛金, it.貸倒引当金]);
    const shortLoan = step('短期貸付金(貸付金 − 2年後に返済される分)', 'sub', [it.貸付金, it.長期分]);
    const total = step('流動資産の合計', 'add', [it.現金預金, arNet.value, it.商品, it.有価証券, it.前払費用, shortLoan.value]);
    const wrong = step('誤答: 貸付金を全部入れた合計', 'add', [it.現金預金, arNet.value, it.商品, it.有価証券, it.前払費用, it.貸付金]);
    questions.push(
      numericQ({
        id: 'C22-007',
        topic: T,
        difficulty: 3,
        prompt: `決算整理後の金額は、現金預金 ${yen(it.現金預金)}、売掛金 ${yen(it.売掛金)}、貸倒引当金 ${yen(it.貸倒引当金)}、商品 ${yen(it.商品)}、有価証券(売買目的)${yen(it.有価証券)}、前払費用 ${yen(it.前払費用)}、貸付金 ${yen(it.貸付金)}(このうち ${yen(it.長期分)} は決算日の2年後に返済される)。貸借対照表の流動資産の合計はいくらか。`,
        answer: total.value,
        calc: [arNet, shortLoan, total],
        explanation: `売掛金は貸倒引当金を引いて ${yen(arNet.value)}。貸付金のうち2年後に返済される ${yen(it.長期分)} は、1年基準で固定資産(長期貸付金)。流動資産は短期貸付金 ${yen(shortLoan.value)} だけを入れて ${yen(total.value)}。`,
        mistakes: [{ value: wrong.value, calc: [arNet, wrong], why: '決算日の翌日から1年を超えて返済される貸付金は、固定資産(長期貸付金)。' }],
        ref: { topic: T, anchor: 'bs' },
      }),
    );
  }

  // 8. 長期前払費用(1年基準)
  {
    const paid = 360000;
    const years = 3;
    const perYear = step('1年分(支払額 ÷ 3年)', 'div', [paid, years]);
    const left = step('決算日に残る前払分(支払額 − 当期分)', 'sub', [paid, perYear.value]);
    const long = step('長期前払費用(残り − 翌期分)', 'sub', [left.value, perYear.value]);
    questions.push(
      numericQ({
        id: 'C22-008',
        topic: T,
        difficulty: 2,
        prompt: `当期首(4月1日)に、3年分の保険料 ${yen(paid)} を支払い、全額を保険料で処理した。決算日(3月31日)に前払分を繰り延べ、貸借対照表では1年基準で表示する。長期前払費用の金額はいくらか。`,
        answer: long.value,
        calc: [perYear, left, long],
        explanation: `1年分は ${yen(perYear.value)}。決算日に残る前払分 ${yen(left.value)} のうち、翌期分 ${yen(perYear.value)} は前払費用(流動)、それより後の分 ${yen(long.value)} が長期前払費用(固定資産)。`,
        mistakes: [{ value: left.value, calc: [perYear, left], why: '翌期(決算日の翌日から1年以内)の分は前払費用(流動資産)。長期前払費用は1年を超える分だけ。' }],
        ref: { topic: T, anchor: 'display' },
      }),
    );
  }

  // 9. 報告式の損益計算書(表)
  {
    const v = { sales: 4800000, cogs: 3360000, sga: 900000, nIn: 45000, nOut: 35000, sIn: 30000, sOut: 50000, tax: 159000 };
    const gp = step('売上総利益(売上高 − 売上原価)', 'sub', [v.sales, v.cogs]);
    const op = step('営業利益(売上総利益 − 販管費)', 'sub', [gp.value, v.sga]);
    const o1 = step('営業利益 + 営業外収益', 'add', [op.value, v.nIn]);
    const ord = step('経常利益(− 営業外費用)', 'sub', [o1.value, v.nOut]);
    const p1 = step('経常利益 + 特別利益', 'add', [ord.value, v.sIn]);
    const pre = step('税引前当期純利益(− 特別損失)', 'sub', [p1.value, v.sOut]);
    const ni = step('当期純利益(− 法人税等)', 'sub', [pre.value, v.tax]);
    const wo1 = step('誤答: 営業利益 + 営業外収益 + 特別利益', 'add', [op.value, v.nIn, v.sIn]);
    const wOrd = step('誤答: − 営業外費用 − 特別損失(特別損益を入れた経常利益)', 'sub', [wo1.value, v.nOut, v.sOut]);
    questions.push(
      tableQ({
        id: 'C22-009',
        topic: T,
        format: 'q3_statements',
        difficulty: 2,
        prompt: '次の報告式の損益計算書の空欄(段階ごとの利益)を埋めなさい。',
        table: {
          title: '損益計算書',
          columns: [{ label: '項目' }, { label: '金額', align: 'right' }],
          rows: [
            ['Ⅰ 売上高', v.sales],
            ['Ⅱ 売上原価', v.cogs],
            ['売上総利益', blankNum(gp.value)],
            ['Ⅲ 販売費及び一般管理費', v.sga],
            ['営業利益', blankNum(op.value)],
            ['Ⅳ 営業外収益', v.nIn],
            ['Ⅴ 営業外費用', v.nOut],
            ['経常利益', blankNum(ord.value)],
            ['Ⅵ 特別利益', v.sIn],
            ['Ⅶ 特別損失', v.sOut],
            ['税引前当期純利益', blankNum(pre.value)],
            ['法人税、住民税及び事業税', v.tax],
            ['当期純利益', blankNum(ni.value)],
          ],
        },
        checks: [
          { label: '売上総利益 = 売上高 − 売上原価', op: 'add', args: [[0, 1], ['-', 1, 1]], result: [2, 1] },
          { label: '営業利益 = 売上総利益 − 販管費', op: 'add', args: [[2, 1], ['-', 3, 1]], result: [4, 1] },
          { label: '経常利益 = 営業利益 + 営業外収益 − 営業外費用', op: 'add', args: [[4, 1], [5, 1], ['-', 6, 1]], result: [7, 1] },
          { label: '税引前当期純利益 = 経常利益 + 特別利益 − 特別損失', op: 'add', args: [[7, 1], [8, 1], ['-', 9, 1]], result: [10, 1] },
          { label: '当期純利益 = 税引前当期純利益 − 法人税等', op: 'add', args: [[10, 1], ['-', 11, 1]], result: [12, 1] },
        ],
        calc: [gp, op, o1, ord, p1, pre, ni],
        explanation: `売上総利益 ${yen(gp.value)} → 営業利益 ${yen(op.value)} → 経常利益 ${yen(ord.value)}(営業外まで)→ 税引前当期純利益 ${yen(pre.value)}(特別損益まで)→ 当期純利益 ${yen(ni.value)}。`,
        mistakes: [
          {
            cell: [7, 1],
            value: wOrd.value,
            calc: [wo1, wOrd],
            why: '経常利益は、営業利益に営業外収益・営業外費用を加減したもの。特別利益・特別損失は経常利益のあとで加減する。',
          },
        ],
        ref: { topic: T, anchor: 'pl' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C22-010',
      topic: T,
      difficulty: 2,
      prompt: '財務諸表の作成について、正しいものをすべて選びなさい。',
      options: [
        '売掛金や買掛金は、回収・支払いの期日が1年を超えても、正常営業循環基準で流動資産・流動負債にする',
        '経常利益は、営業利益に特別利益と特別損失を加減したものである',
        'その他有価証券は、貸借対照表では投資有価証券として固定資産に表示する',
        '貸倒引当金は、貸借対照表の負債の部に表示する',
        'その他有価証券評価差額金は、純資産の部の評価・換算差額等に表示する',
      ],
      answer: [0, 2, 4],
      explanation: '経常利益は営業利益に営業外収益・営業外費用を加減したもの。貸倒引当金は、売掛金などから差し引く形で資産の部に表示する。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '特別利益・特別損失は、経常利益のあとで加減する。' },
        { options: [0, 2, 3, 4], why: '貸倒引当金は負債ではない。資産(売掛金など)から差し引いて表示する。' },
        { options: [0, 2], why: 'その他有価証券評価差額金は、株主資本ではなく評価・換算差額等。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'bs' },
    }),
  );

  return { topic: T, questions };
}
