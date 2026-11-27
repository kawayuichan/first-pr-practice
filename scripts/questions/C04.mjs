// C04 債務の保証 の問題(6問)
// 仕訳3問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 手形の裏書による保証は2027年度の範囲外なので扱わない(借入金の保証だけ)。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C04';

export default function build() {
  const questions = [];

  // 1. 保証人になった
  {
    const amt = 800000;
    questions.push(
      journalQ({
        id: 'C04-001',
        topic: T,
        difficulty: 1,
        prompt: `取引先B社が銀行から借り入れた ${yen(amt)} について、当社が保証人になった。`,
        choices: ['保証債務見返', '保証債務', '借入金', '貸付金', '未収入金', '普通預金'],
        debit: [line('保証債務見返', amt)],
        credit: [line('保証債務', amt)],
        explanation: '保証人になっただけで、お金も借入金も動かない。忘れないための備忘記録として「**保証債務見返 / 保証債務**」をセットで記録する(対照勘定)。',
        mistakes: [
          {
            entry: { debit: [line('保証債務', amt)], credit: [line('保証債務見返', amt)] },
            why: '貸借が逆。保証人になったときは、保証債務見返が借方、保証債務が貸方。',
          },
          {
            entry: { debit: [line('貸付金', amt)], credit: [line('借入金', amt)] },
            why: '当社がお金を借りたり貸したりしたわけではない。保証は備忘記録(保証債務見返 / 保証債務)で残す。',
          },
        ],
        ref: { topic: T, anchor: 'guarantee' },
      }),
    );
  }

  // 2. 相手が返済した
  {
    const amt = 800000;
    questions.push(
      journalQ({
        id: 'C04-002',
        topic: T,
        difficulty: 1,
        prompt: `取引先B社の借入金 ${yen(amt)} について保証人になっていたが、B社がこの借入金を全額返済した。`,
        choices: ['保証債務見返', '保証債務', '借入金', '未収入金', '普通預金', '雑益'],
        debit: [line('保証債務', amt)],
        credit: [line('保証債務見返', amt)],
        explanation: '保証する必要がなくなったので、保証人になったときの仕訳(保証債務見返 / 保証債務)の **逆** で取り消す。',
        mistakes: [
          {
            entry: { debit: [line('保証債務見返', amt)], credit: [line('保証債務', amt)] },
            why: 'これは保証人になったときの仕訳。返済されたら、逆の仕訳で取り消す。',
          },
          {
            entry: { debit: [line('保証債務', amt)], credit: [line('雑益', amt)] },
            why: '保証がなくなっても、当社にもうけは出ない。保証債務見返と保証債務をセットで取り消す。',
          },
        ],
        ref: { topic: T, anchor: 'release' },
      }),
    );
  }

  // 3. 代わりに払った
  {
    const principal = 1500000;
    const interest = 30000;
    const paid = step('代わりに払った額(借入金 + 利息)', 'add', [principal, interest]);
    questions.push(
      journalQ({
        id: 'C04-003',
        topic: T,
        difficulty: 2,
        prompt: `取引先C社の借入金 ${yen(principal)} について保証人になっていたが、C社が返済できなくなったため、当社が借入金と利息 ${yen(interest)} をC社に代わって当座預金口座から支払った。`,
        choices: ['未収入金', '保証債務', '保証債務見返', '当座預金', '貸倒損失', '支払利息'],
        debit: [line('未収入金', paid.value), line('保証債務', principal)],
        credit: [line('当座預金', paid.value), line('保証債務見返', principal)],
        calc: [paid],
        explanation: `代わりに払った ${yen(paid.value)}(利息を含む)は、あとでC社に請求できるので **未収入金**。保証は終わったので、保証債務 ${yen(principal)} と保証債務見返も取り消す。`,
        mistakes: [
          {
            entry: { debit: [line('未収入金', paid.value)], credit: [line('当座預金', paid.value)] },
            why: '保証の記録(保証債務見返 / 保証債務)が残ったまま。保証は終わったので取り消す。',
          },
          {
            entry: { debit: [line('貸倒損失', paid.value), line('保証債務', principal)], credit: [line('当座預金', paid.value), line('保証債務見返', principal)] },
            why: '代わりに払った額はC社に請求できるので、まずは未収入金(資産)。すぐに貸倒損失にしない。',
          },
        ],
        ref: { topic: T, anchor: 'default' },
      }),
    );
  }

  // 4. 注記する保証債務の額(数値)
  {
    const d = 600000;
    const e = 400000;
    const total = step('保証した額の合計', 'add', [d, e]);
    const left = step('期末に残っている保証(合計 − 返済されたD社の分)', 'sub', [total.value, d]);
    questions.push(
      numericQ({
        id: 'C04-004',
        topic: T,
        difficulty: 2,
        prompt: `当期に、D社の借入金 ${yen(d)} と、E社の借入金 ${yen(e)} の保証人になった。期末までに、D社は借入金を全額返済した。E社は返済していない。期末の貸借対照表の注記に書く保証債務の額はいくらか。`,
        answer: left.value,
        calc: [total, left],
        explanation: 'D社が返済した分は、保証債務 / 保証債務見返で取り消している。期末に残っているのはE社の分だけ。',
        mistakes: [
          { value: total.value, calc: [total], why: 'D社は返済したので、D社の分の保証は取り消している。残っている分だけを注記する。' },
        ],
        ref: { topic: T, anchor: 'overview' },
      }),
    );
  }

  // 5. 表示(選択)
  questions.push(
    choiceQ({
      id: 'C04-005',
      topic: T,
      difficulty: 1,
      prompt: '決算日に残っている保証債務は、決算書でどのように示すか。',
      options: ['貸借対照表の流動負債に表示する', '貸借対照表の固定負債に表示する', '貸借対照表には載せず、注記に書く', '純資産から差し引いて表示する'],
      answer: 2,
      explanation: '保証債務は、相手が返済できなかったときに払う可能性がある **偶発債務**。まだ払うと決まっていないので貸借対照表には載せず、注記に金額を書く。',
      mistakes: [
        { option: 0, why: 'まだ払うと決まった負債ではない(偶発債務)ので、負債としては表示しない。' },
        { option: 1, why: '固定負債にも表示しない。注記で知らせる。' },
        { option: 3, why: '純資産とは関係がない。注記で知らせる。' },
      ],
      ref: { topic: T, anchor: 'overview' },
    }),
  );

  // 6. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C04-006',
      topic: T,
      difficulty: 2,
      prompt: '債務の保証について、正しいものをすべて選びなさい。',
      options: [
        '保証人になったときは、借入金を増やす',
        '保証債務見返と保証債務は、同じ金額でセットで記録する',
        '相手に代わって払った額は、相手に請求できるので未収入金にする',
        '相手が返済したら、保証人になったときの逆の仕訳で取り消す',
        '保証債務は、貸借対照表の流動負債に表示する',
      ],
      answer: [1, 2, 3],
      explanation: '保証は備忘記録(保証債務見返 / 保証債務)で、借入金は動かない。返済されたら取り消し、代わりに払ったら未収入金。保証債務は貸借対照表に載せず注記する。',
      mistakes: [
        { options: [0, 1, 2, 3], why: '当社がお金を借りたわけではないので、借入金は増えない。' },
        { options: [1, 2, 3, 4], why: '保証債務は、まだ払うと決まっていないので、貸借対照表には載せず注記する。' },
        { options: [1, 3], why: '代わりに払った額は、相手に請求できる権利なので未収入金。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'overview' },
    }),
  );

  return { topic: T, questions };
}
