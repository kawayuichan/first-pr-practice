// B06 売掛金・買掛金・電子記録債権 の問題(10問)
// 仕訳8問・数値1問・表の穴埋め1問(売掛金元帳)。金額はすべて step() で計算する。
// 2級の内容(電子記録債権の譲渡・割引、営業外電子記録債権など)は C06 で扱うので含めない。

import { blankNum, journalQ, line, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B06';

export default function build() {
  const questions = [];

  // 1. 売掛金の回収
  {
    const amt = 150000;
    questions.push(
      journalQ({
        id: 'B06-001',
        topic: T,
        difficulty: 1,
        prompt: `得意先に対する売掛金 ${yen(amt)} が、普通預金口座に振り込まれた。`,
        choices: ['現金', '普通預金', '売掛金', '売上', '前受金', '買掛金'],
        debit: [line('普通預金', amt)],
        credit: [line('売掛金', amt)],
        explanation: '代金を受け取ったので、まだ受け取っていなかった権利(**売掛金**)が減る(貸方)。売上は、商品を売ったときに記録済み。',
        mistakes: [
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('売上', amt)] },
            why: '売上は、商品を売ったときにすでに記録している。代金を受け取ったときは売掛金を減らす。',
          },
          {
            entry: { debit: [line('売掛金', amt)], credit: [line('普通預金', amt)] },
            why: '左右が逆です。普通預金(資産)が増えたので借方、売掛金(資産)が減ったので貸方。',
          },
        ],
        ref: { topic: T, anchor: 'ar-ap' },
      }),
    );
  }

  // 2. 買掛金の支払
  {
    const amt = 90000;
    questions.push(
      journalQ({
        id: 'B06-002',
        topic: T,
        difficulty: 1,
        prompt: `仕入先に対する買掛金 ${yen(amt)} を、当座預金口座から支払った。`,
        choices: ['当座預金', '普通預金', '買掛金', '仕入', '未払金', '前払金'],
        debit: [line('買掛金', amt)],
        credit: [line('当座預金', amt)],
        explanation: '代金を払ったので、払う義務(**買掛金**)が減る(借方)。仕入は、商品を仕入れたときに記録済み。',
        mistakes: [
          {
            entry: { debit: [line('仕入', amt)], credit: [line('当座預金', amt)] },
            why: '仕入は、商品を仕入れたときにすでに記録している。代金を払ったときは買掛金を減らす。',
          },
          {
            entry: { debit: [line('未払金', amt)], credit: [line('当座預金', amt)] },
            why: '商品の代金の未払いは買掛金。未払金は、商品以外のものを買ったときの未払い。',
          },
        ],
        ref: { topic: T, anchor: 'ar-ap' },
      }),
    );
  }

  // 3. クレジット売上(手数料は販売時に計上)
  {
    const price = 80000;
    const rate = 3;
    const feeX = step('販売額 × 手数料率(%)', 'mul', [price, rate]);
    const fee = step('手数料(販売額の3%)', 'div', [feeX.value, 100]);
    const net = step('クレジット売掛金(販売額 − 手数料)', 'sub', [price, fee.value]);
    questions.push(
      journalQ({
        id: 'B06-003',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(price)} をクレジットカード払いで売り上げた。カード会社への手数料は販売額の${rate}%で、売り上げたときに計上する。`,
        choices: ['売掛金', 'クレジット売掛金', '売上', '支払手数料', '受取手数料', '現金'],
        debit: [line('クレジット売掛金', net.value), line('支払手数料', fee.value)],
        credit: [line('売上', price)],
        calc: [feeX, fee, net],
        explanation: `売上は全額の ${yen(price)}。カード会社から受け取るのは手数料 ${yen(fee.value)} を引いた ${yen(net.value)} なので、それが **クレジット売掛金**。手数料は **支払手数料(費用)**。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', net.value), line('支払手数料', fee.value)], credit: [line('売上', price)] },
            why: 'クレジットカード払いの代金はカード会社から受け取るので、ふつうの売掛金と分けてクレジット売掛金にする。',
          },
          {
            entry: { debit: [line('クレジット売掛金', net.value)], credit: [line('売上', net.value)] },
            why: `売上は手数料を引く前の全額 ${yen(price)}。手数料は売上から引かず、支払手数料にする。`,
          },
          {
            entry: { debit: [line('クレジット売掛金', price)], credit: [line('売上', price)] },
            why: '手数料を売り上げたときに計上する指示がある。手数料は支払手数料にし、クレジット売掛金は手数料を引いた額。',
          },
        ],
        ref: { topic: T, anchor: 'credit' },
      }),
    );
  }

  // 4. クレジット代金の入金
  {
    const price = 80000;
    const feeX = step('販売額 × 手数料率(%)', 'mul', [price, 3]);
    const fee = step('手数料(販売額の3%)', 'div', [feeX.value, 100]);
    const net = step('入金額(販売額 − 手数料)', 'sub', [price, fee.value]);
    questions.push(
      journalQ({
        id: 'B06-004',
        topic: T,
        difficulty: 2,
        prompt: `先日、商品 ${yen(price)} をクレジットカード払いで売り上げ、手数料 ${yen(fee.value)} を差し引いた額をクレジット売掛金としていた。本日、カード会社から ${yen(net.value)} が普通預金口座に入金された。`,
        choices: ['普通預金', '売掛金', 'クレジット売掛金', '支払手数料', '売上', '現金'],
        debit: [line('普通預金', net.value)],
        credit: [line('クレジット売掛金', net.value)],
        calc: [feeX, fee, net],
        explanation: '入金された額だけ **クレジット売掛金** を減らす。手数料は、売り上げたときにすでに支払手数料として記録している。',
        mistakes: [
          {
            entry: { debit: [line('普通預金', net.value), line('支払手数料', fee.value)], credit: [line('クレジット売掛金', price)] },
            why: '手数料は売り上げたときに計上済み。クレジット売掛金はもともと手数料を引いた額で記録している。',
          },
          {
            entry: { debit: [line('普通預金', net.value)], credit: [line('売掛金', net.value)] },
            why: 'カード会社への権利はクレジット売掛金で記録している。ふつうの売掛金ではない。',
          },
        ],
        ref: { topic: T, anchor: 'credit' },
      }),
    );
  }

  // 5. キャッシュレス決済(スマホの決済アプリ)
  {
    const price = 12000;
    const fee = 360;
    const net = step('クレジット売掛金(販売額 − 決済手数料)', 'sub', [price, fee]);
    questions.push(
      journalQ({
        id: 'B06-005',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(price)} を売り上げ、代金はお客さんのスマートフォンの決済アプリで支払いを受けた。決済会社への手数料 ${yen(fee)} は、売り上げたときに計上する。`,
        choices: ['現金', '普通預金', '売掛金', 'クレジット売掛金', '売上', '支払手数料'],
        debit: [line('クレジット売掛金', net.value), line('支払手数料', fee)],
        credit: [line('売上', price)],
        calc: [net],
        explanation: `スマホの決済アプリなどの **キャッシュレス決済もクレジット売掛金** で処理する。代金はあとで決済会社から入金されるので、まだ現金や預金ではない。`,
        mistakes: [
          {
            entry: { debit: [line('現金', net.value), line('支払手数料', fee)], credit: [line('売上', price)] },
            why: 'スマホで支払いを受けても、お金はまだ手元に入っていない。あとで決済会社から入金されるので、クレジット売掛金。',
          },
          {
            entry: { debit: [line('普通預金', net.value), line('支払手数料', fee)], credit: [line('売上', price)] },
            why: '決済会社からの入金はあとから。売り上げた時点では、決済会社に対する権利(クレジット売掛金)。',
          },
        ],
        ref: { topic: T, anchor: 'credit' },
      }),
    );
  }

  // 6. 電子記録債権の発生(受け取る側)
  {
    const amt = 200000;
    questions.push(
      journalQ({
        id: 'B06-006',
        topic: T,
        difficulty: 2,
        prompt: `得意先に対する売掛金 ${yen(amt)} について、得意先の承諾を得て、取引銀行を通じて電子記録債権の発生記録が行われた。`,
        choices: ['売掛金', '電子記録債権', '電子記録債務', '売上', '普通預金', '受取手数料'],
        debit: [line('電子記録債権', amt)],
        credit: [line('売掛金', amt)],
        explanation: '売掛金が **電子記録債権** という形に変わっただけ。売掛金を減らして(貸方)、電子記録債権を増やす(借方)。',
        mistakes: [
          {
            entry: { debit: [line('電子記録債権', amt)], credit: [line('売上', amt)] },
            why: '売上は、商品を売ったときにすでに記録している。ここでは売掛金が電子記録債権に変わる。',
          },
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('売掛金', amt)] },
            why: 'まだ入金されていない。お金が入るのは支払期日。発生記録の時点では電子記録債権に変わるだけ。',
          },
        ],
        ref: { topic: T, anchor: 'denshi' },
      }),
    );
  }

  // 7. 電子記録債務の発生(払う側)
  {
    const amt = 130000;
    questions.push(
      journalQ({
        id: 'B06-007',
        topic: T,
        difficulty: 2,
        prompt: `仕入先に対する買掛金 ${yen(amt)} の支払いのため、取引銀行を通じて電子記録債務の発生記録を行った。`,
        choices: ['当座預金', '買掛金', '電子記録債権', '電子記録債務', '仕入', '未払金'],
        debit: [line('買掛金', amt)],
        credit: [line('電子記録債務', amt)],
        explanation: '買掛金が **電子記録債務** という形に変わっただけ(どちらも負債)。まだお金は払っていないので、預金は動かない。',
        mistakes: [
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('当座預金', amt)] },
            why: 'お金を払うのは支払期日。発生記録の時点では、買掛金が電子記録債務に変わるだけ。',
          },
          {
            entry: { debit: [line('電子記録債務', amt)], credit: [line('買掛金', amt)] },
            why: '左右が逆です。買掛金(負債)が減るので借方、電子記録債務(負債)が増えるので貸方。',
          },
        ],
        ref: { topic: T, anchor: 'denshi' },
      }),
    );
  }

  // 8. 電子記録債権の決済
  {
    const amt = 200000;
    questions.push(
      journalQ({
        id: 'B06-008',
        topic: T,
        difficulty: 2,
        prompt: `電子記録債権 ${yen(amt)} の支払期日になり、普通預金口座に入金された。`,
        choices: ['普通預金', '売掛金', '電子記録債権', '電子記録債務', '売上', '受取利息'],
        debit: [line('普通預金', amt)],
        credit: [line('電子記録債権', amt)],
        explanation: '入金されたので **電子記録債権** が減る。売掛金は、発生記録のときにすでに電子記録債権に変わっている。',
        mistakes: [
          {
            entry: { debit: [line('普通預金', amt)], credit: [line('売掛金', amt)] },
            why: '売掛金は、発生記録のときにすでに電子記録債権に振り替えている。減らすのは電子記録債権。',
          },
          {
            entry: { debit: [line('電子記録債権', amt)], credit: [line('普通預金', amt)] },
            why: '左右が逆です。普通預金(資産)が増え、電子記録債権(資産)が減る。',
          },
        ],
        ref: { topic: T, anchor: 'denshi' },
      }),
    );
  }

  // 9. 売掛金の期末残高
  {
    const begin = 300000;
    const sales = 1200000;
    const collected = 950000;
    const denshi = 180000;
    const returned = 20000;
    const s1 = step('期首 + 掛け売上', 'add', [begin, sales]);
    const s2 = step('− 回収', 'sub', [s1.value, collected]);
    const s3 = step('− 電子記録債権への振替', 'sub', [s2.value, denshi]);
    const end = step('− 返品(= 期末残高)', 'sub', [s3.value, returned]);
    const noDenshi = step('誤答: 電子記録債権への振替を引き忘れ', 'sub', [s2.value, returned]);
    const addReturn = step('誤答: 返品を足した', 'add', [s3.value, returned]);
    questions.push(
      numericQ({
        id: 'B06-009',
        topic: T,
        difficulty: 3,
        prompt: `売掛金の期首残高は ${yen(begin)} だった。当期の掛け売上は ${yen(sales)}、売掛金の回収は ${yen(collected)}、売掛金について電子記録債権の発生記録が行われた額は ${yen(denshi)}、掛けで売った商品の返品は ${yen(returned)} だった。売掛金の期末残高はいくらか。`,
        answer: end.value,
        calc: [s1, s2, s3, end],
        explanation:
          '売掛金は掛け売上で増え、回収・電子記録債権への振替・返品で減る。期末残高 = 期首 + 掛け売上 − 回収 − 電子記録債権への振替 − 返品。',
        mistakes: [
          { value: noDenshi.value, calc: [noDenshi], why: '電子記録債権の発生記録で、売掛金は電子記録債権に振り替わって減っている。' },
          { value: addReturn.value, calc: [addReturn], why: '返品されると売掛金(受け取る権利)は減る。足すのではなく引く。' },
        ],
        ref: { topic: T, anchor: 't-ar' },
      }),
    );
  }

  // 10. 売掛金元帳(A商店)
  {
    const opening = 100000;
    const sale = 60000;
    const ret = 5000;
    const collect = 120000;
    const b1 = step('8日の残高(前月繰越 + 売上)', 'add', [opening, sale]);
    const b2 = step('15日の残高(− 返品)', 'sub', [b1.value, ret]);
    const b3 = step('20日の残高(− 回収)', 'sub', [b2.value, collect]);
    const debitTotal = step('借方の合計', 'add', [opening, sale]);
    const creditTotal = step('貸方の合計(返品 + 回収 + 次月繰越)', 'add', [ret, collect, b3.value]);
    const wrongB2 = step('誤答: 返品を足した', 'add', [b1.value, ret]);
    const wrongCredit = step('誤答: 次月繰越を含めない貸方合計', 'add', [ret, collect]);
    questions.push(
      tableQ({
        id: 'B06-010',
        topic: T,
        difficulty: 2,
        prompt:
          '次の売掛金元帳(A商店)の空欄を埋めなさい。残高はすべて借方残高(受け取る権利が残っている)である。月末に次月繰越を記入し、借方と貸方の合計を一致させて締め切る。',
        table: {
          title: '売掛金元帳(A商店)',
          columns: [
            { label: '日付・摘要' },
            { label: '借方', align: 'right' },
            { label: '貸方', align: 'right' },
            { label: '残高', align: 'right' },
          ],
          rows: [
            ['1日 前月繰越', opening, null, opening],
            ['8日 売上', sale, null, blankNum(b1.value)],
            ['15日 返品', null, ret, blankNum(b2.value)],
            ['20日 入金', null, collect, blankNum(b3.value)],
            ['31日 次月繰越', null, blankNum(b3.value), null],
            ['合計', blankNum(debitTotal.value), blankNum(creditTotal.value), null],
          ],
        },
        checks: [
          { label: '8日の残高', op: 'add', args: [[0, 3], [1, 1]], result: [1, 3] },
          { label: '15日の残高', op: 'sub', args: [[1, 3], [2, 2]], result: [2, 3] },
          { label: '20日の残高', op: 'sub', args: [[2, 3], [3, 2]], result: [3, 3] },
          { label: '次月繰越 = 最後の残高', op: 'add', args: [[3, 3], 0], result: [4, 2] },
          { label: '借方の合計', op: 'add', args: [[0, 1], [1, 1]], result: [5, 1] },
          { label: '貸方の合計', op: 'add', args: [[2, 2], [3, 2], [4, 2]], result: [5, 2] },
          { label: '借方の合計 = 貸方の合計', op: 'add', args: [[5, 1], 0], result: [5, 2] },
        ],
        calc: [b1, b2, b3, debitTotal, creditTotal],
        explanation: `売上で増え(借方)、返品・回収で減る(貸方)。月末の残高 ${yen(b3.value)} を **次月繰越** として貸方に書くと、借方と貸方の合計がどちらも ${yen(debitTotal.value)} で一致して締め切れる。`,
        mistakes: [
          {
            cell: [2, 3],
            value: wrongB2.value,
            calc: [wrongB2],
            why: '返品されると、A商店から受け取る権利(売掛金)は減る。残高から引く。',
          },
          {
            cell: [5, 2],
            value: wrongCredit.value,
            calc: [wrongCredit],
            why: '貸方の合計には、次月繰越も含める。そうすると借方の合計と一致する。',
          },
        ],
        ref: { topic: T, anchor: 'ledgers' },
      }),
    );
  }

  return { topic: T, questions };
}
