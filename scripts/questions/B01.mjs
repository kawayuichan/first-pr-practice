// B01 簿記の基本 の問題(10問)
// 金額はすべて step() で計算する。問題文・解説の数字は計算結果から埋め込む。

import { choiceQ, journalQ, line, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'B01';

export default function build() {
  const questions = [];

  // 1. 借入(資産の増加/負債の増加)
  {
    const amt = 400000;
    questions.push(
      journalQ({
        id: 'B01-001',
        topic: T,
        difficulty: 1,
        prompt: `銀行から ${yen(amt)} を借り入れ、同額が普通預金口座に入金された。`,
        choices: ['現金', '普通預金', '貸付金', '借入金', '資本金', '受取利息'],
        debit: [line('普通預金', amt)],
        credit: [line('借入金', amt)],
        explanation:
          'お金(普通預金 = **資産**)が増えたので **借方**。あとで返す義務(借入金 = **負債**)が増えたので **貸方**。',
        mistakes: [
          {
            entry: { debit: [line('借入金', amt)], credit: [line('普通預金', amt)] },
            why: '左右が逆です。資産(普通預金)の増加は借方、負債(借入金)の増加は貸方。',
          },
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('貸付金', amt)] },
            why: '貸付金は「貸したお金を返してもらう権利」(資産)。お金を借りたときは借入金(負債)。',
          },
        ],
        ref: { topic: T, anchor: 'eight' },
      }),
    );
  }

  // 2. 備品の購入(資産の増加/資産の減少)
  {
    const amt = 180000;
    questions.push(
      journalQ({
        id: 'B01-002',
        topic: T,
        difficulty: 1,
        prompt: `事務作業用のパソコン1台 ${yen(amt)} を購入し、代金は現金で支払った。`,
        choices: ['現金', '普通預金', '備品', '仕入', '消耗品費', '未払金'],
        debit: [line('備品', amt)],
        credit: [line('現金', amt)],
        explanation:
          '会社で長く使う事務機器は **備品(資産)**。備品が増えたので借方、現金(資産)が減ったので貸方。',
        mistakes: [
          {
            entry: { debit: [line('仕入', amt)], credit: [line('現金', amt)] },
            why: '仕入は「売るための商品」を買ったときの科目。会社で使うパソコンは備品(資産)。',
          },
          {
            entry: { debit: [line('消耗品費', amt)], credit: [line('現金', amt)] },
            why: 'すぐに使い切る文房具などが消耗品費。長く使う事務機器は備品(資産)。',
          },
          {
            entry: { debit: [line('現金', amt)], credit: [line('備品', amt)] },
            why: '左右が逆です。備品(資産)が増えたので借方、現金(資産)が減ったので貸方。',
          },
        ],
        ref: { topic: T, anchor: 'elements' },
      }),
    );
  }

  // 3. 手数料の受取(資産の増加/収益の発生)
  {
    const amt = 45000;
    questions.push(
      journalQ({
        id: 'B01-003',
        topic: T,
        difficulty: 1,
        prompt: `取引先どうしの商品売買を仲介し、手数料 ${yen(amt)} を現金で受け取った。`,
        choices: ['現金', '売上', '受取手数料', '支払手数料', '前受金', '受取利息'],
        debit: [line('現金', amt)],
        credit: [line('受取手数料', amt)],
        explanation:
          '現金(資産)が増えたので借方。仲介で得た手数料は **受取手数料(収益)** で、収益の発生は貸方。',
        mistakes: [
          {
            entry: { debit: [line('現金', amt)], credit: [line('売上', amt)] },
            why: '売上は自社の商品を売ったときの収益。仲介で受け取った手数料は受取手数料。',
          },
          {
            entry: { debit: [line('現金', amt)], credit: [line('支払手数料', amt)] },
            why: '支払手数料は手数料を払ったときの費用。受け取ったときは受取手数料(収益)。',
          },
        ],
        ref: { topic: T, anchor: 'eight' },
      }),
    );
  }

  // 4. 通信費の引落し(費用の発生/資産の減少)
  {
    const amt = 18000;
    questions.push(
      journalQ({
        id: 'B01-004',
        topic: T,
        difficulty: 1,
        prompt: `今月分の電話料金とインターネット料金 ${yen(amt)} が普通預金口座から引き落とされた。`,
        choices: ['現金', '普通預金', '通信費', '水道光熱費', '支払手数料', '未払金'],
        debit: [line('通信費', amt)],
        credit: [line('普通預金', amt)],
        explanation:
          '電話・インターネットの料金は **通信費(費用)** で、費用の発生は借方。普通預金(資産)が減ったので貸方。',
        mistakes: [
          {
            entry: { debit: [line('通信費', amt)], credit: [line('現金', amt)] },
            why: '引き落とされたのは普通預金口座。現金は減っていない。',
          },
          {
            entry: { debit: [line('水道光熱費', amt)], credit: [line('普通預金', amt)] },
            why: '電気・ガス・水道が水道光熱費。電話・インターネットは通信費。',
          },
        ],
        ref: { topic: T, anchor: 'eight' },
      }),
    );
  }

  // 5. 備品を一部後払いで購入(資産の増加/資産の減少・負債の増加)
  {
    const price = 360000;
    const paid = 120000;
    const rest = step('未払金(まだ払っていない残額)', 'sub', [price, paid]);
    questions.push(
      journalQ({
        id: 'B01-005',
        topic: T,
        difficulty: 2,
        prompt: `備品 ${yen(price)} を購入し、代金のうち ${yen(paid)} は普通預金口座から支払い、残額は翌月末に支払うことにした。`,
        choices: ['普通預金', '備品', '前払金', '買掛金', '未払金', '借入金'],
        debit: [line('備品', price)],
        credit: [line('普通預金', paid), line('未払金', rest.value)],
        calc: [rest],
        explanation: `備品は代金の全額 ${yen(price)} で借方。払った ${yen(paid)} は普通預金の減少、まだ払っていない ${yen(rest.value)} は **未払金(負債)** の増加で、どちらも貸方。`,
        mistakes: [
          {
            entry: {
              debit: [line('備品', price)],
              credit: [line('普通預金', paid), line('買掛金', rest.value)],
            },
            why: '買掛金は商品を仕入れたときの未払い。備品など商品以外の未払いは未払金。',
          },
          {
            entry: { debit: [line('備品', paid)], credit: [line('普通預金', paid)] },
            why: `備品は全部もう手に入っている。まだ払っていない分も含め、購入代金の全額 ${yen(price)} で記録する。`,
          },
          {
            entry: {
              debit: [line('備品', price)],
              credit: [line('普通預金', paid), line('前払金', rest.value)],
            },
            why: '前払金は「先に払った代金」(資産)。これから払う義務は未払金(負債)。',
          },
        ],
        ref: { topic: T, anchor: 'traps' },
      }),
    );
  }

  // 6. 借入金の返済と利息(負債の減少・費用の発生/資産の減少)
  {
    const principal = 250000;
    const interest = 5000;
    const total = step('普通預金の減少(元本 + 利息)', 'add', [principal, interest]);
    questions.push(
      journalQ({
        id: 'B01-006',
        topic: T,
        difficulty: 2,
        prompt: `銀行からの借入金のうち ${yen(principal)} を、利息 ${yen(interest)} とともに普通預金口座から返済した。`,
        choices: ['現金', '普通預金', '貸付金', '借入金', '受取利息', '支払利息'],
        debit: [line('借入金', principal), line('支払利息', interest)],
        credit: [line('普通預金', total.value)],
        calc: [total],
        explanation: `借入金(負債)を元本の ${yen(principal)} だけ減らし(借方)、利息は **支払利息(費用)** として借方。口座から出ていったのは合計 ${yen(total.value)} なので、普通預金の減少として貸方。`,
        mistakes: [
          {
            entry: { debit: [line('借入金', total.value)], credit: [line('普通預金', total.value)] },
            why: `利息は借りたお金の使用料なので費用(支払利息)。借入金を減らすのは元本の ${yen(principal)} だけ。`,
          },
          {
            entry: {
              debit: [line('借入金', principal), line('受取利息', interest)],
              credit: [line('普通預金', total.value)],
            },
            why: '払った利息は支払利息(費用)。受取利息はお金を貸して利息を受け取ったときの収益。',
          },
          {
            entry: { debit: [line('借入金', principal)], credit: [line('普通預金', principal)] },
            why: `利息の支払いが抜けています。口座から出ていったのは元本と利息の合計 ${yen(total.value)}。`,
          },
        ],
        ref: { topic: T, anchor: 'traps' },
      }),
    );
  }

  // 7. 株式の発行(資産の増加/純資産の増加)
  {
    const amt = 1000000;
    questions.push(
      journalQ({
        id: 'B01-007',
        topic: T,
        difficulty: 2,
        prompt: `会社の設立にあたり、株式を発行して株主から ${yen(amt)} の払込みを受け、全額が普通預金口座に入金された。`,
        choices: ['現金', '普通預金', '借入金', '資本金', '売上', '繰越利益剰余金'],
        debit: [line('普通預金', amt)],
        credit: [line('資本金', amt)],
        explanation:
          '普通預金(資産)が増えたので借方。株主からの出資は返す義務がない元手なので **資本金(純資産)** の増加として貸方。',
        mistakes: [
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('借入金', amt)] },
            why: '株主からの出資は返す義務がないので負債ではない。純資産の資本金。',
          },
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('売上', amt)] },
            why: '出資は商品を売ったもうけ(収益)ではない。純資産の資本金が増える。',
          },
          {
            entry: { debit: [line('現金', amt)], credit: [line('資本金', amt)] },
            why: '入金先は普通預金口座。現金は増えていない。',
          },
        ],
        ref: { topic: T, anchor: 'traps' },
      }),
    );
  }

  // 8. 簿記上の取引になるもの
  {
    const order = 100000;
    const stolen = 30000;
    questions.push(
      choiceQ({
        id: 'B01-008',
        topic: T,
        difficulty: 1,
        prompt: '次のうち、簿記上の取引になるものはどれか。',
        options: [
          `得意先から商品 ${yen(order)} の注文を受けた`,
          '事務所を借りる契約を結んだ(お金の支払いは来月から)',
          `金庫に保管していた現金 ${yen(stolen)} が盗まれた`,
          '従業員を1名採用することを決めた',
        ],
        answer: 2,
        explanation:
          '簿記上の取引とは、**資産・負債・純資産・収益・費用のどれかが増減すること**。盗難は現金(資産)が減るので取引になる。ふだんの言葉の「取引」とずれる所なので注意。',
        mistakes: [
          {
            option: 0,
            why: '注文を受けただけでは、商品もお金も動いていない。商品を渡したときに取引になる。',
          },
          {
            option: 1,
            why: '契約を結んだだけでは5つの要素はどれも増減しない。お金を払ったときに取引になる。',
          },
          {
            option: 3,
            why: '採用を決めただけでは何も増減しない。給料を払ったときに取引になる。',
          },
        ],
        ref: { topic: T, anchor: 'traps' },
      }),
    );
  }

  // 9. 5要素の分類
  questions.push(
    choiceQ({
      id: 'B01-009',
      topic: T,
      difficulty: 2,
      prompt: '次の勘定科目のうち、負債に分類されるものはどれか。',
      options: ['前払金', '未払金', '支払利息', '貸付金'],
      answer: 1,
      explanation:
        '**未払金** は、商品以外のものを買って代金をあとで払う義務なので負債。名前に「払」がついていても、資産・負債・費用のどれかは意味で判断する。',
      mistakes: [
        { option: 0, why: '前払金は先に代金を払ったことで「あとで受け取る権利」がある資産。' },
        { option: 2, why: '支払利息は利息を払ったときの費用。「払」がついても負債とは限らない。' },
        { option: 3, why: '貸付金は貸したお金を返してもらう権利なので資産。' },
      ],
      ref: { topic: T, anchor: 'elements' },
    }),
  );

  // 10. 純資産の増加と当期純利益(ボックス図)
  {
    const a0 = 1200000;
    const l0 = 500000;
    const a1 = 1450000;
    const l1 = 620000;
    const revenue = 980000;
    const eq0 = step('期首の純資産(期首の資産 − 期首の負債)', 'sub', [a0, l0]);
    const eq1 = step('期末の純資産(期末の資産 − 期末の負債)', 'sub', [a1, l1]);
    const ni = step('当期純利益(期末の純資産 − 期首の純資産)', 'sub', [eq1.value, eq0.value]);
    const expense = step('費用の総額(収益の総額 − 当期純利益)', 'sub', [revenue, ni.value]);

    // よくある誤答の数値もコードで計算する
    const wrongEq1 = step('誤答: 収益の総額 − 期末の純資産', 'sub', [revenue, eq1.value]);
    const assetUp = step('資産の増加額(期末の資産 − 期首の資産)', 'sub', [a1, a0]);
    const wrongAsset = step('誤答: 収益の総額 − 資産の増加額', 'sub', [revenue, assetUp.value]);
    const wrongAdd = step('誤答: 収益の総額 + 当期純利益', 'add', [revenue, ni.value]);

    questions.push(
      numericQ({
        id: 'B01-010',
        topic: T,
        difficulty: 3,
        prompt: [
          '次の資料から、当期の費用の総額を求めなさい。なお、当期中に増資と配当はなかった。',
          '',
          '| | 資産 | 負債 |',
          '|---|--:|--:|',
          `| 期首 | ${yen(a0)} | ${yen(l0)} |`,
          `| 期末 | ${yen(a1)} | ${yen(l1)} |`,
          '',
          `当期の収益の総額は ${yen(revenue)} だった。`,
        ].join('\n'),
        answer: expense.value,
        calc: [eq0, eq1, ni, expense],
        explanation: `増資・配当がないとき、純資産が増えた分がそのまま当期純利益。まず期首と期末の純資産を出して差を取り(当期純利益 ${yen(ni.value)})、**費用 = 収益 − 当期純利益** で求める。`,
        mistakes: [
          {
            value: wrongEq1.value,
            calc: [eq1, wrongEq1],
            why: '期末の純資産をそのまま当期純利益にしている。当期純利益は「期末の純資産 − 期首の純資産」。',
          },
          {
            value: wrongAsset.value,
            calc: [assetUp, wrongAsset],
            why: `資産の増加額(${yen(assetUp.value)})を当期純利益にしている。負債も増えているので、純資産(資産 − 負債)どうしで比べる。`,
          },
          {
            value: wrongAdd.value,
            calc: [ni, wrongAdd],
            why: '費用 = 収益 − 当期純利益。当期純利益を足すのではなく引く。',
          },
        ],
        ref: { topic: T, anchor: 'box' },
      }),
    );
  }

  return { topic: T, questions };
}
