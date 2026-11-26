// B02 帳簿と伝票 の問題(10問)
// 伝票5問・証ひょう1問・補助簿の選択3問・仕訳日計表1問。金額はすべて step() で計算する。

import {
  journalQ,
  line,
  multiQ,
  numericQ,
  slipIn,
  slipOut,
  slipsQ,
  slipTransfer,
  step,
  yen,
} from '../lib/qlib.mjs';

const T = 'B02';

// 補助簿の選択問題で使う選択肢(3問共通)
const BOOKS = ['現金出納帳', '仕入帳', '売上帳', '商品有高帳', '売掛金元帳', '買掛金元帳', '固定資産台帳'];
const B = Object.fromEntries(BOOKS.map((b, i) => [b, i]));

export default function build() {
  const questions = [];

  // 1. 入金伝票
  {
    const amt = 45000;
    questions.push(
      slipsQ({
        id: 'B02-001',
        topic: T,
        difficulty: 1,
        prompt: `商品 ${yen(amt)} を売り上げ、代金は現金で受け取った。この取引を伝票に記入しなさい。`,
        choices: ['現金', '売掛金', '売上', '仕入', '受取手数料', '買掛金'],
        slips: [slipIn('売上', amt)],
        entry: { debit: [line('現金', amt)], credit: [line('売上', amt)] },
        explanation:
          '現金が入る取引なので **入金伝票**。入金伝票の借方はいつも現金なので、科目欄には **相手の科目(売上)** を書く。',
        mistakes: [
          {
            slips: [slipIn('現金', amt)],
            why: '入金伝票の科目欄には相手の科目(売上)を書く。借方の現金は、伝票の種類で決まっている。',
          },
          {
            slips: [slipTransfer('現金', amt, '売上')],
            why: '現金が入る取引は入金伝票。振替伝票は、現金が動かない取引だけに使う。',
          },
        ],
        ref: { topic: T, anchor: 'slips' },
      }),
    );
  }

  // 2. 出金伝票
  {
    const amt = 6000;
    questions.push(
      slipsQ({
        id: 'B02-002',
        topic: T,
        difficulty: 1,
        prompt: `事務用のコピー用紙 ${yen(amt)} を購入し、代金は現金で支払った(すぐに使った)。この取引を伝票に記入しなさい。`,
        choices: ['現金', '消耗品費', '備品', '仕入', '未払金', '通信費'],
        slips: [slipOut('消耗品費', amt)],
        entry: { debit: [line('消耗品費', amt)], credit: [line('現金', amt)] },
        explanation:
          '現金が出ていく取引なので **出金伝票**。出金伝票の貸方はいつも現金なので、科目欄には **相手の科目(消耗品費)** を書く。',
        mistakes: [
          {
            slips: [slipIn('消耗品費', amt)],
            why: 'お金が出ていったので出金伝票。入金伝票は現金が入ってきたときに使う。',
          },
          {
            slips: [slipOut('現金', amt)],
            why: '出金伝票の科目欄には相手の科目(消耗品費)を書く。貸方の現金は、伝票の種類で決まっている。',
          },
        ],
        ref: { topic: T, anchor: 'slips' },
      }),
    );
  }

  // 3. 振替伝票(普通預金は現金ではない)
  {
    const amt = 120000;
    questions.push(
      slipsQ({
        id: 'B02-003',
        topic: T,
        difficulty: 1,
        prompt: `得意先から、売掛金 ${yen(amt)} が普通預金口座に振り込まれた。この取引を伝票に記入しなさい。`,
        choices: ['現金', '普通預金', '売掛金', '売上', '買掛金', '前受金'],
        slips: [slipTransfer('普通預金', amt, '売掛金')],
        entry: { debit: [line('普通預金', amt)], credit: [line('売掛金', amt)] },
        explanation:
          '入ってきたのは **普通預金** で、現金は動いていない。だから入金伝票ではなく **振替伝票** に、仕訳と同じ形(借方 普通預金/貸方 売掛金)で書く。',
        mistakes: [
          {
            slips: [slipIn('売掛金', amt)],
            why: '入金伝票は「現金」が入るときだけ。普通預金への振込みは現金が動かないので振替伝票。',
          },
          {
            slips: [slipTransfer('売掛金', amt, '普通預金')],
            why: '左右が逆です。普通預金(資産)が増えたので借方、売掛金(資産)が減ったので貸方。',
          },
        ],
        ref: { topic: T, anchor: 'slips' },
      }),
    );
  }

  // 4. 一部現金取引: 取引を分けて起票する方法
  {
    const total = 150000;
    const cash = 50000;
    const rest = step('掛けの分(売掛金)= 売上の全額 − 現金で受け取った分', 'sub', [total, cash]);
    questions.push(
      slipsQ({
        id: 'B02-004',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(total)} を売り上げ、代金のうち ${yen(cash)} は現金で受け取り、残額は掛けとした。**取引を分けて起票する方法** で、伝票に記入しなさい。`,
        choices: ['現金', '売掛金', '売上', '買掛金', '前受金', '受取手数料'],
        slips: [slipIn('売上', cash), slipTransfer('売掛金', rest.value, '売上')],
        entry: { debit: [line('現金', cash), line('売掛金', rest.value)], credit: [line('売上', total)] },
        calc: [rest],
        explanation: `現金で受け取った ${yen(cash)} の売上は **入金伝票(売上)**、掛けの ${yen(rest.value)} の売上は **振替伝票(売掛金/売上)** に分けて書く。`,
        mistakes: [
          {
            slips: [slipTransfer('売掛金', total, '売上'), slipIn('売掛金', cash)],
            why: `これは「全額をいったん掛けにする方法」。問題は「取引を分けて起票する方法」なので、入金伝票の科目は売上、振替伝票は掛けの分 ${yen(rest.value)}。`,
          },
          {
            slips: [slipIn('売上', cash), slipTransfer('売掛金', total, '売上')],
            why: `振替伝票を全額にすると、売上が ${yen(cash)} 多くなってしまう。分ける方法では、振替伝票は掛けの分だけ。`,
          },
        ],
        ref: { topic: T, anchor: 'partial' },
      }),
    );
  }

  // 5. 一部現金取引: 全額をいったん掛けにする方法
  {
    const total = 80000;
    const cash = 20000;
    const rest = step('掛けの分(買掛金)= 仕入の全額 − 現金で払った分', 'sub', [total, cash]);
    questions.push(
      slipsQ({
        id: 'B02-005',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(total)} を仕入れ、代金のうち ${yen(cash)} は現金で支払い、残額は掛けとした。**全額をいったん掛けで仕入れたものとして起票する方法** で、伝票に記入しなさい。`,
        choices: ['現金', '仕入', '買掛金', '売掛金', '未払金', '前払金'],
        slips: [slipTransfer('仕入', total, '買掛金'), slipOut('買掛金', cash)],
        entry: { debit: [line('仕入', total)], credit: [line('現金', cash), line('買掛金', rest.value)] },
        calc: [rest],
        explanation: `まず全額 ${yen(total)} を掛けで仕入れたとして **振替伝票(仕入/買掛金)**。そのうち ${yen(cash)} はすぐに現金で払ったと考えて、**出金伝票(買掛金)** を書く。`,
        mistakes: [
          {
            slips: [slipOut('仕入', cash), slipTransfer('仕入', rest.value, '買掛金')],
            why: `これは「取引を分けて起票する方法」。全額を掛けにする方法では、振替伝票は全額 ${yen(total)}、出金伝票の科目は買掛金。`,
          },
          {
            slips: [slipTransfer('仕入', total, '買掛金'), slipOut('仕入', cash)],
            why: '出金伝票の科目を仕入にすると、仕入が二重になる。全額をいったん掛けにしたので、現金で払ったのは買掛金。',
          },
        ],
        ref: { topic: T, anchor: 'partial' },
      }),
    );
  }

  // 6. 証ひょう(請求書)から仕訳
  {
    const unit = 60000;
    const qty = 2;
    const shipping = 4000;
    const desks = step('デスクの代金(単価 × 数量)', 'mul', [unit, qty]);
    const total = step('請求額の合計(デスク + 配送料)', 'add', [desks.value, shipping]);
    questions.push(
      journalQ({
        id: 'B02-006',
        topic: T,
        difficulty: 2,
        prompt: [
          '事務所で使う机を購入し、次の請求書を受け取った。代金は月末に支払う。この取引の仕訳をしなさい。',
          '',
          '**請求書**(当社あて)',
          '',
          '| 品物 | 数量 | 単価 | 金額 |',
          '|---|--:|--:|--:|',
          `| 事務用デスク | ${qty} | ${yen(unit)} | ${yen(desks.value)} |`,
          `| 配送料 | | | ${yen(shipping)} |`,
          `| 合計 | | | ${yen(total.value)} |`,
        ].join('\n'),
        choices: ['現金', '備品', '消耗品費', '発送費', '未払金', '買掛金'],
        debit: [line('備品', total.value)],
        credit: [line('未払金', total.value)],
        calc: [desks, total],
        explanation: `長く使う机は **備品**。机を買うためにかかった配送料も備品の金額に含める(付随費用)。代金は月末払いで、商品ではないので **未払金**。`,
        mistakes: [
          {
            entry: { debit: [line('備品', desks.value), line('発送費', shipping)], credit: [line('未払金', total.value)] },
            why: '机を買うためにかかった配送料は付随費用で、備品の金額に含める。発送費は商品を売って送るときの費用。',
          },
          {
            entry: { debit: [line('備品', total.value)], credit: [line('買掛金', total.value)] },
            why: '買掛金は商品を仕入れたときだけ。備品の後払いは未払金。',
          },
          {
            entry: { debit: [line('消耗品費', total.value)], credit: [line('未払金', total.value)] },
            why: '長く使う机は備品(資産)。すぐに使い切る文房具などが消耗品費。',
          },
        ],
        ref: { topic: T, anchor: 'vouchers' },
      }),
    );
  }

  // 7〜9. 補助簿の選択
  {
    const amt = 90000;
    questions.push(
      multiQ({
        id: 'B02-007',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(amt)} を仕入れ、代金は掛けとした。この取引を記入する補助簿を、すべて選びなさい。`,
        options: BOOKS,
        answer: [B.仕入帳, B.商品有高帳, B.買掛金元帳],
        explanation:
          '仕訳は「仕入 / 買掛金」。科目ごとに考えると、仕入 → **仕入帳と商品有高帳**、買掛金 → **買掛金元帳**。',
        mistakes: [
          {
            options: [B.仕入帳, B.買掛金元帳],
            why: '商品有高帳を忘れている。商品の仕入・売上は、商品の数量と単価の動きとして商品有高帳にも書く。',
          },
          {
            options: [B.仕入帳, B.商品有高帳, B.売掛金元帳],
            why: '仕入先への未払いは買掛金元帳。売掛金元帳は、得意先からまだ回収していない分の明細。',
          },
        ],
        ref: { topic: T, anchor: 'choose-books' },
      }),
    );
  }
  {
    const total = 70000;
    const cash = 30000;
    questions.push(
      multiQ({
        id: 'B02-008',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(total)} を売り上げ、代金のうち ${yen(cash)} は現金で受け取り、残額は掛けとした。この取引を記入する補助簿を、すべて選びなさい。`,
        options: BOOKS,
        answer: [B.現金出納帳, B.売上帳, B.商品有高帳, B.売掛金元帳],
        explanation:
          '仕訳は「現金・売掛金 / 売上」。現金 → **現金出納帳**、売掛金 → **売掛金元帳**、売上 → **売上帳と商品有高帳**。',
        mistakes: [
          {
            options: [B.現金出納帳, B.売上帳, B.売掛金元帳],
            why: '商品有高帳を忘れている。商品を売ったときも、商品が出ていった記録として商品有高帳に書く。',
          },
          {
            options: [B.現金出納帳, B.売上帳, B.商品有高帳],
            why: '掛けの分(売掛金)があるので、売掛金元帳にも書く。',
          },
        ],
        ref: { topic: T, anchor: 'choose-books' },
      }),
    );
  }
  {
    const amt = 200000;
    questions.push(
      multiQ({
        id: 'B02-009',
        topic: T,
        difficulty: 2,
        prompt: `営業用の備品 ${yen(amt)} を購入し、代金は翌月末に支払うことにした。この取引を記入する補助簿を、すべて選びなさい。`,
        options: BOOKS,
        answer: [B.固定資産台帳],
        explanation:
          '仕訳は「備品 / 未払金」。備品 → **固定資産台帳**。未払金には補助簿がないので、書く補助簿は固定資産台帳だけ。',
        mistakes: [
          {
            options: [B.買掛金元帳, B.固定資産台帳],
            why: '買掛金元帳は商品の仕入先に対する買掛金の明細。備品の後払いは未払金で、未払金の補助簿はない。',
          },
          {
            options: [B.仕入帳, B.固定資産台帳],
            why: '仕入帳は商品を仕入れたときだけ。備品の購入は仕入ではない。',
          },
        ],
        ref: { topic: T, anchor: 'choose-books' },
      }),
    );
  }

  // 10. 仕訳日計表の合計
  {
    const inSlips = [['売上', 60000], ['売掛金', 35000]];
    const outSlips = [['仕入', 28000], ['通信費', 7000]];
    const trSlips = [['売掛金', '売上', 90000], ['仕入', '買掛金', 40000]];
    const inSum = step('入金伝票の合計(= 現金の借方)', 'add', inSlips.map((s) => s[1]));
    const outSum = step('出金伝票の合計(借方は仕入・通信費)', 'add', outSlips.map((s) => s[1]));
    const trSum = step('振替伝票の合計(借方の金額)', 'add', trSlips.map((s) => s[2]));
    const total = step('仕訳日計表の借方の合計', 'add', [inSum.value, outSum.value, trSum.value]);

    const wrongNoOut = step('誤答: 入金伝票 + 振替伝票', 'add', [inSum.value, trSum.value]);
    const trTwice = step('振替伝票を2回数えた額', 'mul', [trSum.value, 2]);
    const wrongDouble = step('誤答: 入金 + 出金 + 振替 × 2', 'add', [inSum.value, outSum.value, trTwice.value]);
    const wrongCash = step('誤答: 入金伝票 − 出金伝票(現金の増減)', 'sub', [inSum.value, outSum.value]);

    questions.push(
      numericQ({
        id: 'B02-010',
        topic: T,
        difficulty: 3,
        prompt: [
          'ある日の伝票は次のとおりだった。この伝票から仕訳日計表を作るとき、仕訳日計表の **借方の合計** はいくらか。',
          '',
          '| 伝票 | 科目 | 金額 |',
          '|---|---|--:|',
          ...inSlips.map(([a, v]) => `| 入金伝票 | ${a} | ${yen(v)} |`),
          ...outSlips.map(([a, v]) => `| 出金伝票 | ${a} | ${yen(v)} |`),
          ...trSlips.map(([d, c, v]) => `| 振替伝票 | ${d} / ${c} | ${yen(v)} |`),
        ].join('\n'),
        answer: total.value,
        calc: [inSum, outSum, trSum, total],
        explanation:
          '仕訳日計表の借方には、入金伝票の合計(現金の借方)、出金伝票の科目(仕入・通信費)、振替伝票の借方が入る。つまり **すべての伝票の金額の合計** になる(貸方の合計も同じ金額)。',
        mistakes: [
          {
            value: wrongNoOut.value,
            calc: [inSum, trSum, wrongNoOut],
            why: '出金伝票の科目(仕入・通信費)も借方に入る。合計は、すべての伝票の金額の合計。',
          },
          {
            value: wrongDouble.value,
            calc: [trTwice, wrongDouble],
            why: '振替伝票を2回数えている。1枚の振替伝票は、借方と貸方に同じ金額が1回ずつ入る。借方の合計に入るのは1回だけ。',
          },
          {
            value: wrongCash.value,
            calc: [inSum, outSum, wrongCash],
            why: '現金の増減(入金 − 出金)ではなく、仕訳日計表全体の借方の合計を聞いている。',
          },
        ],
        ref: { topic: T, anchor: 'daily' },
      }),
    );
  }

  return { topic: T, questions };
}
