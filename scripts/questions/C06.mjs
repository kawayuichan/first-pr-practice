// C06 電子記録債権(2級) の問題(10問)
// 仕訳8問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 譲渡・一部の譲渡・割引(日割りを含む)・営業外電子記録債権/債務。決済されなかった場合の処理は2027年度の範囲外なので扱わない。

import { choiceQ, journalQ, line, multiQ, step, yen } from '../lib/qlib.mjs';

const T = 'C06';

export default function build() {
  const questions = [];

  // 1. 譲渡する側
  {
    const amt = 350000;
    questions.push(
      journalQ({
        id: 'C06-001',
        topic: T,
        difficulty: 1,
        prompt: `仕入先に対する買掛金 ${yen(amt)} を支払うため、得意先に対する電子記録債権 ${yen(amt)} を、譲渡記録により仕入先に譲渡した。`,
        choices: ['買掛金', '電子記録債権', '電子記録債務', '売掛金', '当座預金', '電子記録債権売却損'],
        debit: [line('買掛金', amt)],
        credit: [line('電子記録債権', amt)],
        explanation: '手元の電子記録債権を渡して、買掛金を支払った。**電子記録債権が減り、買掛金も減る**。自分で発生記録をしたわけではないので、電子記録債務は増えない。',
        mistakes: [
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('電子記録債務', amt)] },
            why: 'これは、自分が支払う側として発生記録をしたときの仕訳。今回は持っていた電子記録債権を渡したので、電子記録債権が減る。',
          },
          {
            entry: { debit: [line('電子記録債権', amt)], credit: [line('買掛金', amt)] },
            why: '貸借が逆。渡したので電子記録債権は減る(貸方)、支払ったので買掛金も減る(借方)。',
          },
        ],
        ref: { topic: T, anchor: 'transfer' },
      }),
    );
  }

  // 2. 譲渡を受ける側
  {
    const amt = 180000;
    questions.push(
      journalQ({
        id: 'C06-002',
        topic: T,
        difficulty: 1,
        prompt: `得意先に対する売掛金 ${yen(amt)} の回収として、得意先が持っていた電子記録債権 ${yen(amt)} の譲渡を受けた。`,
        choices: ['電子記録債権', '売掛金', '売上', '電子記録債務', '買掛金', '当座預金'],
        debit: [line('電子記録債権', amt)],
        credit: [line('売掛金', amt)],
        explanation: '売掛金の代わりに電子記録債権を受け取った。**売掛金が電子記録債権に変わる** だけなので、売上は動かない。',
        mistakes: [
          {
            entry: { debit: [line('電子記録債権', amt)], credit: [line('売上', amt)] },
            why: '売上は、商品を売ったときにすでに記録している。今回は売掛金の回収なので、売掛金を減らす。',
          },
          {
            entry: { debit: [line('売掛金', amt)], credit: [line('電子記録債務', amt)] },
            why: '受け取ったのは債権(資産)。電子記録債務は、支払う側の負債。',
          },
        ],
        ref: { topic: T, anchor: 'transfer' },
      }),
    );
  }

  // 3. 一部の譲渡(分割)
  {
    const whole = 600000;
    const part = 250000;
    const rest = step('手元に残る電子記録債権(全体 − 譲渡した分)', 'sub', [whole, part]);
    questions.push(
      journalQ({
        id: 'C06-003',
        topic: T,
        difficulty: 2,
        prompt: `得意先に対する電子記録債権 ${yen(whole)} のうち ${yen(part)} を分割して、仕入先に対する買掛金の支払いのため譲渡した。`,
        choices: ['買掛金', '電子記録債権', '電子記録債務', '売掛金', '当座預金', '電子記録債権売却損'],
        debit: [line('買掛金', part)],
        credit: [line('電子記録債権', part)],
        calc: [rest],
        explanation: `電子記録債権は **分割** できるので、譲渡した ${yen(part)} だけを減らす。残りの ${yen(rest.value)} は手元に残り、支払期日に決済される。`,
        mistakes: [
          {
            entry: { debit: [line('買掛金', whole)], credit: [line('電子記録債権', whole)] },
            why: `譲渡したのは一部(${yen(part)})だけ。手元に残る ${yen(rest.value)} まで減らさない。`,
          },
          {
            entry: { debit: [line('買掛金', part)], credit: [line('電子記録債務', part)] },
            why: '持っていた電子記録債権を渡したので、減るのは電子記録債権。電子記録債務は増えない。',
          },
        ],
        ref: { topic: T, anchor: 'split' },
      }),
    );
  }

  // 4. 割引(割引料は金額で与える)
  {
    const face = 500000;
    const fee = 4000;
    const cash = step('入金額(額面 − 割引料)', 'sub', [face, fee]);
    questions.push(
      journalQ({
        id: 'C06-004',
        topic: T,
        difficulty: 1,
        prompt: `電子記録債権 ${yen(face)} を取引銀行で割り引き、割引料 ${yen(fee)} を差し引かれた残額が当座預金に入金された。`,
        choices: ['当座預金', '電子記録債権売却損', '電子記録債権', '支払利息', '支払手数料', '売掛金'],
        debit: [line('当座預金', cash.value), line('電子記録債権売却損', fee)],
        credit: [line('電子記録債権', face)],
        calc: [cash],
        explanation: `電子記録債権 ${yen(face)} を銀行に売り、割引料を引いた ${yen(cash.value)} を受け取った。割引料は債権を売った損なので **電子記録債権売却損**。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', cash.value), line('支払利息', fee)], credit: [line('電子記録債権', face)] },
            why: '割引はお金を借りたのではなく、債権を売った取引。割引料は電子記録債権売却損にする。',
          },
          {
            entry: { debit: [line('当座預金', face)], credit: [line('電子記録債権', face)] },
            why: `入金されたのは割引料を引いた ${yen(cash.value)}。差額の ${yen(fee)} を電子記録債権売却損にする。`,
          },
        ],
        ref: { topic: T, anchor: 'discount' },
      }),
    );
  }

  // 5. 割引(割引料を日割りで計算)
  {
    const face = 1095000;
    const ratePct = 4;
    const days = 50;
    const timesRate = step('額面 × 4(年利率4%の「4」)', 'mul', [face, ratePct]);
    const yearFee = step('1年分の割引料(÷ 100)', 'div', [timesRate.value, 100]);
    const byDays = step('50日分(1年分 × 50)', 'mul', [yearFee.value, days]);
    const fee = step('割引料(÷ 365日)', 'div', [byDays.value, 365]);
    const cash = step('入金額(額面 − 割引料)', 'sub', [face, fee.value]);
    const wrongCash = step('誤答: 1年分の割引料を引いた入金額', 'sub', [face, yearFee.value]);
    questions.push(
      journalQ({
        id: 'C06-005',
        topic: T,
        difficulty: 3,
        prompt: `電子記録債権 ${yen(face)} を取引銀行で割り引き、割引料を差し引かれた残額が当座預金に入金された。割引の日から支払期日までは${days}日、割引の年利率は${ratePct}%で、割引料は1年を365日として日割りで計算する。`,
        choices: ['当座預金', '電子記録債権売却損', '電子記録債権', '支払利息', '支払手数料', '受取利息'],
        debit: [line('当座預金', cash.value), line('電子記録債権売却損', fee.value)],
        credit: [line('電子記録債権', face)],
        calc: [timesRate, yearFee, byDays, fee, cash],
        explanation: `割引料 = 額面 × 年利率 × 日数 ÷ 365。1年分 ${yen(yearFee.value)} を **${days}日分** にすると ${yen(fee.value)}。入金額は ${yen(face)} − ${yen(fee.value)} = ${yen(cash.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', wrongCash.value), line('電子記録債権売却損', yearFee.value)], credit: [line('電子記録債権', face)] },
            why: `${yen(yearFee.value)} は1年分の割引料。支払期日までの${days}日分に直す(× ${days} ÷ 365)。`,
          },
          {
            entry: { debit: [line('当座預金', cash.value), line('支払利息', fee.value)], credit: [line('電子記録債権', face)] },
            why: '利率で計算しても、割引は債権を売った取引。割引料は電子記録債権売却損にする。',
          },
        ],
        ref: { topic: T, anchor: 'days' },
      }),
    );
  }

  // 6. 営業外電子記録債権の発生(備品の売却)
  {
    const cost = 600000;
    const acc = 360000;
    const price = 200000;
    const book = step('帳簿価額(取得原価 − 減価償却累計額)', 'sub', [cost, acc]);
    const loss = step('売却損(帳簿価額 − 売却価額)', 'sub', [book.value, price]);
    questions.push(
      journalQ({
        id: 'C06-006',
        topic: T,
        difficulty: 2,
        prompt: `不要になった備品(取得原価 ${yen(cost)}、減価償却累計額 ${yen(acc)}、間接法で記帳)を ${yen(price)} で売却し、代金は電子記録債権の発生記録により受け取ることにした。`,
        choices: ['備品減価償却累計額', '営業外電子記録債権', '電子記録債権', '固定資産売却損', '備品', '固定資産売却益', '未収入金'],
        debit: [line('備品減価償却累計額', acc), line('営業外電子記録債権', price), line('固定資産売却損', loss.value)],
        credit: [line('備品', cost)],
        calc: [book, loss],
        explanation: `備品の売却は商品売買ではないので、代金は **営業外電子記録債権**。帳簿価額 ${yen(book.value)} より安く売ったので、差額 ${yen(loss.value)} が固定資産売却損。`,
        mistakes: [
          {
            entry: { debit: [line('備品減価償却累計額', acc), line('電子記録債権', price), line('固定資産売却損', loss.value)], credit: [line('備品', cost)] },
            why: '電子記録債権は、商品売買(本業)から生じたもの。備品の売却代金は営業外電子記録債権。',
          },
          {
            entry: { debit: [line('備品減価償却累計額', acc), line('未収入金', price), line('固定資産売却損', loss.value)], credit: [line('備品', cost)] },
            why: '電子記録債権の発生記録をしたので、未収入金ではなく営業外電子記録債権にする。',
          },
        ],
        ref: { topic: T, anchor: 'nonoperating' },
      }),
    );
  }

  // 7. 営業外電子記録債務の発生(車両の購入)
  {
    const amt = 1800000;
    questions.push(
      journalQ({
        id: 'C06-007',
        topic: T,
        difficulty: 1,
        prompt: `営業用の車両 ${yen(amt)} を購入し、代金は電子記録債務の発生記録を行った。`,
        choices: ['車両運搬具', '営業外電子記録債務', '電子記録債務', '未払金', '買掛金', '当座預金'],
        debit: [line('車両運搬具', amt)],
        credit: [line('営業外電子記録債務', amt)],
        explanation: '車両の購入は商品の仕入ではないので、電子記録債務の発生記録をしたら **営業外電子記録債務**。',
        mistakes: [
          {
            entry: { debit: [line('車両運搬具', amt)], credit: [line('電子記録債務', amt)] },
            why: '電子記録債務は、商品の仕入(買掛金)から生じたもの。固定資産の購入代金は営業外電子記録債務。',
          },
          {
            entry: { debit: [line('車両運搬具', amt)], credit: [line('未払金', amt)] },
            why: '電子記録債務の発生記録をしたので、未払金ではなく営業外電子記録債務にする。',
          },
        ],
        ref: { topic: T, anchor: 'nonoperating' },
      }),
    );
  }

  // 8. 営業外電子記録債権の割引
  {
    const face = 300000;
    const fee = 2500;
    const cash = step('入金額(額面 − 割引料)', 'sub', [face, fee]);
    questions.push(
      journalQ({
        id: 'C06-008',
        topic: T,
        difficulty: 2,
        prompt: `土地を売却した際に受け取った営業外電子記録債権 ${yen(face)} を取引銀行で割り引き、割引料 ${yen(fee)} を差し引かれた残額が当座預金に入金された。`,
        choices: ['当座預金', '営業外電子記録債権売却損', '営業外電子記録債権', '電子記録債権売却損', '電子記録債権', '支払利息'],
        debit: [line('当座預金', cash.value), line('営業外電子記録債権売却損', fee)],
        credit: [line('営業外電子記録債権', face)],
        calc: [cash],
        explanation: `割り引いたのは **営業外** 電子記録債権なので、割引料は **営業外電子記録債権売却損**。入金額は ${yen(cash.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', cash.value), line('電子記録債権売却損', fee)], credit: [line('営業外電子記録債権', face)] },
            why: '公式の勘定科目表では、営業外電子記録債権の割引には「営業外電子記録債権売却損」を使う。',
          },
          {
            entry: { debit: [line('当座預金', cash.value), line('営業外電子記録債権売却損', fee)], credit: [line('電子記録債権', face)] },
            why: '土地の売却代金として受け取ったのは営業外電子記録債権。減らすのも営業外電子記録債権。',
          },
        ],
        ref: { topic: T, anchor: 'nonop-discount' },
      }),
    );
  }

  // 9. 売却損の表示(選択)
  questions.push(
    choiceQ({
      id: 'C06-009',
      topic: T,
      difficulty: 1,
      prompt: '電子記録債権売却損は、損益計算書のどの区分に表示するか。',
      options: ['売上原価', '販売費及び一般管理費', '営業外費用', '特別損失'],
      answer: 2,
      explanation: '割引は、期日より前にお金にするための **財務の取引**(利息に近い)。本業の費用ではないので **営業外費用** に表示する。',
      mistakes: [
        { option: 0, why: '売上原価は、売った商品の原価。割引料は関係がない。' },
        { option: 1, why: '販売費及び一般管理費は、商品を売る活動や会社の管理の費用。割引は財務の取引なので営業外費用。' },
        { option: 3, why: '特別損失は、火災など臨時でまれな損失。割引は通常の財務の取引なので営業外費用。' },
      ],
      ref: { topic: T, anchor: 'display' },
    }),
  );

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C06-010',
      topic: T,
      difficulty: 2,
      prompt: '電子記録債権(2級)について、正しいものをすべて選びなさい。',
      options: [
        '電子記録債権は、一部だけを譲渡・割引できる',
        '割引で差し引かれた割引料は、支払利息で処理する',
        '備品の売却代金について電子記録債権の発生記録をしたら、営業外電子記録債権にする',
        '電子記録債権を譲渡して買掛金を支払ったら、電子記録債務が増える',
        '割引で入金されるのは、額面から割引料を差し引いた額である',
      ],
      answer: [0, 2, 4],
      explanation: '電子記録債権は分割できるので、一部だけ譲渡・割引できる。割引料は電子記録債権売却損。譲渡は持っている債権を渡すので、電子記録債務は増えない。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '割引は債権を売った取引。割引料は電子記録債権売却損にする。' },
        { options: [0, 2, 3, 4], why: '譲渡では、持っていた電子記録債権が減るだけ。電子記録債務は、自分が支払う側として発生記録をしたときに増える。' },
        { options: [0, 4], why: '備品など固定資産の売却代金は、営業外電子記録債権。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'nonoperating' },
    }),
  );

  return { topic: T, questions };
}
