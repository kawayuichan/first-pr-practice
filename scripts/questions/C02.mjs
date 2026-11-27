// C02 貸倒引当金(2級) の問題(10問)
// 仕訳4問・数値3問・選択1問・表1問(区分ごとの繰入額)・複数選択1問。金額はすべて step() で計算する。
// 決めたこと: 個別評価は「債権額 × 指示された率」の簡単な形だけ(財務内容評価法など担保を差し引く計算は1級)。
// 営業債権の繰入は販売費及び一般管理費、営業外債権の繰入は営業外費用。

import { blankNum, choiceQ, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C02';
const CHOICES = ['貸倒引当金繰入', '貸倒引当金', '貸倒損失', '貸倒引当金戻入', '売掛金', '貸付金'];

/** 金額 × 率(%) */
function rateSteps(label, amount, pct) {
  const x = step(`${label}: 金額 × ${pct}`, 'mul', [amount, pct]);
  const v = step(`${label}(÷ 100)`, 'div', [x.value, 100]);
  return [x, v];
}

export default function build() {
  const questions = [];

  // 1. 個別評価
  {
    const amt = 300000;
    const pct = 40;
    const [x, est] = rateSteps('個別評価の額', amt, pct);
    questions.push(
      journalQ({
        id: 'C02-001',
        topic: T,
        difficulty: 1,
        prompt: `得意先B社の経営状態が悪化したため、同社に対する売掛金 ${yen(amt)} について、${pct}%の貸倒引当金を個別に設定する。B社に対する貸倒引当金の残高はない。`,
        choices: CHOICES,
        debit: [line('貸倒引当金繰入', est.value)],
        credit: [line('貸倒引当金', est.value)],
        calc: [x, est],
        explanation: `個別評価は、その債権の金額 × 指示された率。${yen(amt)} × ${pct}% = ${yen(est.value)} を繰り入れる。まだ貸倒れていないので、売掛金は減らさない。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金繰入', amt)], credit: [line('貸倒引当金', amt)] },
            why: `全額ではなく、指示された ${pct}% の分だけ設定する。`,
          },
          {
            entry: { debit: [line('貸倒損失', est.value)], credit: [line('売掛金', est.value)] },
            why: 'まだ貸倒れていない。回収できないかもしれない分を、貸倒引当金として見積もる。',
          },
        ],
        ref: { topic: T, anchor: 'individual' },
      }),
    );
  }

  // 2. 個別評価 + 一括評価
  {
    const total = 1500000;
    const target = 250000;
    const indPct = 50;
    const colPct = 2;
    const bal = 18000;
    const [ix, ind] = rateSteps('個別評価(C社)', target, indPct);
    const rest = step('一括評価の対象(売掛金 − C社)', 'sub', [total, target]);
    const [cx, col] = rateSteps('一括評価', rest.value, colPct);
    const est = step('見積額の合計(個別 + 一括)', 'add', [ind.value, col.value]);
    const add = step('繰入額(見積額 − 残高)', 'sub', [est.value, bal]);
    const [wx, wrongCol] = rateSteps('誤答: 売掛金全体に一括評価', total, colPct);
    const wrongEst = step('誤答: 見積額(C社を二重に含む)', 'add', [ind.value, wrongCol.value]);
    const wrongAdd = step('誤答: 繰入額(C社を二重に含む)', 'sub', [wrongEst.value, bal]);
    questions.push(
      journalQ({
        id: 'C02-002',
        topic: T,
        difficulty: 3,
        prompt: `決算にあたり、売掛金の期末残高 ${yen(total)} に対して貸倒引当金を設定する。このうち得意先C社に対する ${yen(target)} は${indPct}%で個別評価し、残りは${colPct}%で一括評価する。貸倒引当金の残高は ${yen(bal)} で、差額補充法による。`,
        choices: CHOICES,
        debit: [line('貸倒引当金繰入', add.value)],
        credit: [line('貸倒引当金', add.value)],
        calc: [ix, ind, rest, cx, col, est, add],
        explanation: `個別評価 ${yen(ind.value)} + 一括評価(C社を除いた ${yen(rest.value)} × ${colPct}%)${yen(col.value)} = 見積額 ${yen(est.value)}。残高 ${yen(bal)} との差額を繰り入れる。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金繰入', wrongAdd.value)], credit: [line('貸倒引当金', wrongAdd.value)] },
            why: '一括評価の対象からC社の売掛金を除く。C社には個別評価で引当金をかけているので、二重になる。',
          },
          {
            entry: { debit: [line('貸倒引当金繰入', est.value)], credit: [line('貸倒引当金', est.value)] },
            why: `差額補充法なので、残高 ${yen(bal)} を引いた差額だけ繰り入れる。`,
          },
        ],
        ref: { topic: T, anchor: 'combined' },
      }),
    );
  }

  // 3. 見積額の合計(数値)
  {
    const ar = 900000;
    const target = 100000;
    const indPct = 30;
    const denshi = 400000;
    const colPct = 1;
    const [ix, ind] = rateSteps('個別評価(D社)', target, indPct);
    const rest = step('売掛金 + 電子記録債権', 'add', [ar, denshi]);
    const restNet = step('一括評価の対象(− D社の売掛金)', 'sub', [rest.value, target]);
    const [cx, col] = rateSteps('一括評価', restNet.value, colPct);
    const est = step('見積額の合計', 'add', [ind.value, col.value]);
    const [wx, wrongCol] = rateSteps('誤答: D社も含めて一括評価', rest.value, colPct);
    const wrongEst = step('誤答: 見積額(D社を二重に含む)', 'add', [ind.value, wrongCol.value]);
    questions.push(
      numericQ({
        id: 'C02-003',
        topic: T,
        difficulty: 2,
        prompt: `期末の売掛金は ${yen(ar)}(このうち得意先D社に対する ${yen(target)} は${indPct}%で個別評価する)、電子記録債権は ${yen(denshi)} である。D社以外の売掛金と電子記録債権には、${colPct}%で一括評価する。貸倒引当金の見積額の合計はいくらか。`,
        answer: est.value,
        calc: [ix, ind, rest, restNet, cx, col, est],
        explanation: `個別評価 ${yen(ind.value)}。一括評価の対象は、売掛金と電子記録債権の合計からD社の分を除いた ${yen(restNet.value)} で、その${colPct}%が ${yen(col.value)}。`,
        mistakes: [
          { value: wrongEst.value, calc: [ix, ind, rest, wx, wrongCol, wrongEst], why: '一括評価の対象からD社の売掛金を除く。個別評価した債権に二重に引当金をかけない。' },
          { value: ind.value, calc: [ix, ind], why: '個別評価の分だけでなく、残りの債権に対する一括評価の分も合計する。' },
        ],
        ref: { topic: T, anchor: 'combined' },
      }),
    );
  }

  // 4. 営業外債権(貸付金)
  {
    const loan = 600000;
    const pct = 2;
    const [x, est] = rateSteps('貸付金の見積額', loan, pct);
    questions.push(
      journalQ({
        id: 'C02-004',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、取引先に対する貸付金 ${yen(loan)} について、${pct}%の貸倒引当金を設定する。貸付金に対する貸倒引当金の残高はない。`,
        choices: CHOICES,
        debit: [line('貸倒引当金繰入', est.value)],
        credit: [line('貸倒引当金', est.value)],
        calc: [x, est],
        explanation: `仕訳の科目は売掛金のときと同じ「貸倒引当金繰入 / 貸倒引当金」。ただし貸付金は **営業外債権** なので、この繰入額 ${yen(est.value)} は損益計算書の **営業外費用** に表示する。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒損失', est.value)], credit: [line('貸付金', est.value)] },
            why: 'まだ貸倒れていない。見積もった分を貸倒引当金として設定する。',
          },
          {
            entry: { debit: [line('貸倒引当金繰入', loan)], credit: [line('貸倒引当金', loan)] },
            why: `全額ではなく、${pct}% の分だけ設定する。`,
          },
        ],
        ref: { topic: T, anchor: 'nonoperating' },
      }),
    );
  }

  // 5. 表示の区分(選択)
  questions.push(
    choiceQ({
      id: 'C02-005',
      topic: T,
      difficulty: 1,
      prompt: '取引先に対する貸付金について計上した貸倒引当金繰入は、損益計算書のどの区分に表示するか。',
      options: ['売上原価', '販売費及び一般管理費', '営業外費用', '特別損失'],
      answer: 2,
      explanation: '貸付金は本業の商品売買から生じた債権ではない **営業外債権** なので、その繰入は **営業外費用**。売掛金などの営業債権に対する繰入は販売費及び一般管理費。',
      mistakes: [
        { option: 1, why: '販売費及び一般管理費に表示するのは、売掛金などの営業債権に対する繰入。貸付金は営業外債権。' },
        { option: 0, why: '貸倒引当金繰入は、商品の原価ではないので売上原価には入れない。' },
        { option: 3, why: '特別損失は、めったに起きない臨時の損失。毎期の貸倒引当金の繰入はあてはまらない。' },
      ],
      ref: { topic: T, anchor: 'pl' },
    }),
  );

  // 6. 区分ごとの繰入額(表)
  {
    const target = 300000;
    const indPct = 50;
    const arRest = 1700000;
    const colPct = 2;
    const loan = 800000;
    const loanPct = 1;
    const balOp = 20000;
    const [ix, ind] = rateSteps('E社の個別評価', target, indPct);
    const [cx, col] = rateSteps('その他の売掛金の一括評価', arRest, colPct);
    const [lx, loanEst] = rateSteps('貸付金の一括評価', loan, loanPct);
    const opSum = step('営業債権の見積額(個別 + 一括)', 'add', [ind.value, col.value]);
    const op = step('販売費及び一般管理費の繰入額(見積額 − 営業債権の残高)', 'sub', [opSum.value, balOp]);
    const wrongOp = step('誤答: 貸付金の分も販売費及び一般管理費に入れた', 'add', [op.value, loanEst.value]);
    questions.push(
      tableQ({
        id: 'C02-006',
        topic: T,
        difficulty: 3,
        prompt: `決算にあたり、次のとおり貸倒引当金を設定する(差額補充法)。(1) 得意先E社に対する売掛金 ${yen(target)} は${indPct}%で個別評価する。(2) E社以外の売掛金 ${yen(arRest)} は${colPct}%で一括評価する。(3) 貸付金 ${yen(loan)} は${loanPct}%で一括評価する。貸倒引当金の残高 ${yen(balOp)} は、すべて売掛金に対するもの。空欄に金額を入れなさい。`,
        table: {
          title: '貸倒引当金の見積額と繰入額',
          columns: [{ label: '項目' }, { label: '金額', align: 'right' }],
          rows: [
            ['E社の売掛金(個別評価)', blankNum(ind.value)],
            ['その他の売掛金(一括評価)', blankNum(col.value)],
            ['貸付金(一括評価)', blankNum(loanEst.value)],
            ['販売費及び一般管理費に表示する繰入額', blankNum(op.value)],
            ['営業外費用に表示する繰入額', blankNum(loanEst.value)],
          ],
        },
        checks: [
          { label: '販売費及び一般管理費 = 売掛金の見積額 − 売掛金の残高', op: 'add', args: [[0, 1], [1, 1], -balOp], result: [3, 1] },
          { label: '営業外費用 = 貸付金の見積額(貸付金の残高はない)', op: 'add', args: [[2, 1], 0], result: [4, 1] },
        ],
        calc: [ix, ind, cx, col, lx, loanEst, opSum, op],
        explanation: `売掛金(営業債権)の見積額は ${yen(opSum.value)} で、残高 ${yen(balOp)} を引いた ${yen(op.value)} が販売費及び一般管理費。貸付金(営業外債権)の ${yen(loanEst.value)} は残高がないので全額が営業外費用。`,
        mistakes: [
          {
            cell: [3, 1],
            value: wrongOp.value,
            calc: [opSum, op, wrongOp],
            why: '貸付金は営業外債権。その繰入は販売費及び一般管理費ではなく営業外費用に表示する。',
          },
          {
            cell: [3, 1],
            value: opSum.value,
            calc: [opSum],
            why: `差額補充法なので、売掛金に対する残高 ${yen(balOp)} を引く。`,
          },
        ],
        ref: { topic: T, anchor: 'pl' },
      }),
    );
  }

  // 7. 個別評価した債権の貸倒れ
  {
    const ar = 240000;
    const allow = 120000;
    const loss = step('貸倒損失(売掛金 − 引当金)', 'sub', [ar, allow]);
    questions.push(
      journalQ({
        id: 'C02-007',
        topic: T,
        difficulty: 2,
        prompt: `前期に、得意先F社に対する売掛金 ${yen(ar)} について貸倒引当金 ${yen(allow)} を個別に設定していた(貸倒引当金の残高はこの分だけ)。当期、F社が倒産し、この売掛金が回収できなくなった。`,
        choices: CHOICES,
        debit: [line('貸倒引当金', allow), line('貸倒損失', loss.value)],
        credit: [line('売掛金', ar)],
        calc: [loss],
        explanation: `前期の債権なので、設定していた貸倒引当金 ${yen(allow)} を取り崩す。足りない ${yen(loss.value)} は **貸倒損失**。3級(B08)と同じ考え方。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金', ar)], credit: [line('売掛金', ar)] },
            why: `貸倒引当金は ${yen(allow)} しかない。残高より多くは取り崩せないので、足りない分は貸倒損失。`,
          },
          {
            entry: { debit: [line('貸倒損失', ar)], credit: [line('売掛金', ar)] },
            why: '前期に設定した貸倒引当金があるので、まずそれを取り崩す。',
          },
        ],
        ref: { topic: T, anchor: 'writeoff' },
      }),
    );
  }

  // 8. 販売費及び一般管理費の繰入額(数値)
  {
    const ar = 2400000;
    const target = 400000;
    const indPct = 50;
    const colPct = 3;
    const balOp = 35000;
    const loan = 500000;
    const loanPct = 2;
    const [ix, ind] = rateSteps('個別評価(G社)', target, indPct);
    const rest = step('一括評価の対象(売掛金 − G社)', 'sub', [ar, target]);
    const [cx, col] = rateSteps('一括評価', rest.value, colPct);
    const opSum = step('売掛金の見積額', 'add', [ind.value, col.value]);
    const op = step('販売費及び一般管理費の繰入額(− 売掛金の残高)', 'sub', [opSum.value, balOp]);
    const [lx, loanEst] = rateSteps('誤答用: 貸付金の見積額', loan, loanPct);
    const wrong = step('誤答: 貸付金の分も足した', 'add', [op.value, loanEst.value]);
    questions.push(
      numericQ({
        id: 'C02-008',
        topic: T,
        difficulty: 3,
        prompt: `期末の売掛金は ${yen(ar)} で、このうち得意先G社に対する ${yen(target)} は${indPct}%で個別評価し、残りは${colPct}%で一括評価する。貸付金 ${yen(loan)} には${loanPct}%の貸倒引当金を設定する。貸倒引当金の残高 ${yen(balOp)} はすべて売掛金に対するもの(差額補充法)。損益計算書の販売費及び一般管理費に表示する貸倒引当金繰入はいくらか。`,
        answer: op.value,
        calc: [ix, ind, rest, cx, col, opSum, op],
        explanation: `販売費及び一般管理費に入るのは、売掛金(営業債権)の分だけ。見積額 ${yen(opSum.value)} − 残高 ${yen(balOp)}。貸付金の分は営業外費用。`,
        mistakes: [
          { value: wrong.value, calc: [lx, loanEst, wrong], why: '貸付金の繰入は営業外費用。販売費及び一般管理費には含めない。' },
          { value: opSum.value, calc: [ix, ind, rest, cx, col, opSum], why: `差額補充法なので、売掛金に対する残高 ${yen(balOp)} を引く。` },
        ],
        ref: { topic: T, anchor: 'pl' },
      }),
    );
  }

  // 9. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C02-009',
      topic: T,
      difficulty: 2,
      prompt: '貸倒引当金について、正しいものをすべて選びなさい。',
      options: [
        '一括評価の対象からは、個別評価した債権を除く',
        '貸付金に対する貸倒引当金繰入は、営業外費用に表示する',
        '個別評価した債権には、さらに一括評価の率もかける',
        '未収入金は営業債権なので、その繰入は販売費及び一般管理費に表示する',
        '電子記録債権は営業債権である',
      ],
      answer: [0, 1, 4],
      explanation:
        '個別評価した債権は一括評価の対象から除く(二重にかけない)。貸付金・未収入金は営業外債権で、その繰入は営業外費用。売掛金・電子記録債権は営業債権。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '個別評価した債権に一括評価の率もかけると、引当金が二重になる。' },
        { options: [0, 1, 3, 4], why: '未収入金は商品以外の代金(B07)なので営業外債権。その繰入は営業外費用。' },
        { options: [0, 1], why: '電子記録債権は、売掛金を電子的に記録したもの(B06)なので営業債権。' },
      ],
      ref: { topic: T, anchor: 'pl' },
    }),
  );

  // 10. 営業外費用の繰入額(数値)
  {
    const loan = 1200000;
    const pct = 2;
    const bal = 9000;
    const [x, est] = rateSteps('貸付金の見積額', loan, pct);
    const add = step('営業外費用の繰入額(見積額 − 貸付金の残高)', 'sub', [est.value, bal]);
    questions.push(
      numericQ({
        id: 'C02-010',
        topic: T,
        difficulty: 2,
        prompt: `期末の貸付金 ${yen(loan)} に対して、${pct}%の貸倒引当金を設定する(差額補充法)。貸付金に対する貸倒引当金の残高は ${yen(bal)} である。損益計算書の営業外費用に表示する貸倒引当金繰入はいくらか。`,
        answer: add.value,
        calc: [x, est, add],
        explanation: `見積額 ${yen(est.value)} から、貸付金に対する残高 ${yen(bal)} を引いた差額を繰り入れる。貸付金の分なので営業外費用。`,
        mistakes: [{ value: est.value, calc: [x, est], why: `差額補充法なので、残高 ${yen(bal)} を引く。` }],
        ref: { topic: T, anchor: 'nonoperating' },
      }),
    );
  }

  return { topic: T, questions };
}
