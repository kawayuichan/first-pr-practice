// C15 役務収益・役務原価 の問題(8問)
// 仕訳5問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// サービス業: 費用を仕掛品にためる → 役務収益の計上と同時に役務原価へ振替。前受けは契約負債。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C15';

export default function build() {
  const questions = [];

  // 1. 費用を仕掛品に振り替える
  {
    const salary = 180000;
    const travel = 24000;
    const sum = step('仕掛品にする額(給料 + 旅費交通費)', 'add', [salary, travel]);
    questions.push(
      journalQ({
        id: 'C15-001',
        topic: T,
        difficulty: 2,
        prompt: `設計を請け負う当社は、B社から依頼された設計の仕事のために支払った給料 ${yen(salary)} と旅費交通費 ${yen(travel)}(いずれも支払時に費用で処理済み)を、仕掛品に振り替えた。`,
        choices: ['仕掛品', '給料', '旅費交通費', '役務原価', '役務収益', '前払金'],
        debit: [line('仕掛品', sum.value)],
        credit: [line('給料', salary), line('旅費交通費', travel)],
        calc: [sum],
        explanation: `仕事がまだ終わっていないので、その仕事のためにかかった費用 ${yen(sum.value)} は **仕掛品**(資産)にためておく。`,
        mistakes: [
          {
            entry: { debit: [line('役務原価', sum.value)], credit: [line('給料', salary), line('旅費交通費', travel)] },
            why: '役務原価にするのは、仕事が終わって役務収益を計上したとき。終わるまでは仕掛品にためる。',
          },
        ],
        ref: { topic: T, anchor: 'wip' },
      }),
    );
  }

  // 2. 完成・引渡し(役務収益と役務原価)
  {
    const fee = 500000;
    const wip = 204000;
    questions.push(
      journalQ({
        id: 'C15-002',
        topic: T,
        difficulty: 2,
        prompt: `B社から依頼された設計が完成して引き渡し、代金 ${yen(fee)} は月末に受け取ることにした。この仕事のためにかかった費用 ${yen(wip)} は仕掛品に振り替えてあるので、あわせて役務原価に振り替える。`,
        choices: ['売掛金', '役務収益', '役務原価', '仕掛品', '売上', '契約負債'],
        debit: [line('売掛金', fee), line('役務原価', wip)],
        credit: [line('役務収益', fee), line('仕掛品', wip)],
        explanation: `サービスを提供したので **役務収益** ${yen(fee)} を計上し、ためていた仕掛品 ${yen(wip)} を **役務原価** に振り替える(収益と原価をそろえる)。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', fee)], credit: [line('役務収益', fee)] },
            why: '役務収益を計上したら、その仕事の仕掛品も役務原価に振り替える。',
          },
          {
            entry: { debit: [line('売掛金', fee), line('役務原価', wip)], credit: [line('売上', fee), line('仕掛品', wip)] },
            why: 'サービス業の売上は、役務収益で処理する。',
          },
        ],
        ref: { topic: T, anchor: 'complete' },
      }),
    );
  }

  // 3〜4. 講座の受講料を前受け → 決算
  const tuition = 720000;
  const months = 8;
  questions.push(
    journalQ({
      id: 'C15-003',
      topic: T,
      difficulty: 1,
      prompt: `資格講座(${months}か月)の受講料 ${yen(tuition)} を前もって受け取り、普通預金口座に入金された。`,
      choices: ['普通預金', '契約負債', '役務収益', '売上', '仮受金', '売掛金'],
      debit: [line('普通預金', tuition)],
      credit: [line('契約負債', tuition)],
      explanation: 'まだ講義をしていないので、役務収益ではない。先に受け取った代金は **契約負債**(前受金でもよい)。',
      mistakes: [
        {
          entry: { debit: [line('普通預金', tuition)], credit: [line('役務収益', tuition)] },
          why: '役務収益は、講義を行った分だけ計上する。前もって受け取った分は契約負債。',
        },
      ],
      ref: { topic: T, anchor: 'advance' },
    }),
  );
  {
    const done = 3;
    const per = step('1か月分(受講料 ÷ 8か月)', 'div', [tuition, months]);
    const earned = step('役務収益にする額(1か月分 × 3か月)', 'mul', [per.value, done]);
    questions.push(
      journalQ({
        id: 'C15-004',
        topic: T,
        difficulty: 2,
        prompt: `前もって受け取り契約負債で処理していた資格講座(${months}か月)の受講料 ${yen(tuition)} について、決算日までに${done}か月分の講義を終えた。`,
        choices: ['契約負債', '役務収益', '普通預金', '仕掛品', '前受収益', '売上'],
        debit: [line('契約負債', earned.value)],
        credit: [line('役務収益', earned.value)],
        calc: [per, earned],
        explanation: `講義は時間をかけて提供するので、終えた${done}か月分 ${yen(earned.value)} を契約負債から **役務収益** に振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('契約負債', tuition)], credit: [line('役務収益', tuition)] },
            why: `まだ残りの講義を行っていない。終えた${done}か月分だけを役務収益にする。`,
          },
        ],
        ref: { topic: T, anchor: 'advance' },
      }),
    );
  }

  // 5. 講師への報酬(直接 役務原価)
  {
    const pay = 90000;
    questions.push(
      journalQ({
        id: 'C15-005',
        topic: T,
        difficulty: 1,
        prompt: `資格講座の講師に、当月の講義の報酬 ${yen(pay)} を普通預金口座から支払った。この報酬は、講義を行った月の役務原価として処理する。`,
        choices: ['役務原価', '普通預金', '給料', '仕掛品', '支払手数料', '役務収益'],
        debit: [line('役務原価', pay)],
        credit: [line('普通預金', pay)],
        explanation: '講義を行った月に、その月の役務収益と対応する費用なので、問題文の指示どおり直接 **役務原価** にする。',
        mistakes: [
          {
            entry: { debit: [line('仕掛品', pay)], credit: [line('普通預金', pay)] },
            why: '講義はその月に終わっていて、その分の役務収益も計上している。ためずに、役務原価にする指示。',
          },
        ],
        ref: { topic: T, anchor: 'advance' },
      }),
    );
  }

  // 6. 仕掛品の残高(数値)
  {
    const a = 150000;
    const b = 90000;
    const c = 60000;
    const left = step('決算日の仕掛品(B社 + C社。まだ終わっていない仕事)', 'add', [b, c]);
    const all = step('誤答: 3社分すべて', 'add', [a, b, c]);
    questions.push(
      numericQ({
        id: 'C15-006',
        topic: T,
        difficulty: 2,
        prompt: `当期に、A社・B社・C社の3つの仕事のためにかかった費用を仕掛品に振り替えた(A社 ${yen(a)}、B社 ${yen(b)}、C社 ${yen(c)})。決算日までに完成して引き渡したのはA社の仕事だけである。決算日の仕掛品の残高はいくらか。`,
        answer: left.value,
        calc: [left],
        explanation: `完成したA社の分は、役務収益を計上したときに役務原価へ振り替えている。終わっていないB社とC社の分 ${yen(left.value)} が、仕掛品として残る。`,
        mistakes: [{ value: all.value, calc: [all], why: '完成して引き渡したA社の分は、役務原価に振り替えている。残るのは終わっていない仕事の分だけ。' }],
        ref: { topic: T, anchor: 'year-end' },
      }),
    );
  }

  // 7. 選択: 仕掛品を役務原価にするとき
  questions.push(
    choiceQ({
      id: 'C15-007',
      topic: T,
      difficulty: 1,
      prompt: '特定の仕事のためにかかった費用をためていた仕掛品は、いつ役務原価に振り替えるか。',
      options: ['費用を支払ったとき', 'その仕事の役務収益を計上したとき', '決算日', '代金を回収したとき'],
      answer: 1,
      explanation: '収益と原価をそろえるため、その仕事の **役務収益を計上したとき** に、仕掛品を役務原価に振り替える。',
      mistakes: [
        { option: 0, why: '費用を払った時点では、まだ仕事が終わっていない。いったん仕掛品にためる。' },
        { option: 2, why: '決算日に終わっていない仕事の仕掛品は、資産として次期に繰り越す。' },
        { option: 3, why: '代金の回収とは関係がない。役務収益を計上したときに振り替える。' },
      ],
      ref: { topic: T, anchor: 'complete' },
    }),
  );

  // 8. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C15-008',
      topic: T,
      difficulty: 2,
      prompt: '役務収益・役務原価について、正しいものをすべて選びなさい。',
      options: [
        'サービス業の売上は、役務収益で処理する',
        '特定の仕事のための費用は、仕事が終わるまで仕掛品にためておく',
        '本社の事務の給料も、すべて仕掛品に振り替える',
        '前もって受け取った受講料は、受け取ったときに全額を役務収益にする',
        '決算日に終わっていない仕事の仕掛品は、資産として次期に繰り越す',
      ],
      answer: [0, 1, 4],
      explanation: '仕掛品にするのは、特定の仕事に結びつく費用だけ。前もって受け取った代金は契約負債にして、提供した分だけ役務収益にする。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '特定の仕事に結びつかない費用(本社の事務の給料など)は、仕掛品にしない。' },
        { options: [0, 1, 3, 4], why: '前もって受け取った代金は契約負債。提供した分だけ役務収益にする。' },
        { options: [0, 4], why: '特定の仕事のための費用は、終わるまで仕掛品にためる。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'compare' },
    }),
  );

  return { topic: T, questions };
}
