// C23 株主資本等変動計算書 の問題(8問)
// 仕訳2問・数値3問・表1問(縦にした株主資本等変動計算書)・選択1問・複数選択1問。金額はすべて step() で計算する。
// 区分表の※(簡易な内容)に合わせ、株主資本とその他有価証券評価差額金の増減に限る。

import { blankNum, choiceQ, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C23';

export default function build() {
  const questions = [];

  // 共通の資料
  const b = { cap: 8000000, capRes: 1200000, otherCap: 200000, earnRes: 500000, retained: 2400000, val: 60000 };
  const ev = { div: 800000, reserve: 80000, shares: 2000, price: 1500, ni: 1100000, valEnd: 95000 };
  const data = `当期首の純資産は、資本金 ${yen(b.cap)}、資本準備金 ${yen(b.capRes)}、その他資本剰余金 ${yen(b.otherCap)}、利益準備金 ${yen(b.earnRes)}、繰越利益剰余金 ${yen(b.retained)}、その他有価証券評価差額金 ${yen(b.val)}。当期中に、①繰越利益剰余金から ${yen(ev.div)} の配当を行い、利益準備金を ${yen(ev.reserve)} 積み立てた、②新株 ${ev.shares.toLocaleString()}株を1株 ¥${ev.price.toLocaleString()} で発行し、資本金は会社法で認められる最低限とした、③当期純利益は ${yen(ev.ni)}、④その他有価証券評価差額金の当期末残高は ${yen(ev.valEnd)} になった。`;
  const outflow = step('剰余金の配当で減る繰越利益剰余金(配当 + 積立)', 'add', [ev.div, ev.reserve]);
  const r1 = step('繰越利益剰余金: 当期首 − 配当と積立', 'sub', [b.retained, outflow.value]);
  const retEnd = step('繰越利益剰余金の当期末残高(+ 当期純利益)', 'add', [r1.value, ev.ni]);
  const issue = step('新株の払込額(株数 × 1株の金額)', 'mul', [ev.shares, ev.price]);
  const half = step('資本金に入れる額(払込額 ÷ 2)', 'div', [issue.value, 2]);
  const capEnd = step('資本金の当期末残高', 'add', [b.cap, half.value]);
  const capResEnd = step('資本準備金の当期末残高', 'add', [b.capRes, half.value]);
  const earnEnd = step('利益準備金の当期末残高', 'add', [b.earnRes, ev.reserve]);
  const valChg = step('評価差額金の当期変動額(期末 − 期首)', 'sub', [ev.valEnd, b.val]);

  // 1. 繰越利益剰余金の当期末残高
  {
    const w1 = step('誤答: 当期首 − 配当だけ', 'sub', [b.retained, ev.div]);
    const wrong = step('誤答: + 当期純利益(積立を引かない)', 'add', [w1.value, ev.ni]);
    questions.push(
      numericQ({
        id: 'C23-001',
        topic: T,
        format: 'q2_topic',
        difficulty: 2,
        prompt: `${data}繰越利益剰余金の当期末残高はいくらか。`,
        answer: retEnd.value,
        calc: [outflow, r1, retEnd],
        explanation: `剰余金の配当の行で、繰越利益剰余金は配当 ${yen(ev.div)} と積立 ${yen(ev.reserve)} の合計 ${yen(outflow.value)} が減る。当期純利益 ${yen(ev.ni)} が増えて、${yen(b.retained)} − ${yen(outflow.value)} + ${yen(ev.ni)} = ${yen(retEnd.value)}。`,
        mistakes: [{ value: wrong.value, calc: [w1, wrong], why: '利益準備金の積立も、繰越利益剰余金を減らして行う。' }],
        ref: { topic: T, anchor: 'retained' },
      }),
    );
  }

  // 2. 利益準備金の積立額(上限あり)
  {
    const cap = 4000000;
    const capRes = 700000;
    const earnRes = 260000;
    const div = 600000;
    const tenth = step('① 配当額 × 10分の1', 'div', [div, 10]);
    const quarter = step('資本金 × 4分の1', 'div', [cap, 4]);
    const have = step('準備金の合計(資本準備金 + 利益準備金)', 'add', [capRes, earnRes]);
    const room = step('② 積み立てられる残り(資本金の4分の1 − 準備金の合計)', 'sub', [quarter.value, have.value]);
    questions.push(
      numericQ({
        id: 'C23-002',
        topic: T,
        format: 'q2_topic',
        difficulty: 3,
        prompt: `繰越利益剰余金から ${yen(div)} の配当を行う。資本金は ${yen(cap)}、資本準備金は ${yen(capRes)}、利益準備金は ${yen(earnRes)}。会社法の規定により積み立てる利益準備金の額はいくらか。`,
        answer: room.value,
        calc: [tenth, quarter, have, room],
        explanation: `① 配当額の10分の1 = ${yen(tenth.value)}、② 資本金の4分の1 ${yen(quarter.value)} − 準備金の合計 ${yen(have.value)} = ${yen(room.value)}。少ない方の ${yen(room.value)} を積み立てる(C19)。`,
        mistakes: [{ value: tenth.value, calc: [tenth], why: '準備金の合計が資本金の4分の1に達するまでしか積み立てない。①と②の少ない方。' }],
        ref: { topic: T, anchor: 'dividend' },
      }),
    );
  }

  // 3. 純資産合計の当期末残高
  {
    const s1 = step('当期首の株主資本(資本金 + 資本準備金 + その他資本剰余金)', 'add', [b.cap, b.capRes, b.otherCap]);
    const s2 = step('当期首の純資産合計(+ 利益準備金 + 繰越利益剰余金 + 評価差額金)', 'add', [s1.value, b.earnRes, b.retained, b.val]);
    const c1 = step('純資産合計 + 新株の払込額', 'add', [s2.value, issue.value]);
    const c2 = step('− 配当額(積立は純資産の中の移動)', 'sub', [c1.value, ev.div]);
    const c3 = step('+ 当期純利益', 'add', [c2.value, ev.ni]);
    const end = step('純資産合計の当期末残高(+ 評価差額金の増加)', 'add', [c3.value, valChg.value]);
    const wrong = step('誤答: 積立額も引いた額', 'sub', [end.value, ev.reserve]);
    questions.push(
      numericQ({
        id: 'C23-003',
        topic: T,
        format: 'q2_topic',
        difficulty: 3,
        prompt: `${data}純資産合計の当期末残高はいくらか。`,
        answer: end.value,
        calc: [s1, s2, issue, valChg, c1, c2, c3, end],
        explanation: `当期首の純資産合計は ${yen(s2.value)}。新株の発行 +${yen(issue.value)}、配当 −${yen(ev.div)}(利益準備金の積立は純資産の中の移動なので合計は変わらない)、当期純利益 +${yen(ev.ni)}、評価差額金 +${yen(valChg.value)}(${yen(b.val)} → ${yen(ev.valEnd)})で、${yen(end.value)}。`,
        mistakes: [{ value: wrong.value, calc: [s1, s2, issue, valChg, c1, c2, c3, end, wrong], why: '利益準備金の積立は、繰越利益剰余金から利益準備金への移動。純資産合計は変わらない。' }],
        ref: { topic: T, anchor: 'retained' },
      }),
    );
  }

  // 4. 剰余金の配当の仕訳
  questions.push(
    journalQ({
      id: 'C23-004',
      topic: T,
      difficulty: 1,
      prompt: `株主総会で、繰越利益剰余金から ${yen(ev.div)} の配当を行うことと、利益準備金を ${yen(ev.reserve)} 積み立てることを決めた。`,
      choices: ['繰越利益剰余金', '未払配当金', '利益準備金', '当座預金', '資本準備金', 'その他資本剰余金'],
      debit: [line('繰越利益剰余金', outflow.value)],
      credit: [line('未払配当金', ev.div), line('利益準備金', ev.reserve)],
      calc: [outflow],
      explanation: `配当はまだ払っていないので **未払配当金**。積立額 ${yen(ev.reserve)} は利益準備金。繰越利益剰余金は合計 ${yen(outflow.value)} 減る。`,
      mistakes: [
        {
          entry: { debit: [line('繰越利益剰余金', ev.div)], credit: [line('未払配当金', ev.div)] },
          why: '利益準備金の積立も、繰越利益剰余金を減らして行う。',
        },
      ],
      ref: { topic: T, anchor: 'dividend' },
    }),
  );

  // 5. 新株の発行の仕訳
  questions.push(
    journalQ({
      id: 'C23-005',
      topic: T,
      difficulty: 2,
      prompt: `新株 ${ev.shares.toLocaleString()}株を1株 ¥${ev.price.toLocaleString()} で発行し、払込金は当座預金とした。資本金は会社法で認められる最低限とする。`,
      choices: ['当座預金', '資本金', '資本準備金', 'その他資本剰余金', '株式申込証拠金', '繰越利益剰余金'],
      debit: [line('当座預金', issue.value)],
      credit: [line('資本金', half.value), line('資本準備金', half.value)],
      calc: [issue, half],
      explanation: `払込額 ${yen(issue.value)} のうち、最低限の2分の1 ${yen(half.value)} を資本金、残りを **資本準備金** にする。`,
      mistakes: [
        {
          entry: { debit: [line('当座預金', issue.value)], credit: [line('資本金', issue.value)] },
          why: '「最低限」の指示があるので、資本金は払込額の2分の1。残りは資本準備金。',
        },
        {
          entry: { debit: [line('当座預金', issue.value)], credit: [line('資本金', half.value), line('その他資本剰余金', half.value)] },
          why: '資本金にしない分は、その他資本剰余金ではなく資本準備金にする。',
        },
      ],
      ref: { topic: T, anchor: 'issue' },
    }),
  );

  // 6. 株主資本等変動計算書(縦にした形)
  {
    const capChg = half.value;
    const retChg = step('繰越利益剰余金の当期変動額(当期純利益 − 配当と積立)', 'sub', [ev.ni, outflow.value]);
    const wRet = step('誤答: 当期純利益 − 配当だけ', 'sub', [ev.ni, ev.div]);
    questions.push(
      tableQ({
        id: 'C23-006',
        topic: T,
        format: 'q3_statements',
        difficulty: 3,
        prompt: `${data}株主資本等変動計算書の金額を、項目を縦に並べた次の表にまとめなさい。`,
        table: {
          title: '株主資本等変動計算書(縦にした形)',
          columns: [{ label: '項目' }, { label: '当期首', align: 'right' }, { label: '変動額', align: 'right' }, { label: '当期末', align: 'right' }],
          rows: [
            ['資本金', b.cap, blankNum(capChg), blankNum(capEnd.value)],
            ['資本準備金', b.capRes, blankNum(capChg), blankNum(capResEnd.value)],
            ['利益準備金', b.earnRes, blankNum(ev.reserve), blankNum(earnEnd.value)],
            ['繰越利益剰余金', b.retained, blankNum(retChg.value), blankNum(retEnd.value)],
            ['評価差額金', b.val, blankNum(valChg.value), blankNum(ev.valEnd)],
          ],
        },
        checks: [
          { label: '資本金: 当期首 + 変動額 = 当期末', op: 'add', args: [[0, 1], [0, 2]], result: [0, 3] },
          { label: '資本準備金: 当期首 + 変動額 = 当期末', op: 'add', args: [[1, 1], [1, 2]], result: [1, 3] },
          { label: '利益準備金: 当期首 + 変動額 = 当期末', op: 'add', args: [[2, 1], [2, 2]], result: [2, 3] },
          { label: '繰越利益剰余金: 当期首 + 変動額 = 当期末', op: 'add', args: [[3, 1], [3, 2]], result: [3, 3] },
          { label: '評価差額金: 当期首 + 変動額 = 当期末', op: 'add', args: [[4, 1], [4, 2]], result: [4, 3] },
          { label: '資本金と資本準備金の増加は同じ(2分の1ずつ)', op: 'add', args: [[0, 2], 0], result: [1, 2] },
        ],
        calc: [issue, half, capEnd, capResEnd, earnEnd, outflow, retChg, r1, retEnd, valChg],
        explanation: `資本金・資本準備金は、払込額 ${yen(issue.value)} の半分ずつ ${yen(half.value)} 増える。利益準備金は積立 ${yen(ev.reserve)} 増える。繰越利益剰余金は、当期純利益 ${yen(ev.ni)} − 配当と積立 ${yen(outflow.value)} = ${yen(retChg.value)}。評価差額金は ${yen(b.val)} → ${yen(ev.valEnd)} なので ${yen(valChg.value)} の増加(純額)。`,
        mistakes: [
          {
            cell: [3, 2],
            value: wRet.value,
            calc: [wRet],
            why: '繰越利益剰余金は、配当額だけでなく、利益準備金の積立額も減る。',
          },
          {
            cell: [4, 2],
            value: ev.valEnd,
            why: 'それは当期末残高。変動額は、当期末 − 当期首の純額。',
          },
        ],
        ref: { topic: T, anchor: 'statement' },
      }),
    );
  }

  // 7. 純額で書く項目(選択)
  questions.push(
    choiceQ({
      id: 'C23-007',
      topic: T,
      difficulty: 1,
      prompt: '株主資本等変動計算書で、変動事由に分けず「株主資本以外の項目の当期変動額(純額)」としてまとめて書くものはどれか。',
      options: ['資本金', '利益準備金', '繰越利益剰余金', 'その他有価証券評価差額金'],
      answer: 3,
      explanation: 'その他有価証券評価差額金は株主資本ではない(評価・換算差額等)。増減は **純額** で1行にまとめる。',
      mistakes: [
        { option: 0, why: '資本金は株主資本。新株の発行など、変動事由ごとに書く。' },
        { option: 1, why: '利益準備金は株主資本。剰余金の配当(積立)など、変動事由ごとに書く。' },
        { option: 2, why: '繰越利益剰余金は株主資本。剰余金の配当・当期純利益など、変動事由ごとに書く。' },
      ],
      ref: { topic: T, anchor: 'income' },
    }),
  );

  // 8. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C23-008',
      topic: T,
      difficulty: 2,
      prompt: '株主資本等変動計算書について、正しいものをすべて選びなさい。',
      options: [
        '各項目について、当期首残高に当期変動額を加減すると当期末残高になる',
        '利益準備金の積立を行うと、純資産合計は積立額だけ減る',
        '当期純利益は、繰越利益剰余金の当期変動額として書く',
        '剰余金の配当の行では、繰越利益剰余金の減少額は配当額だけである',
        '新株を発行して資本金を最低限としたときは、資本金と資本準備金が増える',
      ],
      answer: [0, 2, 4],
      explanation: '利益準備金の積立は純資産の中の移動で、合計は変わらない。剰余金の配当の行では、繰越利益剰余金は配当額 + 積立額だけ減る。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '積立は繰越利益剰余金から利益準備金への移動。純資産合計は変わらない。' },
        { options: [0, 2, 3, 4], why: '繰越利益剰余金は、配当額と積立額の合計だけ減る。' },
        { options: [0, 2], why: '新株の発行では、払込額を資本金と資本準備金に分ける。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'statement' },
    }),
  );

  return { topic: T, questions };
}
