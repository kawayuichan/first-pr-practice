// K10 標準原価計算 の問題(12問)
// 仕訳2問・数値9問・複数選択1問。金額はすべて step() で計算する。
// 標準原価(完成品・月末仕掛品)、直接材料費差異(価格・数量)、直接労務費差異(賃率・時間)、
// 製造間接費差異(予算・能率・操業度。能率差異は変動費と固定費の両方から計算)、シングル・プラン、売上原価加減法。

import { journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K10';

export default function build() {
  const questions = [];

  // 共通の資料
  const c = { mp: 150, mq: 4, lr: 1200, vr: 400, fixed: 360000, base: 600 };
  const p = { bQty: 200, bProg: 50, done: 1100, eQty: 300, eProg: 40 };
  const a = { kg: 4900, mPrice: 152, hours: 575, rate: 1180, oh: 593000 };
  // 標準原価カード(時間は 0.5時間なので「× 5 ÷ 10」で計算する)
  const fr = step('固定費率(固定費予算 ÷ 基準操業度)', 'div', [c.fixed, c.base]);
  const ohr = step('標準配賦率(変動費率 + 固定費率)', 'add', [c.vr, fr.value]);
  const cm = step('1個あたりの直接材料費(標準単価 × 標準消費量)', 'mul', [c.mp, c.mq]);
  const clm = step('1個あたりの直接労務費(標準賃率 × 5)', 'mul', [c.lr, 5]);
  const cl = step('1個あたりの直接労務費(÷ 10。0.5時間)', 'div', [clm.value, 10]);
  const com = step('1個あたりの製造間接費(標準配賦率 × 5)', 'mul', [ohr.value, 5]);
  const co = step('1個あたりの製造間接費(÷ 10。0.5時間)', 'div', [com.value, 10]);
  const cconv = step('1個あたりの加工費(直接労務費 + 製造間接費)', 'add', [cl.value, co.value]);
  const card = step('1個あたりの標準原価(直接材料費 + 加工費)', 'add', [cm.value, cconv.value]);
  const cardSteps = [fr, ohr, cm, clm, cl, com, co, cconv, card];
  const data = `標準原価カード(製品1個あたり)は、直接材料費 ¥${c.mp} × ${c.mq}kg、直接労務費 ¥${c.lr.toLocaleString()} × 0.5時間、製造間接費(直接作業時間で配賦)× 0.5時間。製造間接費は公式法変動予算で、変動費率 ¥${c.vr}、固定費の月間予算 ${yen(c.fixed)}、基準操業度 ${c.base}時間。当月の生産は、月初仕掛品 ${p.bQty}個(加工進捗度 ${p.bProg}%)、完成品 ${p.done.toLocaleString()}個、月末仕掛品 ${p.eQty}個(加工進捗度 ${p.eProg}%)。直接材料は始点で投入する。当月の実際は、直接材料 ${a.kg.toLocaleString()}kg(単価 ¥${a.mPrice})、直接作業 ${a.hours}時間(賃率 ¥${a.rate.toLocaleString()})、製造間接費 ${yen(a.oh)}。`;
  // 当月投入
  const in1 = step('直接材料の当月投入(完成 + 月末)', 'add', [p.done, p.eQty]);
  const inQ = step('直接材料の当月投入(− 月初)', 'sub', [in1.value, p.bQty]);
  const stdKg = step('標準消費量(当月投入 × 標準消費量)', 'mul', [inQ.value, c.mq]);
  const eEqM = step('月末の換算量(数量 × 進捗度)', 'mul', [p.eQty, p.eProg]);
  const eEq = step('月末の換算量(÷ 100)', 'div', [eEqM.value, 100]);
  const bEqM = step('月初の換算量(数量 × 進捗度)', 'mul', [p.bQty, p.bProg]);
  const bEq = step('月初の換算量(÷ 100)', 'div', [bEqM.value, 100]);
  const cv1 = step('加工の当月投入(完成 + 月末の換算量)', 'add', [p.done, eEq.value]);
  const cvQ = step('加工の当月投入(− 月初の換算量)', 'sub', [cv1.value, bEq.value]);
  const stdHm = step('標準直接作業時間(加工の当月投入 × 5)', 'mul', [cvQ.value, 5]);
  const stdH = step('標準直接作業時間(÷ 10。1個 0.5時間)', 'div', [stdHm.value, 10]);
  const kgSteps = [in1, inQ, stdKg];
  const hSteps = [eEqM, eEq, bEqM, bEq, cv1, cvQ, stdHm, stdH];

  // 1. 完成品の標準原価
  {
    const done = step('完成品の標準原価(完成品数量 × 1個あたり)', 'mul', [p.done, card.value]);
    const w1 = step('誤答: 1個あたりの直接材料費 + 直接労務費(製造間接費を入れない)', 'add', [cm.value, cl.value]);
    const wrong = step('誤答: 完成品数量 × その額', 'mul', [p.done, w1.value]);
    questions.push(
      numericQ({
        id: 'K10-001',
        topic: T,
        difficulty: 1,
        prompt: `${data}完成品の標準原価はいくらか。`,
        answer: done.value,
        calc: [...cardSteps, done],
        explanation: `1個あたりの標準原価は、${yen(cm.value)} + ${yen(cl.value)} + ${yen(co.value)} = ${yen(card.value)}(製造間接費の標準配賦率は ¥${c.vr} + ¥${fr.value} = ¥${ohr.value})。${p.done.toLocaleString()}個 × ${yen(card.value)} = ${yen(done.value)}。`,
        mistakes: [{ value: wrong.value, calc: [cm, clm, cl, w1, wrong], why: '標準原価には、製造間接費(標準配賦率 × 標準時間)も含める。' }],
        ref: { topic: T, anchor: 'standard' },
      }),
    );
  }

  // 2. 月末仕掛品の標準原価
  {
    const m = step('月末の直接材料費(数量 × 1個あたり)', 'mul', [p.eQty, cm.value]);
    const cv = step('月末の加工費(換算量 × 1個あたりの加工費)', 'mul', [eEq.value, cconv.value]);
    const end = step('月末仕掛品の標準原価', 'add', [m.value, cv.value]);
    const wrong = step('誤答: 月末の数量 × 1個あたりの標準原価', 'mul', [p.eQty, card.value]);
    questions.push(
      numericQ({
        id: 'K10-002',
        topic: T,
        difficulty: 2,
        prompt: `${data}月末仕掛品の標準原価はいくらか。`,
        answer: end.value,
        calc: [...cardSteps, eEqM, eEq, m, cv, end],
        explanation: `直接材料費は数量で ${p.eQty}個 × ${yen(cm.value)} = ${yen(m.value)}。加工費は換算量で ${eEq.value}個 × ${yen(cconv.value)} = ${yen(cv.value)}。合計 ${yen(end.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...cardSteps, wrong], why: '仕掛品の加工費は、数量ではなく完成品換算量にかける。' }],
        ref: { topic: T, anchor: 'standard' },
      }),
    );
  }

  // 3〜4. 直接材料費差異
  {
    const diff = step('単価の差(実際単価 − 標準単価)', 'sub', [a.mPrice, c.mp]);
    const pv = step('価格差異(単価の差 × 実際消費量。不利の額)', 'mul', [diff.value, a.kg]);
    const wrong = step('誤答: 単価の差 × 標準消費量', 'mul', [diff.value, stdKg.value]);
    questions.push(
      numericQ({
        id: 'K10-003',
        topic: T,
        difficulty: 2,
        prompt: `${data}直接材料費の価格差異はいくらの不利差異か。`,
        answer: pv.value,
        calc: [diff, pv],
        explanation: `価格差異 = (標準単価 − 実際単価)× 実際消費量 = (¥${c.mp} − ¥${a.mPrice})× ${a.kg.toLocaleString()}kg。実際のほうが ¥${diff.value} 高いので、${yen(pv.value)} の不利差異。`,
        mistakes: [{ value: wrong.value, calc: [...kgSteps, diff, wrong], why: '価格差異は、標準消費量ではなく実際消費量にかける。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }
  {
    const over = step('消費量の超過(実際消費量 − 標準消費量)', 'sub', [a.kg, stdKg.value]);
    const qv = step('数量差異(標準単価 × 超過量。不利の額)', 'mul', [c.mp, over.value]);
    const wStd = step('誤答: 完成品数量で計算した標準消費量', 'mul', [p.done, c.mq]);
    const wOver = step('誤答: 実際消費量 − 完成品の標準消費量', 'sub', [a.kg, wStd.value]);
    const wrong = step('誤答: 標準単価 × その差', 'mul', [c.mp, wOver.value]);
    questions.push(
      numericQ({
        id: 'K10-004',
        topic: T,
        difficulty: 3,
        prompt: `${data}直接材料費の数量差異はいくらの不利差異か。`,
        answer: qv.value,
        calc: [...kgSteps, over, qv],
        explanation: `直接材料の当月投入は ${p.done.toLocaleString()} + ${p.eQty} − ${p.bQty} = ${inQ.value.toLocaleString()}個、標準消費量は × ${c.mq}kg = ${stdKg.value.toLocaleString()}kg。実際 ${a.kg.toLocaleString()}kg との差 ${over.value}kg × 標準単価 ¥${c.mp} = ${yen(qv.value)}(不利)。`,
        mistakes: [{ value: wrong.value, calc: [wStd, wOver, wrong], why: '標準消費量は、完成品数量ではなく当月投入の数量で計算する。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 5〜6. 直接労務費差異
  {
    const diff = step('賃率の差(標準賃率 − 実際賃率)', 'sub', [c.lr, a.rate]);
    const rv = step('賃率差異(賃率の差 × 実際時間。有利の額)', 'mul', [diff.value, a.hours]);
    const wrong = step('誤答: 賃率の差 × 標準時間', 'mul', [diff.value, stdH.value]);
    questions.push(
      numericQ({
        id: 'K10-005',
        topic: T,
        difficulty: 2,
        prompt: `${data}直接労務費の賃率差異はいくらの有利差異か。`,
        answer: rv.value,
        calc: [diff, rv],
        explanation: `賃率差異 = (標準賃率 − 実際賃率)× 実際時間 = ¥${diff.value} × ${a.hours}時間 = ${yen(rv.value)}。実際の賃率のほうが低いので有利。`,
        mistakes: [{ value: wrong.value, calc: [...hSteps, diff, wrong], why: '賃率差異は、標準時間ではなく実際の作業時間にかける。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }
  {
    const over = step('時間の超過(実際時間 − 標準時間)', 'sub', [a.hours, stdH.value]);
    const tv = step('時間差異(標準賃率 × 超過時間。不利の額)', 'mul', [c.lr, over.value]);
    const wm = step('誤答: 完成品数量 × 5', 'mul', [p.done, 5]);
    const wStd = step('誤答: 完成品数量で計算した標準時間(÷ 10)', 'div', [wm.value, 10]);
    const wOver = step('誤答: 実際時間 − その標準時間', 'sub', [a.hours, wStd.value]);
    const wrong = step('誤答: 標準賃率 × その差', 'mul', [c.lr, wOver.value]);
    questions.push(
      numericQ({
        id: 'K10-006',
        topic: T,
        difficulty: 3,
        prompt: `${data}直接労務費の時間差異はいくらの不利差異か。`,
        answer: tv.value,
        calc: [...hSteps, over, tv],
        explanation: `加工の当月投入(換算量)は ${p.done.toLocaleString()} + ${eEq.value} − ${bEq.value} = ${cvQ.value.toLocaleString()}個、標準時間は × 0.5 = ${stdH.value}時間。実際 ${a.hours}時間との差 ${over.value}時間 × 標準賃率 ¥${c.lr.toLocaleString()} = ${yen(tv.value)}(不利)。`,
        mistakes: [{ value: wrong.value, calc: [wm, wStd, wOver, wrong], why: '標準時間は、完成品数量ではなく加工の当月投入(換算量)で計算する。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 7〜9. 製造間接費差異
  {
    const vb = step('変動費の予算(変動費率 × 実際時間)', 'mul', [c.vr, a.hours]);
    const allowed = step('予算許容額(+ 固定費予算)', 'add', [vb.value, c.fixed]);
    const bv = step('予算差異(実際発生額 − 予算許容額。不利の額)', 'sub', [a.oh, allowed.value]);
    const wb = step('誤答: 変動費率 × 基準操業度', 'mul', [c.vr, c.base]);
    const wa = step('誤答: 基準操業度での予算', 'add', [wb.value, c.fixed]);
    const wrong = step('誤答: 基準操業度での予算 − 実際発生額', 'sub', [wa.value, a.oh]);
    questions.push(
      numericQ({
        id: 'K10-007',
        topic: T,
        difficulty: 2,
        prompt: `${data}製造間接費の予算差異はいくらの不利差異か。`,
        answer: bv.value,
        calc: [vb, allowed, bv],
        explanation: `予算許容額 = ¥${c.vr} × ${a.hours}時間 + ${yen(c.fixed)} = ${yen(allowed.value)}。実際 ${yen(a.oh)} との差 ${yen(bv.value)} が不利差異。`,
        mistakes: [{ value: wrong.value, calc: [wb, wa, wrong], why: '予算許容額は、基準操業度ではなく実際の作業時間で計算する。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }
  {
    const over = step('時間の超過(実際時間 − 標準時間)', 'sub', [a.hours, stdH.value]);
    const ev = step('能率差異(標準配賦率 × 超過時間。不利の額)', 'mul', [ohr.value, over.value]);
    const wrong = step('誤答: 変動費率 × 超過時間', 'mul', [c.vr, over.value]);
    questions.push(
      numericQ({
        id: 'K10-008',
        topic: T,
        difficulty: 3,
        prompt: `${data}能率差異は変動費と固定費の両方から計算する。製造間接費の能率差異はいくらの不利差異か。`,
        answer: ev.value,
        calc: [fr, ohr, ...hSteps, over, ev],
        explanation: `標準時間 ${stdH.value}時間より ${over.value}時間多くかかった。変動費と固定費の両方から計算するので、標準配賦率 ¥${ohr.value} × ${over.value}時間 = ${yen(ev.value)}(不利)。`,
        mistakes: [{ value: wrong.value, calc: [...hSteps, over, wrong], why: '能率差異を変動費と固定費の両方から計算するときは、変動費率ではなく標準配賦率を使う。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }
  {
    const short = step('操業度の不足(基準操業度 − 実際時間)', 'sub', [c.base, a.hours]);
    const vv = step('操業度差異(固定費率 × 不足時間。不利の額)', 'mul', [fr.value, short.value]);
    const wrong = step('誤答: 標準配賦率 × 不足時間', 'mul', [ohr.value, short.value]);
    questions.push(
      numericQ({
        id: 'K10-009',
        topic: T,
        difficulty: 2,
        prompt: `${data}製造間接費の操業度差異はいくらの不利差異か。`,
        answer: vv.value,
        calc: [fr, short, vv],
        explanation: `操業度差異 = 固定費率 ×(実際時間 − 基準操業度)。固定費率 ${yen(c.fixed)} ÷ ${c.base}時間 = ¥${fr.value}。¥${fr.value} × ${short.value}時間 = ${yen(vv.value)}(実際が基準より少ないので不利)。`,
        mistakes: [{ value: wrong.value, calc: [fr, ohr, short, wrong], why: '操業度差異は、固定費率だけを使う。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 10. シングル・プランの材料消費
  {
    const std = step('仕掛品に記入する標準原価(標準単価 × 標準消費量)', 'mul', [c.mp, stdKg.value]);
    const act = step('材料の実際消費額(実際単価 × 実際消費量)', 'mul', [a.mPrice, a.kg]);
    const diff = step('単価の差(実際 − 標準)', 'sub', [a.mPrice, c.mp]);
    const pv = step('価格差異', 'mul', [diff.value, a.kg]);
    const over = step('消費量の超過', 'sub', [a.kg, stdKg.value]);
    const qv = step('数量差異', 'mul', [c.mp, over.value]);
    questions.push(
      journalQ({
        id: 'K10-010',
        topic: T,
        difficulty: 3,
        prompt: `${data}シングル・プランで、当月の直接材料の消費を記帳する。`,
        choices: ['仕掛品', '価格差異', '数量差異', '材料', '製品', '材料消費価格差異', '売上原価'],
        debit: [line('仕掛品', std.value), line('価格差異', pv.value), line('数量差異', qv.value)],
        credit: [line('材料', act.value)],
        calc: [...kgSteps, std, act, diff, pv, over, qv],
        explanation: `シングル・プランでは、仕掛品には標準原価 ¥${c.mp} × ${stdKg.value.toLocaleString()}kg = ${yen(std.value)} だけを書く。実際 ${yen(act.value)} との差は、価格差異 ${yen(pv.value)} と数量差異 ${yen(qv.value)}(どちらも不利なので借方)。`,
        mistakes: [
          {
            entry: { debit: [line('仕掛品', act.value)], credit: [line('材料', act.value)] },
            why: 'それはパーシャル・プランの記帳。シングル・プランでは、仕掛品には標準原価だけを書き、差異は材料の消費の時点で出す。',
          },
        ],
        ref: { topic: T, anchor: 'single' },
      }),
    );
  }

  // 11. 売上原価加減法
  {
    const unf = 32000;
    const fav = 12000;
    const net = step('売上原価に加える額(不利差異 − 有利差異)', 'sub', [unf, fav]);
    questions.push(
      journalQ({
        id: 'K10-011',
        topic: T,
        difficulty: 2,
        prompt: `会計年度末に、数量差異の借方残高 ${yen(unf)}(不利差異)と、賃率差異の貸方残高 ${yen(fav)}(有利差異)を、売上原価に振り替えた。`,
        choices: ['売上原価', '数量差異', '賃率差異', '仕掛品', '製品', '雑益'],
        debit: [line('売上原価', net.value), line('賃率差異', fav)],
        credit: [line('数量差異', unf)],
        calc: [net],
        explanation: `不利差異 ${yen(unf)} は売上原価に加え、有利差異 ${yen(fav)} は差し引く。差し引き ${yen(net.value)} を売上原価の借方へ。各差異の残高は、反対側に記入して消す。`,
        mistakes: [
          {
            entry: { debit: [line('数量差異', unf)], credit: [line('売上原価', net.value), line('賃率差異', fav)] },
            why: '借方残高の数量差異は貸方に、貸方残高の賃率差異は借方に記入して消す。不利差異の分、売上原価は増える(借方)。',
          },
        ],
        ref: { topic: T, anchor: 'year-end' },
      }),
    );
  }

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K10-012',
      topic: T,
      difficulty: 2,
      prompt: '標準原価計算について、正しいものをすべて選びなさい。',
      options: [
        'パーシャル・プランでは、仕掛品勘定の借方に当月の実際原価を書き、差異を仕掛品勘定から振り替える',
        'シングル・プランでは、仕掛品勘定の借方にも貸方にも実際原価を書く',
        '価格差異は、標準単価と実際単価の差に実際消費量をかけて計算する',
        '操業度差異は、標準配賦率に操業度の差をかけて計算する',
        '標準消費量は、完成品数量ではなく当月投入の数量にもとづいて計算する',
      ],
      answer: [0, 2, 4],
      explanation: 'シングル・プランの仕掛品勘定は、借方も貸方も標準原価。操業度差異は固定費率 × 操業度の差。',
      mistakes: [
        { options: [0, 1, 2, 4], why: 'シングル・プランでは、仕掛品勘定には標準原価だけを書く。' },
        { options: [0, 2, 3, 4], why: '操業度差異は、固定費率だけを使う(変動費は操業度に比例するので差異にならない)。' },
        { options: [0, 2], why: '標準消費量は当月投入の数量で計算する。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'partial' },
    }),
  );

  return { topic: T, questions };
}
