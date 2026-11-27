// C08 有価証券①売買目的有価証券 の問題(12問)
// 仕訳8問・数値2問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 売買(分記法)、平均単価、債券の端数利息(日付から数える問題を含む)、配当金・利息、評価替え(切放法・洗替法)。
// 約定日基準・修正受渡基準・総記法は1級なので扱わない。
// 有価証券評価損 と 有価証券評価損益 はどちらも公式表の標準の科目なので、1つの問題の選択肢にはどちらか一方だけを入れる。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C08';

/** 年利率(rate / scale)の1年分の利息を日割りにする */
function interestSteps(face, rate, scale, rateText, days) {
  const times = step(`額面 × ${rate}(年利率${rateText}%の計算)`, 'mul', [face, rate]);
  const year = step(`1年分の利息(÷ ${scale})`, 'div', [times.value, scale]);
  const byDays = step(`${days}日分(1年分 × ${days})`, 'mul', [year.value, days]);
  const interest = step('端数利息(÷ 365日)', 'div', [byDays.value, 365]);
  return { times, year, byDays, interest };
}

export default function build() {
  const questions = [];

  // 1. 株式を買う(手数料は取得原価)
  {
    const shares = 500;
    const price = 620;
    const fee = 4000;
    const base = step('購入代価(1株の値段 × 株数)', 'mul', [price, shares]);
    const cost = step('取得原価(購入代価 + 手数料)', 'add', [base.value, fee]);
    questions.push(
      journalQ({
        id: 'C08-001',
        topic: T,
        difficulty: 1,
        prompt: `売買目的で、A社株式${shares}株を1株 ${yen(price)} で買い、手数料 ${yen(fee)} とともに普通預金口座から支払った。`,
        choices: ['売買目的有価証券', '普通預金', '支払手数料', '満期保有目的債券', '有価証券利息', '未払金'],
        debit: [line('売買目的有価証券', cost.value)],
        credit: [line('普通預金', cost.value)],
        calc: [base, cost],
        explanation: `手数料は買うためにかかった費用(付随費用)なので、**取得原価に含める**。${yen(base.value)} + ${yen(fee)} = ${yen(cost.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('売買目的有価証券', base.value), line('支払手数料', fee)], credit: [line('普通預金', cost.value)] },
            why: '有価証券を買うときの手数料は、支払手数料にせず取得原価に含める。',
          },
          {
            entry: { debit: [line('満期保有目的債券', cost.value)], credit: [line('普通預金', cost.value)] },
            why: '時価の変動で利益を得るために持つ株式は売買目的有価証券。満期保有目的債券は満期まで持つ債券(C09)。',
          },
        ],
        ref: { topic: T, anchor: 'buy' },
      }),
    );
  }

  // 2. 株式を売る(売却益)
  {
    const held = 400;
    const book = 480000;
    const sold = 300;
    const price = 1350;
    const unit = step('1株の帳簿価額(帳簿価額 ÷ 株数)', 'div', [book, held]);
    const soldBook = step('売った株の帳簿価額(1株の帳簿価額 × 売った株数)', 'mul', [unit.value, sold]);
    const proceeds = step('売却価額(1株の値段 × 売った株数)', 'mul', [price, sold]);
    const gain = step('売却益(売却価額 − 帳簿価額)', 'sub', [proceeds.value, soldBook.value]);
    const wrongLoss = step('誤答: 全部の帳簿価額から売却価額を引いた額', 'sub', [book, proceeds.value]);
    questions.push(
      journalQ({
        id: 'C08-002',
        topic: T,
        difficulty: 2,
        prompt: `売買目的で持っているB社株式${held}株(帳簿価額 ${yen(book)})のうち${sold}株を、1株 ${yen(price)} で売り、代金は普通預金口座に入金された。`,
        choices: ['普通預金', '売買目的有価証券', '有価証券売却益', '有価証券売却損', '有価証券評価益', '受取配当金'],
        debit: [line('普通預金', proceeds.value)],
        credit: [line('売買目的有価証券', soldBook.value), line('有価証券売却益', gain.value)],
        calc: [unit, soldBook, proceeds, gain],
        explanation: `1株の帳簿価額は ${yen(unit.value)}。売った${sold}株の帳簿価額 ${yen(soldBook.value)} を減らし、売却価額 ${yen(proceeds.value)} との差額 ${yen(gain.value)} を **有価証券売却益** にする(分記法)。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', proceeds.value)], credit: [line('売買目的有価証券', proceeds.value)] },
            why: '有価証券は帳簿価額で減らし、売却価額との差額を売却益にする。',
          },
          {
            entry: { debit: [line('普通預金', proceeds.value), line('有価証券売却損', wrongLoss.value)], credit: [line('売買目的有価証券', book)] },
            why: `売ったのは${held}株のうち${sold}株だけ。減らすのは売った分の帳簿価額 ${yen(soldBook.value)}。`,
            calc: [wrongLoss],
          },
        ],
        ref: { topic: T, anchor: 'sell' },
      }),
    );
  }

  // 3. 株式を売る(売却損・代金は後日)
  {
    const held = 200;
    const book = 420000;
    const sold = 150;
    const price = 1900;
    const unit = step('1株の帳簿価額(帳簿価額 ÷ 株数)', 'div', [book, held]);
    const soldBook = step('売った株の帳簿価額', 'mul', [unit.value, sold]);
    const proceeds = step('売却価額', 'mul', [price, sold]);
    const loss = step('売却損(帳簿価額 − 売却価額)', 'sub', [soldBook.value, proceeds.value]);
    questions.push(
      journalQ({
        id: 'C08-003',
        topic: T,
        difficulty: 2,
        prompt: `売買目的で持っているC社株式${held}株(帳簿価額 ${yen(book)})のうち${sold}株を、1株 ${yen(price)} で売り、代金は後日受け取ることにした。`,
        choices: ['未収入金', '有価証券売却損', '売買目的有価証券', '売掛金', '有価証券売却益', '普通預金'],
        debit: [line('未収入金', proceeds.value), line('有価証券売却損', loss.value)],
        credit: [line('売買目的有価証券', soldBook.value)],
        calc: [unit, soldBook, proceeds, loss],
        explanation: `売った分の帳簿価額 ${yen(soldBook.value)} より売却価額 ${yen(proceeds.value)} が低いので、差額 ${yen(loss.value)} は **有価証券売却損**。商品以外の代金をあとで受け取るので **未収入金**。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', proceeds.value), line('有価証券売却損', loss.value)], credit: [line('売買目的有価証券', soldBook.value)] },
            why: '売掛金は商品の代金。有価証券を売った代金の未回収分は未収入金。',
          },
          {
            entry: { debit: [line('未収入金', proceeds.value)], credit: [line('売買目的有価証券', proceeds.value)] },
            why: '有価証券は帳簿価額で減らし、売却価額との差額を売却損にする。',
          },
        ],
        ref: { topic: T, anchor: 'sell' },
      }),
    );
  }

  // 4. 平均単価で売る
  {
    const n1 = 300;
    const p1 = 700;
    const n2 = 200;
    const p2 = 800;
    const sold = 250;
    const price = 760;
    const c1 = step('1回目の金額', 'mul', [p1, n1]);
    const c2 = step('2回目の金額', 'mul', [p2, n2]);
    const total = step('金額の合計', 'add', [c1.value, c2.value]);
    const shares = step('株数の合計', 'add', [n1, n2]);
    const avg = step('平均単価(金額の合計 ÷ 株数の合計)', 'div', [total.value, shares.value]);
    const soldBook = step('売った株の帳簿価額(平均単価 × 売った株数)', 'mul', [avg.value, sold]);
    const proceeds = step('売却価額', 'mul', [price, sold]);
    const gain = step('売却益(売却価額 − 帳簿価額)', 'sub', [proceeds.value, soldBook.value]);
    const fifoBook = step('誤答: 1回目の単価で出した帳簿価額', 'mul', [p1, sold]);
    const fifoGain = step('誤答: 1回目の単価で出した売却益', 'sub', [proceeds.value, fifoBook.value]);
    const lastBook = step('誤答: 2回目の単価で出した帳簿価額', 'mul', [p2, sold]);
    const lastLoss = step('誤答: 2回目の単価で出した売却損', 'sub', [lastBook.value, proceeds.value]);
    questions.push(
      journalQ({
        id: 'C08-004',
        topic: T,
        difficulty: 3,
        prompt: `売買目的で、D社株式を1回目に${n1}株を1株 ${yen(p1)}、2回目に${n2}株を1株 ${yen(p2)} で買っていた(手数料はなし)。このうち${sold}株を1株 ${yen(price)} で売り、代金は普通預金口座に入金された。`,
        choices: ['普通預金', '売買目的有価証券', '有価証券売却益', '有価証券売却損', '有価証券評価益', '未収入金'],
        debit: [line('普通預金', proceeds.value)],
        credit: [line('売買目的有価証券', soldBook.value), line('有価証券売却益', gain.value)],
        calc: [c1, c2, total, shares, avg, soldBook, proceeds, gain],
        explanation: `何回かに分けて買ったときは **平均単価** で帳簿価額を出す。平均単価 ${yen(avg.value)} × ${sold}株 = ${yen(soldBook.value)}。売却価額 ${yen(proceeds.value)} との差額 ${yen(gain.value)} が売却益。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', proceeds.value)], credit: [line('売買目的有価証券', fifoBook.value), line('有価証券売却益', fifoGain.value)] },
            why: '先に買った分から売ったことにしない。2回分をまとめた平均単価で帳簿価額を出す。',
            calc: [fifoBook, fifoGain],
          },
          {
            entry: { debit: [line('普通預金', proceeds.value), line('有価証券売却損', lastLoss.value)], credit: [line('売買目的有価証券', lastBook.value)] },
            why: '最後に買った単価ではなく、2回分をまとめた平均単価で帳簿価額を出す。',
            calc: [lastBook, lastLoss],
          },
        ],
        ref: { topic: T, anchor: 'average' },
      }),
    );
  }

  // 5. 端数利息(日付から日数を数える)
  {
    const face = 2000000;
    const days = step('日数(7月31日 + 8月31日 + 9月1日〜14日)', 'add', [31, 31, 14]);
    const { times, year, byDays, interest } = interestSteps(face, 1825, 100000, '1.825', days.value);
    const days77 = step('誤答: 6月30日も数えた日数', 'add', [days.value, 1]);
    const wrong77a = step('誤答: 77日分', 'mul', [year.value, days77.value]);
    const wrong77 = step('誤答: 77日分の端数利息', 'div', [wrong77a.value, 365]);
    const days75 = step('誤答: 9月14日を数えなかった日数', 'sub', [days.value, 1]);
    const wrong75a = step('誤答: 75日分', 'mul', [year.value, days75.value]);
    const wrong75 = step('誤答: 75日分の端数利息', 'div', [wrong75a.value, 365]);
    questions.push(
      numericQ({
        id: 'C08-005',
        topic: T,
        difficulty: 2,
        prompt: `売買目的で、額面 ${yen(face)} の社債(年利率1.825%、利払日は6月末と12月末)を9月14日に買った。端数利息はいくらか。端数利息は前の利払日の翌日から売買日までの日数で、1年を365日として日割りで計算する。`,
        answer: interest.value,
        calc: [days, times, year, byDays, interest],
        explanation: `日数は7月1日から9月14日まで: 31 + 31 + 14 = ${days.value}日。1年分の利息 ${yen(year.value)} × ${days.value} ÷ 365 = ${yen(interest.value)}。`,
        mistakes: [
          { value: wrong77.value, calc: [days77, wrong77a, wrong77], why: '前の利払日(6月30日)は数えない。数えるのは翌日の7月1日から。' },
          { value: wrong75.value, calc: [days75, wrong75a, wrong75], why: '売買日(9月14日)の当日まで数える。' },
        ],
        ref: { topic: T, anchor: 'bond-buy' },
      }),
    );
  }

  // 6. 債券を買う(端数利息を払う)
  {
    const face = 3000000;
    const days = 50;
    const pTimes = step('額面 × 975(額面100円につき97.5円)', 'mul', [face, 975]);
    const cost = step('取得原価(÷ 1,000)', 'div', [pTimes.value, 1000]);
    const { times, year, byDays, interest } = interestSteps(face, 146, 10000, '1.46', days);
    const pay = step('支払額(取得原価 + 端数利息)', 'add', [cost.value, interest.value]);
    questions.push(
      journalQ({
        id: 'C08-006',
        topic: T,
        difficulty: 2,
        prompt: `売買目的で、額面 ${yen(face)} の社債(年利率1.46%)を額面 ¥100 につき ¥97.5 で買い、端数利息とともに当座預金口座から支払った。端数利息は${days}日分で、1年を365日として計算する。`,
        choices: ['売買目的有価証券', '有価証券利息', '当座預金', '支払利息', '満期保有目的債券', '受取配当金'],
        debit: [line('売買目的有価証券', cost.value), line('有価証券利息', interest.value)],
        credit: [line('当座預金', pay.value)],
        calc: [pTimes, cost, times, year, byDays, interest, pay],
        explanation: `取得原価は ${yen(face)} × 97.5 ÷ 100 = ${yen(cost.value)}。端数利息 ${yen(interest.value)} は前の持ち主の分の利息なので、取得原価に含めず **有価証券利息(借方)**。`,
        mistakes: [
          {
            entry: { debit: [line('売買目的有価証券', pay.value)], credit: [line('当座預金', pay.value)] },
            why: '端数利息は取得原価に含めない。有価証券利息(借方)にする。',
          },
          {
            entry: { debit: [line('売買目的有価証券', cost.value), line('支払利息', interest.value)], credit: [line('当座預金', pay.value)] },
            why: '端数利息は、あとで受け取る利息の前払いのようなもの。借入金の利息(支払利息)ではなく、有価証券利息を借方に書く。',
          },
        ],
        ref: { topic: T, anchor: 'bond-buy' },
      }),
    );
  }

  // 7. 債券を売る(端数利息を受け取る)
  {
    const face = 2000000;
    const book = 1960000;
    const days = 85;
    const pTimes = step('額面 × 986(額面100円につき98.6円)', 'mul', [face, 986]);
    const proceeds = step('売却価額(÷ 1,000)', 'div', [pTimes.value, 1000]);
    const gain = step('売却益(売却価額 − 帳簿価額)', 'sub', [proceeds.value, book]);
    const { times, year, byDays, interest } = interestSteps(face, 219, 10000, '2.19', days);
    const cash = step('入金額(売却価額 + 端数利息)', 'add', [proceeds.value, interest.value]);
    const wrongGain = step('誤答: 端数利息を売却益に含めた額', 'add', [gain.value, interest.value]);
    questions.push(
      journalQ({
        id: 'C08-007',
        topic: T,
        difficulty: 3,
        prompt: `売買目的で持っている額面 ${yen(face)} の社債(帳簿価額 ${yen(book)}、年利率2.19%)を、額面 ¥100 につき ¥98.6 で売り、端数利息とともに普通預金口座に入金された。端数利息は${days}日分で、1年を365日として計算する。`,
        choices: ['普通預金', '売買目的有価証券', '有価証券売却益', '有価証券利息', '有価証券売却損', '受取配当金'],
        debit: [line('普通預金', cash.value)],
        credit: [line('売買目的有価証券', book), line('有価証券売却益', gain.value), line('有価証券利息', interest.value)],
        calc: [pTimes, proceeds, gain, times, year, byDays, interest, cash],
        explanation: `売却価額 ${yen(proceeds.value)} − 帳簿価額 ${yen(book)} = 売却益 ${yen(gain.value)}。持っていた期間の端数利息 ${yen(interest.value)} は、売却益と分けて **有価証券利息(貸方)**。入金額は合わせて ${yen(cash.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', cash.value)], credit: [line('売買目的有価証券', book), line('有価証券売却益', wrongGain.value)] },
            why: '端数利息は売却益に含めない。有価証券利息として分けて書く。',
            calc: [wrongGain],
          },
          {
            entry: { debit: [line('普通預金', proceeds.value)], credit: [line('売買目的有価証券', book), line('有価証券売却益', gain.value)] },
            why: '端数利息も一緒に受け取っている。有価証券利息(貸方)を忘れずに書く。',
          },
        ],
        ref: { topic: T, anchor: 'bond-sell' },
      }),
    );
  }

  // 8. 配当金と利息(選択)
  questions.push(
    choiceQ({
      id: 'C08-008',
      topic: T,
      difficulty: 1,
      prompt: '次の2つを受け取ったときの貸方の科目の組み合わせとして、正しいものはどれか。(ア)持っている株式の配当金 (イ)持っている社債の利払日の利息',
      options: ['(ア)有価証券利息 (イ)受取配当金', '(ア)受取配当金 (イ)有価証券利息', '(ア)(イ)ともに受取配当金', '(ア)売買目的有価証券 (イ)有価証券利息'],
      answer: 1,
      explanation: '株式からの分配は **受取配当金**、債券(社債・国債)の利息は **有価証券利息**。',
      mistakes: [
        { option: 0, why: '逆になっている。株式からは配当金、債券からは利息。' },
        { option: 2, why: '社債から受け取るのは利息。有価証券利息にする。' },
        { option: 3, why: '配当金を受け取っても、株式の帳簿価額は減らない。受取配当金(収益)にする。' },
      ],
      ref: { topic: T, anchor: 'income' },
    }),
  );

  // 9. 決算の評価替え(評価損)
  {
    const book = 540000;
    const fair = 515000;
    const loss = step('評価損(帳簿価額 − 時価)', 'sub', [book, fair]);
    questions.push(
      journalQ({
        id: 'C08-009',
        topic: T,
        difficulty: 1,
        prompt: `決算で、売買目的有価証券(帳簿価額 ${yen(book)})を時価 ${yen(fair)} に評価替えする。`,
        choices: ['有価証券評価損', '売買目的有価証券', '有価証券評価益', '有価証券売却損', '有価証券利息', '普通預金'],
        debit: [line('有価証券評価損', loss.value)],
        credit: [line('売買目的有価証券', loss.value)],
        calc: [loss],
        explanation: `時価が ${yen(loss.value)} 下がったので、売買目的有価証券を減らし **有価証券評価損** を計上する。`,
        mistakes: [
          {
            entry: { debit: [line('売買目的有価証券', loss.value)], credit: [line('有価証券評価益', loss.value)] },
            why: '時価が帳簿価額より下がったので、評価益ではなく評価損。売買目的有価証券は減らす(貸方)。',
          },
          {
            entry: { debit: [line('有価証券売却損', loss.value)], credit: [line('売買目的有価証券', loss.value)] },
            why: '売っていないので売却損ではない。決算の時価との差額は評価損。',
          },
        ],
        ref: { topic: T, anchor: 'valuation' },
      }),
    );
  }

  // 10. 洗替法: 期首に元へ戻す(有価証券評価損益を使う)
  {
    const book = 600000;
    const fair = 570000;
    const diff = step('前期末の評価差額(帳簿価額 − 時価)', 'sub', [book, fair]);
    questions.push(
      journalQ({
        id: 'C08-010',
        topic: T,
        difficulty: 2,
        prompt: `前期末に、売買目的有価証券(帳簿価額 ${yen(book)})を時価 ${yen(fair)} に評価替えし、評価差額を有価証券評価損益で処理した。当期首に、洗替法による処理を行う。`,
        choices: ['売買目的有価証券', '有価証券評価損益', '有価証券売却益', '有価証券売却損', '繰越利益剰余金', '普通預金'],
        debit: [line('売買目的有価証券', diff.value)],
        credit: [line('有価証券評価損益', diff.value)],
        calc: [diff],
        explanation: `前期末の仕訳は「有価証券評価損益 ${yen(diff.value)} / 売買目的有価証券 ${yen(diff.value)}」。洗替法では、期首にこの **逆の仕訳** をして、元の帳簿価額 ${yen(book)} に戻す。`,
        mistakes: [
          {
            entry: { debit: [line('有価証券評価損益', diff.value)], credit: [line('売買目的有価証券', diff.value)] },
            why: 'これは前期末の評価替えと同じ仕訳。期首には逆の仕訳で元に戻す。',
          },
          {
            entry: { debit: [line('売買目的有価証券', diff.value)], credit: [line('有価証券売却益', diff.value)] },
            why: '売っていないので売却益ではない。前期末に使った有価証券評価損益で戻す。',
          },
        ],
        ref: { topic: T, anchor: 'methods' },
      }),
    );
  }

  // 11. 洗替法と切放法で売却益が変わる(数値)
  {
    const book = 400000;
    const fair = 380000;
    const price = 410000;
    const gain = step('洗替法の売却益(売却価額 − 元の帳簿価額)', 'sub', [price, book]);
    const kiri = step('誤答: 切放法の売却益(売却価額 − 前期末の時価)', 'sub', [price, fair]);
    questions.push(
      numericQ({
        id: 'C08-011',
        topic: T,
        difficulty: 3,
        prompt: `前期末に、売買目的有価証券(帳簿価額 ${yen(book)})を時価 ${yen(fair)} に評価替えした。洗替法を採用している。当期に、この有価証券をすべて ${yen(price)} で売った。有価証券売却益はいくらか。`,
        answer: gain.value,
        calc: [gain],
        explanation: `洗替法では、期首に元の帳簿価額 ${yen(book)} に戻している。売却益は ${yen(price)} − ${yen(book)} = ${yen(gain.value)}。`,
        mistakes: [{ value: kiri.value, calc: [kiri], why: `これは切放法(前期末の時価 ${yen(fair)} が帳簿価額)の答え。洗替法では期首に元の帳簿価額へ戻す。` }],
        ref: { topic: T, anchor: 'methods' },
      }),
    );
  }

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C08-012',
      topic: T,
      difficulty: 2,
      prompt: '売買目的有価証券について、正しいものをすべて選びなさい。',
      options: [
        '株式を買ったときの手数料は、取得原価に含める',
        '債券を買ったときに払った端数利息は、取得原価に含める',
        '洗替法では、翌期首に決算の評価替えの逆の仕訳をして、元の帳簿価額に戻す',
        '切放法では、決算の時価がそのまま翌期の帳簿価額になる',
        '決算で時価が帳簿価額より高くなっても、評価益は計上しない',
      ],
      answer: [0, 2, 3],
      explanation: '手数料は取得原価に含め、端数利息は有価証券利息にする。売買目的有価証券は、時価が上がっても下がっても時価に評価替えする。',
      mistakes: [
        { options: [0, 1, 2, 3], why: '端数利息は前の持ち主の分の利息。取得原価に含めず、有価証券利息(借方)にする。' },
        { options: [0, 2, 3, 4], why: '売買目的有価証券は、時価が上がったときも評価替えして評価益を計上する。' },
        { options: [0, 2], why: '切放法では、決算の時価が翌期の帳簿価額になる。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'methods' },
    }),
  );

  return { topic: T, questions };
}
