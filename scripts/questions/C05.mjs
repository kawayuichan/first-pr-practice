// C05 銀行勘定調整表 の問題(10問)
// 仕訳4問・選択3問・数値1問・表1問・複数選択1問。金額はすべて step() で計算する。
// 2027年度から小切手は範囲外なので、不一致の原因は連絡未通知・誤記入・時間外預入と、振込の未処理(要確認)だけ。

import { blankNum, blankSelect, choiceQ, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C05';
const HEAD = '決算日に銀行から残高証明書を取り寄せたところ、当座預金勘定の残高と一致しなかった。原因を調べると、';

export default function build() {
  const questions = [];

  // 1. 連絡未通知(入金)
  {
    const amt = 85000;
    questions.push(
      journalQ({
        id: 'C05-001',
        topic: T,
        difficulty: 1,
        prompt: `${HEAD}得意先から売掛金 ${yen(amt)} が当座預金に振り込まれていたが、当社に連絡が届いていなかった。必要な仕訳をしなさい。`,
        choices: ['当座預金', '売掛金', '売上', '普通預金', '買掛金', '前受金'],
        debit: [line('当座預金', amt)],
        credit: [line('売掛金', amt)],
        explanation: '銀行では入金が済んでいるのに、当社の帳簿に記録がない(**連絡未通知**)。会社側の記録漏れなので、仕訳をして当座預金を増やし、売掛金を減らす。',
        mistakes: [
          {
            entry: { debit: [line('当座預金', amt)], credit: [line('売上', amt)] },
            why: '売上は、商品を売ったときにすでに記録している。今回は売掛金が回収されたので、売掛金を減らす。',
          },
          {
            entry: { debit: [line('売掛金', amt)], credit: [line('当座預金', amt)] },
            why: '貸借が逆。入金なので、当座預金が増える(借方)。',
          },
        ],
        ref: { topic: T, anchor: 'unnotified' },
      }),
    );
  }

  // 2. 連絡未通知(引落し)
  {
    const amt = 120000;
    questions.push(
      journalQ({
        id: 'C05-002',
        topic: T,
        difficulty: 1,
        prompt: `${HEAD}電子記録債務 ${yen(amt)} が支払期日に当座預金から引き落とされていたが、当社では記入していなかった。必要な仕訳をしなさい。`,
        choices: ['電子記録債務', '買掛金', '当座預金', '電子記録債権', '支払手数料', '未払金'],
        debit: [line('電子記録債務', amt)],
        credit: [line('当座預金', amt)],
        explanation: '銀行では引落しが済んでいるのに、当社の帳簿に記録がない(**連絡未通知**)。電子記録債務を減らし、当座預金を減らす。',
        mistakes: [
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('当座預金', amt)] },
            why: '買掛金は、電子記録債務を発生させたときにすでに減らしている。今回減るのは電子記録債務。',
          },
          {
            entry: { debit: [line('当座預金', amt)], credit: [line('電子記録債務', amt)] },
            why: '貸借が逆。引落しなので、当座預金が減る(貸方)。',
          },
        ],
        ref: { topic: T, anchor: 'unnotified' },
      }),
    );
  }

  // 3. 誤記入(金額の書き間違い)
  {
    const right = 27000;
    const wrote = 72000;
    const diff = step('減らしすぎた額(記入した額 − 正しい額)', 'sub', [wrote, right]);
    questions.push(
      journalQ({
        id: 'C05-003',
        topic: T,
        difficulty: 2,
        prompt: `${HEAD}広告宣伝費 ${yen(right)} を当座預金から振り込んだ際に、帳簿に ${yen(wrote)} と記入していたことがわかった。必要な修正の仕訳をしなさい。`,
        choices: ['当座預金', '広告宣伝費', '現金', '未払金', '雑損', '雑益'],
        debit: [line('当座預金', diff.value)],
        credit: [line('広告宣伝費', diff.value)],
        calc: [diff],
        explanation: `${yen(wrote)} と書いたので、当座預金を正しい額より ${yen(diff.value)} 多く減らしている。**差額** だけ当座預金を戻し、広告宣伝費も同じ額だけ減らす。`,
        mistakes: [
          {
            entry: { debit: [line('広告宣伝費', diff.value)], credit: [line('当座預金', diff.value)] },
            why: '向きが逆。多く書きすぎたので、当座預金を増やして(借方)戻す。',
          },
          {
            entry: { debit: [line('当座預金', wrote)], credit: [line('広告宣伝費', wrote)] },
            why: `書いた金額を全部取り消すと、正しい支払い ${yen(right)} まで消えてしまう。直すのは差額だけ。`,
          },
        ],
        ref: { topic: T, anchor: 'error' },
      }),
    );
  }

  // 4. 誤記入(入金を出金と逆に記入)
  {
    const amt = 25000;
    const twice = step('取り消す分 + 正しく書く分(金額 × 2)', 'mul', [amt, 2]);
    questions.push(
      journalQ({
        id: 'C05-004',
        topic: T,
        difficulty: 3,
        prompt: `${HEAD}得意先から売掛金 ${yen(amt)} が当座預金に振り込まれた際に、誤って「売掛金 ${yen(amt)} / 当座預金 ${yen(amt)}」と、貸借を逆に記入していたことがわかった。必要な修正の仕訳をしなさい。`,
        choices: ['当座預金', '売掛金', '売上', '買掛金', '雑益', '雑損'],
        debit: [line('当座預金', twice.value)],
        credit: [line('売掛金', twice.value)],
        calc: [twice],
        explanation: `間違いの仕訳を取り消す分(${yen(amt)})と、正しい仕訳を書く分(${yen(amt)})が必要なので、**2倍** の ${yen(twice.value)} を直す。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', amt)], credit: [line('売掛金', amt)] },
            why: `これだと間違いを取り消しただけで、当座預金は振込の前と同じ。正しい入金の記録 ${yen(amt)} も必要なので、2倍の ${yen(twice.value)} を直す。`,
          },
          {
            entry: { debit: [line('売掛金', twice.value)], credit: [line('当座預金', twice.value)] },
            why: '向きが逆。入金なのに当座預金を減らしていたので、当座預金を増やして(借方)直す。',
          },
        ],
        ref: { topic: T, anchor: 'error' },
      }),
    );
  }

  // 5. 時間外預入(選択)
  {
    const amt = 40000;
    questions.push(
      choiceQ({
        id: 'C05-005',
        topic: T,
        difficulty: 1,
        prompt: `決算日に、銀行の営業時間が終わったあとで現金 ${yen(amt)} を当座預金に預け入れ、帳簿に記入した。銀行では翌日の入金として扱われた。両者区分調整法で銀行勘定調整表を作るとき、正しい扱いはどれか。`,
        options: [
          '当座預金勘定の残高に加算し、仕訳をする',
          '銀行の残高証明書の残高に加算する。仕訳はしない',
          '銀行の残高証明書の残高から減算する。仕訳はしない',
          '当座預金勘定の残高から減算し、記入を取り消す仕訳をする',
        ],
        answer: 1,
        explanation: '会社の帳簿は正しく、銀行の記録が1日遅れているだけ(**時間外預入**)。銀行の残高に **加算** して正しい残高にそろえる。会社の帳簿は正しいので **仕訳はしない**。',
        mistakes: [
          { option: 0, why: '会社はすでに預入を記入している。会社の残高に足すと二重になる。' },
          { option: 2, why: '銀行の残高には、まだこの預入が入っていない。足りない分なので加算する。' },
          { option: 3, why: '預入は実際に済んでいて、翌日には銀行の残高にも入る。会社の記入は正しいので取り消さない。' },
        ],
        ref: { topic: T, anchor: 'after-hours' },
      }),
    );
  }

  // 6. 貸借対照表に書く当座預金(数値)
  {
    const book = 620000;
    const late = 80000;
    const inflow = 45000;
    const tel = 13000;
    const plus = step('帳簿 + 連絡未通知の入金', 'add', [book, inflow]);
    const fixed = step('正しい残高(− 連絡未通知の引落し)', 'sub', [plus.value, tel]);
    const bank = step('残高証明書の残高(正しい残高 − 時間外預入)', 'sub', [fixed.value, late]);
    const wrongAll = step('誤答: 時間外預入も帳簿に加算', 'add', [fixed.value, late]);
    questions.push(
      numericQ({
        id: 'C05-006',
        topic: T,
        difficulty: 2,
        prompt: `決算日の当座預金勘定の残高は ${yen(book)}、銀行の残高証明書の残高は ${yen(bank.value)} で、一致しなかった。原因は次の3つだった。(1) 決算日の営業時間後に預け入れた ${yen(late)} が、銀行では翌日の入金になっていた。(2) 得意先から売掛金 ${yen(inflow)} が振り込まれていたが、連絡が届いていなかった。(3) 通信費 ${yen(tel)} が引き落とされていたが、連絡が届いていなかった。貸借対照表に記載する当座預金の金額はいくらか。`,
        answer: fixed.value,
        calc: [plus, fixed],
        explanation: `貸借対照表には **正しい残高** を書く。会社側は (2) を加算、(3) を減算して ${yen(fixed.value)}。銀行側は (1) を加算して ${yen(bank.value)} + ${yen(late)} = ${yen(fixed.value)} となり、両方が一致する。`,
        mistakes: [
          { value: bank.value, why: '残高証明書の金額には、時間外預入がまだ入っていない。銀行側を直した正しい残高を書く。' },
          { value: book, why: '修正前の帳簿の金額。連絡未通知の (2)(3) を直した正しい残高を書く。' },
          { value: wrongAll.value, calc: [fixed, wrongAll], why: '時間外預入は、会社はすでに記入済み。会社の残高に足すと二重になる。' },
        ],
        ref: { topic: T, anchor: 'both' },
      }),
    );
  }

  // 7. 両者区分調整法の表(表)
  {
    const book = 350000;
    const late = 30000;
    const inflow = 48000;
    const elec = 16000;
    const apRight = 56000;
    const apWrote = 65000;
    const err = step('(4) 誤記入の差額(記入した額 − 正しい額)', 'sub', [apWrote, apRight]);
    const plus = step('帳簿 + (2) + (4)', 'add', [book, inflow, err.value]);
    const fixed = step('正しい残高(− (3))', 'sub', [plus.value, elec]);
    const bank = step('残高証明書の残高(正しい残高 − (1))', 'sub', [fixed.value, late]);
    const wrongBook = step('誤答: 時間外預入も会社側に加算', 'add', [fixed.value, late]);
    const NUMS = ['(1)', '(2)', '(3)', '(4)'];
    const sel = (a) => blankSelect(NUMS, a);
    questions.push(
      tableQ({
        id: 'C05-007',
        topic: T,
        difficulty: 3,
        prompt: `決算日の当座預金勘定の残高は ${yen(book)}、銀行の残高証明書の残高は ${yen(bank.value)} だった。不一致の原因は次の4つ。(1) 決算日の営業時間後に預け入れた ${yen(late)} が、銀行では翌日の入金になっていた。(2) 得意先から売掛金 ${yen(inflow)} が振り込まれていたが、連絡が届いていなかった。(3) 電気料金 ${yen(elec)} が引き落とされていたが、連絡が届いていなかった。(4) 買掛金 ${yen(apRight)} の振込を、帳簿に ${yen(apWrote)} と記入していた。両者区分調整法の銀行勘定調整表の空欄に、原因の番号と金額を入れなさい。同じ区分に2つ入るときは、番号の小さい順に書く。`,
        table: {
          title: '銀行勘定調整表(両者区分調整法)',
          layout: 'sides',
          rowLabel: 'number',
          columns: [
            { label: '会社側' },
            { label: '番号', say: '会社側の番号' },
            { label: '金額', say: '会社側の金額', align: 'right' },
            { label: '銀行側' },
            { label: '番号', say: '銀行側の番号' },
            { label: '金額', say: '銀行側の金額', align: 'right' },
          ],
          rows: [
            ['当座預金勘定の残高', '', book, '残高証明書の残高', '', bank.value],
            ['加算', sel('(2)'), blankNum(inflow), '加算', sel('(1)'), blankNum(late)],
            ['加算', sel('(4)'), blankNum(err.value), null, null, null],
            ['減算', sel('(3)'), blankNum(elec), null, null, null],
            ['正しい残高', '', blankNum(fixed.value), '正しい残高', '', blankNum(fixed.value)],
          ],
        },
        checks: [
          { label: '会社側の正しい残高', op: 'add', args: [[0, 2], [1, 2], [2, 2], ['-', 3, 2]], result: [4, 2] },
          { label: '銀行側の正しい残高', op: 'add', args: [[0, 5], [1, 5]], result: [4, 5] },
          { label: '両側の正しい残高が一致', op: 'add', args: [[4, 2], 0], result: [4, 5] },
        ],
        calc: [err, plus, fixed],
        explanation: `会社側は、(2) 連絡未通知の入金と (4) 誤記入を加算、(3) 連絡未通知の引落しを減算する。(4) は ${yen(apWrote)} と書いて当座預金を減らしすぎたので、差額 ${yen(err.value)} を **加算**。銀行側は (1) 時間外預入を加算。両側とも **正しい残高** ${yen(fixed.value)} になる。`,
        mistakes: [
          { cell: [2, 2], value: apWrote, why: `誤記入は、書いた金額ではなく差額 ${yen(err.value)} だけ直す。` },
          { cell: [1, 4], value: '(2)', why: '(2) の入金は、銀行ではもう済んでいる。直すのは会社側(連絡未通知)。銀行側に入るのは (1) の時間外預入。' },
          { cell: [4, 2], value: wrongBook.value, calc: [wrongBook], why: '時間外預入は、会社はすでに記入済み。会社側には入れず、銀行側に加算する。' },
        ],
        ref: { topic: T, anchor: 'both' },
      }),
    );
  }

  // 8. 企業残高基準法(選択)
  {
    const amt = 40000;
    questions.push(
      choiceQ({
        id: 'C05-008',
        topic: T,
        difficulty: 3,
        prompt: `企業残高基準法(当座預金勘定の残高から出発して、銀行の残高証明書の残高に合わせる方法)で銀行勘定調整表を作る。決算日の営業時間後に預け入れ、銀行では翌日の入金になった ${yen(amt)}(時間外預入)は、どのように記入するか。`,
        options: ['加算する', '減算する', '仕訳がないので記入しない', '金額の2倍を加算する'],
        answer: 1,
        explanation: '時間外預入は、会社の残高には入っているが、銀行の残高にはまだ入っていない。会社の残高から銀行の残高に合わせるには **減算** する。両者区分調整法の「銀行の残高に加算」と、加算・減算が **逆** になる。',
        mistakes: [
          { option: 0, why: '両者区分調整法(銀行の残高に加算)と同じにしてしまった誤り。会社の残高から出発するときは、相手側の項目の加算・減算を逆にする。' },
          { option: 2, why: '仕訳がいらないことと、調整表に書くかどうかは別。2つの残高のずれの原因なので記入する。' },
          { option: 3, why: '2倍にするのは、入金と出金を逆に書いた誤記入の修正。時間外預入は金額そのものを書く。' },
        ],
        ref: { topic: T, anchor: 'other-methods' },
      }),
    );
  }

  // 9. 振込の未処理(選択・要確認)
  {
    const amt = 70000;
    questions.push(
      choiceQ({
        id: 'C05-009',
        topic: T,
        difficulty: 2,
        prompt: `決算日に、買掛金 ${yen(amt)} を支払う振込の手続きをして帳簿に記入したが、受付時間を過ぎていたため、銀行の処理は翌営業日になった。両者区分調整法で銀行勘定調整表を作るとき、正しい扱いはどれか。`,
        options: [
          '当座預金勘定の残高に加算し、記入を取り消す仕訳をする',
          '銀行の残高証明書の残高に加算する。仕訳はしない',
          '銀行の残高証明書の残高から減算する。仕訳はしない',
          '当座預金勘定の残高から減算し、仕訳をする',
        ],
        answer: 2,
        explanation: '会社の帳簿は正しく、銀行の引落しが翌営業日に遅れているだけ。銀行の残高には、まだこの引落しが入っていないので **減算** する。会社の帳簿は正しいので **仕訳はしない**。',
        mistakes: [
          { option: 0, why: '振込の手続きは済んでいて、翌営業日には必ず引き落とされる。このアプリでは、会社の記入は正しいものとして扱う。' },
          { option: 1, why: '銀行の残高は、まだ引き落とされていない分だけ多い。加算ではなく減算する。' },
          { option: 3, why: '会社はすでに支払いを記入している。会社の残高から引くと二重になる。' },
        ],
        needs_review: true,
        needs_review_reason:
          '2027年度の区分表と改定の説明には、不一致の原因の具体例が書かれていない。振込の受付時間を過ぎて銀行の処理が翌営業日になる例は、このアプリで考えたもの。会社の記録は正しく、銀行の記録が遅れているだけと考えて「銀行の残高から減算・仕訳なし」としたが、試験でこの形が出るか、会社側で記入を取り消す扱いにならないかは未確定。',
        ref: { topic: T, anchor: 'transfer' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C05-010',
      topic: T,
      difficulty: 2,
      prompt: '銀行勘定調整表(両者区分調整法)について、正しいものをすべて選びなさい。',
      options: [
        '連絡未通知の入金・引落しは、会社側で仕訳をする',
        '時間外預入は、当座預金勘定の残高に加算し、仕訳をする',
        '誤記入は、正しい金額との差額だけを修正する',
        '貸借対照表の当座預金には、銀行の残高証明書の金額をそのまま書く',
        '会社の残高と銀行の残高を、それぞれ直して同じ正しい残高にそろえる',
      ],
      answer: [0, 2, 4],
      explanation: '仕訳が必要なのは会社側(連絡未通知・誤記入)だけ。時間外預入は銀行の残高に加算し、仕訳はしない。貸借対照表には、両方をそろえた **正しい残高** を書く。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '時間外預入は、会社の帳簿は正しく、銀行の記録が遅れているだけ。銀行の残高に加算し、仕訳はしない。' },
        { options: [0, 2, 3, 4], why: '残高証明書の金額には、銀行側のずれ(時間外預入など)が残っている。貸借対照表には正しい残高を書く。' },
        { options: [0, 4], why: '誤記入は、書いた金額を全部直すのではなく、正しい金額との差額だけを直す。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'both' },
    }),
  );

  return { topic: T, questions };
}
