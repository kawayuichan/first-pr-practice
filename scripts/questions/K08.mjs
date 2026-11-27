// K08 総合原価計算① の問題(12問)
// 仕訳1問・数値9問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 完成品換算量、平均法・先入先出法、正常仕損(度外視法: 終点は完成品のみ負担、始点は両者負担)、仕損品の評価額。
// 直接材料はすべて工程の始点で投入する。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K08';
const pct = (n) => `${n}%`;

export default function build() {
  const questions = [];

  // 1. 完成品換算量(数値)
  {
    const units = 300;
    const prog = 40;
    const m = step('月末仕掛品の数量 × 加工進捗度(%)', 'mul', [units, prog]);
    const eq = step('完成品換算量(÷ 100)', 'div', [m.value, 100]);
    const rest = step('誤答: 残りの割合(100% − 進捗度)', 'sub', [100, prog]);
    const wm = step('誤答: 数量 × 残りの割合', 'mul', [units, rest.value]);
    const wrong = step('誤答: 残りの割合で計算した換算量(÷ 100)', 'div', [wm.value, 100]);
    questions.push(
      numericQ({
        id: 'K08-001',
        topic: T,
        difficulty: 1,
        unit: '個',
        prompt: `月末仕掛品は ${units}個、加工進捗度は ${pct(prog)} である。加工費の計算に使う月末仕掛品の完成品換算量は何個か。`,
        answer: eq.value,
        calc: [m, eq],
        explanation: `完成品換算量 = 数量 × 加工進捗度 = ${units}個 × ${pct(prog)} = ${eq.value}個。`,
        mistakes: [{ value: wrong.value, calc: [rest, wm, wrong], why: '加工進捗度は、加工が進んだ割合。残りの割合ではなく、進捗度そのものをかける。' }],
        ref: { topic: T, anchor: 'equivalent' },
      }),
    );
  }

  // 2〜7. 平均法・先入先出法(共通の資料)
  const d = {
    bQty: 200, bProg: 50, bMat: 44000, bConv: 16800,
    inQty: 1800, inMat: 360000, inConv: 255000,
    done: 1600, eQty: 400, eProg: 50,
  };
  const data = `直接材料は工程の始点ですべて投入する。月初仕掛品は ${d.bQty}個(加工進捗度 ${pct(d.bProg)}、直接材料費 ${yen(d.bMat)}、加工費 ${yen(d.bConv)})、当月投入は ${d.inQty.toLocaleString()}個(直接材料費 ${yen(d.inMat)}、加工費 ${yen(d.inConv)})、完成品は ${d.done.toLocaleString()}個、月末仕掛品は ${d.eQty}個(加工進捗度 ${pct(d.eProg)})。`;
  const bEqM = step('月初仕掛品の換算量(数量 × 進捗度)', 'mul', [d.bQty, d.bProg]);
  const bEq = step('月初仕掛品の換算量(÷ 100)', 'div', [bEqM.value, 100]);
  const eEqM = step('月末仕掛品の換算量(数量 × 進捗度)', 'mul', [d.eQty, d.eProg]);
  const eEq = step('月末仕掛品の換算量(÷ 100)', 'div', [eEqM.value, 100]);
  const eqSteps = [bEqM, bEq, eEqM, eEq];
  // 平均法
  const aMatSum = step('直接材料費の合計(月初 + 当月)', 'add', [d.bMat, d.inMat]);
  const aMatQty = step('直接材料費の数量(完成 + 月末)', 'add', [d.done, d.eQty]);
  const aMatRate = step('平均法の直接材料費の単価', 'div', [aMatSum.value, aMatQty.value]);
  const aMatEnd = step('月末仕掛品の直接材料費(平均法)', 'mul', [d.eQty, aMatRate.value]);
  const aConvSum = step('加工費の合計(月初 + 当月)', 'add', [d.bConv, d.inConv]);
  const aConvQty = step('加工費の換算量(完成 + 月末の換算量)', 'add', [d.done, eEq.value]);
  const aConvRate = step('平均法の加工費の単価', 'div', [aConvSum.value, aConvQty.value]);
  const aConvEnd = step('月末仕掛品の加工費(平均法)', 'mul', [eEq.value, aConvRate.value]);
  const aEnd = step('月末仕掛品原価(平均法)', 'add', [aMatEnd.value, aConvEnd.value]);
  const total = step('原価の合計(直接材料費 + 加工費)', 'add', [aMatSum.value, aConvSum.value]);
  const aDone = step('完成品総合原価(平均法)', 'sub', [total.value, aEnd.value]);
  const avgMatSteps = [aMatSum, aMatQty, aMatRate, aMatEnd];
  const avgConvSteps = [eEqM, eEq, aConvSum, aConvQty, aConvRate, aConvEnd];
  // 先入先出法
  const fMatRate = step('先入先出法の直接材料費の単価(当月投入 ÷ 当月投入の数量)', 'div', [d.inMat, d.inQty]);
  const fMatEnd = step('月末仕掛品の直接材料費(先入先出法)', 'mul', [d.eQty, fMatRate.value]);
  const fIn1 = step('当月投入の換算量(完成 + 月末の換算量)', 'add', [d.done, eEq.value]);
  const fInEq = step('当月投入の換算量(− 月初の換算量)', 'sub', [fIn1.value, bEq.value]);
  const fConvRate = step('先入先出法の加工費の単価(当月の加工費 ÷ 当月投入の換算量)', 'div', [d.inConv, fInEq.value]);
  const fConvEnd = step('月末仕掛品の加工費(先入先出法)', 'mul', [eEq.value, fConvRate.value]);
  const fEnd = step('月末仕掛品原価(先入先出法)', 'add', [fMatEnd.value, fConvEnd.value]);
  const fDone = step('完成品総合原価(先入先出法)', 'sub', [total.value, fEnd.value]);
  const fifoSteps = [...eqSteps, fMatRate, fMatEnd, fIn1, fInEq, fConvRate, fConvEnd, fEnd];

  questions.push(
    numericQ({
      id: 'K08-002',
      topic: T,
      difficulty: 2,
      prompt: `${data}平均法で、月末仕掛品の直接材料費はいくらか。`,
      answer: aMatEnd.value,
      calc: avgMatSteps,
      explanation: `直接材料は始点投入なので、数量で分ける。(${yen(d.bMat)} + ${yen(d.inMat)}) ÷ (${d.done.toLocaleString()} + ${d.eQty})個 = ¥${aMatRate.value}。月末 ${d.eQty}個 × ¥${aMatRate.value} = ${yen(aMatEnd.value)}。`,
      mistakes: [
        {
          value: fMatEnd.value,
          calc: [fMatRate, fMatEnd],
          why: 'それは先入先出法。平均法は、月初と当月の合計を、完成と月末の合計で割った単価を使う。',
        },
      ],
      ref: { topic: T, anchor: 'average' },
    }),
  );
  {
    const w = step('誤答: 月末の数量そのもの × 単価(換算量を使わない)', 'mul', [d.eQty, aConvRate.value]);
    questions.push(
      numericQ({
        id: 'K08-003',
        topic: T,
        difficulty: 2,
        prompt: `${data}平均法で、月末仕掛品の加工費はいくらか。`,
        answer: aConvEnd.value,
        calc: avgConvSteps,
        explanation: `月末の換算量は ${d.eQty} × ${pct(d.eProg)} = ${eEq.value}個。(${yen(d.bConv)} + ${yen(d.inConv)}) ÷ (${d.done.toLocaleString()} + ${eEq.value})個 = ¥${aConvRate.value}。${eEq.value}個 × ¥${aConvRate.value} = ${yen(aConvEnd.value)}。`,
        mistakes: [{ value: w.value, calc: [aConvSum, aConvQty, aConvRate, w], why: '加工費は、月末の数量ではなく完成品換算量(数量 × 進捗度)にかける。' }],
        ref: { topic: T, anchor: 'average' },
      }),
    );
  }
  questions.push(
    numericQ({
      id: 'K08-004',
      topic: T,
      difficulty: 3,
      prompt: `${data}平均法で、完成品総合原価はいくらか。`,
      answer: aDone.value,
      calc: [...avgMatSteps, ...avgConvSteps, aEnd, total, aDone],
      explanation: `月末仕掛品原価 = 直接材料費 ${yen(aMatEnd.value)} + 加工費 ${yen(aConvEnd.value)} = ${yen(aEnd.value)}。原価の合計 ${yen(total.value)} から引いて ${yen(aDone.value)}。`,
      mistakes: [{ value: fDone.value, calc: [...fifoSteps, total, fDone], why: 'それは先入先出法の結果。平均法の単価で月末を計算する。' }],
      ref: { topic: T, anchor: 'average' },
    }),
  );
  {
    const wConv = step('誤答: 月末の数量 × 加工費の単価(換算量を使わない)', 'mul', [d.eQty, fConvRate.value]);
    const wrong = step('誤答: その加工費を使った月末仕掛品原価', 'add', [fMatEnd.value, wConv.value]);
    questions.push(
      numericQ({
        id: 'K08-005',
        topic: T,
        difficulty: 3,
        prompt: `${data}先入先出法で、月末仕掛品原価はいくらか。`,
        answer: fEnd.value,
        calc: fifoSteps,
        explanation: `月末仕掛品はすべて当月投入から出る。直接材料費 ${yen(d.inMat)} ÷ ${d.inQty.toLocaleString()}個 = ¥${fMatRate.value} → ${yen(fMatEnd.value)}。当月投入の換算量 = ${d.done.toLocaleString()} + ${eEq.value} − ${bEq.value} = ${fInEq.value}個、加工費 ${yen(d.inConv)} ÷ ${fInEq.value.toLocaleString()} = ¥${fConvRate.value} → ${yen(fConvEnd.value)}。合計 ${yen(fEnd.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...fifoSteps.slice(0, -1), wConv, wrong], why: '加工費は、月末の数量ではなく完成品換算量(数量 × 進捗度)にかける。' }],
        ref: { topic: T, anchor: 'fifo' },
      }),
    );
  }
  questions.push(
    numericQ({
      id: 'K08-006',
      topic: T,
      difficulty: 3,
      prompt: `${data}先入先出法で、完成品総合原価はいくらか。`,
      answer: fDone.value,
      calc: [...fifoSteps, aMatSum, aConvSum, total, fDone],
      explanation: `月末仕掛品原価 ${yen(fEnd.value)} を、原価の合計 ${yen(total.value)} から引いて ${yen(fDone.value)}。月初仕掛品の原価は、すべて完成品に入る。`,
      mistakes: [{ value: aDone.value, calc: [...avgMatSteps, ...avgConvSteps, aEnd, total, aDone], why: 'それは平均法の結果。先入先出法は、月末を当月投入の単価だけで計算する。' }],
      ref: { topic: T, anchor: 'fifo' },
    }),
  );
  questions.push(
    journalQ({
      id: 'K08-007',
      topic: T,
      difficulty: 2,
      prompt: `${data}平均法で計算した完成品総合原価を、製品勘定に振り替える。`,
      choices: ['製品', '仕掛品', '売上原価', '材料', '製造間接費', '賃金・給料'],
      debit: [line('製品', aDone.value)],
      credit: [line('仕掛品', aDone.value)],
      calc: [...avgMatSteps, ...avgConvSteps, aEnd, total, aDone],
      explanation: `完成品総合原価 ${yen(aDone.value)}(原価の合計 ${yen(total.value)} − 月末 ${yen(aEnd.value)})を、仕掛品から **製品** へ振り替える。`,
      mistakes: [
        {
          entry: { debit: [line('製品', total.value)], credit: [line('仕掛品', total.value)] },
          why: '月末仕掛品の原価は仕掛品に残す。振り替えるのは完成品の分だけ。',
        },
      ],
      ref: { topic: T, anchor: 'journal' },
    }),
  );

  // 8〜10. 正常仕損(度外視法)
  const s = { inQty: 2000, mat: 570000, conv: 342000, done: 1700, sp: 100, eQty: 200, eProg: 50 };
  const sData = `月初仕掛品はない。当月投入は ${s.inQty.toLocaleString()}個(直接材料費 ${yen(s.mat)}、加工費 ${yen(s.conv)})、完成品は ${s.done.toLocaleString()}個、正常仕損は ${s.sp}個、月末仕掛品は ${s.eQty}個(加工進捗度 ${pct(s.eProg)})。直接材料は工程の始点で投入する。仕損は度外視法で処理する。`;
  const sEqM = step('月末の換算量(数量 × 進捗度)', 'mul', [s.eQty, s.eProg]);
  const sEq = step('月末の換算量(÷ 100)', 'div', [sEqM.value, 100]);
  // 終点発生: 仕損の数量も分母に入れる
  const m1 = step('直接材料費の数量(完成 + 仕損)', 'add', [s.done, s.sp]);
  const m2 = step('直接材料費の数量(+ 月末)', 'add', [m1.value, s.eQty]);
  const mRate = step('直接材料費の単価(終点発生)', 'div', [s.mat, m2.value]);
  const mEnd = step('月末の直接材料費(終点発生)', 'mul', [s.eQty, mRate.value]);
  const c2 = step('加工費の換算量(完成 + 仕損 + 月末の換算量)', 'add', [m1.value, sEq.value]);
  const cRate = step('加工費の単価(終点発生)', 'div', [s.conv, c2.value]);
  const cEnd = step('月末の加工費(終点発生)', 'mul', [sEq.value, cRate.value]);
  const endA = step('月末仕掛品原価(終点発生)', 'add', [mEnd.value, cEnd.value]);
  const endSteps = [sEqM, sEq, m1, m2, mRate, mEnd, c2, cRate, cEnd, endA];
  {
    // 誤答: 両者負担として計算(仕損を分母から除く)
    const wq = step('誤答: 仕損を除いた数量(完成 + 月末)', 'add', [s.done, s.eQty]);
    const wmr = step('誤答: 仕損を除いた直接材料費の単価', 'div', [s.mat, wq.value]);
    const wm = step('誤答: 月末の直接材料費', 'mul', [s.eQty, wmr.value]);
    const wcq = step('誤答: 仕損を除いた換算量(完成 + 月末の換算量)', 'add', [s.done, sEq.value]);
    const wcr = step('誤答: 仕損を除いた加工費の単価', 'div', [s.conv, wcq.value]);
    const wc = step('誤答: 月末の加工費', 'mul', [sEq.value, wcr.value]);
    const wrong = step('誤答: 両者負担として計算した月末仕掛品原価', 'add', [wm.value, wc.value]);
    questions.push(
      numericQ({
        id: 'K08-008',
        topic: T,
        difficulty: 3,
        prompt: `${sData}仕損は工程の終点で発生した。月末仕掛品原価はいくらか。`,
        answer: endA.value,
        calc: endSteps,
        explanation: `終点で発生した仕損は、終点まで進んでいない月末仕掛品は負担しない(完成品だけが負担)。仕損の数量も分母に入れて月末を計算する。直接材料費 ${yen(s.mat)} ÷ ${m2.value.toLocaleString()}個 × ${s.eQty}個 = ${yen(mEnd.value)}、加工費 ${yen(s.conv)} ÷ ${c2.value.toLocaleString()}個 × ${sEq.value}個 = ${yen(cEnd.value)}。合計 ${yen(endA.value)}。`,
        mistakes: [{ value: wrong.value, calc: [sEqM, sEq, wq, wmr, wm, wcq, wcr, wc, wrong], why: 'それは両者負担の計算。終点発生なら、仕損の数量も分母に入れて、月末に仕損の原価が入らないようにする。' }],
        ref: { topic: T, anchor: 'spoilage' },
      }),
    );
  }
  {
    const q = { inQty: 1500, mat: 420000, done: 1200, sp: 100, eQty: 200, eProg: 60 };
    const qq = step('仕損を除いた数量(完成 + 月末)', 'add', [q.done, q.eQty]);
    const rate = step('直接材料費の単価(始点発生・両者負担)', 'div', [q.mat, qq.value]);
    const end = step('月末の直接材料費', 'mul', [q.eQty, rate.value]);
    const wRate = step('誤答: 仕損を含めた数量で割った単価', 'div', [q.mat, q.inQty]);
    const wrong = step('誤答: 月末の直接材料費', 'mul', [q.eQty, wRate.value]);
    questions.push(
      numericQ({
        id: 'K08-009',
        topic: T,
        difficulty: 3,
        prompt: `月初仕掛品はない。当月投入は ${q.inQty.toLocaleString()}個(直接材料費 ${yen(q.mat)})、完成品は ${q.done.toLocaleString()}個、正常仕損は ${q.sp}個、月末仕掛品は ${q.eQty}個(加工進捗度 ${pct(q.eProg)})。直接材料は工程の始点で投入する。仕損は工程の始点で発生し、度外視法で処理する。月末仕掛品の直接材料費はいくらか。`,
        answer: end.value,
        calc: [qq, rate, end],
        explanation: `始点で発生した仕損は、始点を通った月末仕掛品も負担する(両者負担)。仕損の数量を分母から除いて、${yen(q.mat)} ÷ (${q.done.toLocaleString()} + ${q.eQty})個 = ¥${rate.value}。月末 ${q.eQty}個 × ¥${rate.value} = ${yen(end.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wRate, wrong], why: '両者負担では、仕損の数量を分母から除く(度外視する)。そうすると仕損の原価が月末にも配られる。' }],
        ref: { topic: T, anchor: 'spoilage' },
      }),
    );
  }
  {
    const scrap = 10000;
    const tot = step('原価の合計(直接材料費 + 加工費)', 'add', [s.mat, s.conv]);
    const before = step('完成品総合原価(評価額を引く前)', 'sub', [tot.value, endA.value]);
    const doneV = step('完成品総合原価(− 仕損品の評価額)', 'sub', [before.value, scrap]);
    questions.push(
      numericQ({
        id: 'K08-010',
        topic: T,
        difficulty: 3,
        prompt: `${sData}仕損は工程の終点で発生し、仕損品には ${yen(scrap)} の評価額(売れる価値)がある。完成品総合原価はいくらか。`,
        answer: doneV.value,
        calc: [...endSteps, tot, before, doneV],
        explanation: `月末仕掛品原価は ${yen(endA.value)}(終点発生なので完成品だけが負担)。原価の合計 ${yen(tot.value)} − 月末 ${yen(endA.value)} = ${yen(before.value)} から、仕損品の評価額 ${yen(scrap)} を差し引いて ${yen(doneV.value)}。`,
        mistakes: [{ value: before.value, calc: [...endSteps, tot, before], why: '仕損品に評価額があるときは、完成品だけが負担する場合、その額を完成品総合原価から差し引く。' }],
        ref: { topic: T, anchor: 'spoilage' },
      }),
    );
  }

  // 11. どちらが負担するか(選択)
  questions.push(
    choiceQ({
      id: 'K08-011',
      topic: T,
      difficulty: 2,
      prompt: '正常仕損が工程の 60% の地点で発生し、月末仕掛品の加工進捗度は 40% である。度外視法で、仕損の原価を負担するのはどれか。',
      options: ['完成品だけ', '月末仕掛品だけ', '完成品と月末仕掛品の両方', 'どちらも負担せず、営業外費用にする'],
      answer: 0,
      explanation: '月末仕掛品(40%)は、仕損の発生点(60%)まで進んでいないので負担しない。仕損の原価は **完成品だけ** が負担する。',
      mistakes: [
        { option: 1, why: '完成品は60%の地点を通っているので、完成品は必ず負担する。' },
        { option: 2, why: '両者負担になるのは、月末仕掛品の進捗度が発生点以上のとき(例: 発生点30%、月末40%)。' },
        { option: 3, why: '正常な仕損の原価は、良品(製品)の原価に含める。' },
      ],
      ref: { topic: T, anchor: 'who-bears' },
    }),
  );

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K08-012',
      topic: T,
      difficulty: 2,
      prompt: '総合原価計算について、正しいものをすべて選びなさい。',
      options: [
        '始点で投入する直接材料費は、月末仕掛品の数量そのもので分ける',
        '先入先出法では、月末仕掛品を月初仕掛品と当月投入の平均の単価で計算する',
        '先入先出法では、月初仕掛品の原価はすべて完成品総合原価に入る',
        '正常仕損が終点で発生したときは、完成品と月末仕掛品の両方が負担する',
        '加工費は、完成品換算量(数量 × 加工進捗度)で完成品と月末仕掛品に分ける',
      ],
      answer: [0, 2, 4],
      explanation: '平均の単価を使うのは平均法。終点で発生した仕損は、完成品だけが負担する。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '先入先出法の月末仕掛品は、当月投入の単価だけで計算する。' },
        { options: [0, 2, 3, 4], why: '終点で発生した仕損は、終点まで進んでいない月末仕掛品は負担しない。' },
        { options: [0, 4], why: '先入先出法では、先に作り始めた月初仕掛品から完成するので、月初の原価はすべて完成品に入る。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'fifo' },
    }),
  );

  return { topic: T, questions };
}
