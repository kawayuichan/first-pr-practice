// C07 ファクタリング(売掛債権の譲渡)の問題(8問)
// 仕訳5問・選択2問・複数選択1問。金額はすべて step() で計算する。
// 2級は買取型(2社間・3社間)の簡易な出題だけ。2社間は債権譲渡登記済みの場合。譲渡する債権は売掛金だけ(ユーザーと相談)。

import { choiceQ, journalQ, line, multiQ, step, yen } from '../lib/qlib.mjs';

const T = 'C07';

/** 手数料(売掛金 × 率%)と手取額 */
function feeSteps(ar, pct) {
  const times = step(`売掛金 × ${pct}(手数料${pct}%の「${pct}」)`, 'mul', [ar, pct]);
  const fee = step('手数料(÷ 100)', 'div', [times.value, 100]);
  const net = step('手取額(売掛金 − 手数料)', 'sub', [ar, fee.value]);
  return { times, fee, net };
}

export default function build() {
  const questions = [];

  // 1. 3社間: 契約(手数料は%)
  {
    const ar = 600000;
    const pct = 5;
    const { times, fee, net } = feeSteps(ar, pct);
    questions.push(
      journalQ({
        id: 'C07-001',
        topic: T,
        difficulty: 2,
        prompt: `得意先に対する売掛金 ${yen(ar)} を、得意先の承認を得てファクタリング会社に譲渡した(3社間ファクタリング)。手数料${pct}%を差し引かれた手取額が、普通預金口座に振り込まれた。`,
        choices: ['普通預金', '売掛債権売却損', '売掛金', '支払手数料', '支払利息', '預り金'],
        debit: [line('普通預金', net.value), line('売掛債権売却損', fee.value)],
        credit: [line('売掛金', ar)],
        calc: [times, fee, net],
        explanation: `手数料は ${yen(ar)} × ${pct}% = ${yen(fee.value)}。売掛金を売った損なので **売掛債権売却損**。普通預金に入るのは、売掛金から手数料を引いた ${yen(net.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', net.value), line('支払手数料', fee.value)], credit: [line('売掛金', ar)] },
            why: 'ファクタリングは売掛金を売る取引。差し引かれた手数料は売掛債権売却損にする。',
          },
          {
            entry: { debit: [line('普通預金', ar)], credit: [line('売掛金', ar)] },
            why: `振り込まれたのは手数料を引いた ${yen(net.value)}。差額の ${yen(fee.value)} を売掛債権売却損にする。`,
          },
        ],
        ref: { topic: T, anchor: 'three' },
      }),
    );
  }

  // 2. 3社間: 期日に得意先がファクタリング会社へ支払った(選択)
  {
    const ar = 600000;
    questions.push(
      choiceQ({
        id: 'C07-002',
        topic: T,
        difficulty: 2,
        prompt: `3社間ファクタリングで譲渡した売掛金 ${yen(ar)} について、支払期日に得意先がファクタリング会社へ代金を支払った。当社の仕訳として正しいものはどれか。`,
        options: ['「普通預金 / 売掛金」の仕訳をする', '仕訳はしない', '「売掛債権売却損 / 売掛金」の仕訳をする', '「預り金 / 売掛金」の仕訳をする'],
        answer: 1,
        explanation: '売掛金は、譲渡したときにすでに減らしている。3社間では得意先がファクタリング会社へ直接払うので、当社にお金は動かず **仕訳はしない**。',
        mistakes: [
          { option: 0, why: '当社の普通預金には入金がない。得意先が払ったのはファクタリング会社。' },
          { option: 2, why: '手数料(売掛債権売却損)は、譲渡したときに計上済み。期日には何もしない。' },
          { option: 3, why: '預り金を使うのは、2社間で得意先から当社に入金があったとき。3社間では当社に入金がない。' },
        ],
        ref: { topic: T, anchor: 'three' },
      }),
    );
  }

  // 3〜5. 2社間: 契約 → 期日の入金 → ファクタリング会社への支払い
  const ar2 = 800000;
  const pct2 = 3;
  {
    const { times, fee, net } = feeSteps(ar2, pct2);
    questions.push(
      journalQ({
        id: 'C07-003',
        topic: T,
        difficulty: 2,
        prompt: `得意先に対する売掛金 ${yen(ar2)} を、ファクタリング会社に譲渡する2社間ファクタリング契約を結んだ(債権譲渡登記済み)。手数料${pct2}%を差し引かれた手取額が、普通預金口座に振り込まれた。`,
        choices: ['普通預金', '売掛債権売却損', '売掛金', '預り金', '支払手数料', '借入金'],
        debit: [line('普通預金', net.value), line('売掛債権売却損', fee.value)],
        credit: [line('売掛金', ar2)],
        calc: [times, fee, net],
        explanation: `債権譲渡登記が済んでいるので、契約のときに売掛金を譲渡したものとして **売掛金を減らす**。手数料 ${yen(fee.value)} は売掛債権売却損、手取額は ${yen(net.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', net.value), line('売掛債権売却損', fee.value)], credit: [line('預り金', ar2)] },
            why: '預り金を使うのは、期日に得意先から入金があったとき。契約のときは、譲渡した売掛金を減らす。',
          },
          {
            entry: { debit: [line('普通預金', net.value), line('売掛債権売却損', fee.value)], credit: [line('借入金', ar2)] },
            why: '2級のファクタリングは、売掛金を売る(買い取ってもらう)取引。お金を借りたのではない。',
          },
        ],
        ref: { topic: T, anchor: 'two' },
      }),
    );
  }
  questions.push(
    journalQ({
      id: 'C07-004',
      topic: T,
      difficulty: 2,
      prompt: `2社間ファクタリング契約(債権譲渡登記済み)により譲渡した売掛金 ${yen(ar2)} について、支払期日に、得意先から当社の普通預金口座に ${yen(ar2)} が振り込まれた。`,
      choices: ['普通預金', '預り金', '売掛金', '売上', '仮受金', '未払金'],
      debit: [line('普通預金', ar2)],
      credit: [line('預り金', ar2)],
      explanation: '売掛金は契約のときに譲渡済み。得意先は譲渡を知らないので当社に払ったが、このお金はファクタリング会社に渡すもの。渡すまでは **預り金**。',
      mistakes: [
        {
          entry: { debit: [line('普通預金', ar2)], credit: [line('売掛金', ar2)] },
          why: '売掛金は契約のときにすでに減らしている。もう一度減らすと二重になる。',
        },
        {
          entry: { debit: [line('普通預金', ar2)], credit: [line('売上', ar2)] },
          why: '売上は、商品を売ったときに計上済み。このお金はファクタリング会社に渡すものなので預り金。',
        },
      ],
      ref: { topic: T, anchor: 'two' },
    }),
  );
  questions.push(
    journalQ({
      id: 'C07-005',
      topic: T,
      difficulty: 1,
      prompt: `2社間ファクタリングで、得意先から受け取って預り金としていた ${yen(ar2)} を、普通預金口座からファクタリング会社に支払った。`,
      choices: ['預り金', '普通預金', '売掛金', '未払金', '売掛債権売却損', '支払手数料'],
      debit: [line('預り金', ar2)],
      credit: [line('普通預金', ar2)],
      explanation: '預かっていたお金を、本来の受取人(ファクタリング会社)に渡した。**預り金** を減らす。',
      mistakes: [
        {
          entry: { debit: [line('売掛金', ar2)], credit: [line('普通預金', ar2)] },
          why: '売掛金は、譲渡したときにすでに減らしている。ここで減らすのは、受け取ったときに計上した預り金。',
        },
        {
          entry: { debit: [line('売掛債権売却損', ar2)], credit: [line('普通預金', ar2)] },
          why: '売却損は手数料の分だけで、譲渡したときに計上済み。今回は預かったお金を渡しただけ。',
        },
      ],
      ref: { topic: T, anchor: 'two' },
    }),
  );

  // 6. 手数料を金額で与える(3社間・当座預金)
  {
    const ar = 350000;
    const fee = 10500;
    const net = step('手取額(売掛金 − 手数料)', 'sub', [ar, fee]);
    questions.push(
      journalQ({
        id: 'C07-006',
        topic: T,
        difficulty: 1,
        prompt: `得意先に対する売掛金 ${yen(ar)} を、得意先の承認を得てファクタリング会社に譲渡し、手数料 ${yen(fee)} を差し引かれた手取額が当座預金口座に振り込まれた。`,
        choices: ['当座預金', '売掛債権売却損', '売掛金', '電子記録債権売却損', '支払手数料', '普通預金'],
        debit: [line('当座預金', net.value), line('売掛債権売却損', fee)],
        credit: [line('売掛金', ar)],
        calc: [net],
        explanation: `手取額は ${yen(ar)} − ${yen(fee)} = ${yen(net.value)}。手数料は **売掛債権売却損**。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', net.value), line('電子記録債権売却損', fee)], credit: [line('売掛金', ar)] },
            why: '電子記録債権売却損は、電子記録債権を割り引いたときの科目。売掛金を譲渡したら売掛債権売却損。',
          },
          {
            entry: { debit: [line('当座預金', net.value), line('支払手数料', fee)], credit: [line('売掛金', ar)] },
            why: 'ファクタリングは売掛金を売る取引。差し引かれた手数料は売掛債権売却損にする。',
          },
        ],
        ref: { topic: T, anchor: 'three' },
      }),
    );
  }

  // 7. 電子記録債権の割引との比較(選択)
  questions.push(
    choiceQ({
      id: 'C07-007',
      topic: T,
      difficulty: 2,
      prompt: '次の2つの取引で、差し引かれた額を処理する科目の組み合わせとして正しいものはどれか。(ア)電子記録債権を取引銀行で割り引き、割引料を差し引かれた。(イ)売掛金をファクタリング会社に譲渡し、手数料を差し引かれた。',
      options: [
        '(ア)売掛債権売却損 (イ)電子記録債権売却損',
        '(ア)支払利息 (イ)支払手数料',
        '(ア)電子記録債権売却損 (イ)売掛債権売却損',
        '(ア)(イ)ともに支払手数料',
      ],
      answer: 2,
      explanation: 'どちらも債権を期日より前に売る取引で、差し引かれた分は売却損。売った債権の名前に合わせて、電子記録債権なら **電子記録債権売却損**、売掛金なら **売掛債権売却損**。',
      mistakes: [
        { option: 0, why: '逆になっている。売った債権の名前に合わせる(電子記録債権 → 電子記録債権売却損、売掛金 → 売掛債権売却損)。' },
        { option: 1, why: 'どちらも債権を売る取引なので、利息や手数料ではなく売却損にする。' },
        { option: 3, why: '差し引かれた分は、債権を売った損。支払手数料ではない。' },
      ],
      ref: { topic: T, anchor: 'vs-discount' },
    }),
  );

  // 8. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C07-008',
      topic: T,
      difficulty: 2,
      prompt: 'ファクタリング(売掛債権の譲渡)について、正しいものをすべて選びなさい。',
      options: [
        '3社間ファクタリングでは、支払期日に得意先がファクタリング会社へ支払う',
        '2社間ファクタリングで得意先から入金があったら、売掛金を減らす',
        'ファクタリングで差し引かれた手数料は、売掛債権売却損で処理する',
        '2社間ファクタリングで得意先から受け取ったお金は、ファクタリング会社に渡すまで預り金にする',
        '売掛債権売却損は、販売費及び一般管理費に表示する',
      ],
      answer: [0, 2, 3],
      explanation: '3社間は得意先がファクタリング会社へ直接払い、2社間は当社が受け取って預り金にしてから渡す。手数料は売掛債権売却損で、損益計算書では営業外費用に表示する。',
      mistakes: [
        { options: [0, 1, 2, 3], why: '売掛金は契約のときに減らし済み。2社間の期日の入金は預り金にする。' },
        { options: [0, 2, 3, 4], why: '売掛債権売却損は、債権を売った損(財務の取引)なので営業外費用に表示する。' },
        { options: [0, 2], why: '2社間で得意先から受け取ったお金は、ファクタリング会社に渡すまで預り金。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'compare' },
    }),
  );

  return { topic: T, questions };
}
