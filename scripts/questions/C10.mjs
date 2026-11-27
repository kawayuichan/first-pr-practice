// C10 有形固定資産②取得 の問題(10問)
// 仕訳8問・数値1問・複数選択1問。金額はすべて step() で計算する。
// 割賦購入(利息は定額法。前払利息で処理する形が中心、支払利息で処理する形を1問)、代金は未払金と営業外電子記録債務。
// 圧縮記帳は国庫補助金・工事負担金の直接控除方式だけ(積立金方式は1級)。建設仮勘定。

import { journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C10';

export default function build() {
  const questions = [];

  // 1〜2. 割賦購入(前払利息で処理): 買う → 1回目の支払い
  const cashPrice = 1500000;
  const total = 1560000;
  const times = 12;
  const per = step('1回の支払額(総額 ÷ 12回)', 'div', [total, times]);
  const interest = step('利息(総額 − 現金正価)', 'sub', [total, cashPrice]);
  const perInterest = step('1回分の利息(利息 ÷ 12回)', 'div', [interest.value, times]);
  questions.push(
    journalQ({
      id: 'C10-001',
      topic: T,
      difficulty: 2,
      prompt: `営業用の車両(現金正価 ${yen(cashPrice)})を割賦で買った。代金は ${yen(total)} で、来月から毎月末に${times}回に分けて支払う。利息相当額は前払利息で処理する。`,
      choices: ['車両運搬具', '前払利息', '未払金', '支払利息', '買掛金', '当座預金'],
      debit: [line('車両運搬具', cashPrice), line('前払利息', interest.value)],
      credit: [line('未払金', total)],
      calc: [interest],
      explanation: `取得原価は **現金正価** ${yen(cashPrice)}。分割にして高くなった ${yen(interest.value)} は利息なので **前払利息**(資産)。代金は固定資産の代金なので **未払金**。`,
      mistakes: [
        {
          entry: { debit: [line('車両運搬具', total)], credit: [line('未払金', total)] },
          why: `取得原価は分割払いの総額ではなく現金正価 ${yen(cashPrice)}。差額は利息として区分する。`,
        },
        {
          entry: { debit: [line('車両運搬具', cashPrice), line('前払利息', interest.value)], credit: [line('買掛金', total)] },
          why: '買掛金は商品の代金。固定資産の代金の未払分は未払金。',
        },
      ],
      ref: { topic: T, anchor: 'installment' },
    }),
  );
  questions.push(
    journalQ({
      id: 'C10-002',
      topic: T,
      difficulty: 2,
      prompt: `割賦で買った車両の代金 ${yen(total)}(${times}回払い、利息相当額 ${yen(interest.value)} は買ったときに前払利息で処理)について、1回目の ${yen(per.value)} を当座預金口座から支払った。利息は定額法で配分する。`,
      choices: ['未払金', '支払利息', '当座預金', '前払利息', '車両運搬具', '未払利息'],
      debit: [line('未払金', per.value), line('支払利息', perInterest.value)],
      credit: [line('当座預金', per.value), line('前払利息', perInterest.value)],
      calc: [per, perInterest],
      explanation: `未払金 ${yen(per.value)} を払うとともに、1回分の利息 ${yen(interest.value)} ÷ ${times}回 = ${yen(perInterest.value)} を、前払利息から **支払利息** へ振り替える。`,
      mistakes: [
        {
          entry: { debit: [line('未払金', per.value)], credit: [line('当座預金', per.value)] },
          why: `前払利息で処理しているので、支払うたびに1回分の利息 ${yen(perInterest.value)} を支払利息へ振り替える。`,
        },
        {
          entry: { debit: [line('未払金', per.value), line('前払利息', perInterest.value)], credit: [line('当座預金', per.value), line('支払利息', perInterest.value)] },
          why: '振替の向きが逆。費用になった分は支払利息を増やし(借方)、前払利息を減らす(貸方)。',
        },
      ],
      ref: { topic: T, anchor: 'installment' },
    }),
  );

  // 3. 支払利息で処理する形: 決算で未経過分を前払利息へ
  {
    const interestTotal = 36000;
    const n = 12;
    const paid = 4;
    const left = step('まだ来ていない回数(12回 − 払った4回)', 'sub', [n, paid]);
    const perI = step('1回分の利息(利息 ÷ 12回)', 'div', [interestTotal, n]);
    const prepaid = step('前払利息にする額(1回分 × 残りの回数)', 'mul', [perI.value, left.value]);
    const wrongPaid = step('誤答: 払った4回分の利息', 'mul', [perI.value, paid]);
    questions.push(
      journalQ({
        id: 'C10-003',
        topic: T,
        difficulty: 3,
        prompt: `X1年12月1日に備品を割賦で買い、利息相当額 ${yen(interestTotal)} は支払利息で処理した。代金は12月末から毎月末に${n}回に分けて支払っており、決算日(X2年3月31日)までに${paid}回支払った。決算にあたり、利息のうち次期以降の分を前払利息に振り替える。利息は定額法で配分する。`,
        choices: ['前払利息', '支払利息', '未払利息', '未払金', '備品', '当座預金'],
        debit: [line('前払利息', prepaid.value)],
        credit: [line('支払利息', prepaid.value)],
        calc: [left, perI, prepaid],
        explanation: `1回分の利息は ${yen(perI.value)}。まだ支払っていない${left.value}回分 ${yen(prepaid.value)} は次期以降の費用なので、支払利息から **前払利息** へ振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('前払利息', wrongPaid.value)], credit: [line('支払利息', wrongPaid.value)] },
            why: `払った${paid}回分は当期の費用(支払利息のまま)。前払利息にするのは、まだ来ていない${left.value}回分。`,
            calc: [wrongPaid],
          },
          {
            entry: { debit: [line('支払利息', prepaid.value)], credit: [line('前払利息', prepaid.value)] },
            why: '向きが逆。次期以降の分は費用から外すので、支払利息を減らし(貸方)、前払利息を増やす(借方)。',
          },
        ],
        ref: { topic: T, anchor: 'alternative' },
      }),
    );
  }

  // 4. 割賦購入(営業外電子記録債務)
  {
    const cp = 2400000;
    const tot = 2520000;
    const intr = step('利息(総額 − 現金正価)', 'sub', [tot, cp]);
    questions.push(
      journalQ({
        id: 'C10-004',
        topic: T,
        difficulty: 2,
        prompt: `機械装置(現金正価 ${yen(cp)})を割賦で買い、代金 ${yen(tot)} について、6回分の電子記録債務の発生記録を行った。利息相当額は前払利息で処理する。`,
        choices: ['機械装置', '前払利息', '営業外電子記録債務', '電子記録債務', '未払金', '支払利息'],
        debit: [line('機械装置', cp), line('前払利息', intr.value)],
        credit: [line('営業外電子記録債務', tot)],
        calc: [intr],
        explanation: `取得原価は現金正価 ${yen(cp)}、差額 ${yen(intr.value)} は前払利息。固定資産の代金について発生記録をしたので **営業外電子記録債務**。`,
        mistakes: [
          {
            entry: { debit: [line('機械装置', cp), line('前払利息', intr.value)], credit: [line('電子記録債務', tot)] },
            why: '電子記録債務は商品の仕入(買掛金)から生じたもの。固定資産の代金は営業外電子記録債務。',
          },
          {
            entry: { debit: [line('機械装置', cp), line('前払利息', intr.value)], credit: [line('未払金', tot)] },
            why: '電子記録債務の発生記録をしたので、未払金ではなく営業外電子記録債務にする。',
          },
        ],
        ref: { topic: T, anchor: 'denshi' },
      }),
    );
  }

  // 5. 国庫補助金を受け取る
  {
    const amt = 500000;
    questions.push(
      journalQ({
        id: 'C10-005',
        topic: T,
        difficulty: 1,
        prompt: `機械装置を買うための国庫補助金 ${yen(amt)} を国から受け取り、普通預金口座に入金された。この補助金は返す必要がない。`,
        choices: ['普通預金', '国庫補助金受贈益', '借入金', '雑益', '前受金', '固定資産圧縮損'],
        debit: [line('普通預金', amt)],
        credit: [line('国庫補助金受贈益', amt)],
        explanation: '返す必要のない補助金をもらったので、収益の **国庫補助金受贈益**。',
        mistakes: [
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('借入金', amt)] },
            why: '補助金は返す必要がないので、借入金(負債)ではない。国庫補助金受贈益(収益)。',
          },
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('雑益', amt)] },
            why: '国庫補助金には専用の科目(国庫補助金受贈益)がある。',
          },
        ],
        ref: { topic: T, anchor: 'compression' },
      }),
    );
  }

  // 6. 圧縮記帳(直接控除方式)
  {
    const cost = 1800000;
    const subsidy = 600000;
    questions.push(
      journalQ({
        id: 'C10-006',
        topic: T,
        difficulty: 2,
        prompt: `国庫補助金 ${yen(subsidy)}(受け取ったときに国庫補助金受贈益で処理済み)と自己資金で、機械装置 ${yen(cost)} を買った(購入の仕訳は済んでいる)。補助金の分だけ、直接控除方式で圧縮記帳する。`,
        choices: ['固定資産圧縮損', '機械装置', '国庫補助金受贈益', '減価償却費', '未払金', '当座預金'],
        debit: [line('固定資産圧縮損', subsidy)],
        credit: [line('機械装置', subsidy)],
        explanation: `補助金の分 ${yen(subsidy)} だけ機械装置の取得原価を減らし、相手の科目は **固定資産圧縮損**(費用)。受贈益(収益)と打ち消し合う。`,
        mistakes: [
          {
            entry: { debit: [line('国庫補助金受贈益', subsidy)], credit: [line('機械装置', subsidy)] },
            why: '受贈益を取り消すのではない。圧縮した額は固定資産圧縮損(費用)にする。',
          },
          {
            entry: { debit: [line('機械装置', subsidy)], credit: [line('固定資産圧縮損', subsidy)] },
            why: '向きが逆。圧縮記帳は機械装置を減らす(貸方)。',
          },
        ],
        ref: { topic: T, anchor: 'compression' },
      }),
    );
  }

  // 7. 圧縮後の減価償却(数値)
  {
    const cost = 1200000;
    const subsidy = 480000;
    const life = 6;
    const base = step('圧縮後の帳簿価額(取得原価 − 圧縮額)', 'sub', [cost, subsidy]);
    const dep = step('減価償却費(圧縮後の帳簿価額 ÷ 6年)', 'div', [base.value, life]);
    const wrong = step('誤答: 圧縮前の取得原価で計算', 'div', [cost, life]);
    questions.push(
      numericQ({
        id: 'C10-007',
        topic: T,
        difficulty: 2,
        prompt: `当期首に、国庫補助金 ${yen(subsidy)} と自己資金で備品 ${yen(cost)} を買い、直接控除方式で圧縮記帳した。決算で、定額法(耐用年数${life}年、残存価額ゼロ)により減価償却する。当期の減価償却費はいくらか。`,
        answer: dep.value,
        calc: [base, dep],
        explanation: `圧縮記帳したので、備品の帳簿価額は ${yen(cost)} − ${yen(subsidy)} = ${yen(base.value)}。これを${life}年で割って ${yen(dep.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wrong], why: '圧縮記帳したあとは、圧縮後の金額で減価償却する。圧縮前の取得原価で計算しない。' }],
        ref: { topic: T, anchor: 'after' },
      }),
    );
  }

  // 8〜9. 建設仮勘定: 手付金 → 完成・引渡し
  const contract = 10000000;
  const deposit = 4000000;
  questions.push(
    journalQ({
      id: 'C10-008',
      topic: T,
      difficulty: 1,
      prompt: `本社ビルの建設を建設会社に頼み、請負代金 ${yen(contract)} のうち、手付金 ${yen(deposit)} を当座預金口座から支払った。`,
      choices: ['建設仮勘定', '当座預金', '建物', '前払金', '未払金', '減価償却費'],
      debit: [line('建設仮勘定', deposit)],
      credit: [line('当座預金', deposit)],
      explanation: 'まだ完成していない建物のための支払いは **建設仮勘定** にしておく。完成して引渡しを受けたら建物に振り替える。',
      mistakes: [
        {
          entry: { debit: [line('建物', deposit)], credit: [line('当座預金', deposit)] },
          why: 'まだ完成・引渡しの前なので、建物にはしない。建設仮勘定にしておく。',
        },
        {
          entry: { debit: [line('前払金', deposit)], credit: [line('当座預金', deposit)] },
          why: '前払金は商品の代金の前払い。建設中の固定資産への支払いは建設仮勘定。',
        },
      ],
      ref: { topic: T, anchor: 'cip' },
    }),
  );
  {
    const rest = step('残りの代金(請負代金 − 手付金)', 'sub', [contract, deposit]);
    questions.push(
      journalQ({
        id: 'C10-009',
        topic: T,
        difficulty: 2,
        prompt: `建設を頼んでいた本社ビル(請負代金 ${yen(contract)})が完成して引渡しを受け、残りの代金を当座預金口座から支払った。手付金 ${yen(deposit)} は建設仮勘定で処理している。`,
        choices: ['建物', '建設仮勘定', '当座預金', '未払金', '前払金', '減価償却費'],
        debit: [line('建物', contract)],
        credit: [line('建設仮勘定', deposit), line('当座預金', rest.value)],
        calc: [rest],
        explanation: `完成したので、手付金を含めた **全額** ${yen(contract)} を建物にする。建設仮勘定 ${yen(deposit)} を減らし、残りの ${yen(rest.value)} を支払う。`,
        mistakes: [
          {
            entry: { debit: [line('建物', rest.value)], credit: [line('当座預金', rest.value)] },
            why: `建設仮勘定 ${yen(deposit)} を建物に振り替えるのを忘れている。建物は全額の ${yen(contract)}。`,
          },
          {
            entry: { debit: [line('建物', contract)], credit: [line('当座預金', contract)] },
            why: `手付金 ${yen(deposit)} はもう払っている。今回払うのは残りの ${yen(rest.value)} で、手付金の分は建設仮勘定を減らす。`,
          },
        ],
        ref: { topic: T, anchor: 'cip' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C10-010',
      topic: T,
      difficulty: 2,
      prompt: '固定資産の取得について、正しいものをすべて選びなさい。',
      options: [
        '割賦で買った固定資産の取得原価は、現金正価にする',
        '直接控除方式の圧縮記帳では、固定資産圧縮損を計上して固定資産の取得原価を減らす',
        '圧縮記帳した固定資産の減価償却費は、圧縮する前の取得原価で計算する',
        '建設仮勘定は、完成前でも毎期減価償却する',
        '工事負担金を受け取ったときは、工事負担金受贈益(収益)にする',
      ],
      answer: [0, 1, 4],
      explanation: '割賦の取得原価は現金正価、差額は利息。圧縮記帳は固定資産圧縮損で取得原価を減らし、減価償却は圧縮後の金額で計算する。建設仮勘定はまだ使っていないので減価償却しない。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '圧縮記帳したあとは、圧縮後の金額で減価償却する。' },
        { options: [0, 1, 3, 4], why: '建設仮勘定は、まだ完成して使い始めていないので減価償却しない。' },
        { options: [0, 4], why: '直接控除方式では、固定資産圧縮損を計上して取得原価を減らす。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'compression' },
    }),
  );

  return { topic: T, questions };
}
