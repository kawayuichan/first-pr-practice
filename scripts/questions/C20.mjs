// C20 合併 の問題(8問)
// 仕訳5問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 吸収合併: 資産・負債は時価で受け入れ、交付株式は指示どおりに資本金など、差額はのれん・負ののれん発生益。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C20';

export default function build() {
  const questions = [];

  // 1. 吸収合併(のれん・全額資本金)
  {
    const shares = 300;
    const price = 40000;
    const ar = 4000000;
    const bldg = 7000000;
    const land = 3000000;
    const ap = 2500000;
    const loan = 1500000;
    const stock = step('交付した株式(1株の時価 × 株数)', 'mul', [price, shares]);
    const assets = step('受け入れた資産(売掛金 + 建物 + 土地)', 'add', [ar, bldg, land]);
    const liabs = step('受け入れた負債(買掛金 + 借入金)', 'add', [ap, loan]);
    const net = step('受け入れた純資産(資産 − 負債)', 'sub', [assets.value, liabs.value]);
    const gw = step('のれん(交付した株式 − 純資産)', 'sub', [stock.value, net.value]);
    questions.push(
      journalQ({
        id: 'C20-001',
        topic: T,
        difficulty: 2,
        prompt: `当社はD社を吸収合併し、D社の株主に当社の株式${shares}株(1株の時価 ${yen(price)})を交付した。交付した株式の時価は全額を資本金とする。D社から受け入れた資産と負債(時価)は、売掛金 ${yen(ar)}、建物 ${yen(bldg)}、土地 ${yen(land)}、買掛金 ${yen(ap)}、借入金 ${yen(loan)} である。`,
        choices: ['売掛金', '建物', '土地', 'のれん', '買掛金', '借入金', '資本金', '負ののれん発生益'],
        debit: [line('売掛金', ar), line('建物', bldg), line('土地', land), line('のれん', gw.value)],
        credit: [line('買掛金', ap), line('借入金', loan), line('資本金', stock.value)],
        calc: [stock, assets, liabs, net, gw],
        explanation: `交付した株式 ${yen(stock.value)} が、受け入れた純資産 ${yen(net.value)} より多いので、差額 ${yen(gw.value)} が **のれん**。`,
        mistakes: [
          {
            entry: {
              debit: [line('売掛金', ar), line('建物', bldg), line('土地', land)],
              credit: [line('買掛金', ap), line('借入金', loan), line('資本金', net.value)],
            },
            why: `資本金は交付した株式の額 ${yen(stock.value)}。純資産との差額はのれんにする。`,
          },
        ],
        ref: { topic: T, anchor: 'goodwill' },
      }),
    );
  }

  // 2. 資本金・資本準備金・その他資本剰余金に分ける
  {
    const stockAmt = 8000000;
    const cap = 5000000;
    const capRes = 2000000;
    const assets = 9000000;
    const liabs = 2400000;
    const other = step('その他資本剰余金(交付した株式 − 資本金 − 資本準備金)', 'sub', [stockAmt, cap, capRes]);
    const net = step('受け入れた純資産(資産 − 負債)', 'sub', [assets, liabs]);
    const gw = step('のれん(交付した株式 − 純資産)', 'sub', [stockAmt, net.value]);
    questions.push(
      journalQ({
        id: 'C20-002',
        topic: T,
        difficulty: 3,
        prompt: `E社を吸収合併し、当社の株式(時価 ${yen(stockAmt)})を交付した。このうち ${yen(cap)} を資本金、${yen(capRes)} を資本準備金とし、残りはその他資本剰余金とする。E社から受け入れた資産は建物 ${yen(assets)}、負債は借入金 ${yen(liabs)}(いずれも時価)である。`,
        choices: ['建物', 'のれん', '借入金', '資本金', '資本準備金', 'その他資本剰余金', '負ののれん発生益', '利益準備金'],
        debit: [line('建物', assets), line('のれん', gw.value)],
        credit: [line('借入金', liabs), line('資本金', cap), line('資本準備金', capRes), line('その他資本剰余金', other.value)],
        calc: [other, net, gw],
        explanation: `交付した株式 ${yen(stockAmt)} を、資本金 ${yen(cap)}・資本準備金 ${yen(capRes)}・その他資本剰余金 ${yen(other.value)} に分ける。純資産 ${yen(net.value)} との差額 ${yen(gw.value)} はのれん。`,
        mistakes: [
          {
            entry: { debit: [line('建物', assets), line('のれん', gw.value)], credit: [line('借入金', liabs), line('資本金', stockAmt)] },
            why: '指示があるので、交付した株式の額を資本金・資本準備金・その他資本剰余金に分ける。',
          },
        ],
        ref: { topic: T, anchor: 'equity-split' },
      }),
    );
  }

  // 3. 負ののれん
  {
    const stockAmt = 5000000;
    const ar = 2000000;
    const land = 6000000;
    const ap = 1800000;
    const assets = step('受け入れた資産(売掛金 + 土地)', 'add', [ar, land]);
    const net = step('受け入れた純資産(資産 − 買掛金)', 'sub', [assets.value, ap]);
    const neg = step('負ののれん(純資産 − 交付した株式)', 'sub', [net.value, stockAmt]);
    questions.push(
      journalQ({
        id: 'C20-003',
        topic: T,
        difficulty: 3,
        prompt: `F社を吸収合併し、当社の株式(時価 ${yen(stockAmt)}、全額を資本金とする)を交付した。F社から受け入れた資産は売掛金 ${yen(ar)}・土地 ${yen(land)}、負債は買掛金 ${yen(ap)}(いずれも時価)である。`,
        choices: ['売掛金', '土地', '買掛金', '資本金', '負ののれん発生益', 'のれん', 'その他資本剰余金', '固定資産売却益'],
        debit: [line('売掛金', ar), line('土地', land)],
        credit: [line('買掛金', ap), line('資本金', stockAmt), line('負ののれん発生益', neg.value)],
        calc: [assets, net, neg],
        explanation: `受け入れた純資産 ${yen(net.value)} のほうが、交付した株式 ${yen(stockAmt)} より多い。安く手に入れた差額 ${yen(neg.value)} は **負ののれん発生益**(収益)。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', ar), line('土地', land)], credit: [line('買掛金', ap), line('資本金', stockAmt), line('その他資本剰余金', neg.value)] },
            why: '純資産より安く手に入れた差額は、資本ではなく収益(負ののれん発生益)にする。',
          },
        ],
        ref: { topic: T, anchor: 'negative' },
      }),
    );
  }

  // 4. のれんの額(数値)
  {
    const stockAmt = 12000000;
    const assets = 15000000;
    const liabs = 5000000;
    const bookAssets = 13000000;
    const net = step('受け入れた純資産(時価の資産 − 負債)', 'sub', [assets, liabs]);
    const gw = step('のれん(交付した株式 − 純資産)', 'sub', [stockAmt, net.value]);
    const wNet = step('誤答: 帳簿の資産で計算した純資産', 'sub', [bookAssets, liabs]);
    const wrong = step('誤答: 帳簿の資産で計算したのれん', 'sub', [stockAmt, wNet.value]);
    questions.push(
      numericQ({
        id: 'C20-004',
        topic: T,
        difficulty: 2,
        prompt: `G社を吸収合併し、当社の株式(時価 ${yen(stockAmt)})を交付した。G社の資産は、帳簿の金額が ${yen(bookAssets)}、時価が ${yen(assets)}。負債は ${yen(liabs)}(帳簿の金額・時価とも同じ)。合併で生じるのれんはいくらか。`,
        answer: gw.value,
        calc: [net, gw],
        explanation: `資産は時価 ${yen(assets)} で受け入れる。純資産 ${yen(net.value)}、のれん = ${yen(stockAmt)} − ${yen(net.value)} = ${yen(gw.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wNet, wrong], why: '合併で受け入れる資産は、相手の帳簿の金額ではなく時価で計算する。' }],
        ref: { topic: T, anchor: 'box' },
      }),
    );
  }

  // 5. 合併で生じたのれんの償却
  {
    const gw = 3600000;
    const years = 20;
    const amort = step('1年分の償却額(のれん ÷ 20年)', 'div', [gw, years]);
    questions.push(
      journalQ({
        id: 'C20-005',
        topic: T,
        difficulty: 1,
        prompt: `決算。当期首の吸収合併で生じたのれん ${yen(gw)} を、${years}年にわたり定額法で償却する。`,
        choices: ['のれん償却', 'のれん', '減価償却費', '負ののれん発生益', '資本金', '雑損'],
        debit: [line('のれん償却', amort.value)],
        credit: [line('のれん', amort.value)],
        calc: [amort],
        explanation: `合併で生じたのれんも、20年以内に定額法で償却する(直接法)。${yen(gw)} ÷ ${years}年 = ${yen(amort.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', amort.value)], credit: [line('のれん', amort.value)] },
            why: 'のれんの償却には、のれん償却を使う。',
          },
        ],
        ref: { topic: T, anchor: 'goodwill' },
      }),
    );
  }

  // 6. 資産・負債の評価(選択)
  questions.push(
    choiceQ({
      id: 'C20-006',
      topic: T,
      difficulty: 1,
      prompt: '吸収合併で、消える会社から受け入れる資産と負債は、どの金額で記録するか。',
      options: ['消える会社の帳簿の金額', '合併の日の時価', '取得したときの金額(取得原価)', '交付した株式の額で按分した金額'],
      answer: 1,
      explanation: '合併で受け入れる資産・負債は、合併の日の **時価** で記録する。',
      mistakes: [
        { option: 0, why: '相手の帳簿の金額(簿価)ではなく、時価で受け入れる。' },
        { option: 2, why: '相手が取得したときの金額ではなく、合併の日の時価。' },
        { option: 3, why: '資産・負債はそれぞれの時価。交付した株式との差はのれんになる。' },
      ],
      ref: { topic: T, anchor: 'goodwill' },
    }),
  );

  // 7. のれんか負ののれんか(選択)
  questions.push(
    choiceQ({
      id: 'C20-007',
      topic: T,
      difficulty: 2,
      prompt: '吸収合併で、交付した株式の額が、受け入れた純資産(時価)より少なかった。差額はどう処理するか。',
      options: ['のれん(資産)', '負ののれん発生益(収益)', 'その他資本剰余金(純資産)', '処理しない'],
      answer: 1,
      explanation: '純資産より安く手に入れたので、差額は **負ののれん発生益**(収益。損益計算書の特別利益)。',
      mistakes: [
        { option: 0, why: 'のれんは、交付した株式が純資産より多いとき。' },
        { option: 2, why: '差額は資本ではなく、収益(負ののれん発生益)。' },
        { option: 3, why: '差額があれば、のれんか負ののれん発生益で処理する。' },
      ],
      ref: { topic: T, anchor: 'negative' },
    }),
  );

  // 8. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C20-008',
      topic: T,
      difficulty: 2,
      prompt: '合併について、正しいものをすべて選びなさい。',
      options: [
        '受け入れる資産と負債は、時価で記録する',
        'のれんは、交付した株式の額と、受け入れた資産の合計との差額である',
        '交付した株式の額は、指示があれば資本金・資本準備金・その他資本剰余金に分ける',
        '負ののれんは、負債として貸借対照表に表示する',
        '合併で生じたのれんは、20年以内に償却する',
      ],
      answer: [0, 2, 4],
      explanation: 'のれんは、資産の合計ではなく純資産(資産 − 負債)と比べる。負ののれんは負債ではなく、負ののれん発生益(収益)。',
      mistakes: [
        { options: [0, 1, 2, 4], why: 'のれんは、受け入れた純資産(資産 − 負債)との差額。資産の合計とは比べない。' },
        { options: [0, 2, 3, 4], why: '負ののれんは、負ののれん発生益(収益)として処理する。負債ではない。' },
        { options: [0, 4], why: '交付した株式は、指示どおりに資本金などに分ける。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'box' },
    }),
  );

  return { topic: T, questions };
}
