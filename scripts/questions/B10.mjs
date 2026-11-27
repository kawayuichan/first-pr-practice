// B10 収益・費用と経過勘定 の問題(12問)
// 仕訳7問・数値2問・表2問(保険料勘定、経過勘定を選ぶ)・複数選択1問。金額はすべて step() で計算する。
// 決めたこと: 家賃・地代は使わない(2級では不動産の賃借は支払リース料になるため)。保険料・利息・手数料で練習する。
// 経過勘定の科目は「前払保険料」のように科目ごとに書く(公式表の「前払費用の各勘定」。前払費用などでも正解)。

import { blankNum, blankSelect, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B10';
const PERIOD = '会計期間は4月1日から3月31日までの1年である。';

/** 金額 × 月数 ÷ 全体の月数 */
function monthsStep(label, amount, months, total = 12) {
  const x = step(`${label}: × ${months}か月`, 'mul', [amount, months]);
  const v = step(`${label}(÷ ${total}か月)`, 'div', [x.value, total]);
  return [x, v];
}

/** 元金 × 年利率(%) ÷ 100 × 月数 ÷ 12 */
function interestSteps(principal, rate, months) {
  const a = step('元金 × 年利率(%)', 'mul', [principal, rate]);
  const year = step('1年分の利息(÷ 100)', 'div', [a.value, 100]);
  const [x, v] = monthsStep('当期の分の利息', year.value, months);
  return { steps: [a, year, x, v], year, interest: v };
}

export default function build() {
  const questions = [];

  // 1. 前払保険料
  {
    const amt = 96000;
    const [x, pre] = monthsStep('来期の分(4月〜8月)', amt, 5);
    const [x7, wrong7] = monthsStep('誤答: 当期の分(9月〜3月)', amt, 7);
    questions.push(
      journalQ({
        id: 'B10-001',
        topic: T,
        difficulty: 2,
        prompt: `${PERIOD}9月1日に1年分の保険料 ${yen(amt)} を支払い、保険料で処理している。決算にあたり、来期の分を月割で前払処理する。`,
        choices: ['前払保険料', '保険料', '未払保険料', '前払金', '普通預金', '前受金'],
        debit: [line('前払保険料', pre.value)],
        credit: [line('保険料', pre.value)],
        calc: [x, pre],
        explanation: `9月〜3月の7か月が当期の分、**4月〜8月の5か月** が来期の分。来期の分 ${yen(pre.value)} だけ保険料(費用)を減らし、**前払保険料(資産)** にする。`,
        mistakes: [
          {
            entry: { debit: [line('前払保険料', wrong7.value)], credit: [line('保険料', wrong7.value)] },
            why: '前払にするのは来期の分(4月〜8月の5か月)。9月〜3月の7か月は当期に使った分なので保険料のまま。',
            calc: [x7, wrong7],
          },
          {
            entry: { debit: [line('保険料', pre.value)], credit: [line('前払保険料', pre.value)] },
            why: '貸借が逆。決算では、来期の分の保険料(費用)を減らして前払保険料(資産)にする。この形は翌期首の再振替仕訳。',
          },
          {
            entry: { debit: [line('前払金', pre.value)], credit: [line('保険料', pre.value)] },
            why: '前払金は商品の代金を先に払ったとき(B07)。時間とともに使っていく保険料の前払いは前払保険料(前払費用)。',
          },
        ],
        ref: { topic: T, anchor: 'prepaid' },
      }),
    );
  }

  // 2. 前受手数料
  {
    const amt = 54000;
    const [x, pre] = monthsStep('来期の分(4月)', amt, 1, 6);
    const [x5, wrong5] = monthsStep('誤答: 当期の分(11月〜3月)', amt, 5, 6);
    questions.push(
      journalQ({
        id: 'B10-002',
        topic: T,
        difficulty: 2,
        prompt: `${PERIOD}11月1日に6か月分の手数料 ${yen(amt)} を受け取り、受取手数料で処理している。決算にあたり、来期の分を月割で前受処理する。`,
        choices: ['受取手数料', '前受手数料', '未収手数料', '前受金', '支払手数料', '普通預金'],
        debit: [line('受取手数料', pre.value)],
        credit: [line('前受手数料', pre.value)],
        calc: [x, pre],
        explanation: `11月〜4月の6か月分のうち、**4月の1か月** が来期の分。${yen(pre.value)} だけ受取手数料(収益)を減らし、**前受手数料(負債)** にする。`,
        mistakes: [
          {
            entry: { debit: [line('受取手数料', wrong5.value)], credit: [line('前受手数料', wrong5.value)] },
            why: '前受にするのは来期の分(4月の1か月)。11月〜3月の5か月は当期にサービスを提供した分なので収益のまま。',
            calc: [x5, wrong5],
          },
          {
            entry: { debit: [line('前受手数料', pre.value)], credit: [line('受取手数料', pre.value)] },
            why: '貸借が逆。決算では、来期の分の受取手数料(収益)を減らして前受手数料(負債)にする。',
          },
        ],
        ref: { topic: T, anchor: 'unearned' },
      }),
    );
  }

  // 3. 未払利息
  {
    const principal = 2400000;
    const rate = 3;
    const { steps, year, interest } = interestSteps(principal, rate, 4);
    questions.push(
      journalQ({
        id: 'B10-003',
        topic: T,
        difficulty: 2,
        prompt: `${PERIOD}12月1日に銀行から ${yen(principal)} を借り入れた(利率は年${rate}%、利息は返済のときに支払う)。決算にあたり、当期の分の利息を月割で計上する。`,
        choices: ['支払利息', '未払利息', '前払利息', '未払金', '借入金', '受取利息'],
        debit: [line('支払利息', interest.value)],
        credit: [line('未払利息', interest.value)],
        calc: steps,
        explanation: `12月〜3月の **4か月分** は当期の費用。1年分 ${yen(year.value)} の 4/12 = ${yen(interest.value)} を支払利息にし、まだ払っていないので **未払利息(負債)**。`,
        mistakes: [
          {
            entry: { debit: [line('支払利息', year.value)], credit: [line('未払利息', year.value)] },
            why: `${yen(year.value)} は1年分。当期に借りていたのは12月〜3月の4か月なので、月割にする。`,
          },
          {
            entry: { debit: [line('支払利息', interest.value)], credit: [line('未払金', interest.value)] },
            why: '時間とともに発生する利息の未払いは未払利息(未払費用)。未払金は、物を買った代金などの未払い。',
          },
        ],
        ref: { topic: T, anchor: 'accrued-expense' },
      }),
    );
  }

  // 4. 未収利息
  {
    const principal = 600000;
    const rate = 4;
    const { steps, interest } = interestSteps(principal, rate, 5);
    questions.push(
      journalQ({
        id: 'B10-004',
        topic: T,
        difficulty: 2,
        prompt: `${PERIOD}11月1日に取引先へ ${yen(principal)} を貸し付けた(利率は年${rate}%、利息は返済のときに受け取る)。決算にあたり、当期の分の利息を月割で計上する。`,
        choices: ['未収利息', '受取利息', '前受利息', '未収入金', '貸付金', '支払利息'],
        debit: [line('未収利息', interest.value)],
        credit: [line('受取利息', interest.value)],
        calc: steps,
        explanation: `11月〜3月の **5か月分** の利息 ${yen(interest.value)} は当期の収益。まだ受け取っていないので **未収利息(資産)**。`,
        mistakes: [
          {
            entry: { debit: [line('未収入金', interest.value)], credit: [line('受取利息', interest.value)] },
            why: '時間とともに発生する利息の未収は未収利息(未収収益)。未収入金は、物を売った代金などの未収。',
          },
          {
            entry: { debit: [line('受取利息', interest.value)], credit: [line('前受利息', interest.value)] },
            why: '利息はまだ受け取っていない。受け取っていない当期の分は、収益を増やして未収利息にする。',
          },
        ],
        ref: { topic: T, anchor: 'accrued-revenue' },
      }),
    );
  }

  // 5. 再振替(前払保険料)
  {
    const amt = 40000;
    questions.push(
      journalQ({
        id: 'B10-005',
        topic: T,
        difficulty: 1,
        prompt: `期首(4月1日)にあたり、前期末に計上した前払保険料 ${yen(amt)} について再振替仕訳を行う。`,
        choices: ['保険料', '前払保険料', '未払保険料', '普通預金', '前払金', '損益'],
        debit: [line('保険料', amt)],
        credit: [line('前払保険料', amt)],
        explanation: `決算の仕訳(前払保険料 / 保険料)の **貸借を逆** にする。前期に払った分のうち ${yen(amt)} は当期に使う保険なので、当期の保険料(費用)に戻す。`,
        mistakes: [
          {
            entry: { debit: [line('前払保険料', amt)], credit: [line('保険料', amt)] },
            why: 'これは前期末の決算の仕訳。再振替は、その貸借を逆にする。',
          },
          {
            entry: { debit: [line('保険料', amt)], credit: [line('普通預金', amt)] },
            why: '期首にお金は払っていない。前期に払い済みの分を、前払保険料から保険料に戻すだけ。',
          },
        ],
        ref: { topic: T, anchor: 'reversal' },
      }),
    );
  }

  // 6. 再振替(未払利息)
  {
    const amt = 15000;
    questions.push(
      journalQ({
        id: 'B10-006',
        topic: T,
        difficulty: 2,
        prompt: `期首(4月1日)にあたり、前期末に計上した未払利息 ${yen(amt)} について再振替仕訳を行う。`,
        choices: ['未払利息', '支払利息', '未払金', '借入金', '普通預金', '受取利息'],
        debit: [line('未払利息', amt)],
        credit: [line('支払利息', amt)],
        explanation: `決算の仕訳(支払利息 / 未払利息)の **貸借を逆** にする。当期に利息を払ったときは全額を支払利息にするので、前期の分 ${yen(amt)} を先に引いておけば、二重に費用にならない。`,
        mistakes: [
          {
            entry: { debit: [line('支払利息', amt)], credit: [line('未払利息', amt)] },
            why: 'これは前期末の決算の仕訳。再振替は、その貸借を逆にする。',
          },
          {
            entry: { debit: [line('未払利息', amt)], credit: [line('普通預金', amt)] },
            why: '期首にはまだ利息を払っていない。再振替では、未払利息を消して支払利息を減らすだけ。',
          },
        ],
        ref: { topic: T, anchor: 'reversal' },
      }),
    );
  }

  // 7. 貯蔵品
  {
    const stamps = 3200;
    const revenueStamps = 6000;
    const total = step('貯蔵品(切手 + 収入印紙)', 'add', [stamps, revenueStamps]);
    questions.push(
      journalQ({
        id: 'B10-007',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、郵便切手 ${yen(stamps)} と収入印紙 ${yen(revenueStamps)} が使われずに残っていた。購入したときに、郵便切手は通信費、収入印紙は租税公課で処理している。`,
        choices: ['貯蔵品', '通信費', '租税公課', '前払費用', '消耗品費', '現金'],
        debit: [line('貯蔵品', total.value)],
        credit: [line('通信費', stamps), line('租税公課', revenueStamps)],
        calc: [total],
        explanation: `使っていない切手・収入印紙は、来期に使える資産なので **貯蔵品**。それぞれ買ったときの費用(通信費 ${yen(stamps)}・租税公課 ${yen(revenueStamps)})を減らす。`,
        mistakes: [
          {
            entry: { debit: [line('貯蔵品', total.value)], credit: [line('通信費', total.value)] },
            why: '収入印紙は租税公課で処理している。切手は通信費、収入印紙は租税公課をそれぞれ減らす。',
          },
          {
            entry: { debit: [line('通信費', stamps), line('租税公課', revenueStamps)], credit: [line('貯蔵品', total.value)] },
            why: '貸借が逆。決算では費用を減らして貯蔵品(資産)にする。この形は翌期首の再振替仕訳。',
          },
        ],
        ref: { topic: T, anchor: 'supplies' },
      }),
    );
  }

  // 8. 当期の保険料(数値)
  {
    const opening = 30000;
    const paid = 84000;
    const [x, pre] = monthsStep('期末の前払分(4月〜7月)', paid, 4);
    const s1 = step('再振替で戻した分 + 当期に払った分', 'add', [opening, paid]);
    const expense = step('当期の保険料(− 期末の前払分)', 'sub', [s1.value, pre.value]);
    const noReversal = step('誤答: 再振替の分を入れない', 'sub', [paid, pre.value]);
    questions.push(
      numericQ({
        id: 'B10-008',
        topic: T,
        difficulty: 3,
        prompt: `${PERIOD}前期末に前払保険料 ${yen(opening)} を計上し、当期首に再振替した。当期は8月1日に1年分の保険料 ${yen(paid)} を支払い、保険料で処理した。決算で来期の分を月割で前払処理したあと、当期の保険料(損益計算書の金額)はいくらか。`,
        answer: expense.value,
        calc: [x, pre, s1, expense],
        explanation: `当期の保険料 = 再振替で戻した ${yen(opening)} + 当期に払った ${yen(paid)} − 来期の分(4月〜7月) ${yen(pre.value)}。`,
        mistakes: [
          { value: paid, why: '払った額がそのまま当期の費用ではない。再振替で戻した前期の前払分を足し、来期の分を引く。' },
          {
            value: noReversal.value,
            calc: [x, pre, noReversal],
            why: `期首の再振替で、前期に払った ${yen(opening)} が当期の保険料に戻っている。それも足す。`,
          },
        ],
        ref: { topic: T, anchor: 't-insurance' },
      }),
    );
  }

  // 9. 前受利息(数値)
  {
    const amt = 36000;
    const [x, pre] = monthsStep('来期の分(4月〜8月)', amt, 5);
    const [x7, wrong7] = monthsStep('誤答: 当期の分(9月〜3月)', amt, 7);
    questions.push(
      numericQ({
        id: 'B10-009',
        topic: T,
        difficulty: 2,
        prompt: `${PERIOD}貸付金の利息1年分 ${yen(amt)} を9月1日に前もって受け取り、受取利息で処理している。決算で計上する前受利息はいくらか(月割)。`,
        answer: pre.value,
        calc: [x, pre],
        explanation: `9月1日から1年分なので、9月〜3月の7か月が当期の分、**4月〜8月の5か月** が来期の分。来期の分を前受利息(負債)にする。`,
        mistakes: [
          { value: wrong7.value, calc: [x7, wrong7], why: 'これは当期の分(9月〜3月の7か月)。前受利息にするのは来期の分。' },
          { value: amt, why: '1年分の全部ではない。当期の分は収益のままで、来期の分だけを前受利息にする。' },
        ],
        ref: { topic: T, anchor: 'unearned' },
      }),
    );
  }

  // 10. 保険料勘定(表)
  {
    const opening = 25000;
    const paid = 60000;
    const [x, pre] = monthsStep('期末の前払分(4月〜6月)', paid, 3);
    const s1 = step('借方の合計(再振替 + 支払)', 'add', [opening, paid]);
    const pl = step('損益へ(借方の合計 − 期末の前払分)', 'sub', [s1.value, pre.value]);
    const [x9, wrong9] = monthsStep('誤答: 当期の分(7月〜3月)', paid, 9);
    const noReversal = step('誤答: 再振替を入れない損益', 'sub', [paid, pre.value]);
    questions.push(
      tableQ({
        id: 'B10-010',
        topic: T,
        difficulty: 3,
        prompt: `${PERIOD}次の保険料勘定の空欄を埋めなさい。前期末に前払保険料 ${yen(opening)} を計上しており、4月1日に再振替した。7月1日に1年分の保険料 ${yen(paid)} を普通預金口座から支払った。決算で来期の分を月割で前払処理し、残りを損益勘定に振り替える。`,
        table: {
          title: '保険料',
          columns: [{ label: '日付・摘要' }, { label: '借方', align: 'right' }, { label: '貸方', align: 'right' }],
          rows: [
            ['4月1日 前払保険料', blankNum(opening), null],
            ['7月1日 普通預金', paid, null],
            ['3月31日 前払保険料', null, blankNum(pre.value)],
            ['3月31日 損益', null, blankNum(pl.value)],
            ['合計', blankNum(s1.value), blankNum(s1.value)],
          ],
        },
        checks: [
          { label: '借方の合計', op: 'add', args: [[0, 1], [1, 1]], result: [4, 1] },
          { label: '貸方の合計', op: 'add', args: [[2, 2], [3, 2]], result: [4, 2] },
          { label: '借方の合計 = 貸方の合計', op: 'add', args: [[4, 1], 0], result: [4, 2] },
        ],
        calc: [x, pre, s1, pl],
        explanation: `期首に再振替した ${yen(opening)} と、7月1日に払った ${yen(paid)} が借方。決算で来期の分(4月〜6月の3か月)${yen(pre.value)} を前払保険料へ、残り ${yen(pl.value)} が当期の保険料として損益へ振り替わる。`,
        mistakes: [
          {
            cell: [2, 2],
            value: wrong9.value,
            calc: [x9, wrong9],
            why: '前払にするのは来期の分(4月〜6月の3か月)。7月〜3月の9か月は当期の分。',
          },
          {
            cell: [3, 2],
            value: noReversal.value,
            calc: [x, pre, noReversal],
            why: `4月1日の再振替で戻した ${yen(opening)} も当期の保険料。損益へ振り替える額に含める。`,
          },
        ],
        ref: { topic: T, anchor: 't-insurance' },
      }),
    );
  }

  // 11. どの経過勘定か(表で選ぶ)
  {
    const K = ['前払費用', '前受収益', '未払費用', '未収収益'];
    const sel = (ans) => blankSelect(K, ans);
    questions.push(
      tableQ({
        id: 'B10-011',
        topic: T,
        difficulty: 2,
        prompt: '次の決算の場面で使う経過勘定を選びなさい。',
        table: {
          title: 'どの経過勘定か',
          columns: [{ label: '決算の場面' }, { label: '経過勘定' }],
          rows: [
            ['保険料を1年分前払いしており、来期の分がある', sel('前払費用')],
            ['手数料を前もって受け取っており、来期の分がある', sel('前受収益')],
            ['借入金の利息は後払いで、当期の分をまだ払っていない', sel('未払費用')],
            ['貸付金の利息は後で受け取り、当期の分をまだ受け取っていない', sel('未収収益')],
          ],
        },
        explanation:
          '先に払った・受け取った分のうち **来期の分** は前払費用・前受収益。**当期の分** なのにまだ払っていない・受け取っていないものは未払費用・未収収益。',
        mistakes: [
          { cell: [0, 1], value: '未払費用', why: 'すでに払っていて、来期の分が残っている。来期の分を払い済み → 前払費用。' },
          { cell: [1, 1], value: '前払費用', why: '受け取った側なので収益の調整。来期の分を先に受け取った → 前受収益(負債)。' },
          { cell: [2, 1], value: '前払費用', why: 'まだ払っていない当期の分 → 未払費用(負債)。前払費用は先に払ったとき。' },
          { cell: [3, 1], value: '前受収益', why: 'まだ受け取っていない当期の分 → 未収収益(資産)。前受収益は先に受け取ったとき。' },
        ],
        ref: { topic: T, anchor: 'four' },
      }),
    );
  }

  // 12. 資産になるもの(複数選択)
  {
    const O = ['前払費用', '前受収益', '未払費用', '未収収益', '貯蔵品'];
    questions.push(
      multiQ({
        id: 'B10-012',
        topic: T,
        difficulty: 2,
        prompt: '次のうち、貸借対照表で資産になるものをすべて選びなさい。',
        options: O,
        answer: [0, 3, 4],
        explanation:
          '**前払費用**(来期のサービスを受ける権利)、**未収収益**(当期の分を受け取る権利)、**貯蔵品**(来期に使える切手など)が資産。前受収益(来期にサービスを提供する義務)と未払費用(当期の分を払う義務)は負債。',
        mistakes: [
          { options: [0, 1, 4], why: '前受収益は、先にお金を受け取って来期にサービスを提供する義務なので負債。未収収益は受け取る権利なので資産。' },
          { options: [0, 3], why: '使っていない切手・収入印紙(貯蔵品)も、来期に使える資産。' },
          { options: [0, 2, 3, 4], why: '未払費用は、当期の分をこれから払う義務なので負債。' },
        ],
        ref: { topic: T, anchor: 'four' },
      }),
    );
  }

  return { topic: T, questions };
}
