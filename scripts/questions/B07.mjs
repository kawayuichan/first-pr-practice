// B07 その他の債権債務 の問題(12問)
// 仕訳10問・数値1問(利息の月割)・表1問(取引から科目を選ぶ)。金額はすべて step() で計算する。
// 決めたこと: 敷金は支払時と退去時まで。家賃の支払いは混ぜない(2級では支払リース料になるため B10・C13 で扱う)。
// 給料は源泉所得税・社会保険料(預り金)と法定福利費まで。

import { blankSelect, journalQ, line, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B07';

/** 月割の利息: 元金 × 年利率(%) ÷ 100 × 月数 ÷ 12 */
function interestSteps(principal, ratePct, months) {
  const a = step('元金 × 年利率(%)', 'mul', [principal, ratePct]);
  const year = step('1年分の利息(÷ 100)', 'div', [a.value, 100]);
  const b = step(`1年分の利息 × ${months}か月`, 'mul', [year.value, months]);
  const interest = step(`${months}か月分の利息(÷ 12)`, 'div', [b.value, 12]);
  return { steps: [a, year, b, interest], year, interest };
}

export default function build() {
  const questions = [];

  // 1. 借入金の返済(利息は月割)
  {
    const principal = 1200000;
    const months = 9;
    const rate = 3;
    const { steps, year, interest } = interestSteps(principal, rate, months);
    const pay = step('支払額(元金 + 利息)', 'add', [principal, interest.value]);
    const wrongPay = step('誤答: 1年分の利息で計算した支払額', 'add', [principal, year.value]);
    questions.push(
      journalQ({
        id: 'B07-001',
        topic: T,
        difficulty: 2,
        prompt: `取引先から借り入れていた ${yen(principal)}(借入期間${months}か月、利率は年${rate}%)の返済期日になり、利息とともに普通預金口座から返済した。利息は月割で計算する。`,
        choices: ['借入金', '貸付金', '支払利息', '受取利息', '普通預金', '未払金'],
        debit: [line('借入金', principal), line('支払利息', interest.value)],
        credit: [line('普通預金', pay.value)],
        calc: [...steps, pay],
        explanation: `利息は月割で、${yen(principal)} × ${rate}% = ${yen(year.value)}(1年分)の ${months}/12 で ${yen(interest.value)}。借入金を元金の分だけ減らし、利息は **支払利息(費用)**。`,
        mistakes: [
          {
            entry: { debit: [line('借入金', principal), line('支払利息', year.value)], credit: [line('普通預金', wrongPay.value)] },
            why: `${yen(year.value)} は1年分の利息。借りていたのは${months}か月なので、月割にする。`,
          },
          {
            entry: { debit: [line('借入金', principal)], credit: [line('普通預金', principal)] },
            why: '利息も一緒に払っている。利息は支払利息として書く。',
          },
          {
            entry: { debit: [line('借入金', principal), line('受取利息', interest.value)], credit: [line('普通預金', pay.value)] },
            why: '払った利息は費用の支払利息。受取利息は、貸した側が受け取る利息(収益)。',
          },
        ],
        ref: { topic: T, anchor: 'loan' },
      }),
    );
  }

  // 2. 受取利息の計算(数値)
  {
    const principal = 900000;
    const months = 8;
    const rate = 4;
    const { steps, year, interest } = interestSteps(principal, rate, months);
    const total = step('誤答: 元金 + 利息', 'add', [principal, interest.value]);
    questions.push(
      numericQ({
        id: 'B07-002',
        topic: T,
        difficulty: 2,
        prompt: `取引先に ${yen(principal)} を貸し付けていた(貸付期間${months}か月、利率は年${rate}%)。返済期日に、元金と利息を受け取った。受取利息の金額はいくらか。利息は月割で計算する。`,
        answer: interest.value,
        calc: steps,
        explanation: `元金 × 年利率で1年分の利息 ${yen(year.value)} を出し、貸していた${months}か月分(${months}/12)にする。`,
        mistakes: [
          { value: year.value, calc: steps.slice(0, 2), why: `これは1年分の利息。貸していたのは${months}か月なので、× ${months} ÷ 12 で月割にする。` },
          { value: total.value, calc: [...steps, total], why: '受け取った総額(元金 + 利息)になっている。聞かれているのは受取利息だけ。' },
        ],
        ref: { topic: T, anchor: 'loan' },
      }),
    );
  }

  // 3. 未払金(備品の購入)
  {
    const amt = 240000;
    questions.push(
      journalQ({
        id: 'B07-003',
        topic: T,
        difficulty: 1,
        prompt: `事務用のパソコン ${yen(amt)} を購入し、代金は月末に支払うことにした。`,
        choices: ['備品', '仕入', '未払金', '買掛金', '未収入金', '普通預金'],
        debit: [line('備品', amt)],
        credit: [line('未払金', amt)],
        explanation: '事務用のパソコンは売るための商品ではないので **備品**。商品以外の代金をあとで払うときは **未払金**。',
        mistakes: [
          {
            entry: { debit: [line('備品', amt)], credit: [line('買掛金', amt)] },
            why: '買掛金は商品の代金だけ。備品の代金は未払金。',
          },
          {
            entry: { debit: [line('仕入', amt)], credit: [line('買掛金', amt)] },
            why: '売るための商品ではないので仕入にしない。事務用の物は備品、代金は未払金。',
          },
        ],
        ref: { topic: T, anchor: 'misc' },
      }),
    );
  }

  // 4. 前払金(内金の支払い)
  {
    const order = 500000;
    const adv = 100000;
    questions.push(
      journalQ({
        id: 'B07-004',
        topic: T,
        difficulty: 1,
        prompt: `商品 ${yen(order)} を注文し、内金として ${yen(adv)} を普通預金口座から支払った。`,
        choices: ['前払金', '前受金', '仕入', '買掛金', '普通預金', '未払金'],
        debit: [line('前払金', adv)],
        credit: [line('普通預金', adv)],
        explanation: `まだ商品を受け取っていないので、仕入は書かない。先に払った内金 ${yen(adv)} は、あとで商品を受け取る権利として **前払金(資産)** にする。`,
        mistakes: [
          {
            entry: { debit: [line('仕入', adv)], credit: [line('普通預金', adv)] },
            why: '仕入は商品を受け取ったときに書く。注文して内金を払っただけなので前払金。',
          },
          {
            entry: { debit: [line('前受金', adv)], credit: [line('普通預金', adv)] },
            why: '前受金は、売る側が代金を先に受け取ったときの負債。買う側が先に払ったのは前払金。',
          },
          {
            entry: { debit: [line('前払金', order)], credit: [line('普通預金', order)] },
            why: `払ったのは内金 ${yen(adv)} だけ。注文した金額の全部ではない。`,
          },
        ],
        ref: { topic: T, anchor: 'advance' },
      }),
    );
  }

  // 5. 前受金(商品の引き渡し)
  {
    const price = 360000;
    const adv = 60000;
    const rest = step('掛けにした残り(代金 − 手付金)', 'sub', [price, adv]);
    questions.push(
      journalQ({
        id: 'B07-005',
        topic: T,
        difficulty: 2,
        prompt: `得意先から注文を受けていた商品 ${yen(price)} を引き渡した。代金のうち ${yen(adv)} は注文を受けたときに手付金として受け取っており、残りは掛けとした。`,
        choices: ['前受金', '前払金', '売掛金', '売上', '現金', '未収入金'],
        debit: [line('前受金', adv), line('売掛金', rest.value)],
        credit: [line('売上', price)],
        calc: [rest],
        explanation: `売上は全額の ${yen(price)}。受け取っていた手付金は **前受金(負債)** なので、商品を渡したときに消す。残りの ${yen(rest.value)} が売掛金。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', price)], credit: [line('売上', price)] },
            why: `手付金 ${yen(adv)} はもう受け取っている。前受金を消して、売掛金は残りだけにする。`,
          },
          {
            entry: { debit: [line('売掛金', rest.value)], credit: [line('売上', rest.value)] },
            why: `売上は商品の代金の全額 ${yen(price)}。手付金の分も売上になる(前受金を消す)。`,
          },
          {
            entry: { debit: [line('前払金', adv), line('売掛金', rest.value)], credit: [line('売上', price)] },
            why: '売る側が先に受け取ったお金は前受金。前払金は買う側の科目。',
          },
        ],
        ref: { topic: T, anchor: 'advance' },
      }),
    );
  }

  // 6. 給料の支払い(所得税・社会保険料の預り金)
  {
    const gross = 280000;
    const tax = 15000;
    const social = 32000;
    const paid = step('支払額(給料 − 所得税 − 社会保険料)', 'sub', [gross, tax, social]);
    const wrongNoSocial = step('誤答: 社会保険料を引き忘れた支払額', 'sub', [gross, tax]);
    questions.push(
      journalQ({
        id: 'B07-006',
        topic: T,
        difficulty: 2,
        prompt: `従業員の給料 ${yen(gross)} から、源泉所得税 ${yen(tax)} と従業員が負担する社会保険料 ${yen(social)} を差し引き、残りを普通預金口座から支払った。`,
        choices: ['給料', '所得税預り金', '社会保険料預り金', '法定福利費', '立替金', '普通預金'],
        debit: [line('給料', gross)],
        credit: [line('所得税預り金', tax), line('社会保険料預り金', social), line('普通預金', paid.value)],
        calc: [paid],
        explanation: `給料(費用)は差し引く前の総額 ${yen(gross)}。差し引いた所得税と社会保険料は、従業員の代わりにあとで納めるために預かったお金なので **預り金(負債)**。支払ったのは残りの ${yen(paid.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('給料', paid.value)], credit: [line('普通預金', paid.value)] },
            why: `給料は手取りではなく総額 ${yen(gross)} で書く。差し引いた分は預り金にする。`,
          },
          {
            entry: { debit: [line('給料', gross)], credit: [line('所得税預り金', tax), line('法定福利費', social), line('普通預金', paid.value)] },
            why: '従業員が負担する社会保険料は、会社が預かってあとで納めるお金なので社会保険料預り金(負債)。法定福利費は会社が負担する分。',
          },
          {
            entry: { debit: [line('給料', gross)], credit: [line('所得税預り金', tax), line('普通預金', wrongNoSocial.value)] },
            why: `社会保険料 ${yen(social)} も差し引いている。社会保険料預り金を書く。`,
          },
        ],
        ref: { topic: T, anchor: 'tatekae' },
      }),
    );
  }

  // 7. 社会保険料の納付(預り分 + 会社負担分)
  {
    const employee = 32000;
    const company = 32000;
    const total = step('納付額(従業員の分 + 会社の分)', 'add', [employee, company]);
    questions.push(
      journalQ({
        id: 'B07-007',
        topic: T,
        difficulty: 2,
        prompt: `給料を支払ったときに預かっていた従業員負担の社会保険料 ${yen(employee)} と、会社が負担する社会保険料 ${yen(company)} を合わせて、普通預金口座から納付した。`,
        choices: ['社会保険料預り金', '法定福利費', '給料', '立替金', '普通預金', '未払金'],
        debit: [line('社会保険料預り金', employee), line('法定福利費', company)],
        credit: [line('普通預金', total.value)],
        calc: [total],
        explanation: `預かっていた従業員の分は **社会保険料預り金** を消す。会社が負担する分は会社の費用なので **法定福利費**。合わせて ${yen(total.value)} を納付した。`,
        mistakes: [
          {
            entry: { debit: [line('法定福利費', total.value)], credit: [line('普通預金', total.value)] },
            why: `従業員の分 ${yen(employee)} は給料から預かったお金。費用ではなく、社会保険料預り金を消す。`,
          },
          {
            entry: { debit: [line('社会保険料預り金', total.value)], credit: [line('普通預金', total.value)] },
            why: `預かっていたのは従業員の分 ${yen(employee)} だけ。会社が負担する分は法定福利費(費用)。`,
          },
        ],
        ref: { topic: T, anchor: 'tatekae' },
      }),
    );
  }

  // 8. 仮払金の精算
  {
    const advance = 70000;
    const used = 63000;
    const back = step('戻ってきた現金(渡した額 − 旅費)', 'sub', [advance, used]);
    questions.push(
      journalQ({
        id: 'B07-008',
        topic: T,
        difficulty: 2,
        prompt: `出張する従業員に旅費の概算額 ${yen(advance)} を現金で渡し、仮払金としていた。従業員が帰社し、旅費は ${yen(used)} だったと報告を受け、残りを現金で受け取った。`,
        choices: ['旅費交通費', '仮払金', '仮受金', '現金', '立替金', '未収入金'],
        debit: [line('旅費交通費', used), line('現金', back.value)],
        credit: [line('仮払金', advance)],
        calc: [back],
        explanation: `渡した ${yen(advance)} の仮払金を全部消す。使った ${yen(used)} は **旅費交通費**、戻ってきた ${yen(back.value)} は現金。`,
        mistakes: [
          {
            entry: { debit: [line('旅費交通費', used)], credit: [line('仮払金', used)] },
            why: `戻ってきた現金 ${yen(back.value)} が抜けている。これだと仮払金が残ってしまう。渡した額 = 使った額 + 戻った額。`,
          },
          {
            entry: { debit: [line('旅費交通費', advance)], credit: [line('仮払金', advance)] },
            why: `旅費は ${yen(used)}。残りは現金で戻ってきているので、旅費交通費は使った額だけ。`,
          },
        ],
        ref: { topic: T, anchor: 'temp' },
      }),
    );
  }

  // 9. 仮受金の内容が判明
  {
    const total = 150000;
    const collected = 110000;
    const deposit = step('手付金(入金額 − 売掛金の回収額)', 'sub', [total, collected]);
    questions.push(
      journalQ({
        id: 'B07-009',
        topic: T,
        difficulty: 2,
        prompt: `先日、内容のわからない入金 ${yen(total)} が普通預金口座にあり、仮受金としていた。調べたところ、${yen(collected)} は得意先に対する売掛金の回収で、残りは商品の注文を受けたときの手付金だとわかった。`,
        choices: ['仮受金', '仮払金', '売掛金', '前受金', '売上', '普通預金'],
        debit: [line('仮受金', total)],
        credit: [line('売掛金', collected), line('前受金', deposit.value)],
        calc: [deposit],
        explanation: `内容がわかったので、仮受金 ${yen(total)} を消して正しい科目に振り替える。売掛金の回収は **売掛金** を減らし、手付金 ${yen(deposit.value)} は商品をまだ渡していないので **前受金**。`,
        mistakes: [
          {
            entry: { debit: [line('仮受金', total)], credit: [line('売掛金', collected), line('売上', deposit.value)] },
            why: '手付金を受け取っただけで、商品はまだ渡していない。売上ではなく前受金(負債)。',
          },
          {
            entry: { debit: [line('仮受金', total)], credit: [line('売掛金', total)] },
            why: `売掛金の回収は ${yen(collected)} だけ。残りの ${yen(deposit.value)} は手付金(前受金)。`,
          },
          {
            entry: { debit: [line('普通預金', total)], credit: [line('売掛金', collected), line('前受金', deposit.value)] },
            why: '入金は仮受金として記録済み。今回は仮受金を消して振り替える(普通預金は動かない)。',
          },
        ],
        ref: { topic: T, anchor: 'temp' },
      }),
    );
  }

  // 10. 受取商品券
  {
    const price = 45000;
    const coupon = 30000;
    const cash = step('現金で受け取った額(代金 − 商品券)', 'sub', [price, coupon]);
    questions.push(
      journalQ({
        id: 'B07-010',
        topic: T,
        difficulty: 1,
        prompt: `商品 ${yen(price)} を売り上げ、代金のうち ${yen(coupon)} は自治体が発行した商品券で受け取り、残りは現金で受け取った。`,
        choices: ['受取商品券', '現金', '売掛金', '売上', '前受金', '未収入金'],
        debit: [line('受取商品券', coupon), line('現金', cash.value)],
        credit: [line('売上', price)],
        calc: [cash],
        explanation: `自治体が発行した商品券は、あとで発行元からお金を受け取る権利なので **受取商品券(資産)**。現金で受け取ったのは残りの ${yen(cash.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('現金', price)], credit: [line('売上', price)] },
            why: '他の店や自治体が発行した商品券は現金ではない。受取商品券にする。',
          },
          {
            entry: { debit: [line('売掛金', coupon), line('現金', cash.value)], credit: [line('売上', price)] },
            why: '商品券で受け取った分は、売掛金ではなく受取商品券という専用の科目を使う。',
          },
        ],
        ref: { topic: T, anchor: 'giftcert' },
      }),
    );
  }

  // 11. 差入保証金(退去時)
  {
    const deposit = 400000;
    const repair = 90000;
    const back = step('振り込まれた額(敷金 − 修繕費)', 'sub', [deposit, repair]);
    questions.push(
      journalQ({
        id: 'B07-011',
        topic: T,
        difficulty: 2,
        prompt: `店舗の賃貸借契約を解約して退去した。契約のときに差し入れていた敷金 ${yen(deposit)} から修繕費 ${yen(repair)} を差し引いた残りが、普通預金口座に振り込まれた。`,
        choices: ['差入保証金', '普通預金', '修繕費', '支払手数料', '未収入金', '前払金'],
        debit: [line('普通預金', back.value), line('修繕費', repair)],
        credit: [line('差入保証金', deposit)],
        calc: [back],
        explanation: `敷金 ${yen(deposit)} は **差入保証金(資産)** として記録しているので、全額を消す。差し引かれた修繕費 ${yen(repair)} は費用(**修繕費**)、戻ってきたのは ${yen(back.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', back.value)], credit: [line('差入保証金', back.value)] },
            why: `これだと差入保証金が ${yen(repair)} 残ってしまう。差し引かれた修繕費の分も、差入保証金を消して修繕費にする。`,
          },
          {
            entry: { debit: [line('普通預金', back.value), line('支払手数料', repair)], credit: [line('差入保証金', deposit)] },
            why: '差し引かれたのは店舗を元に戻すための修繕費。支払手数料ではない。',
          },
        ],
        ref: { topic: T, anchor: 'deposit' },
      }),
    );
  }

  // 12. 取引から科目を選ぶ(似ている科目の見分け)
  {
    const A = ['貸付金', '借入金', '売掛金', '未収入金', '買掛金', '未払金', '立替金', '預り金', '差入保証金', '前払金'];
    const sel = (ans) => blankSelect(A, ans);
    questions.push(
      tableQ({
        id: 'B07-012',
        topic: T,
        difficulty: 2,
        prompt: '次の取引の仕訳で、空欄に当てはまる科目を選びなさい。',
        table: {
          title: '似ている科目の見分け',
          columns: [{ label: '取引' }, { label: '借方' }, { label: '貸方' }],
          rows: [
            ['取引先に現金を貸し付けた', sel('貸付金'), '現金'],
            ['商品を売り、代金は月末に受け取る', sel('売掛金'), '売上'],
            ['土地を帳簿価額で売り、代金は月末に受け取る', sel('未収入金'), '土地'],
            ['前月に買った備品の代金を普通預金から払った', sel('未払金'), '普通預金'],
            ['従業員の保険料を現金で立て替えた', sel('立替金'), '現金'],
            ['店舗の敷金を普通預金から払った', sel('差入保証金'), '普通預金'],
          ],
        },
        explanation:
          '売掛金・買掛金は **商品** の代金だけ。土地や備品など商品以外の代金は **未収入金・未払金**。お金を貸したら貸付金、他人の分を立て替えたら立替金、退去時に返ってくる敷金は差入保証金。',
        mistakes: [
          { cell: [2, 1], value: '売掛金', why: '土地は商品ではないので、売掛金ではなく未収入金。' },
          { cell: [3, 1], value: '買掛金', why: '備品は商品ではないので、代金は買掛金ではなく未払金で記録している。払ったときは未払金を減らす。' },
          { cell: [4, 1], value: '預り金', why: '会社がお金を出して立て替えたので、あとで返してもらう権利(立替金・資産)。預り金は預かった側の負債。' },
          { cell: [5, 1], value: '前払金', why: '敷金は退去するときに返ってくるお金なので差入保証金。前払金は商品の代金を先に払ったとき。' },
          { cell: [0, 1], value: '借入金', why: 'お金を貸した側は貸付金(資産)。借入金は借りた側の負債。' },
        ],
        ref: { topic: T, anchor: 'compare' },
      }),
    );
  }

  return { topic: T, questions };
}
