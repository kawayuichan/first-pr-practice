// C26 連結①資本連結 の問題(8問)
// 仕訳3問・数値3問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 支配獲得日の投資と資本の相殺消去、非支配株主持分、のれん・負ののれん発生益、連結貸借対照表。
// 子会社の資産・負債の時価評価は1級なので扱わない(支配獲得日の簿価 = 時価とする)。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C26';
const F = 'q3_consolidation';

export default function build() {
  const questions = [];

  // 1. 100%取得(のれん)
  {
    const cap = 1000000;
    const ret = 600000;
    const cost = 1750000;
    const net = step('子会社の純資産(資本金 + 利益剰余金)', 'add', [cap, ret]);
    const gw = step('のれん(取得原価 − 純資産)', 'sub', [cost, net.value]);
    questions.push(
      journalQ({
        id: 'C26-001',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `P社は、S社の発行済株式の100%を ${yen(cost)} で取得し、支配を獲得した。支配獲得日のS社の純資産は、資本金 ${yen(cap)}、利益剰余金 ${yen(ret)} である。支配獲得日の連結修正仕訳(投資と資本の相殺消去)を答えなさい。`,
        choices: ['資本金', '利益剰余金', 'のれん', '子会社株式', '非支配株主持分', '負ののれん発生益'],
        debit: [line('資本金', cap), line('利益剰余金', ret), line('のれん', gw.value)],
        credit: [line('子会社株式', cost)],
        calc: [net, gw],
        explanation: `S社の純資産 ${yen(net.value)} と子会社株式 ${yen(cost)} を相殺する。差額 ${yen(gw.value)} は、純資産より高く買った分なので **のれん**(資産)。`,
        mistakes: [
          {
            entry: { debit: [line('資本金', cap), line('利益剰余金', ret)], credit: [line('子会社株式', cost), line('負ののれん発生益', gw.value)] },
            why: '取得原価が純資産より大きいので、差額はのれん(借方)。負ののれんは、純資産より安く買ったときに生じる。',
          },
        ],
        ref: { topic: T, anchor: 'full' },
      }),
    );
  }

  // 2. 70%取得(非支配株主持分・のれん)
  {
    const cap = 2000000;
    const capSur = 400000;
    const ret = 600000;
    const cost = 2250000;
    const net = step('子会社の純資産(資本金 + 資本剰余金 + 利益剰余金)', 'add', [cap, capSur, ret]);
    const ncm = step('非支配株主持分(純資産 × 30)', 'mul', [net.value, 30]);
    const nci = step('非支配株主持分(÷ 100)', 'div', [ncm.value, 100]);
    const own = step('親会社の持分(純資産 − 非支配株主持分)', 'sub', [net.value, nci.value]);
    const gw = step('のれん(取得原価 − 親会社の持分)', 'sub', [cost, own.value]);
    const wneg = step('誤答: 純資産 − 取得原価', 'sub', [net.value, cost]);
    questions.push(
      journalQ({
        id: 'C26-002',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `P社は、S社の発行済株式の70%を ${yen(cost)} で取得し、支配を獲得した。支配獲得日のS社の純資産は、資本金 ${yen(cap)}、資本剰余金 ${yen(capSur)}、利益剰余金 ${yen(ret)} である。投資と資本の相殺消去の仕訳を答えなさい。`,
        choices: ['資本金', '資本剰余金', '利益剰余金', 'のれん', '子会社株式', '非支配株主持分', '負ののれん発生益'],
        debit: [line('資本金', cap), line('資本剰余金', capSur), line('利益剰余金', ret), line('のれん', gw.value)],
        credit: [line('子会社株式', cost), line('非支配株主持分', nci.value)],
        calc: [net, ncm, nci, own, gw],
        explanation: `S社の純資産 ${yen(net.value)} は全額消す。そのうち30%の ${yen(nci.value)} は **非支配株主持分**。親会社の持分 ${yen(own.value)} と子会社株式 ${yen(cost)} の差 ${yen(gw.value)} が **のれん**。`,
        mistakes: [
          {
            entry: { debit: [line('資本金', cap), line('資本剰余金', capSur), line('利益剰余金', ret)], credit: [line('子会社株式', cost), line('負ののれん発生益', wneg.value)] },
            why: '非支配株主の持分(30%)を忘れている。純資産のうち30%は非支配株主持分にして、のれんは親会社の持分と比べて計算する。',
            calc: [wneg],
          },
        ],
        ref: { topic: T, anchor: 'partial' },
      }),
    );
  }

  // 3〜4. 非支配株主持分・のれん(数値)
  const d = { cap: 3000000, capSur: 500000, ret: 1300000, ratio: 75, cost: 3800000 };
  const dData = `P社は、S社の発行済株式の${d.ratio}%を ${yen(d.cost)} で取得し、支配を獲得した。支配獲得日のS社の純資産は、資本金 ${yen(d.cap)}、資本剰余金 ${yen(d.capSur)}、利益剰余金 ${yen(d.ret)}。`;
  const dNet = step('子会社の純資産(資本金 + 資本剰余金 + 利益剰余金)', 'add', [d.cap, d.capSur, d.ret]);
  const dNr = step('非支配株主の持分比率(100 − 親会社の比率)', 'sub', [100, d.ratio]);
  const dNcm = step('非支配株主持分(純資産 × 非支配株主の比率)', 'mul', [dNet.value, dNr.value]);
  const dNci = step('非支配株主持分(÷ 100)', 'div', [dNcm.value, 100]);
  const dOwn = step('親会社の持分(純資産 − 非支配株主持分)', 'sub', [dNet.value, dNci.value]);
  const dGw = step('のれん(取得原価 − 親会社の持分)', 'sub', [d.cost, dOwn.value]);
  {
    const wm = step('誤答: 純資産 × 親会社の比率', 'mul', [dNet.value, d.ratio]);
    const wrong = step('誤答: 親会社の持分(÷ 100)', 'div', [wm.value, 100]);
    questions.push(
      numericQ({
        id: 'C26-003',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${dData}連結貸借対照表の非支配株主持分はいくらか。`,
        answer: dNci.value,
        calc: [dNet, dNr, dNcm, dNci],
        explanation: `S社の純資産 ${yen(dNet.value)} × 非支配株主の比率 ${dNr.value}% = ${yen(dNci.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wm, wrong], why: 'それは親会社の持分。非支配株主持分は、親会社が持っていない ' + `${dNr.value}%` + ' の分。' }],
        ref: { topic: T, anchor: 'box' },
      }),
    );
  }
  {
    const wm = step('誤答: 純資産 × 非支配株主の比率(比率の取り違え)', 'mul', [dNet.value, dNr.value]);
    const wo = step('誤答: 取り違えた持分(÷ 100)', 'div', [wm.value, 100]);
    const wrong = step('誤答: 取得原価 − 取り違えた持分', 'sub', [d.cost, wo.value]);
    questions.push(
      numericQ({
        id: 'C26-004',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${dData}連結貸借対照表ののれんはいくらか。`,
        answer: dGw.value,
        calc: [dNet, dNr, dNcm, dNci, dOwn, dGw],
        explanation: `親会社の持分 = ${yen(dNet.value)} − 非支配株主持分 ${yen(dNci.value)} = ${yen(dOwn.value)}。のれん = 子会社株式 ${yen(d.cost)} − ${yen(dOwn.value)} = ${yen(dGw.value)}。`,
        mistakes: [{ value: wrong.value, calc: [dNet, dNr, wm, wo, wrong], why: 'のれんは、取得原価から親会社の持分(' + `${d.ratio}%` + ')を引く。非支配株主の比率をかけない。' }],
        ref: { topic: T, anchor: 'box' },
      }),
    );
  }

  // 5. 負ののれん
  {
    const cap = 1200000;
    const ret = 500000;
    const cost = 1580000;
    const net = step('子会社の純資産(資本金 + 利益剰余金)', 'add', [cap, ret]);
    const neg = step('負ののれん発生益(純資産 − 取得原価)', 'sub', [net.value, cost]);
    questions.push(
      journalQ({
        id: 'C26-005',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `P社は、S社の発行済株式の100%を ${yen(cost)} で取得し、支配を獲得した。支配獲得日のS社の純資産は、資本金 ${yen(cap)}、利益剰余金 ${yen(ret)} である。投資と資本の相殺消去の仕訳を答えなさい。`,
        choices: ['資本金', '利益剰余金', '子会社株式', '負ののれん発生益', 'のれん', '非支配株主持分'],
        debit: [line('資本金', cap), line('利益剰余金', ret)],
        credit: [line('子会社株式', cost), line('負ののれん発生益', neg.value)],
        calc: [net, neg],
        explanation: `純資産 ${yen(net.value)} より ${yen(neg.value)} 安く取得した。この差額は **負ののれん発生益**(特別利益)。`,
        mistakes: [
          {
            entry: { debit: [line('資本金', cap), line('利益剰余金', ret)], credit: [line('子会社株式', cost), line('のれん', neg.value)] },
            why: '純資産より安く買ったときの差額は、のれん(資産)ではなく負ののれん発生益(利益)。',
          },
        ],
        ref: { topic: T, anchor: 'negative' },
      }),
    );
  }

  // 6. 連結貸借対照表の資産合計(数値)
  {
    const pAssets = 7000000;
    const pStock = 2400000;
    const sAssets = 3600000;
    const sLiab = 1000000;
    const ratio = 80;
    const sNet = step('S社の純資産(諸資産 − 諸負債)', 'sub', [sAssets, sLiab]);
    const om = step('親会社の持分(純資産 × 80)', 'mul', [sNet.value, ratio]);
    const own = step('親会社の持分(÷ 100)', 'div', [om.value, 100]);
    const gw = step('のれん(子会社株式 − 親会社の持分)', 'sub', [pStock, own.value]);
    const a1 = step('諸資産の合計(P社 + S社)', 'add', [pAssets, sAssets]);
    const total = step('連結貸借対照表の資産合計(+ のれん)', 'add', [a1.value, gw.value]);
    const wrong = step('誤答: P社とS社の資産を単純に合計(子会社株式も含む)', 'add', [pAssets, pStock, sAssets]);
    questions.push(
      numericQ({
        id: 'C26-006',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `支配獲得日の資料。P社は、諸資産 ${yen(pAssets)} と子会社株式 ${yen(pStock)}(S社の株式の${ratio}%)を持つ。S社は、諸資産 ${yen(sAssets)}、諸負債 ${yen(sLiab)} で、残りは純資産。連結貸借対照表の資産合計はいくらか。`,
        answer: total.value,
        calc: [sNet, om, own, gw, a1, total],
        explanation: `S社の純資産 ${yen(sNet.value)} の80% = ${yen(own.value)}。のれん = ${yen(pStock)} − ${yen(own.value)} = ${yen(gw.value)}。子会社株式は相殺されて消え、資産合計 = 諸資産 ${yen(a1.value)} + のれん ${yen(gw.value)} = ${yen(total.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wrong], why: '子会社株式は、子会社の純資産と相殺して消す。代わりにのれんが残る。' }],
        ref: { topic: T, anchor: 'cbs' },
      }),
    );
  }

  // 7. 子会社の判定(選択)
  questions.push(
    choiceQ({
      id: 'C26-007',
      topic: T,
      difficulty: 1,
      prompt: 'P社がS社を子会社とする(連結の対象とする)のは、ふつうどのようなときか。',
      options: [
        'S社の議決権の過半数(50%超)を持っているとき',
        'S社の議決権を10%以上持っているとき',
        'S社と毎月取引をしているとき',
        'S社にお金を貸しているとき',
      ],
      answer: 0,
      explanation: '議決権の **過半数** を持つなど、S社の意思決定を支配しているとき、S社は子会社になる。',
      mistakes: [
        { option: 1, why: '10%程度では、S社を支配しているとはいえない。' },
        { option: 2, why: '取引があるだけでは、支配しているとはいえない。' },
        { option: 3, why: 'お金を貸しているだけでは、議決権を持たないので支配していない。' },
      ],
      ref: { topic: T, anchor: 'summary' },
    }),
  );

  // 8. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C26-008',
      topic: T,
      difficulty: 2,
      prompt: '資本連結(支配獲得日)について、正しいものをすべて選びなさい。',
      options: [
        '子会社の資本金・資本剰余金・利益剰余金は、全額を相殺して消す',
        '非支配株主持分は、連結貸借対照表の負債の部に表示する',
        'のれんは、子会社株式の取得原価から、子会社の純資産のうち親会社の持分を引いた額である',
        '連結の修正仕訳は、親会社の帳簿にも記録する',
        '子会社の純資産より安く取得したときの差額は、負ののれん発生益とする',
      ],
      answer: [0, 2, 4],
      explanation: '非支配株主持分は純資産の部。連結の修正仕訳は、連結財務諸表を作るときだけに行い、親会社・子会社の帳簿には記録しない。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '非支配株主持分は、負債ではなく純資産の部に表示する。' },
        { options: [0, 2, 3, 4], why: '連結の修正仕訳は、連結財務諸表を作るためのもの。各社の帳簿には記録しない。' },
        { options: [0, 2], why: '純資産より安く取得した差額は、負ののれん発生益。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'partial' },
    }),
  );

  return { topic: T, questions };
}
