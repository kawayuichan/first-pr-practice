// K09 総合原価計算② の問題(10問)
// 仕訳3問・数値5問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 等級別(積数の比で按分)、組別(組間接費の配賦)、工程別(全原価要素・累加法、前工程費)。
// 等級・組・工程の科目名(1級製品・A組仕掛品・第1工程仕掛品など)は公式表外の補助リストにある。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K09';

export default function build() {
  const questions = [];

  // 1〜3. 等級別総合原価計算
  const g = { cost: 760000, q1: 1000, q2: 1500 };
  const gData = `等級別総合原価計算を行っている。当月の完成品総合原価は ${yen(g.cost)}。完成品は、1級製品 ${g.q1.toLocaleString()}個(等価係数 1)、2級製品 ${g.q2.toLocaleString()}個(等価係数 0.6)。なお、1級・2級は製品の等級の名前である。`;
  const p2m = step('2級製品の積数(数量 × 6)', 'mul', [g.q2, 6]);
  const p2 = step('2級製品の積数(÷ 10。等価係数 0.6)', 'div', [p2m.value, 10]);
  const pAll = step('積数の合計(1級 + 2級)', 'add', [g.q1, p2.value]);
  const perP = step('積数1あたりの原価', 'div', [g.cost, pAll.value]);
  const c1 = step('1級製品の完成品原価(積数 × 積数1あたり)', 'mul', [g.q1, perP.value]);
  const c2 = step('2級製品の完成品原価(積数 × 積数1あたり)', 'mul', [p2.value, perP.value]);
  const gSteps = [p2m, p2, pAll, perP];
  {
    const qAll = step('誤答: 数量の合計', 'add', [g.q1, g.q2]);
    const wm = step('誤答: 完成品総合原価 × 1級の数量', 'mul', [g.cost, g.q1]);
    const wrong = step('誤答: 数量の比で分けた1級の原価', 'div', [wm.value, qAll.value]);
    questions.push(
      numericQ({
        id: 'K09-001',
        topic: T,
        difficulty: 2,
        prompt: `${gData}1級製品の完成品原価はいくらか。`,
        answer: c1.value,
        calc: [...gSteps, c1],
        explanation: `積数は、1級 ${g.q1.toLocaleString()} × 1 = ${g.q1.toLocaleString()}、2級 ${g.q2.toLocaleString()} × 0.6 = ${p2.value}、合計 ${pAll.value.toLocaleString()}。${yen(g.cost)} ÷ ${pAll.value.toLocaleString()} = ¥${perP.value}。1級 ${g.q1.toLocaleString()} × ¥${perP.value} = ${yen(c1.value)}。`,
        mistakes: [{ value: wrong.value, calc: [qAll, wm, wrong], why: '等級別は、数量の比ではなく、等価係数をかけた積数の比で分ける。' }],
        ref: { topic: T, anchor: 'grade' },
      }),
    );
  }
  {
    const unit = step('2級製品の単位原価(完成品原価 ÷ 数量)', 'div', [c2.value, g.q2]);
    questions.push(
      numericQ({
        id: 'K09-002',
        topic: T,
        difficulty: 3,
        prompt: `${gData}2級製品の単位原価(1個あたり)はいくらか。`,
        answer: unit.value,
        calc: [...gSteps, c2, unit],
        explanation: `2級製品の完成品原価は 積数 ${p2.value} × ¥${perP.value} = ${yen(c2.value)}。これを2級製品の数量 ${g.q2.toLocaleString()}個で割って ¥${unit.value}。`,
        mistakes: [{ value: perP.value, calc: gSteps, why: 'それは積数1あたりの原価(1級製品の単位原価と同じ)。2級製品の原価 ÷ 2級製品の数量で計算する。' }],
        ref: { topic: T, anchor: 'grade' },
      }),
    );
  }
  {
    const qAll = step('誤答: 数量の合計', 'add', [g.q1, g.q2]);
    const wm = step('誤答: 完成品総合原価 × 1級の数量', 'mul', [g.cost, g.q1]);
    const w1 = step('誤答: 数量の比で分けた1級の原価', 'div', [wm.value, qAll.value]);
    const w2 = step('誤答: 数量の比で分けた2級の原価', 'sub', [g.cost, w1.value]);
    questions.push(
      journalQ({
        id: 'K09-003',
        topic: T,
        difficulty: 2,
        prompt: `${gData}完成品原価を各等級の製品勘定に振り替える。`,
        choices: ['1級製品', '2級製品', '仕掛品', '売上原価', '製造間接費', '材料'],
        debit: [line('1級製品', c1.value), line('2級製品', c2.value)],
        credit: [line('仕掛品', g.cost)],
        calc: [...gSteps, c1, c2],
        explanation: `積数の比で分けて、1級製品 ${yen(c1.value)}、2級製品 ${yen(c2.value)}。合計は完成品総合原価 ${yen(g.cost)}。`,
        mistakes: [
          {
            entry: { debit: [line('1級製品', w1.value), line('2級製品', w2.value)], credit: [line('仕掛品', g.cost)] },
            why: '数量の比ではなく、等価係数をかけた積数の比で分ける。',
            calc: [qAll, wm, w1, w2],
          },
        ],
        ref: { topic: T, anchor: 'grade' },
      }),
    );
  }

  // 4〜6. 組別総合原価計算
  const ind = 240000;
  const hA = 500;
  const hB = 300;
  const hAll = step('機械運転時間の合計(A組 + B組)', 'add', [hA, hB]);
  const aM = step('組間接費 × A組の時間', 'mul', [ind, hA]);
  const aInd = step('A組への配賦額(÷ 合計時間)', 'div', [aM.value, hAll.value]);
  const bInd = step('B組への配賦額(組間接費 − A組への配賦額)', 'sub', [ind, aInd.value]);
  const indText = `組間接費 ${yen(ind)} を、機械運転時間(A組 ${hA}時間、B組 ${hB}時間)で各組に配賦する。`;
  {
    const wrong = step('誤答: 2つの組に均等に分けた額', 'div', [ind, 2]);
    questions.push(
      numericQ({
        id: 'K09-004',
        topic: T,
        difficulty: 1,
        prompt: `組別総合原価計算を行っている。${indText}A組への配賦額はいくらか。`,
        answer: aInd.value,
        calc: [hAll, aM, aInd],
        explanation: `${yen(ind)} × ${hA}時間 ÷ ${hAll.value}時間 = ${yen(aInd.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wrong], why: '組間接費は、均等ではなく配賦基準(機械運転時間)の比で配賦する。' }],
        ref: { topic: T, anchor: 'group' },
      }),
    );
  }
  questions.push(
    journalQ({
      id: 'K09-005',
      topic: T,
      difficulty: 2,
      prompt: `組別総合原価計算を行っている。${indText}`,
      choices: ['A組仕掛品', 'B組仕掛品', '組間接費', '製品', '仕掛品', '売上原価'],
      debit: [line('A組仕掛品', aInd.value), line('B組仕掛品', bInd.value)],
      credit: [line('組間接費', ind)],
      calc: [hAll, aM, aInd, bInd],
      explanation: `A組 ${yen(aInd.value)}、B組 ${yen(bInd.value)} を各組の仕掛品に配賦し、組間接費を減らす(貸方)。`,
      mistakes: [
        {
          entry: { debit: [line('組間接費', ind)], credit: [line('A組仕掛品', aInd.value), line('B組仕掛品', bInd.value)] },
          why: '配賦は、組間接費から各組の仕掛品へ移す。借方が各組の仕掛品。',
        },
      ],
      ref: { topic: T, anchor: 'group' },
    }),
  );
  {
    const a = { qIn: 2000, mat: 400000, conv: 154000, done: 1800, eQty: 200, eProg: 50 };
    const conv = step('A組の加工費(組直接費の加工費 + 組間接費の配賦額)', 'add', [a.conv, aInd.value]);
    const mRate = step('直接材料費の単価(当月投入 ÷ 数量)', 'div', [a.mat, a.qIn]);
    const mEnd = step('月末の直接材料費', 'mul', [a.eQty, mRate.value]);
    const eqM = step('月末の換算量(数量 × 進捗度)', 'mul', [a.eQty, a.eProg]);
    const eq = step('月末の換算量(÷ 100)', 'div', [eqM.value, 100]);
    const cq = step('加工費の換算量(完成 + 月末の換算量)', 'add', [a.done, eq.value]);
    const cRate = step('加工費の単価', 'div', [conv.value, cq.value]);
    const cEnd = step('月末の加工費', 'mul', [eq.value, cRate.value]);
    const end = step('A組の月末仕掛品原価', 'add', [mEnd.value, cEnd.value]);
    const wc = step('誤答: 月末の数量 × 加工費の単価(換算量を使わない)', 'mul', [a.eQty, cRate.value]);
    const wrong = step('誤答: 換算量を使わずに計算した月末仕掛品原価', 'add', [mEnd.value, wc.value]);
    questions.push(
      numericQ({
        id: 'K09-006',
        topic: T,
        difficulty: 3,
        prompt: `組別総合原価計算を行っている。${indText}A組は、月初仕掛品なし、当月投入 ${a.qIn.toLocaleString()}個(直接材料費 ${yen(a.mat)}、組直接費のうち加工費 ${yen(a.conv)})、完成品 ${a.done.toLocaleString()}個、月末仕掛品 ${a.eQty}個(加工進捗度 ${a.eProg}%)。直接材料は始点で投入し、組間接費は加工費に含める。A組の月末仕掛品原価はいくらか。`,
        answer: end.value,
        calc: [hAll, aM, aInd, conv, mRate, mEnd, eqM, eq, cq, cRate, cEnd, end],
        explanation: `A組の加工費 = ${yen(a.conv)} + 組間接費 ${yen(aInd.value)} = ${yen(conv.value)}。直接材料費: ¥${mRate.value} × ${a.eQty}個 = ${yen(mEnd.value)}。加工費: ${yen(conv.value)} ÷ ${cq.value.toLocaleString()}個 = ¥${cRate.value}、× ${eq.value}個 = ${yen(cEnd.value)}。合計 ${yen(end.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wc, wrong], why: '加工費は、月末の数量ではなく完成品換算量にかける。' }],
        ref: { topic: T, anchor: 'group' },
      }),
    );
  }

  // 7〜8. 工程別総合原価計算(累加法)
  const p1 = { qIn: 1200, mat: 360000, conv: 220000, done: 1000, eQty: 200, eProg: 50 };
  const p1MRate = step('第1工程 直接材料費の単価', 'div', [p1.mat, p1.qIn]);
  const p1MEnd = step('第1工程 月末の直接材料費', 'mul', [p1.eQty, p1MRate.value]);
  const p1EqM = step('第1工程 月末の換算量(数量 × 進捗度)', 'mul', [p1.eQty, p1.eProg]);
  const p1Eq = step('第1工程 月末の換算量(÷ 100)', 'div', [p1EqM.value, 100]);
  const p1Cq = step('第1工程 加工費の換算量(完成 + 月末)', 'add', [p1.done, p1Eq.value]);
  const p1CRate = step('第1工程 加工費の単価', 'div', [p1.conv, p1Cq.value]);
  const p1CEnd = step('第1工程 月末の加工費', 'mul', [p1Eq.value, p1CRate.value]);
  const p1End = step('第1工程 月末仕掛品原価', 'add', [p1MEnd.value, p1CEnd.value]);
  const p1Tot = step('第1工程 原価の合計', 'add', [p1.mat, p1.conv]);
  const p1Done = step('第1工程 完成品原価(前工程費)', 'sub', [p1Tot.value, p1End.value]);
  const p1Steps = [p1MRate, p1MEnd, p1EqM, p1Eq, p1Cq, p1CRate, p1CEnd, p1End, p1Tot, p1Done];
  questions.push(
    journalQ({
      id: 'K09-007',
      topic: T,
      difficulty: 3,
      prompt: `工程別総合原価計算(累加法)を行っている。第1工程は、月初仕掛品なし、当月投入 ${p1.qIn.toLocaleString()}個(直接材料費 ${yen(p1.mat)}、加工費 ${yen(p1.conv)})、完成品 ${p1.done.toLocaleString()}個、月末仕掛品 ${p1.eQty}個(加工進捗度 ${p1.eProg}%)。直接材料は始点で投入する。第1工程の完成品を第2工程に送る。`,
      choices: ['第2工程仕掛品', '第1工程仕掛品', '製品', '仕掛品', '材料', '売上原価'],
      debit: [line('第2工程仕掛品', p1Done.value)],
      credit: [line('第1工程仕掛品', p1Done.value)],
      calc: p1Steps,
      explanation: `第1工程の月末仕掛品原価は ${yen(p1MEnd.value)} + ${yen(p1CEnd.value)} = ${yen(p1End.value)}。完成品原価は ${yen(p1Tot.value)} − ${yen(p1End.value)} = ${yen(p1Done.value)}。これを **前工程費** として第2工程仕掛品へ振り替える。`,
      mistakes: [
        {
          entry: { debit: [line('製品', p1Done.value)], credit: [line('第1工程仕掛品', p1Done.value)] },
          why: '第1工程の完成品は、まだ製品ではない。第2工程で加工を続けるので、第2工程仕掛品へ振り替える。',
        },
      ],
      ref: { topic: T, anchor: 'process' },
    }),
  );
  {
    const p2 = { done: 800, eQty: 200, eProg: 60 };
    const rate = step('前工程費の単価(前工程費 ÷ 受け入れた数量)', 'div', [p1Done.value, p1.done]);
    const end = step('第2工程 月末の前工程費(数量 × 単価)', 'mul', [p2.eQty, rate.value]);
    const wEqM = step('誤答: 第2工程の進捗度をかけた数量(× 進捗度)', 'mul', [p2.eQty, p2.eProg]);
    const wEq = step('誤答: 進捗度をかけた数量(÷ 100)', 'div', [wEqM.value, 100]);
    const wrong = step('誤答: 進捗度をかけた数量 × 単価', 'mul', [wEq.value, rate.value]);
    questions.push(
      numericQ({
        id: 'K09-008',
        topic: T,
        difficulty: 2,
        prompt: `工程別総合原価計算(累加法)を行っている。第2工程は、月初仕掛品なし。第1工程から ${p1.done.toLocaleString()}個(前工程費 ${yen(p1Done.value)})を受け入れ、完成品 ${p2.done}個、月末仕掛品 ${p2.eQty}個(第2工程の加工進捗度 ${p2.eProg}%)。第2工程の月末仕掛品に含まれる前工程費はいくらか。`,
        answer: end.value,
        calc: [rate, end],
        explanation: `前工程費は、第2工程の始点で投入した材料と同じ扱い。進捗度にかかわらず数量で分ける。${yen(p1Done.value)} ÷ ${p1.done.toLocaleString()}個 = ¥${rate.value}、× ${p2.eQty}個 = ${yen(end.value)}。`,
        mistakes: [{ value: wrong.value, calc: [rate, wEqM, wEq, wrong], why: '前工程費は始点投入と同じなので、加工進捗度はかけない。' }],
        ref: { topic: T, anchor: 'process' },
      }),
    );
  }

  // 9. 前工程費の扱い(選択)
  questions.push(
    choiceQ({
      id: 'K09-009',
      topic: T,
      difficulty: 2,
      prompt: '累加法の工程別総合原価計算で、第2工程の計算をするとき、前工程費はどのように扱うか。',
      options: [
        '第2工程の始点で投入した直接材料と同じように、数量で完成品と月末仕掛品に分ける',
        '第2工程の加工費と同じように、完成品換算量で分ける',
        '第2工程では計算せず、すべて完成品に含める',
        '第1工程の月末仕掛品に戻す',
      ],
      answer: 0,
      explanation: '前工程費は、第2工程の始点で受け入れるので、**始点投入の直接材料** と同じ扱い。月末仕掛品にも完成品と同じ1個分が入っている。',
      mistakes: [
        { option: 1, why: '前工程費は始点で受け入れるので、月末仕掛品にも1個分が全部入っている。換算量は使わない。' },
        { option: 2, why: '第2工程の月末仕掛品にも前工程費は含まれるので、完成品と月末に分ける。' },
        { option: 3, why: '第1工程で完成したものなので、第1工程には戻さない。' },
      ],
      ref: { topic: T, anchor: 'process' },
    }),
  );

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K09-010',
      topic: T,
      difficulty: 2,
      prompt: '等級別・組別・工程別総合原価計算について、正しいものをすべて選びなさい。',
      options: [
        '等級別総合原価計算では、完成品数量に等価係数をかけた積数の比で完成品原価を分ける',
        '組別総合原価計算では、組直接費も組間接費も、配賦基準で各組に配賦する',
        '工程別総合原価計算(累加法)では、第1工程の完成品原価を第2工程に前工程費として送る',
        '第1工程の完成品は、製品勘定に振り替える',
        '組間接費は、組ごとに完成品と月末仕掛品に分ける前に、各組に配賦する',
      ],
      answer: [0, 2, 4],
      explanation: '組直接費はその組に賦課する(配賦は組間接費だけ)。第1工程の完成品は第2工程仕掛品へ。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '組直接費は、どの組の費用かわかるので、その組に直接賦課する。' },
        { options: [0, 2, 3, 4], why: '第1工程の完成品は、第2工程仕掛品へ振り替える。製品になるのは最終工程の完成品。' },
        { options: [0, 2], why: '組間接費は、組ごとの計算の前に配賦し、加工費に含める。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'compare' },
    }),
  );

  return { topic: T, questions };
}
