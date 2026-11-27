// C17 税金(2級)の問題(10問)
// 仕訳6問・数値2問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 課税所得の算定(損金不算入・益金不算入)、中間納付の払いすぎ、追徴・還付、消費税の未収還付。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C17';
const HOJINZEI = '法人税、住民税及び事業税';

export default function build() {
  const questions = [];

  // 1. 課税所得と法人税等(数値)
  {
    const profit = 2400000;
    const dep = 120000;
    const ent = 80000;
    const pct = 30;
    const income = step('課税所得(税引前当期純利益 + 損金不算入)', 'add', [profit, dep, ent]);
    const t1 = step('課税所得 × 30', 'mul', [income.value, pct]);
    const tax = step('法人税等(÷ 100)', 'div', [t1.value, 100]);
    const w1 = step('誤答: 税引前当期純利益 × 30', 'mul', [profit, pct]);
    const wrong = step('誤答: 税引前当期純利益に税率をかけた額', 'div', [w1.value, 100]);
    questions.push(
      numericQ({
        id: 'C17-001',
        topic: T,
        difficulty: 2,
        prompt: `当期の税引前当期純利益は ${yen(profit)}。このうち、減価償却費 ${yen(dep)} と交際費 ${yen(ent)} は、税法では損金と認められない(損金不算入)。法人税等の税率を${pct}%として、当期の法人税等はいくらか。`,
        answer: tax.value,
        calc: [income, t1, tax],
        explanation: `損金不算入の額は課税所得に **加算** する。課税所得 ${yen(income.value)} × ${pct}% = ${yen(tax.value)}。`,
        mistakes: [{ value: wrong.value, calc: [w1, wrong], why: '法人税等は、会計の利益ではなく課税所得(損金不算入を加算した額)に税率をかける。' }],
        ref: { topic: T, anchor: 'taxable-income' },
      }),
    );
  }

  // 2. 益金不算入を含む課税所得(数値)
  {
    const profit = 1500000;
    const notDeduct = 60000;
    const notIncome = 40000;
    const plus = step('利益 + 損金不算入', 'add', [profit, notDeduct]);
    const fixed = step('課税所得(− 益金不算入)', 'sub', [plus.value, notIncome]);
    const wPlus = step('誤答: 益金不算入も加算した額', 'add', [plus.value, notIncome]);
    questions.push(
      numericQ({
        id: 'C17-002',
        topic: T,
        difficulty: 2,
        prompt: `税引前当期純利益は ${yen(profit)}。損金不算入の額が ${yen(notDeduct)}、益金不算入の額(会計では収益だが、税法では収益にならない受取配当金の一部)が ${yen(notIncome)} ある。課税所得はいくらか。`,
        answer: fixed.value,
        calc: [plus, fixed],
        explanation: `損金不算入は加算、益金不算入は減算する。${yen(profit)} + ${yen(notDeduct)} − ${yen(notIncome)} = ${yen(fixed.value)}。`,
        mistakes: [{ value: wPlus.value, calc: [plus, wPlus], why: '益金不算入は、税法では収益にならないので減算する。' }],
        ref: { topic: T, anchor: 'box' },
      }),
    );
  }

  // 3. 決算の法人税等(未払法人税等)
  {
    const tax = 720000;
    const interim = 300000;
    const unpaid = step('未払法人税等(年間の額 − 中間納付額)', 'sub', [tax, interim]);
    questions.push(
      journalQ({
        id: 'C17-003',
        topic: T,
        difficulty: 1,
        prompt: `決算で、当期の法人税等が ${yen(tax)} と計算された。中間納付額 ${yen(interim)} は仮払法人税等で処理している。`,
        choices: [HOJINZEI, '仮払法人税等', '未払法人税等', '未収還付法人税等', '追徴法人税等', '租税公課'],
        debit: [line(HOJINZEI, tax)],
        credit: [line('仮払法人税等', interim), line('未払法人税等', unpaid.value)],
        calc: [unpaid],
        explanation: `年間の額 ${yen(tax)} を計上し、中間納付の仮払法人税等を取り崩す。残り ${yen(unpaid.value)} は **未払法人税等**。`,
        mistakes: [
          {
            entry: { debit: [line(HOJINZEI, unpaid.value)], credit: [line('未払法人税等', unpaid.value)] },
            why: `費用は年間の額 ${yen(tax)}。中間納付の仮払法人税等も取り崩す。`,
          },
        ],
        ref: { topic: T, anchor: 'taxable-income' },
      }),
    );
  }

  // 4. 中間納付が多すぎた
  {
    const tax = 340000;
    const interim = 400000;
    const refund = step('未収還付法人税等(中間納付額 − 年間の額)', 'sub', [interim, tax]);
    questions.push(
      journalQ({
        id: 'C17-004',
        topic: T,
        difficulty: 2,
        prompt: `決算で、当期の法人税等が ${yen(tax)} と計算された。中間納付額 ${yen(interim)} は仮払法人税等で処理している。`,
        choices: [HOJINZEI, '未収還付法人税等', '仮払法人税等', '未払法人税等', '還付法人税等', '雑益'],
        debit: [line(HOJINZEI, tax), line('未収還付法人税等', refund.value)],
        credit: [line('仮払法人税等', interim)],
        calc: [refund],
        explanation: `中間納付額のほうが ${yen(refund.value)} 多いので、払いすぎた分はあとで返ってくる **未収還付法人税等**(資産)。`,
        mistakes: [
          {
            entry: { debit: [line(HOJINZEI, tax)], credit: [line('仮払法人税等', tax)] },
            why: `中間納付の仮払法人税等 ${yen(interim)} は全額取り崩す。払いすぎた分は未収還付法人税等。`,
          },
          {
            entry: { debit: [line(HOJINZEI, tax), line('還付法人税等', refund.value)], credit: [line('仮払法人税等', interim)] },
            why: '返ってくる権利は資産(未収還付法人税等)。還付法人税等は、前の年度の分が返ってくるときの収益の科目。',
          },
        ],
        ref: { topic: T, anchor: 'refund-year-end' },
      }),
    );
  }

  // 5. 追徴
  {
    const amt = 95000;
    questions.push(
      journalQ({
        id: 'C17-005',
        topic: T,
        difficulty: 1,
        prompt: `税務調査の結果、前の年度の法人税等 ${yen(amt)} を追加で納めることになった。まだ納めていない。`,
        choices: ['追徴法人税等', '未払法人税等', HOJINZEI, '租税公課', '還付法人税等', '未払金'],
        debit: [line('追徴法人税等', amt)],
        credit: [line('未払法人税等', amt)],
        explanation: '前の年度の分を追加で払うのは **追徴法人税等**(当期の法人税等とは分ける)。まだ払っていないので未払法人税等。',
        mistakes: [
          {
            entry: { debit: [line(HOJINZEI, amt)], credit: [line('未払法人税等', amt)] },
            why: '法人税、住民税及び事業税は当期の分。前の年度の分の追加は追徴法人税等。',
          },
          {
            entry: { debit: [line('租税公課', amt)], credit: [line('未払法人税等', amt)] },
            why: '租税公課は固定資産税・印紙税など。法人税等の追加は追徴法人税等。',
          },
        ],
        ref: { topic: T, anchor: 'additional' },
      }),
    );
  }

  // 6. 還付
  {
    const amt = 46000;
    questions.push(
      journalQ({
        id: 'C17-006',
        topic: T,
        difficulty: 2,
        prompt: `前の年度の法人税等のうち ${yen(amt)} が還付されることになった。まだ入金されていない。`,
        choices: ['未収還付法人税等', '還付法人税等', HOJINZEI, '雑益', '未収入金', '仮払法人税等'],
        debit: [line('未収還付法人税等', amt)],
        credit: [line('還付法人税等', amt)],
        explanation: '前の年度の分が返ってくるのは **還付法人税等**(収益)。まだ入金されていないので **未収還付法人税等**(資産)。',
        mistakes: [
          {
            entry: { debit: [line('未収還付法人税等', amt)], credit: [line(HOJINZEI, amt)] },
            why: '前の年度の分の還付は、当期の法人税等から差し引かず、還付法人税等にする。',
          },
          {
            entry: { debit: [line('未収入金', amt)], credit: [line('雑益', amt)] },
            why: '法人税等の還付には、専用の科目(未収還付法人税等・還付法人税等)を使う。',
          },
        ],
        ref: { topic: T, anchor: 'additional' },
      }),
    );
  }

  // 7. 還付金の入金
  {
    const amt = 46000;
    questions.push(
      journalQ({
        id: 'C17-007',
        topic: T,
        difficulty: 1,
        prompt: `未収還付法人税等で処理していた還付金 ${yen(amt)} が、普通預金口座に入金された。`,
        choices: ['普通預金', '未収還付法人税等', '還付法人税等', '雑益', '仮払法人税等', '未収入金'],
        debit: [line('普通預金', amt)],
        credit: [line('未収還付法人税等', amt)],
        explanation: '還付されることが決まったときに、還付法人税等(収益)と未収還付法人税等(資産)を計上済み。入金されたら **未収還付法人税等** を減らす。',
        mistakes: [
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('還付法人税等', amt)] },
            why: '還付法人税等(収益)は、還付が決まったときに計上済み。入金では未収還付法人税等を減らす。',
          },
        ],
        ref: { topic: T, anchor: 'additional' },
      }),
    );
  }

  // 8. 消費税の未収還付
  {
    const paid = 150000;
    const received = 110000;
    const refund = step('未収還付消費税(仮払消費税 − 仮受消費税)', 'sub', [paid, received]);
    questions.push(
      journalQ({
        id: 'C17-008',
        topic: T,
        difficulty: 2,
        prompt: `決算で、仮払消費税 ${yen(paid)} と仮受消費税 ${yen(received)} を相殺する(税抜方式)。`,
        choices: ['仮受消費税', '未収還付消費税', '仮払消費税', '未払消費税', '租税公課', '未収還付法人税等'],
        debit: [line('仮受消費税', received), line('未収還付消費税', refund.value)],
        credit: [line('仮払消費税', paid)],
        calc: [refund],
        explanation: `払った消費税(仮払)のほうが ${yen(refund.value)} 多いので、差額は返してもらえる **未収還付消費税**(資産)。`,
        mistakes: [
          {
            entry: { debit: [line('仮受消費税', received), line('租税公課', refund.value)], credit: [line('仮払消費税', paid)] },
            why: '差額は費用ではなく、返してもらえる権利(未収還付消費税)。',
          },
          {
            entry: { debit: [line('仮受消費税', received)], credit: [line('仮払消費税', received)] },
            why: `仮払消費税は ${yen(paid)} 全額を相殺し、差額 ${yen(refund.value)} を未収還付消費税にする。`,
          },
        ],
        ref: { topic: T, anchor: 'consumption-refund' },
      }),
    );
  }

  // 9. 損金不算入の向き(選択)
  questions.push(
    choiceQ({
      id: 'C17-009',
      topic: T,
      difficulty: 1,
      prompt: '会計では費用にしたが、税法では損金と認められない額(損金不算入)は、課税所得の計算でどうするか。',
      options: ['税引前当期純利益に加算する', '税引前当期純利益から減算する', '何もしない', '法人税等の額から直接差し引く'],
      answer: 0,
      explanation: '会計では費用として利益から引いているが、税法では費用にならないので、税引前当期純利益に **加算** して課税所得を出す。',
      mistakes: [
        { option: 1, why: '減算するのは益金不算入(会計では収益、税法では収益にならないもの)。' },
        { option: 2, why: '会計と税法の違いなので、課税所得の計算で調整する。' },
        { option: 3, why: '税額ではなく、課税所得を調整する。' },
      ],
      ref: { topic: T, anchor: 'taxable-income' },
    }),
  );

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C17-010',
      topic: T,
      difficulty: 2,
      prompt: '税金(2級)について、正しいものをすべて選びなさい。',
      options: [
        '法人税等は、課税所得に税率をかけて計算する',
        '前の年度の法人税等を追加で納めることになったら、法人税、住民税及び事業税で処理する',
        '中間納付額が年間の法人税等より多いときは、差額を未収還付法人税等にする',
        '益金不算入の額は、課税所得の計算で加算する',
        '仮払消費税が仮受消費税より多いときは、差額を未収還付消費税にする',
      ],
      answer: [0, 2, 4],
      explanation: '前の年度の分の追加は追徴法人税等。益金不算入は減算、損金不算入は加算。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '前の年度の分を追加で納めるときは、当期の分と分けて追徴法人税等にする。' },
        { options: [0, 2, 3, 4], why: '益金不算入は、税法では収益にならないので減算する。' },
        { options: [0, 4], why: '中間納付の払いすぎは、返ってくる未収還付法人税等。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'accounts' },
    }),
  );

  return { topic: T, questions };
}
