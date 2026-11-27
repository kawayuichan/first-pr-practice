// C14 収益認識 の問題(12問)
// 仕訳10問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 一時点/一定期間、出荷・着荷・検収基準、契約負債、複数の履行義務、契約資産、変動対価(返金負債)。
// 割賦販売・工事契約・重要な金融要素・本人と代理人の区分などは1級なので扱わない。

import { choiceQ, journalQ, line, multiQ, step, yen } from '../lib/qlib.mjs';

const T = 'C14';

export default function build() {
  const questions = [];

  // 1. 出荷基準
  {
    const amt = 420000;
    questions.push(
      journalQ({
        id: 'C14-001',
        topic: T,
        difficulty: 1,
        prompt: `得意先に商品 ${yen(amt)} を発送した。代金は掛けとする。当社は出荷基準で売上を計上している。`,
        choices: ['売掛金', '売上', '契約資産', '契約負債', '発送費', '未収入金'],
        debit: [line('売掛金', amt)],
        credit: [line('売上', amt)],
        explanation: '**出荷基準** では、商品を発送したときに売上を計上する。代金は掛けなので売掛金。',
        mistakes: [
          {
            entry: { debit: [line('契約資産', amt)], credit: [line('売上', amt)] },
            why: '代金はすぐに請求できる(条件がない)ので、契約資産ではなく売掛金。',
          },
        ],
        ref: { topic: T, anchor: 'timing' },
      }),
    );
  }

  // 2. 検収基準(選択)
  questions.push(
    choiceQ({
      id: 'C14-002',
      topic: T,
      difficulty: 1,
      prompt: '検収基準で売上を計上している会社が、得意先に商品を発送した。売上を計上するのはいつか。',
      options: ['得意先から注文を受けたとき', '商品を発送したとき', '商品が得意先に届いたとき', '得意先から検収が終わったと連絡を受けたとき'],
      answer: 3,
      explanation: '**検収基準** は、得意先が商品の中身・数量を確かめた(検収した)ときに売上を計上する。発送したとき・届いたときは、まだ計上しない。',
      mistakes: [
        { option: 0, why: '注文を受けただけでは、まだ何も渡していない。' },
        { option: 1, why: '発送したときに計上するのは出荷基準。' },
        { option: 2, why: '届いたときに計上するのは着荷基準。' },
      ],
      ref: { topic: T, anchor: 'timing' },
    }),
  );

  // 3. 検収基準(検収の連絡)
  {
    const amt = 360000;
    const fee = 5000;
    questions.push(
      journalQ({
        id: 'C14-003',
        topic: T,
        difficulty: 2,
        prompt: `先日発送した商品 ${yen(amt)}(代金は掛け)について、得意先から検収が終わったと連絡を受けた。当社は検収基準で売上を計上している。なお、発送したときに当社負担の送料 ${yen(fee)} を支払い、発送費で処理している。`,
        choices: ['売掛金', '売上', '発送費', '契約資産', '契約負債', '未収入金'],
        debit: [line('売掛金', amt)],
        credit: [line('売上', amt)],
        explanation: `検収基準なので、検収の連絡を受けたこの時点で売上 ${yen(amt)} を計上する。送料はすでに発送費で処理済みなので、ここでは関係しない。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', amt + fee)], credit: [line('売上', amt), line('発送費', fee)] },
            why: '当社負担の送料は当社の費用(発送費)。売上や売掛金に含めない。',
          },
        ],
        ref: { topic: T, anchor: 'timing' },
      }),
    );
  }

  // 4〜5. 手付金(契約負債)→ 引渡し
  const order = 700000;
  const deposit = 140000;
  questions.push(
    journalQ({
      id: 'C14-004',
      topic: T,
      difficulty: 1,
      prompt: `得意先から商品 ${yen(order)} の注文を受け、手付金 ${yen(deposit)} が普通預金口座に入金された。`,
      choices: ['普通預金', '契約負債', '売上', '契約資産', '売掛金', '仮受金'],
      debit: [line('普通預金', deposit)],
      credit: [line('契約負債', deposit)],
      explanation: 'まだ商品を渡していないので売上ではない。先に受け取ったお金は、商品を渡す義務を表す **契約負債**(前受金でもよい)。',
      mistakes: [
        {
          entry: { debit: [line('普通預金', deposit)], credit: [line('売上', deposit)] },
          why: '売上は商品を渡したとき。手付金を受け取っただけでは売上にしない。',
        },
        {
          entry: { debit: [line('普通預金', deposit)], credit: [line('仮受金', deposit)] },
          why: '入金の理由(注文の手付金)がわかっているので、仮受金ではない。契約負債にする。',
        },
      ],
      ref: { topic: T, anchor: 'contract-liability' },
    }),
  );
  {
    const rest = step('売掛金(代金 − 手付金)', 'sub', [order, deposit]);
    questions.push(
      journalQ({
        id: 'C14-005',
        topic: T,
        difficulty: 2,
        prompt: `注文を受けていた商品 ${yen(order)} を引き渡した。手付金 ${yen(deposit)} は受け取ったときに契約負債で処理しており、残りの代金は掛けとする。`,
        choices: ['契約負債', '売掛金', '売上', '契約資産', '普通預金', '返金負債'],
        debit: [line('契約負債', deposit), line('売掛金', rest.value)],
        credit: [line('売上', order)],
        calc: [rest],
        explanation: `商品を渡したので、売上は全額の ${yen(order)}。手付金の分は契約負債を減らし、残りの ${yen(rest.value)} が売掛金。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', rest.value)], credit: [line('売上', rest.value)] },
            why: `売上は代金の全額 ${yen(order)}。手付金の分は契約負債を減らして売上に含める。`,
          },
        ],
        ref: { topic: T, anchor: 'contract-liability' },
      }),
    );
  }

  // 6. 一定の期間にわたるサービス(決算)
  {
    const fee = 360000;
    const months = 4;
    const m = step('経過した4か月分(年額 × 4)', 'mul', [fee, months]);
    const earned = step('売上にする額(÷ 12か月)', 'div', [m.value, 12]);
    questions.push(
      journalQ({
        id: 'C14-006',
        topic: T,
        difficulty: 2,
        prompt: `12月1日に、1年間の保守サービスの代金 ${yen(fee)} を受け取り、契約負債で処理した。決算日(3月31日)にあたり、サービスを提供した期間の分を売上に振り替える(月割り)。`,
        choices: ['契約負債', '売上', '契約資産', '前受収益', '売掛金', '返金負債'],
        debit: [line('契約負債', earned.value)],
        credit: [line('売上', earned.value)],
        calc: [m, earned],
        explanation: `保守サービスは、時間がたつにつれて義務を果たす。12月〜3月の${months}か月分 ${yen(earned.value)} を、契約負債から **売上** に振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('契約負債', fee)], credit: [line('売上', fee)] },
            why: `1年分を全部売上にしない。決算日までにサービスを提供した${months}か月分だけ。`,
          },
        ],
        ref: { topic: T, anchor: 'over-time' },
      }),
    );
  }

  // 7〜8. 複数の履行義務(商品 + 保守)
  const productPrice = 600000;
  const servicePrice = 120000;
  const serviceYears = 2;
  {
    const total = step('契約の代金(商品 + 保守サービス)', 'add', [productPrice, servicePrice]);
    questions.push(
      journalQ({
        id: 'C14-007',
        topic: T,
        difficulty: 3,
        prompt: `商品の販売と、その後${serviceYears}年間の保守サービスをセットにして ${yen(total.value)} で契約し、本日、商品を引き渡した。代金は月末に受け取る。代金は、商品に ${yen(productPrice)}、保守サービスに ${yen(servicePrice)} を配分する。`,
        choices: ['売掛金', '売上', '契約負債', '契約資産', '返金負債'],
        debit: [line('売掛金', total.value)],
        credit: [line('売上', productPrice), line('契約負債', servicePrice)],
        calc: [total],
        explanation: `1つの契約に2つの約束(商品の引渡し・保守サービス)がある。引き渡した商品の分 ${yen(productPrice)} は売上、まだ果たしていない保守サービスの分 ${yen(servicePrice)} は **契約負債**。代金は無条件に請求できるので売掛金。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', total.value)], credit: [line('売上', total.value)] },
            why: '保守サービスはまだ提供していない。その分は売上にせず、契約負債にする。',
          },
        ],
        ref: { topic: T, anchor: 'multiple' },
      }),
    );
  }
  {
    const months = 6;
    const per = step('1か月分(保守サービス ÷ 24か月)', 'div', [servicePrice, serviceYears * 12]);
    const earned = step('売上にする額(1か月分 × 6か月)', 'mul', [per.value, months]);
    questions.push(
      journalQ({
        id: 'C14-008',
        topic: T,
        difficulty: 2,
        prompt: `商品とセットで契約した${serviceYears}年間の保守サービス(${yen(servicePrice)}、契約負債で処理済み)について、決算日までに${months}か月分のサービスを提供した。決算にあたり、提供した分を売上に振り替える。`,
        choices: ['契約負債', '売上', '売掛金', '契約資産', '前払費用', '返金負債'],
        debit: [line('契約負債', earned.value)],
        credit: [line('売上', earned.value)],
        calc: [per, earned],
        explanation: `${serviceYears}年(24か月)のうち${months}か月分を提供したので、${yen(servicePrice)} ÷ 24 × ${months} = ${yen(earned.value)} を売上に振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('契約負債', servicePrice)], credit: [line('売上', servicePrice)] },
            why: `まだ残りの期間のサービスを提供していない。提供した${months}か月分だけを売上にする。`,
          },
        ],
        ref: { topic: T, anchor: 'over-time' },
      }),
    );
  }

  // 9〜10. 契約資産
  const a = 180000;
  const b = 320000;
  questions.push(
    journalQ({
      id: 'C14-009',
      topic: T,
      difficulty: 3,
      prompt: `得意先と、商品Xと商品Yを合わせて販売する契約を結んだ。代金は、両方を引き渡したあとに請求できる。本日、商品X(${yen(a)}分)を引き渡した。`,
      choices: ['契約資産', '売上', '売掛金', '契約負債', '未収入金', '返金負債'],
      debit: [line('契約資産', a)],
      credit: [line('売上', a)],
      explanation: `商品Xを引き渡したので、その分 ${yen(a)} は売上にする。ただし、代金は商品Yも渡すまで請求できない(条件付き)ので、売掛金ではなく **契約資産**。`,
      mistakes: [
        {
          entry: { debit: [line('売掛金', a)], credit: [line('売上', a)] },
          why: '商品Yを渡すまで代金を請求できない(条件付き)ので、売掛金ではなく契約資産。',
        },
        {
          entry: { debit: [line('契約資産', a)], credit: [line('契約負債', a)] },
          why: '商品Xは渡したので、その分は売上にする。',
        },
      ],
      ref: { topic: T, anchor: 'contract-asset' },
    }),
  );
  {
    const total = step('代金の合計(商品X + 商品Y)', 'add', [a, b]);
    questions.push(
      journalQ({
        id: 'C14-010',
        topic: T,
        difficulty: 3,
        prompt: `商品Xと商品Yを合わせて販売する契約(代金は両方を引き渡したあとに請求できる)について、先に引き渡した商品X(${yen(a)}分)は契約資産で処理している。本日、商品Y(${yen(b)}分)を引き渡し、代金の全額を月末に受け取ることになった。`,
        choices: ['売掛金', '売上', '契約資産', '契約負債', '未収入金', '返金負債'],
        debit: [line('売掛金', total.value)],
        credit: [line('売上', b), line('契約資産', a)],
        calc: [total],
        explanation: `商品Yの分 ${yen(b)} を売上にする。両方を渡して無条件に請求できるようになったので、代金の全額 ${yen(total.value)} を売掛金にし、契約資産 ${yen(a)} を振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', b)], credit: [line('売上', b)] },
            why: `商品Xの分(契約資産 ${yen(a)})も、無条件に請求できるようになったので売掛金に振り替える。`,
          },
          {
            entry: { debit: [line('売掛金', total.value)], credit: [line('売上', total.value)] },
            why: `商品Xの分は、引き渡したときに売上にしている。ここでは契約資産 ${yen(a)} を売掛金に振り替える。`,
          },
        ],
        ref: { topic: T, anchor: 'contract-asset' },
      }),
    );
  }

  // 11. 変動対価(返金負債)
  {
    const sales = 900000;
    const rebate = 27000;
    const net = step('売上(代金 − 割戻しの見込み額)', 'sub', [sales, rebate]);
    questions.push(
      journalQ({
        id: 'C14-011',
        topic: T,
        difficulty: 3,
        prompt: `得意先に商品 ${yen(sales)} を掛けで売った。この得意先とは、一定の量を超えて買ったときに代金の一部を返す(割戻し)約束があり、このうち ${yen(rebate)} は返すことになると見込まれる。`,
        choices: ['売掛金', '売上', '返金負債', '売上割戻', '契約負債', '貸倒引当金'],
        debit: [line('売掛金', sales)],
        credit: [line('売上', net.value), line('返金負債', rebate)],
        calc: [net],
        explanation: `返すと見込まれる ${yen(rebate)} は、売上にせず **返金負債**(負債)にする。売上は ${yen(net.value)}。代金の全額 ${yen(sales)} を売掛金にする。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', sales)], credit: [line('売上', sales)] },
            why: '返すと見込まれる額は、売上に含めない。返金負債にする。',
          },
          {
            entry: { debit: [line('売掛金', sales)], credit: [line('売上', net.value), line('契約負債', rebate)] },
            why: '割戻しで返す見込みの額は、返金負債。契約負債は、先に代金を受け取ってまだ渡していないときの科目。',
          },
        ],
        ref: { topic: T, anchor: 'variable' },
      }),
    );
  }

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C14-012',
      topic: T,
      difficulty: 2,
      prompt: '収益認識について、正しいものをすべて選びなさい。',
      options: [
        '商品の注文を受けて手付金を受け取ったときは、契約負債にする',
        '検収基準では、商品を発送したときに売上を計上する',
        '1年間の保守サービスの代金は、受け取ったときに全額を売上にする',
        '商品を渡したが、代金の請求にまだ条件があるときは、契約資産にする',
        '割戻しで返すと見込まれる額は、売上にせず返金負債にする',
      ],
      answer: [0, 3, 4],
      explanation: '検収基準は、得意先が検収したときに売上を計上する。一定の期間にわたるサービスは、経過した期間の分だけ売上にする。',
      mistakes: [
        { options: [0, 1, 3, 4], why: '発送したときに計上するのは出荷基準。検収基準は、検収の連絡を受けたとき。' },
        { options: [0, 2, 3, 4], why: '保守サービスは一定の期間にわたって提供するので、経過した期間の分だけ売上にする。' },
        { options: [0, 4], why: '渡したが請求に条件があるときは契約資産。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'compare' },
    }),
  );

  return { topic: T, questions };
}
