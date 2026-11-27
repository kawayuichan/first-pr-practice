// C27 連結②支配獲得後 の問題(10問)
// 仕訳4問・数値4問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 開始仕訳(当期首残高の項目)、のれん償却、非支配株主に帰属する当期純利益、子会社の配当の修正、
// 2年目の開始仕訳、親会社株主に帰属する当期純利益。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C27';
const F = 'q3_consolidation';

export default function build() {
  const questions = [];

  // 共通の資料
  const d = { ratio: 70, cost: 2020000, cap: 2000000, ret: 600000, years: 10, ni: 500000, div: 200000 };
  const base = `P社は、X1年3月31日にS社の発行済株式の${d.ratio}%を ${yen(d.cost)} で取得し、支配を獲得した。このときのS社の純資産は、資本金 ${yen(d.cap)}、利益剰余金 ${yen(d.ret)}。のれんは${d.years}年で定額法により償却する。`;
  const y1 = `X2年3月期(支配獲得後1年目)のS社の当期純利益は ${yen(d.ni)}、配当金は ${yen(d.div)} だった。`;
  const net = step('支配獲得日のS社の純資産(資本金 + 利益剰余金)', 'add', [d.cap, d.ret]);
  const nr = step('非支配株主の持分比率(100 − 親会社の比率)', 'sub', [100, d.ratio]);
  const ncm = step('非支配株主持分(純資産 × 非支配株主の比率)', 'mul', [net.value, nr.value]);
  const nci = step('非支配株主持分(÷ 100)', 'div', [ncm.value, 100]);
  const own = step('親会社の持分(純資産 − 非支配株主持分)', 'sub', [net.value, nci.value]);
  const gw = step('のれん(取得原価 − 親会社の持分)', 'sub', [d.cost, own.value]);
  const amort = step('のれん償却(のれん ÷ 償却年数)', 'div', [gw.value, d.years]);
  const niNm = step('非支配株主の利益(当期純利益 × 非支配株主の比率)', 'mul', [d.ni, nr.value]);
  const niN = step('非支配株主に帰属する当期純利益(÷ 100)', 'div', [niNm.value, 100]);
  const divNm = step('非支配株主への配当(配当 × 非支配株主の比率)', 'mul', [d.div, nr.value]);
  const divN = step('非支配株主への配当(÷ 100)', 'div', [divNm.value, 100]);
  const divP = step('親会社が受け取った配当(配当 − 非支配株主の分)', 'sub', [d.div, divN.value]);
  const gwSteps = [net, nr, ncm, nci, own, gw];

  // 1. 開始仕訳(1年目)
  {
    questions.push(
      journalQ({
        id: 'C27-001',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${base}X2年3月期の連結財務諸表を作るための開始仕訳を答えなさい(支配獲得日の相殺消去だけ)。`,
        choices: ['資本金当期首残高', '利益剰余金当期首残高', 'のれん', '子会社株式', '非支配株主持分当期首残高', '非支配株主持分当期変動額', 'のれん償却'],
        debit: [line('資本金当期首残高', d.cap), line('利益剰余金当期首残高', d.ret), line('のれん', gw.value)],
        credit: [line('子会社株式', d.cost), line('非支配株主持分当期首残高', nci.value)],
        calc: gwSteps,
        explanation: `支配獲得日の相殺消去を、純資産の項目は **当期首残高** の名前でもう一度行う。非支配株主持分 ${yen(nci.value)}、のれん ${yen(gw.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('資本金当期首残高', d.cap), line('利益剰余金当期首残高', d.ret), line('のれん', gw.value)], credit: [line('子会社株式', d.cost), line('非支配株主持分当期変動額', nci.value)] },
            why: '開始仕訳は前期末までの修正なので、非支配株主持分も「当期首残高」で書く。当期変動額は当期の修正で使う。',
          },
        ],
        ref: { topic: T, anchor: 'opening' },
      }),
    );
  }

  // 2. のれん償却
  questions.push(
    journalQ({
      id: 'C27-002',
      topic: T,
      format: F,
      difficulty: 1,
      prompt: `${base}X2年3月期ののれんの償却の仕訳を答えなさい。`,
      choices: ['のれん償却', 'のれん', '利益剰余金当期首残高', '子会社株式', '減価償却費', '非支配株主持分当期変動額'],
      debit: [line('のれん償却', amort.value)],
      credit: [line('のれん', amort.value)],
      calc: [...gwSteps, amort],
      explanation: `のれん ${yen(gw.value)} を${d.years}年で償却するので、1年分は ${yen(amort.value)}。`,
      mistakes: [
        {
          entry: { debit: [line('減価償却費', amort.value)], credit: [line('のれん', amort.value)] },
          why: 'のれんの償却は「のれん償却」で記録する。',
        },
      ],
      ref: { topic: T, anchor: 'amortization' },
    }),
  );

  // 3. 非支配株主に帰属する当期純利益
  {
    const wm = step('誤答: 当期純利益 × 親会社の比率', 'mul', [d.ni, d.ratio]);
    const wrong = step('誤答: 親会社の比率で計算した額(÷ 100)', 'div', [wm.value, 100]);
    questions.push(
      journalQ({
        id: 'C27-003',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${base}${y1}S社の当期純利益のうち、非支配株主の分を振り替える仕訳を答えなさい。`,
        choices: ['非支配株主に帰属する当期純利益', '非支配株主持分当期変動額', '非支配株主持分当期首残高', '利益剰余金当期首残高', '受取配当金', '剰余金の配当'],
        debit: [line('非支配株主に帰属する当期純利益', niN.value)],
        credit: [line('非支配株主持分当期変動額', niN.value)],
        calc: [nr, niNm, niN],
        explanation: `S社の当期純利益 ${yen(d.ni)} × 非支配株主の比率 ${nr.value}% = ${yen(niN.value)}。連結の利益から取り出し、非支配株主持分を増やす(当期の変動なので当期変動額)。`,
        mistakes: [
          {
            entry: { debit: [line('非支配株主に帰属する当期純利益', wrong.value)], credit: [line('非支配株主持分当期変動額', wrong.value)] },
            why: '非支配株主の分は、親会社の比率ではなく、非支配株主の比率(' + `${nr.value}%` + ')をかける。',
            calc: [wm, wrong],
          },
        ],
        ref: { topic: T, anchor: 'nci-income' },
      }),
    );
  }

  // 4. 子会社の配当の修正
  questions.push(
    journalQ({
      id: 'C27-004',
      topic: T,
      format: F,
      difficulty: 3,
      prompt: `${base}${y1}S社の配当金の修正の仕訳を答えなさい。P社は受け取った配当金を受取配当金で処理している。`,
      choices: ['受取配当金', '非支配株主持分当期変動額', '剰余金の配当', '非支配株主に帰属する当期純利益', '利益剰余金当期首残高', '現金'],
      debit: [line('受取配当金', divP.value), line('非支配株主持分当期変動額', divN.value)],
      credit: [line('剰余金の配当', d.div)],
      calc: [nr, divNm, divN, divP],
      explanation: `配当 ${yen(d.div)} のうち、P社が受け取った ${yen(divP.value)} は **受取配当金** と相殺する。非支配株主に払った ${yen(divN.value)} は **非支配株主持分** を減らす。S社の配当(剰余金の配当)は取り消す(貸方)。`,
      mistakes: [
        {
          entry: { debit: [line('受取配当金', d.div)], credit: [line('剰余金の配当', d.div)] },
          why: 'P社が受け取ったのは配当の' + `${d.ratio}%` + 'だけ。残りは非支配株主に払った分なので、非支配株主持分を減らす。',
        },
      ],
      ref: { topic: T, anchor: 'dividend' },
    }),
  );

  // 5〜7. 2年目の開始仕訳とのれん(数値)
  {
    const a = step('利益剰余金当期首残高: 支配獲得日 + のれん償却 + 非支配株主の利益 + 受取配当金', 'add', [d.ret, amort.value, niN.value, divP.value]);
    const ans = step('2年目の開始仕訳の利益剰余金当期首残高(− 剰余金の配当)', 'sub', [a.value, d.div]);
    const wrong = step('誤答: 配当の修正を入れない額', 'add', [d.ret, amort.value, niN.value]);
    questions.push(
      numericQ({
        id: 'C27-005',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `${base}${y1}X3年3月期(2年目)の開始仕訳で、借方に記入する利益剰余金当期首残高はいくらか。`,
        answer: ans.value,
        calc: [...gwSteps, amort, nr, niNm, niN, divNm, divN, divP, a, ans],
        explanation: `1年目の修正のうち、損益の項目(のれん償却 ${yen(amort.value)}・非支配株主に帰属する当期純利益 ${yen(niN.value)}・受取配当金 ${yen(divP.value)}、どれも借方)と剰余金の配当(貸方 ${yen(d.div)})は、利益剰余金当期首残高にまとめる。${yen(d.ret)} + ${yen(amort.value)} + ${yen(niN.value)} + ${yen(divP.value)} − ${yen(d.div)} = ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...gwSteps, amort, nr, niNm, niN, wrong], why: '1年目の配当の修正(受取配当金の借方と剰余金の配当の貸方)も、利益剰余金当期首残高にまとめる。' }],
        ref: { topic: T, anchor: 'opening2' },
      }),
    );
  }
  {
    const a = step('非支配株主持分: 支配獲得日 + 非支配株主の利益', 'add', [nci.value, niN.value]);
    const ans = step('2年目の非支配株主持分当期首残高(− 非支配株主への配当)', 'sub', [a.value, divN.value]);
    questions.push(
      numericQ({
        id: 'C27-006',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${base}${y1}X3年3月期(2年目)の開始仕訳で、貸方に記入する非支配株主持分当期首残高はいくらか。`,
        answer: ans.value,
        calc: [net, nr, ncm, nci, niNm, niN, divNm, divN, a, ans],
        explanation: `支配獲得日の ${yen(nci.value)} に、1年目の非支配株主の利益 ${yen(niN.value)} を足し、非支配株主への配当 ${yen(divN.value)} を引いて ${yen(ans.value)}。`,
        mistakes: [{ value: a.value, calc: [net, nr, ncm, nci, niNm, niN, a], why: '非支配株主に払った配当の分、非支配株主持分は減っている。' }],
        ref: { topic: T, anchor: 'opening2' },
      }),
    );
  }
  {
    const two = step('2年分ののれん償却(1年分 × 2)', 'mul', [amort.value, 2]);
    const ans = step('X3年3月期末ののれん(のれん − 2年分の償却)', 'sub', [gw.value, two.value]);
    const wrong = step('誤答: 1年分しか償却しない', 'sub', [gw.value, amort.value]);
    questions.push(
      numericQ({
        id: 'C27-007',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${base}X3年3月期(2年目)末の連結貸借対照表ののれんはいくらか。`,
        answer: ans.value,
        calc: [...gwSteps, amort, two, ans],
        explanation: `のれん ${yen(gw.value)} から、1年目と2年目の償却(${yen(amort.value)} × 2 = ${yen(two.value)})を引いて ${yen(ans.value)}。1年目の償却は2年目の開始仕訳に含まれている。`,
        mistakes: [{ value: wrong.value, calc: [...gwSteps, amort, wrong], why: '1年目の償却も、2年目の開始仕訳でのれんを減らしている。2年分を引く。' }],
        ref: { topic: T, anchor: 'opening2' },
      }),
    );
  }

  // 8. 親会社株主に帰属する当期純利益
  {
    const pNi = 900000;
    const s1 = step('P社とS社の当期純利益の合計', 'add', [pNi, d.ni]);
    const s2 = step('− のれん償却', 'sub', [s1.value, amort.value]);
    const cNi = step('連結の当期純利益(− 受取配当金)', 'sub', [s2.value, divP.value]);
    const ans = step('親会社株主に帰属する当期純利益(− 非支配株主に帰属する当期純利益)', 'sub', [cNi.value, niN.value]);
    const wrong = step('誤答: 受取配当金を消さない額', 'sub', [s2.value, niN.value]);
    questions.push(
      numericQ({
        id: 'C27-008',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `${base}${y1}X2年3月期のP社の当期純利益は ${yen(pNi)}(S社からの受取配当金を含む)である。連結損益計算書の親会社株主に帰属する当期純利益はいくらか。`,
        answer: ans.value,
        calc: [...gwSteps, amort, nr, divNm, divN, divP, niNm, niN, s1, s2, cNi, ans],
        explanation: `P社 + S社 = ${yen(s1.value)}。のれん償却 ${yen(amort.value)} と、グループ内の受取配当金 ${yen(divP.value)} を引いて、連結の当期純利益 ${yen(cNi.value)}。非支配株主に帰属する ${yen(niN.value)} を引いて ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...gwSteps, amort, nr, niNm, niN, s1, s2, wrong], why: 'P社が子会社から受け取った配当は、グループの中でお金が動いただけ。受取配当金を消す。' }],
        ref: { topic: T, anchor: 'cpl' },
      }),
    );
  }

  // 9. 非支配株主への配当(選択)
  questions.push(
    choiceQ({
      id: 'C27-009',
      topic: T,
      difficulty: 2,
      prompt: '子会社が支払った配当金のうち、非支配株主に支払った分は、連結の修正仕訳でどう処理するか。',
      options: [
        '非支配株主持分を減らす',
        '受取配当金を減らす',
        '非支配株主に帰属する当期純利益を増やす',
        '修正しない',
      ],
      answer: 0,
      explanation: '非支配株主への配当で、子会社の純資産のうち非支配株主の分が減った。**非支配株主持分を減らす**(非支配株主持分当期変動額の借方)。',
      mistakes: [
        { option: 1, why: '受取配当金を減らすのは、親会社が受け取った分。' },
        { option: 2, why: '配当は利益の分配で、利益そのものは変わらない。' },
        { option: 3, why: '子会社の剰余金の配当は取り消すので、非支配株主の分の相手として非支配株主持分を減らす必要がある。' },
      ],
      ref: { topic: T, anchor: 'dividend' },
    }),
  );

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C27-010',
      topic: T,
      difficulty: 2,
      prompt: '支配獲得後の連結について、正しいものをすべて選びなさい。',
      options: [
        '連結の修正仕訳は各社の帳簿に残らないので、毎年、前期までの修正を開始仕訳としてもう一度行う',
        'のれんは、償却しないで毎年そのまま残す',
        '子会社の当期純利益のうち非支配株主の分は、非支配株主持分を増やす',
        '親会社が子会社から受け取った配当金は、連結損益計算書の受取配当金にそのまま残す',
        '開始仕訳では、のれん償却などの前期の損益の項目は、利益剰余金当期首残高にまとめる',
      ],
      answer: [0, 2, 4],
      explanation: 'のれんは20年以内に定額法で償却する。グループ内の配当は相殺して消す。',
      mistakes: [
        { options: [0, 1, 2, 4], why: 'のれんは、20年以内の期間で定額法などにより償却する。' },
        { options: [0, 2, 3, 4], why: '子会社から受け取った配当は、グループの中の取引なので受取配当金を消す。' },
        { options: [0, 2], why: '前期の損益の項目は、当期の損益にならないので利益剰余金当期首残高にまとめる。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'opening2' },
    }),
  );

  return { topic: T, questions };
}
