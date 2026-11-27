// K05 製造間接費 の問題(10問)
// 仕訳3問・数値5問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 予定配賦、配賦差異、原因分析(公式法変動予算・固定予算)、売上原価加減法。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K05';

export default function build() {
  const questions = [];

  // 1. 予定配賦率(数値)
  const budget = 5400000;
  const baseYear = 18000;
  const actualHours = 1250;
  const rate = step('予定配賦率(年間予算 ÷ 年間基準操業度)', 'div', [budget, baseYear]);
  const monthBudget = step('誤答: 月間の予算(年間予算 ÷ 12)', 'div', [budget, 12]);
  const wrongRate = step('誤答: 月間の予算 ÷ 実際の作業時間', 'div', [monthBudget.value, actualHours]);
  questions.push(
    numericQ({
      id: 'K05-001',
      topic: T,
      difficulty: 1,
      unit: '円/時間',
      prompt: `年間の製造間接費予算は ${yen(budget)}、年間の基準操業度(直接作業時間)は ${baseYear.toLocaleString()}時間である。当月の実際の直接作業時間は ${actualHours.toLocaleString()}時間だった。予定配賦率(1時間あたり)はいくらか。`,
      answer: rate.value,
      calc: [rate],
      explanation: `予定配賦率 = 年間予算 ÷ 年間基準操業度 = ${yen(budget)} ÷ ${baseYear.toLocaleString()}時間 = 1時間 ¥${rate.value}。実際の作業時間は、配賦額の計算(率 × 実際の時間)で使う。`,
      mistakes: [
        {
          value: wrongRate.value,
          calc: [monthBudget, wrongRate],
          why: '予定配賦率は、年間予算を年間の基準操業度で割る。実際の作業時間では割らない。',
        },
      ],
      ref: { topic: T, anchor: 'apply' },
    }),
  );

  // 2. 予定配賦
  const applied = step('予定配賦額(予定配賦率 × 実際の直接作業時間)', 'mul', [rate.value, actualHours]);
  {
    const baseMonth = step('誤答: 月間の基準操業度(年間 ÷ 12)', 'div', [baseYear, 12]);
    const wrong = step('誤答: 基準操業度で計算した額', 'mul', [rate.value, baseMonth.value]);
    questions.push(
      journalQ({
        id: 'K05-002',
        topic: T,
        difficulty: 1,
        prompt: `製造間接費の予定配賦率は1時間 ¥${rate.value}(年間の基準操業度 ${baseYear.toLocaleString()}時間)。当月の実際の直接作業時間は ${actualHours.toLocaleString()}時間だった。製造間接費を予定配賦する。`,
        choices: ['仕掛品', '製造間接費', '製品', '製造間接費配賦差異', '売上原価', '賃金・給料'],
        debit: [line('仕掛品', applied.value)],
        credit: [line('製造間接費', applied.value)],
        calc: [applied],
        explanation: `予定配賦額 = 予定配賦率 × **実際** の作業時間 = ¥${rate.value} × ${actualHours.toLocaleString()}時間 = ${yen(applied.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('仕掛品', wrong.value)], credit: [line('製造間接費', wrong.value)] },
            why: '予定配賦額は、基準操業度ではなく、当月の実際の作業時間にかける。',
            calc: [baseMonth, wrong],
          },
        ],
        ref: { topic: T, anchor: 'apply' },
      }),
    );
  }

  // 3. 配賦差異の振替
  {
    const actual = 390000;
    const diff = step('配賦差異(実際発生額 − 予定配賦額)', 'sub', [actual, applied.value]);
    questions.push(
      journalQ({
        id: 'K05-003',
        topic: T,
        difficulty: 2,
        prompt: `月末。製造間接費の実際発生額は ${yen(actual)}、予定配賦額は ${yen(applied.value)} だった。差額を製造間接費配賦差異勘定に振り替える。`,
        choices: ['製造間接費配賦差異', '製造間接費', '仕掛品', '売上原価', '賃率差異', '製品'],
        debit: [line('製造間接費配賦差異', diff.value)],
        credit: [line('製造間接費', diff.value)],
        calc: [diff],
        explanation: `実際 ${yen(actual)} が予定 ${yen(applied.value)} より ${yen(diff.value)} 多い(配りきれなかった=不利差異)。製造間接費勘定の借方残高を、**製造間接費配賦差異** の借方へ振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('製造間接費', diff.value)], credit: [line('製造間接費配賦差異', diff.value)] },
            why: '実際が予定配賦より多いので不利差異(借方)。',
          },
        ],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 4〜6. 公式法変動予算の差異分析(数値・選択)
  const vRate = 200;
  const fixed = 300000;
  const base = 1500;
  const act = 1400;
  const actualCost = 590000;
  const vPart = step('変動費の予算(変動費率 × 実際操業度)', 'mul', [vRate, act]);
  const allowed = step('予算許容額(変動費の予算 + 固定費)', 'add', [vPart.value, fixed]);
  const budgetVar = step('予算差異(実際発生額 − 予算許容額。不利の額)', 'sub', [actualCost, allowed.value]);
  const fRate = step('固定費率(固定費 ÷ 基準操業度)', 'div', [fixed, base]);
  const short = step('操業度の不足(基準 − 実際)', 'sub', [base, act]);
  const volVar = step('操業度差異(固定費率 × 不足した時間。不利の額)', 'mul', [fRate.value, short.value]);
  const common = `製造間接費は公式法変動予算で管理している。月間の予算は、変動費率が1時間 ¥${vRate}、固定費が ${yen(fixed)}、基準操業度が ${base.toLocaleString()}時間。当月の実際の操業度は ${act.toLocaleString()}時間、製造間接費の実際発生額は ${yen(actualCost)} だった。`;
  {
    const wrong = step('誤答: 予算全体との差(実際 − 変動費率 × 基準 − 固定費)', 'sub', [actualCost, vRate * base + fixed]);
    questions.push(
      numericQ({
        id: 'K05-004',
        topic: T,
        difficulty: 3,
        prompt: `${common}予算差異はいくらの不利差異か。`,
        answer: budgetVar.value,
        calc: [vPart, allowed, budgetVar],
        explanation: `予算許容額は、**実際の操業度** での予算: ¥${vRate} × ${act.toLocaleString()}時間 + ${yen(fixed)} = ${yen(allowed.value)}。実際 ${yen(actualCost)} はこれより ${yen(budgetVar.value)} 多いので不利。`,
        mistakes: [{ value: wrong.value, calc: [wrong], why: '予算許容額は、基準操業度ではなく実際の操業度で計算する。' }],
        ref: { topic: T, anchor: 'analysis' },
      }),
    );
  }
  {
    const pRate = step('誤答: 予定配賦率(変動費率 + 固定費率)', 'add', [vRate, fRate.value]);
    const wrong = step('誤答: 予定配賦率 × 不足した時間', 'mul', [pRate.value, short.value]);
    questions.push(
      numericQ({
        id: 'K05-005',
        topic: T,
        difficulty: 3,
        prompt: `${common}操業度差異はいくらの不利差異か。`,
        answer: volVar.value,
        calc: [fRate, short, volVar],
        explanation: `操業度差異 = 固定費率 ×(基準操業度 − 実際操業度)。固定費率は ${yen(fixed)} ÷ ${base.toLocaleString()}時間 = ¥${fRate.value}。¥${fRate.value} × ${short.value}時間 = ${yen(volVar.value)}(実際が基準より少ないので不利)。`,
        mistakes: [{ value: wrong.value, calc: [pRate, wrong], why: '操業度差異には、予定配賦率全体ではなく固定費率だけを使う。' }],
        ref: { topic: T, anchor: 'analysis' },
      }),
    );
  }
  {
    const total = step('配賦差異の合計(予算差異 + 操業度差異。不利)', 'add', [budgetVar.value, volVar.value]);
    questions.push(
      numericQ({
        id: 'K05-006',
        topic: T,
        difficulty: 2,
        prompt: `${common}製造間接費配賦差異(総差異)はいくらの不利差異か。`,
        answer: total.value,
        calc: [vPart, allowed, budgetVar, fRate, short, volVar, total],
        explanation: `総差異は、予算差異 ${yen(budgetVar.value)} と操業度差異 ${yen(volVar.value)} の合計で ${yen(total.value)}(予定配賦額 − 実際発生額と一致する)。`,
        mistakes: [{ value: budgetVar.value, calc: [vPart, allowed, budgetVar], why: '予算差異だけでなく、操業度差異も合わせたものが配賦差異(総差異)。' }],
        ref: { topic: T, anchor: 'analysis' },
      }),
    );
  }

  // 7. 固定予算の予算差異(数値)
  {
    const fb = 420000;
    const fBase = 1200;
    const fAct = 1150;
    const fActual = 410000;
    const bv = step('予算差異(予算 − 実際発生額。有利の額)', 'sub', [fb, fActual]);
    const fr = step('予定配賦率(予算 ÷ 基準操業度)', 'div', [fb, fBase]);
    const ap = step('予定配賦額(予定配賦率 × 実際操業度)', 'mul', [fr.value, fAct]);
    const wrong = step('誤答: 予定配賦額と実際発生額の差', 'sub', [fActual, ap.value]);
    questions.push(
      numericQ({
        id: 'K05-007',
        topic: T,
        difficulty: 2,
        prompt: `製造間接費は固定予算で管理している。月間の予算は ${yen(fb)}、基準操業度は ${fBase.toLocaleString()}時間。当月の実際の操業度は ${fAct.toLocaleString()}時間、実際発生額は ${yen(fActual)} だった。予算差異はいくらの有利差異か。`,
        answer: bv.value,
        calc: [bv],
        explanation: `固定予算では、予算は操業度にかかわらず ${yen(fb)} のまま。予算差異 = 予算 − 実際発生額 = ${yen(bv.value)}(実際のほうが少ないので有利)。`,
        mistakes: [{ value: wrong.value, calc: [fr, ap, wrong], why: 'それは配賦差異(総差異)。予算差異は、予算と実際発生額の差。' }],
        ref: { topic: T, anchor: 'fixed' },
      }),
    );
  }

  // 8. 売上原価加減法
  {
    const amt = 24000;
    questions.push(
      journalQ({
        id: 'K05-008',
        topic: T,
        difficulty: 2,
        prompt: `会計年度末に、製造間接費配賦差異の借方残高 ${yen(amt)}(不利差異)を、売上原価に振り替えた。`,
        choices: ['売上原価', '製造間接費配賦差異', '製造間接費', '仕掛品', '製品', '雑損'],
        debit: [line('売上原価', amt)],
        credit: [line('製造間接費配賦差異', amt)],
        explanation: '不利差異は原価が予定より多かった分なので、売上原価に **加える**(売上原価加減法)。',
        mistakes: [
          {
            entry: { debit: [line('製造間接費配賦差異', amt)], credit: [line('売上原価', amt)] },
            why: '借方残高(不利差異)を消すには貸方に記入し、売上原価に加える(借方)。',
          },
        ],
        ref: { topic: T, anchor: 'year-end' },
      }),
    );
  }

  // 9. 操業度差異の意味(選択)
  questions.push(
    choiceQ({
      id: 'K05-009',
      topic: T,
      difficulty: 2,
      prompt: '実際の操業度が基準操業度より少なかったときの操業度差異について、正しいものはどれか。',
      options: [
        '有利差異になる(固定費が少なくて済んだ)',
        '不利差異になる(固定費を製品に配りきれなかった)',
        '差異は生じない',
        '変動費率によって有利にも不利にもなる',
      ],
      answer: 1,
      explanation: '固定費は操業度が下がっても減らないので、予定の時間より少ないと、固定費を製品に配りきれない。これが **不利** な操業度差異。',
      mistakes: [
        { option: 0, why: '固定費は操業度が下がっても減らない。配りきれない分が不利差異になる。' },
        { option: 2, why: '基準と実際の操業度がちがえば、操業度差異が生じる。' },
        { option: 3, why: '操業度差異は固定費率だけで計算するので、変動費率は関係ない。' },
      ],
      ref: { topic: T, anchor: 'analysis' },
    }),
  );

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K05-010',
      topic: T,
      difficulty: 2,
      prompt: '製造間接費について、正しいものをすべて選びなさい。',
      options: [
        '予定配賦額は、予定配賦率に実際の操業度をかけて計算する',
        '実際発生額が予定配賦額より多いときの配賦差異は、有利差異である',
        '公式法変動予算の予算許容額は、実際の操業度で計算した予算である',
        '操業度差異は、予定配賦率に操業度の差をかけて計算する',
        '会計年度末の不利な配賦差異は、売上原価に加算する',
      ],
      answer: [0, 2, 4],
      explanation: '実際発生額が多いのは不利差異。操業度差異は固定費率 × 操業度の差。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '実際発生額が予定配賦額より多いのは、配りきれなかったので不利差異。' },
        { options: [0, 2, 3, 4], why: '操業度差異には固定費率を使う。変動費は操業度に比例するので差異にならない。' },
        { options: [0, 4], why: '予算許容額は実際の操業度での予算。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'analysis' },
    }),
  );

  return { topic: T, questions };
}
