// K03 労務費 の問題(10問)
// 仕訳6問・数値2問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 支払賃金、直接工の消費(予定賃率)、間接工の要支払額、賃率差異、未払賃金。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K03';

export default function build() {
  const questions = [];

  // 1. 賃金の支払い
  {
    const gross = 950000;
    const withheld = 92000;
    const net = step('当座預金から払う額(総額 − 預り金)', 'sub', [gross, withheld]);
    questions.push(
      journalQ({
        id: 'K03-001',
        topic: T,
        difficulty: 1,
        prompt: `当月の賃金の総額 ${yen(gross)} から、源泉所得税など ${yen(withheld)} を差し引き、残りを当座預金口座から支払った。`,
        choices: ['賃金・給料', '預り金', '当座預金', '仕掛品', '製造間接費', '未払賃金'],
        debit: [line('賃金・給料', gross)],
        credit: [line('預り金', withheld), line('当座預金', net.value)],
        calc: [net],
        explanation: `賃金・給料には **総額** ${yen(gross)} を記録する。差し引いた源泉所得税などは預り金、手取額 ${yen(net.value)} を払う。`,
        mistakes: [
          {
            entry: { debit: [line('賃金・給料', net.value)], credit: [line('当座預金', net.value)] },
            why: '賃金・給料には、差し引く前の総額を記録する。差し引いた分は預り金。',
          },
        ],
        ref: { topic: T, anchor: 'pay' },
      }),
    );
  }

  // 2. 直接工の消費(予定賃率)
  const rate = 1300;
  const dHours = 600;
  const iHours = 50;
  const wHours = 20;
  const direct = step('直接労務費(予定賃率 × 直接作業時間)', 'mul', [rate, dHours]);
  const indHours = step('間接作業時間 + 手待時間', 'add', [iHours, wHours]);
  const indirect = step('製造間接費にする額(予定賃率 × 間接作業・手待時間)', 'mul', [rate, indHours.value]);
  const planned = step('予定消費額の合計', 'add', [direct.value, indirect.value]);
  questions.push(
    journalQ({
      id: 'K03-002',
      topic: T,
      difficulty: 2,
      prompt: `直接工の当月の作業時間は、直接作業 ${dHours}時間、間接作業 ${iHours}時間、手待 ${wHours}時間だった。予定賃率(1時間 ¥${rate.toLocaleString()})で消費額を計算する。`,
      choices: ['仕掛品', '製造間接費', '賃金・給料', '賃率差異', '製品', '未払賃金'],
      debit: [line('仕掛品', direct.value), line('製造間接費', indirect.value)],
      credit: [line('賃金・給料', planned.value)],
      calc: [direct, indHours, indirect, planned],
      explanation: `直接作業時間の分 ${yen(direct.value)} は **仕掛品**、間接作業と手待時間の分 ${yen(indirect.value)} は **製造間接費**。`,
      mistakes: [
        {
          entry: { debit: [line('仕掛品', planned.value)], credit: [line('賃金・給料', planned.value)] },
          why: '直接工の賃金でも、間接作業と手待時間の分は製造間接費にする。',
        },
      ],
      ref: { topic: T, anchor: 'direct' },
    }),
  );

  // 3〜4. 間接工の要支払額
  const paid = 320000;
  const prevUnpaid = 45000;
  const currUnpaid = 58000;
  const a1 = step('当月支払 − 前月未払', 'sub', [paid, prevUnpaid]);
  const due = step('要支払額(+ 当月未払)', 'add', [a1.value, currUnpaid]);
  {
    const w1 = step('誤答: 前月と当月の未払を逆にした額(当月支払 + 前月未払)', 'add', [paid, prevUnpaid]);
    const wrong = step('誤答: 逆にした額(− 当月未払)', 'sub', [w1.value, currUnpaid]);
    questions.push(
      numericQ({
        id: 'K03-003',
        topic: T,
        difficulty: 2,
        prompt: `間接工の当月の賃金支払額は ${yen(paid)}、前月末の未払額は ${yen(prevUnpaid)}、当月末の未払額は ${yen(currUnpaid)} である。当月の間接工の賃金の消費額(要支払額)はいくらか。`,
        answer: due.value,
        calc: [a1, due],
        explanation: `当月の支払額には前月分(${yen(prevUnpaid)})が含まれるので引き、当月分でまだ払っていない ${yen(currUnpaid)} を足す。${yen(due.value)}。`,
        mistakes: [
          { value: wrong.value, calc: [w1, wrong], why: '前月の未払分は引き、当月の未払分は足す。逆にしない。' },
          { value: paid, why: '当月の支払額には前月分が含まれ、当月分の未払が含まれていない。要支払額に直す。' },
        ],
        ref: { topic: T, anchor: 'indirect' },
      }),
    );
  }
  questions.push(
    journalQ({
      id: 'K03-004',
      topic: T,
      difficulty: 2,
      prompt: `間接工の当月の賃金の消費額(要支払額 ${yen(due.value)})を計上する。`,
      choices: ['製造間接費', '賃金・給料', '仕掛品', '未払賃金', '製品', '当座預金'],
      debit: [line('製造間接費', due.value)],
      credit: [line('賃金・給料', due.value)],
      explanation: '間接工は製品を直接作らないので、賃金は全額 **製造間接費**(間接労務費)。',
      mistakes: [
        {
          entry: { debit: [line('仕掛品', due.value)], credit: [line('賃金・給料', due.value)] },
          why: '間接工の賃金は間接労務費。仕掛品ではなく製造間接費。',
        },
      ],
      ref: { topic: T, anchor: 'indirect' },
    }),
  );

  // 5. 賃率差異
  {
    const actual = 935000;
    const diff = step('賃率差異(実際消費額 − 予定消費額)', 'sub', [actual, planned.value]);
    questions.push(
      journalQ({
        id: 'K03-005',
        topic: T,
        difficulty: 3,
        prompt: `月末。直接工の賃金の予定消費額は ${yen(planned.value)}、実際消費額(要支払額)は ${yen(actual)} だった。差額を賃率差異勘定に振り替える。`,
        choices: ['賃率差異', '賃金・給料', '製造間接費', '仕掛品', '材料消費価格差異', '未払賃金'],
        debit: [line('賃率差異', diff.value)],
        credit: [line('賃金・給料', diff.value)],
        calc: [diff],
        explanation: `実際 ${yen(actual)} が予定 ${yen(planned.value)} より ${yen(diff.value)} 多い(不利差異)。賃金・給料勘定の借方に残った差額を、**賃率差異** の借方へ振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('賃金・給料', diff.value)], credit: [line('賃率差異', diff.value)] },
            why: '実際が予定より多いので不利差異(借方)。',
          },
        ],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 6〜7. 未払賃金(月末計上・月初の振替)
  {
    const amt = 72000;
    questions.push(
      journalQ({
        id: 'K03-006',
        topic: T,
        difficulty: 1,
        prompt: `月末に、当月分の賃金のうちまだ支払っていない ${yen(amt)} を計上した。`,
        choices: ['賃金・給料', '未払賃金', '製造間接費', '当座預金', '預り金', '未払金'],
        debit: [line('賃金・給料', amt)],
        credit: [line('未払賃金', amt)],
        explanation: '当月に働いた分は、まだ払っていなくても当月の賃金。**賃金・給料 / 未払賃金** で計上する。',
        mistakes: [
          {
            entry: { debit: [line('未払賃金', amt)], credit: [line('賃金・給料', amt)] },
            why: 'これは翌月初の再振替の仕訳。月末は賃金・給料を増やし、未払賃金を計上する。',
          },
        ],
        ref: { topic: T, anchor: 'accrued' },
      }),
    );
    questions.push(
      journalQ({
        id: 'K03-007',
        topic: T,
        difficulty: 1,
        prompt: `月初に、前月末に計上した未払賃金 ${yen(amt)} を、賃金・給料勘定に振り替えた(再振替)。`,
        choices: ['未払賃金', '賃金・給料', '当座預金', '製造間接費', '預り金', '仕掛品'],
        debit: [line('未払賃金', amt)],
        credit: [line('賃金・給料', amt)],
        explanation: '前月末の仕訳の **逆** をする。当月の支払額に含まれる前月分を、賃金・給料勘定の貸方で差し引けるようにするため。',
        mistakes: [
          {
            entry: { debit: [line('賃金・給料', amt)], credit: [line('未払賃金', amt)] },
            why: 'これは月末に未払分を計上する仕訳。月初は逆の仕訳で元に戻す。',
          },
        ],
        ref: { topic: T, anchor: 't-wages' },
      }),
    );
  }

  // 8. 手待時間(選択)
  questions.push(
    choiceQ({
      id: 'K03-008',
      topic: T,
      difficulty: 1,
      prompt: '直接工が、材料が届かず作業できなかった時間(手待時間)の賃金は、どう処理するか。',
      options: ['直接労務費として仕掛品にする', '間接労務費として製造間接費にする', '原価にしない(非原価項目)', '賃率差異にする'],
      answer: 1,
      explanation: '手待時間は、ふつうに起きる範囲なら原価。製品を作っていないので直接労務費ではなく、**製造間接費**(間接労務費)にする。',
      mistakes: [
        { option: 0, why: '仕掛品にするのは直接作業時間の分だけ。' },
        { option: 2, why: 'ふつうに起きる手待時間の賃金は原価に含める。' },
        { option: 3, why: '賃率差異は、予定と実際の賃率の差。手待時間とは関係がない。' },
      ],
      ref: { topic: T, anchor: 'direct' },
    }),
  );

  // 9. 直接労務費(数値)
  {
    const r = 1500;
    const d = 420;
    const i = 30;
    const amt = step('直接労務費(予定賃率 × 直接作業時間)', 'mul', [r, d]);
    const all = step('誤答: 直接作業と間接作業の合計時間', 'add', [d, i]);
    const wrong = step('誤答: 合計時間 × 予定賃率', 'mul', [r, all.value]);
    questions.push(
      numericQ({
        id: 'K03-009',
        topic: T,
        difficulty: 1,
        prompt: `直接工の当月の作業時間は、直接作業 ${d}時間、間接作業 ${i}時間だった。予定賃率は1時間 ¥${r.toLocaleString()}。当月の直接労務費はいくらか。`,
        answer: amt.value,
        calc: [amt],
        explanation: `直接労務費は、直接作業時間の分だけ。¥${r.toLocaleString()} × ${d}時間 = ${yen(amt.value)}。`,
        mistakes: [{ value: wrong.value, calc: [all, wrong], why: '間接作業時間の分は製造間接費。直接労務費は直接作業時間だけ。' }],
        ref: { topic: T, anchor: 'direct' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K03-010',
      topic: T,
      difficulty: 2,
      prompt: '労務費について、正しいものをすべて選びなさい。',
      options: [
        '直接工の間接作業時間の賃金は、製造間接費にする',
        '間接工の賃金の消費額は、当月の支払額そのものである',
        '賃金を支払ったときは、源泉所得税などを差し引く前の総額を賃金・給料に記録する',
        '予定賃率による消費額より実際の消費額が多いときの賃率差異は、有利差異である',
        '月末の未払賃金は、翌月初に再振替する',
      ],
      answer: [0, 2, 4],
      explanation: '間接工の消費額は要支払額(当月支払 − 前月未払 + 当月未払)。実際が予定より多ければ不利差異。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '当月の支払額には前月分が含まれる。要支払額に直す。' },
        { options: [0, 2, 3, 4], why: '実際の消費額が予定より多いのは、コストが高かったので不利差異。' },
        { options: [0, 4], why: '賃金・給料には総額を記録する。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'variance' },
    }),
  );

  return { topic: T, questions };
}
