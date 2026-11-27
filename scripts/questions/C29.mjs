// C29 連結④連結精算表 の問題(8問)
// 表1問(連結精算表の貸借対照表の一部)・数値6問・複数選択1問。金額はすべて step() で計算する。
// 支配獲得後1年目の資本連結・成果連結をまとめて、連結財務諸表の金額を求める。

import { blankNum, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C29';
const F = 'q3_consolidation';

export default function build() {
  const questions = [];

  // 共通の資料
  const d = {
    ratio: 80, cost: 2000000, cap: 1500000, ret0: 700000, years: 10,
    sNi: 400000, sDiv: 150000, pNi: 1000000,
    inter: 800000, invFromP: 200000, gpRate: 25,
    arToS: 100000, allowRate: 2,
    pAr: 900000, sAr: 500000, pAllow: 18000, sAllow: 10000, pInv: 600000, sInv: 350000,
    pCogs: 3500000, sCogs: 1600000, pRet: 3000000,
  };
  const data = `P社は、X1年3月31日にS社の発行済株式の${d.ratio}%を ${yen(d.cost)} で取得して支配した(このときのS社の純資産は、資本金 ${yen(d.cap)}、利益剰余金 ${yen(d.ret0)})。のれんは${d.years}年で定額法により償却する。X2年3月期(1年目)の資料: S社の当期純利益 ${yen(d.sNi)}、S社の配当金 ${yen(d.sDiv)}。P社からS社への売上高 ${yen(d.inter)}、S社の期末商品のうちP社から仕入れた分 ${yen(d.invFromP)}(P社の売上総利益率 ${d.gpRate}%)。P社の売掛金のうちS社に対するもの ${yen(d.arToS)}(P社は売掛金に ${d.allowRate}% の貸倒引当金を設定)。`;
  const net0 = step('支配獲得日のS社の純資産', 'add', [d.cap, d.ret0]);
  const nr = step('非支配株主の比率(100 − 80)', 'sub', [100, d.ratio]);
  const nci0m = step('支配獲得日の非支配株主持分(純資産 × 20)', 'mul', [net0.value, nr.value]);
  const nci0 = step('支配獲得日の非支配株主持分(÷ 100)', 'div', [nci0m.value, 100]);
  const own = step('親会社の持分(純資産 − 非支配株主持分)', 'sub', [net0.value, nci0.value]);
  const gw = step('のれん(取得原価 − 親会社の持分)', 'sub', [d.cost, own.value]);
  const amort = step('のれん償却(÷ 10年)', 'div', [gw.value, d.years]);
  const gwEnd = step('期末ののれん(のれん − 償却)', 'sub', [gw.value, amort.value]);
  const niNm = step('非支配株主の利益(S社の当期純利益 × 20)', 'mul', [d.sNi, nr.value]);
  const niN = step('非支配株主に帰属する当期純利益(÷ 100)', 'div', [niNm.value, 100]);
  const divNm = step('非支配株主への配当(配当 × 20)', 'mul', [d.sDiv, nr.value]);
  const divN = step('非支配株主への配当(÷ 100)', 'div', [divNm.value, 100]);
  const divP = step('P社の受取配当金(配当 − 非支配株主の分)', 'sub', [d.sDiv, divN.value]);
  const urm = step('未実現利益(期末商品 × 売上総利益率)', 'mul', [d.invFromP, d.gpRate]);
  const ur = step('未実現利益(÷ 100)', 'div', [urm.value, 100]);
  const alm = step('消す貸倒引当金(S社への売掛金 × 2)', 'mul', [d.arToS, d.allowRate]);
  const al = step('消す貸倒引当金(÷ 100)', 'div', [alm.value, 100]);
  const gwSteps = [net0, nr, nci0m, nci0, own, gw];

  // 1. 連結精算表(貸借対照表の一部)
  {
    const arSum = step('売掛金の合計(P + S)', 'add', [d.pAr, d.sAr]);
    const arC = step('連結の売掛金(− 消去)', 'sub', [arSum.value, d.arToS]);
    const alSum = step('貸倒引当金の合計(P + S)', 'add', [d.pAllow, d.sAllow]);
    const alC = step('連結の貸倒引当金(− 消去)', 'sub', [alSum.value, al.value]);
    const invSum = step('商品の合計(P + S)', 'add', [d.pInv, d.sInv]);
    const invC = step('連結の商品(− 未実現利益)', 'sub', [invSum.value, ur.value]);
    const nciCr = step('非支配株主持分の修正貸方(支配獲得日 + 当期の利益)', 'add', [nci0.value, niN.value]);
    const nciC = step('連結の非支配株主持分(− 配当の分)', 'sub', [nciCr.value, divN.value]);
    questions.push(
      tableQ({
        id: 'C29-001',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `${data}X2年3月期の連結精算表(貸借対照表の一部)の空欄を埋めなさい。貸倒引当金と非支配株主持分は貸方の項目。何も書かない欄は空けたままにする。`,
        table: {
          title: '連結精算表(一部)',
          columns: [
            { label: '科目' },
            { label: 'P社', align: 'right' },
            { label: 'S社', align: 'right' },
            { label: '借方', group: '修正・消去', align: 'right' },
            { label: '貸方', group: '修正・消去', align: 'right' },
            { label: '連結', align: 'right' },
          ],
          rows: [
            ['売掛金', d.pAr, d.sAr, null, blankNum(d.arToS), blankNum(arC.value)],
            ['貸倒引当金', d.pAllow, d.sAllow, blankNum(al.value), null, blankNum(alC.value)],
            ['商品', d.pInv, d.sInv, null, blankNum(ur.value), blankNum(invC.value)],
            ['のれん', null, null, gw.value, blankNum(amort.value), blankNum(gwEnd.value)],
            ['子会社株式', d.cost, null, null, blankNum(d.cost), null],
            ['非支配株主持分', null, null, blankNum(divN.value), blankNum(nciCr.value), blankNum(nciC.value)],
          ],
        },
        checks: [
          { label: '売掛金: P + S + 借方 − 貸方', op: 'add', args: [[0, 1], [0, 2], [0, 3], ['-', 0, 4]], result: [0, 5] },
          { label: '貸倒引当金: P + S − 借方 + 貸方', op: 'add', args: [[1, 1], [1, 2], ['-', 1, 3], [1, 4]], result: [1, 5] },
          { label: '商品: P + S + 借方 − 貸方', op: 'add', args: [[2, 1], [2, 2], [2, 3], ['-', 2, 4]], result: [2, 5] },
          { label: 'のれん: 借方 − 貸方', op: 'add', args: [[3, 3], ['-', 3, 4]], result: [3, 5] },
          { label: '子会社株式: P − 貸方 = 0', op: 'add', args: [[4, 1], ['-', 4, 4]], result: [4, 5] },
          { label: '非支配株主持分: − 借方 + 貸方', op: 'add', args: [['-', 5, 3], [5, 4]], result: [5, 5] },
        ],
        calc: [...gwSteps, amort, gwEnd, niNm, niN, divNm, divN, urm, ur, alm, al, arSum, arC, alSum, alC, invSum, invC, nciCr, nciC],
        explanation: `売掛金はS社への ${yen(d.arToS)} を消して ${yen(arC.value)}。貸倒引当金はその2%の ${yen(al.value)} を消して ${yen(alC.value)}。商品は未実現利益 ${yen(ur.value)} を消して ${yen(invC.value)}。のれんは ${yen(gw.value)} − 償却 ${yen(amort.value)} = ${yen(gwEnd.value)}。子会社株式は相殺して残らない。非支配株主持分は ${yen(nci0.value)} + 当期の利益 ${yen(niN.value)}(貸方)− 配当 ${yen(divN.value)}(借方)= ${yen(nciC.value)}。`,
        mistakes: [
          { cell: [2, 5], value: invSum.value, calc: [invSum], why: 'S社の期末商品に含まれる未実現利益を消す。' },
          { cell: [5, 5], value: nciCr.value, calc: [nciCr], why: '非支配株主への配当の分、非支配株主持分は減る(修正の借方)。' },
        ],
        ref: { topic: T, anchor: 'row' },
      }),
    );
  }

  // 2. 連結の売上原価
  {
    const s = step('売上原価の合計(P + S)', 'add', [d.pCogs, d.sCogs]);
    const a = step('− グループ内の売上', 'sub', [s.value, d.inter]);
    const ans = step('連結の売上原価(+ 期末の未実現利益)', 'add', [a.value, ur.value]);
    questions.push(
      numericQ({
        id: 'C29-002',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${data}売上原価は、P社 ${yen(d.pCogs)}、S社 ${yen(d.sCogs)}。連結損益計算書の売上原価はいくらか。`,
        answer: ans.value,
        calc: [s, a, urm, ur, ans],
        explanation: `${yen(s.value)} から、グループ内の売上 ${yen(d.inter)} を引き(売上高と相殺)、期末商品の未実現利益 ${yen(ur.value)} を足して ${yen(ans.value)}。`,
        mistakes: [{ value: a.value, calc: [s, a], why: '期末商品の未実現利益の消去(売上原価 / 商品)も入れる。' }],
        ref: { topic: T, anchor: 'row' },
      }),
    );
  }

  // 3. 非支配株主に帰属する当期純利益(数値)
  {
    const wm = step('誤答: S社の当期純利益 × 80', 'mul', [d.sNi, d.ratio]);
    const wrong = step('誤答: 親会社の比率で計算(÷ 100)', 'div', [wm.value, 100]);
    questions.push(
      numericQ({
        id: 'C29-003',
        topic: T,
        format: F,
        difficulty: 1,
        prompt: `${data}連結損益計算書の非支配株主に帰属する当期純利益はいくらか(未実現利益はダウンストリームなので非支配株主には負担させない)。`,
        answer: niN.value,
        calc: [nr, niNm, niN],
        explanation: `S社の当期純利益 ${yen(d.sNi)} × 非支配株主の比率 ${nr.value}% = ${yen(niN.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wm, wrong], why: '非支配株主の比率(20%)をかける。' }],
        ref: { topic: T, anchor: 'entries' },
      }),
    );
  }

  // 4. 親会社株主に帰属する当期純利益
  {
    const s = step('P社とS社の当期純利益の合計', 'add', [d.pNi, d.sNi]);
    const m1 = step('− のれん償却 − 受取配当金 − 未実現利益', 'sub', [s.value, amort.value, divP.value, ur.value]);
    const cNi = step('連結の当期純利益(+ 貸倒引当金繰入の取消し)', 'add', [m1.value, al.value]);
    const ans = step('親会社株主に帰属する当期純利益(− 非支配株主の分)', 'sub', [cNi.value, niN.value]);
    const w1 = step('誤答: のれん償却と受取配当金だけ修正', 'sub', [s.value, amort.value, divP.value]);
    const wrong = step('誤答: − 非支配株主の分(成果連結を入れない)', 'sub', [w1.value, niN.value]);
    questions.push(
      numericQ({
        id: 'C29-004',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `${data}P社の当期純利益は ${yen(d.pNi)}(S社からの受取配当金を含む)。連結損益計算書の親会社株主に帰属する当期純利益はいくらか。`,
        answer: ans.value,
        calc: [...gwSteps, amort, nr, divNm, divN, divP, urm, ur, alm, al, niNm, niN, s, m1, cNi, ans],
        explanation: `P + S = ${yen(s.value)}。のれん償却 ${yen(amort.value)}・受取配当金 ${yen(divP.value)}・未実現利益 ${yen(ur.value)} を引き、貸倒引当金繰入の取消し ${yen(al.value)} を足して、連結の当期純利益 ${yen(cNi.value)}。非支配株主の分 ${yen(niN.value)} を引いて ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...gwSteps, amort, nr, divNm, divN, divP, niNm, niN, s, w1, wrong], why: '成果連結(未実現利益の消去と貸倒引当金の修正)も、連結の利益を変える。' }],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 5. 連結の利益剰余金(期末)
  {
    const sRet = step('S社の利益剰余金(支配獲得日 + 当期純利益)', 'add', [d.ret0, d.sNi]);
    const sRetEnd = step('S社の利益剰余金(期末)(− 配当)', 'sub', [sRet.value, d.sDiv]);
    const sum = step('P社とS社の利益剰余金の合計', 'add', [d.pRet, sRetEnd.value]);
    const minus = step('減らす額(支配獲得日の利益剰余金 + のれん償却 + 非支配株主の利益 + 受取配当金 + 未実現利益)', 'add', [d.ret0, amort.value, niN.value, divP.value, ur.value]);
    const plus = step('増やす額(剰余金の配当の取消し + 貸倒引当金繰入の取消し)', 'add', [d.sDiv, al.value]);
    const a = step('合計 − 減らす額', 'sub', [sum.value, minus.value]);
    const ans = step('連結貸借対照表の利益剰余金(+ 増やす額)', 'add', [a.value, plus.value]);
    const wrong = step('誤答: 剰余金の配当の取消しを入れない額', 'add', [a.value, al.value]);
    questions.push(
      numericQ({
        id: 'C29-005',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `${data}X2年3月期末の利益剰余金は、P社 ${yen(d.pRet)}(当期純利益を含む)。S社は支配獲得日の利益剰余金に当期純利益を足し、配当金を引いた額。連結貸借対照表の利益剰余金はいくらか。`,
        answer: ans.value,
        calc: [...gwSteps, amort, nr, niNm, niN, divNm, divN, divP, urm, ur, alm, al, sRet, sRetEnd, sum, minus, plus, a, ans],
        explanation: `S社の期末の利益剰余金は ${yen(sRetEnd.value)}、P社と合わせて ${yen(sum.value)}。支配獲得日の利益剰余金 ${yen(d.ret0)}(開始仕訳)、のれん償却 ${yen(amort.value)}、非支配株主の利益 ${yen(niN.value)}、受取配当金 ${yen(divP.value)}、未実現利益 ${yen(ur.value)} の合計 ${yen(minus.value)} を引き、剰余金の配当の取消し ${yen(d.sDiv)} と貸倒引当金繰入の取消し ${yen(al.value)} を足して ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...gwSteps, amort, nr, niNm, niN, divNm, divN, divP, urm, ur, alm, al, sRet, sRetEnd, sum, minus, a, wrong], why: '子会社の配当の修正では、剰余金の配当(子会社の利益剰余金の減少)を取り消すので、利益剰余金が増える。' }],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 6. 連結の売上高
  {
    const pSales = 5000000;
    const sSales = 2400000;
    const s = step('売上高の合計(P + S)', 'add', [pSales, sSales]);
    const ans = step('連結の売上高(− グループ内の売上)', 'sub', [s.value, d.inter]);
    questions.push(
      numericQ({
        id: 'C29-006',
        topic: T,
        format: F,
        difficulty: 1,
        prompt: `${data}売上高は、P社 ${yen(pSales)}、S社 ${yen(sSales)}。連結損益計算書の売上高はいくらか。`,
        answer: ans.value,
        calc: [s, ans],
        explanation: `${yen(s.value)} から、P社からS社への売上 ${yen(d.inter)} を引いて ${yen(ans.value)}。未実現利益の消去は売上原価で行うので、売上高は変わらない。`,
        mistakes: [{ value: s.value, calc: [s], why: 'グループ内の売上は、売上原価と相殺して消す。' }],
        ref: { topic: T, anchor: 'entries' },
      }),
    );
  }

  // 7. 非支配株主持分の当期末残高
  {
    const a = step('支配獲得日の非支配株主持分 + 当期の利益の分', 'add', [nci0.value, niN.value]);
    const ans = step('非支配株主持分の当期末残高(− 配当の分)', 'sub', [a.value, divN.value]);
    questions.push(
      numericQ({
        id: 'C29-007',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${data}連結株主資本等変動計算書の非支配株主持分当期末残高はいくらか。`,
        answer: ans.value,
        calc: [net0, nr, nci0m, nci0, niNm, niN, divNm, divN, a, ans],
        explanation: `当期首残高 ${yen(nci0.value)} + 当期変動額(利益 ${yen(niN.value)} − 配当 ${yen(divN.value)})= ${yen(ans.value)}。`,
        mistakes: [{ value: nci0.value, calc: [net0, nr, nci0m, nci0], why: 'それは当期首残高。当期変動額(非支配株主の利益と配当)を加減する。' }],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 8. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C29-008',
      topic: T,
      difficulty: 2,
      prompt: '連結精算表について、正しいものをすべて選びなさい。',
      options: [
        '資産の行は、P社とS社の合計に修正・消去の借方を足し、貸方を引いて連結の金額を出す',
        '子会社株式は、連結の欄にもP社の金額がそのまま残る',
        '損益計算書の親会社株主に帰属する当期純利益は、株主資本等変動計算書を通って貸借対照表の利益剰余金につながる',
        '貸倒引当金のような貸方の項目は、修正・消去の借方を足す',
        '連結の売上原価には、グループ内の売上の消去と、未実現利益の消去の両方が影響する',
      ],
      answer: [0, 2, 4],
      explanation: '子会社株式は子会社の資本と相殺して消える。貸方の項目は、修正の借方を引き、貸方を足す。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '子会社株式は、投資と資本の相殺消去で消えるので、連結には残らない。' },
        { options: [0, 2, 3, 4], why: '貸方の項目(負債・純資産・収益や貸倒引当金)は、修正の借方を引き、貸方を足す。' },
        { options: [0, 2], why: '売上原価は、グループ内の売上の消去で減り、期末の未実現利益の消去で増える。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'row' },
    }),
  );

  return { topic: T, questions };
}
