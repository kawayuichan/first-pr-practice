// B14 決算②締切と財務諸表 の問題(10問)
// 仕訳4問・表4問(損益勘定・売掛金勘定の締切・損益計算書・貸借対照表)・複数選択1問・数値1問。金額はすべて step() で計算する。
// 決めたこと: 損益計算書・貸借対照表(勘定式)の問題では、金額に加えて表示の名前も選ぶ。繰越試算表は参考書で紹介だけ。
// 報告式・区分表示は2級の C22 で扱う。

import { blankNum, blankSelect, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B14';

export default function build() {
  const questions = [];

  // 1. 収益の振替
  {
    const sales = 1200000;
    const fee = 45000;
    const total = step('損益へ(売上 + 受取手数料)', 'add', [sales, fee]);
    questions.push(
      journalQ({
        id: 'B14-001',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、売上 ${yen(sales)} と受取手数料 ${yen(fee)} を損益勘定に振り替えた。`,
        choices: ['売上', '受取手数料', '損益', '繰越利益剰余金', '仕入', '資本金'],
        debit: [line('売上', sales), line('受取手数料', fee)],
        credit: [line('損益', total.value)],
        calc: [total],
        explanation: '収益の勘定は貸方に残高があるので、**借方** に書いて残高を消し、合計を損益の **貸方** に移す。',
        mistakes: [
          {
            entry: { debit: [line('損益', total.value)], credit: [line('売上', sales), line('受取手数料', fee)] },
            why: '貸借が逆。収益は貸方に残高があるので、借方に書いて消し、損益の貸方へ移す。',
          },
          {
            entry: { debit: [line('売上', sales), line('受取手数料', fee)], credit: [line('繰越利益剰余金', total.value)] },
            why: '収益・費用は、いったん損益勘定に集める。繰越利益剰余金に振り替えるのは、損益勘定の差額(当期純利益)だけ。',
          },
        ],
        ref: { topic: T, anchor: 'to-pl' },
      }),
    );
  }

  // 2. 費用の振替
  {
    const cogs = 780000;
    const salary = 260000;
    const dep = 90000;
    const total = step('損益へ(費用の合計)', 'add', [cogs, salary, dep]);
    questions.push(
      journalQ({
        id: 'B14-002',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、仕入(売上原価の計算後) ${yen(cogs)}、給料 ${yen(salary)}、減価償却費 ${yen(dep)} を損益勘定に振り替えた。`,
        choices: ['損益', '仕入', '給料', '減価償却費', '繰越利益剰余金', '売上'],
        debit: [line('損益', total.value)],
        credit: [line('仕入', cogs), line('給料', salary), line('減価償却費', dep)],
        calc: [total],
        explanation: '費用の勘定は借方に残高があるので、**貸方** に書いて残高を消し、合計を損益の **借方** に移す。',
        mistakes: [
          {
            entry: { debit: [line('仕入', cogs), line('給料', salary), line('減価償却費', dep)], credit: [line('損益', total.value)] },
            why: '貸借が逆。費用は借方に残高があるので、貸方に書いて消し、損益の借方へ移す。',
          },
        ],
        ref: { topic: T, anchor: 'to-pl' },
      }),
    );
  }

  // 3. 当期純利益の振替
  {
    const cr = 1245000;
    const dr = 1130000;
    const ni = step('当期純利益(貸方合計 − 借方合計)', 'sub', [cr, dr]);
    questions.push(
      journalQ({
        id: 'B14-003',
        topic: T,
        difficulty: 2,
        prompt: `収益と費用を損益勘定に振り替えたところ、損益勘定の貸方合計は ${yen(cr)}、借方合計は ${yen(dr)} になった。損益勘定の残高を繰越利益剰余金勘定に振り替える。`,
        choices: ['損益', '繰越利益剰余金', '資本金', '利益準備金', '売上', '現金'],
        debit: [line('損益', ni.value)],
        credit: [line('繰越利益剰余金', ni.value)],
        calc: [ni],
        explanation: `収益(貸方)のほうが多いので、差額 ${yen(ni.value)} は **当期純利益**。損益勘定を借方で消し、**繰越利益剰余金**(純資産)を増やす。`,
        mistakes: [
          {
            entry: { debit: [line('繰越利益剰余金', ni.value)], credit: [line('損益', ni.value)] },
            why: '貸借が逆。これは当期純損失のときの仕訳。利益なら繰越利益剰余金が増えるので貸方。',
          },
          {
            entry: { debit: [line('損益', ni.value)], credit: [line('資本金', ni.value)] },
            why: '当期純利益は、稼いだ利益の積み重ねである繰越利益剰余金に入れる。資本金は株主が払い込んだ元手。',
          },
        ],
        ref: { topic: T, anchor: 'to-retained' },
      }),
    );
  }

  // 4. 当期純損失の振替
  {
    const dr = 960000;
    const cr = 910000;
    const loss = step('当期純損失(借方合計 − 貸方合計)', 'sub', [dr, cr]);
    questions.push(
      journalQ({
        id: 'B14-004',
        topic: T,
        difficulty: 2,
        prompt: `収益と費用を損益勘定に振り替えたところ、損益勘定の借方合計は ${yen(dr)}、貸方合計は ${yen(cr)} になった。損益勘定の残高を繰越利益剰余金勘定に振り替える。`,
        choices: ['損益', '繰越利益剰余金', '資本金', '利益準備金', '仕入', '現金'],
        debit: [line('繰越利益剰余金', loss.value)],
        credit: [line('損益', loss.value)],
        calc: [loss],
        explanation: `費用(借方)のほうが多いので、差額 ${yen(loss.value)} は **当期純損失**。損益勘定を貸方で消し、繰越利益剰余金を減らす(借方)。`,
        mistakes: [
          {
            entry: { debit: [line('損益', loss.value)], credit: [line('繰越利益剰余金', loss.value)] },
            why: '借方合計(費用)のほうが多いので、純損失。繰越利益剰余金は減るので借方に書く。',
          },
        ],
        ref: { topic: T, anchor: 'to-retained' },
      }),
    );
  }

  // 5. 損益勘定(表)
  {
    const purchases = 640000;
    const begin = 70000;
    const end = 85000;
    const salary = 210000;
    const dep = 45000;
    const sales = 980000;
    const interest = 12000;
    const c1 = step('仕入 + 期首商品', 'add', [purchases, begin]);
    const cogs = step('損益へ振り替える仕入(− 期末商品)', 'sub', [c1.value, end]);
    const rev = step('収益の合計(貸方合計)', 'add', [sales, interest]);
    const exp = step('費用の合計', 'add', [cogs.value, salary, dep]);
    const ni = step('当期純利益(収益 − 費用)', 'sub', [rev.value, exp.value]);
    const wrongNi = step('誤答: 決算整理前の仕入で計算した差額', 'sub', [rev.value, purchases, salary, dep]);
    questions.push(
      tableQ({
        id: 'B14-005',
        topic: T,
        difficulty: 3,
        prompt: `次の損益勘定の空欄を埋めなさい。決算整理前の仕入は ${yen(purchases)}、期首商品棚卸高は ${yen(begin)}、期末商品棚卸高は ${yen(end)} で、売上原価は仕入勘定で計算している。損益勘定の差額は繰越利益剰余金に振り替える。`,
        table: {
          title: '損益',
          columns: [{ label: '日付・摘要' }, { label: '借方', align: 'right' }, { label: '貸方', align: 'right' }],
          rows: [
            ['3月31日 仕入', blankNum(cogs.value), null],
            ['3月31日 給料', salary, null],
            ['3月31日 減価償却費', dep, null],
            ['3月31日 繰越利益剰余金', blankNum(ni.value), null],
            ['3月31日 売上', null, sales],
            ['3月31日 受取利息', null, interest],
            ['合計', blankNum(rev.value), blankNum(rev.value)],
          ],
        },
        checks: [
          { label: '借方の合計', op: 'add', args: [[0, 1], [1, 1], [2, 1], [3, 1]], result: [6, 1] },
          { label: '貸方の合計', op: 'add', args: [[4, 2], [5, 2]], result: [6, 2] },
          { label: '借方の合計 = 貸方の合計', op: 'add', args: [[6, 1], 0], result: [6, 2] },
        ],
        calc: [c1, cogs, rev, exp, ni],
        explanation: `損益勘定に振り替える仕入は、売上原価の計算後の ${yen(cogs.value)}(仕入 + 期首 − 期末)。収益 ${yen(rev.value)} − 費用 ${yen(exp.value)} = ${yen(ni.value)} が当期純利益で、借方に「繰越利益剰余金」と書いて貸借を一致させる。`,
        mistakes: [
          {
            cell: [0, 1],
            value: purchases,
            why: '損益勘定に振り替えるのは、売上原価を計算したあとの仕入。期首の在庫を足し、期末の在庫を引く。',
          },
          {
            cell: [3, 1],
            value: wrongNi.value,
            calc: [wrongNi],
            why: '仕入は売上原価の計算後の金額で費用にする。差額(当期純利益)も変わる。',
          },
        ],
        ref: { topic: T, anchor: 'pl-account' },
      }),
    );
  }

  // 6. 売掛金勘定の締切(英米式)(表)
  {
    const opening = 280000;
    const sales = 650000;
    const collected = 560000;
    const s1 = step('借方の合計(前期繰越 + 売上)', 'add', [opening, sales]);
    const carry = step('次期繰越(借方の合計 − 回収)', 'sub', [s1.value, collected]);
    const noOpening = step('誤答: 前期繰越を入れずに計算した残高', 'sub', [sales, collected]);
    questions.push(
      tableQ({
        id: 'B14-006',
        topic: T,
        difficulty: 2,
        prompt: '次の売掛金勘定を英米式で締め切り、翌期首の開始記入もしなさい。空欄に金額を書く。',
        table: {
          title: '売掛金',
          columns: [{ label: '日付・摘要' }, { label: '借方', align: 'right' }, { label: '貸方', align: 'right' }],
          rows: [
            ['4月1日 前期繰越', opening, null],
            ['期中 売上', sales, null],
            ['期中 普通預金', null, collected],
            ['3月31日 次期繰越', null, blankNum(carry.value)],
            ['合計', blankNum(s1.value), blankNum(s1.value)],
            ['4月1日 前期繰越', blankNum(carry.value), null],
          ],
        },
        checks: [
          { label: '借方の合計', op: 'add', args: [[0, 1], [1, 1]], result: [4, 1] },
          { label: '貸方の合計(回収 + 次期繰越)', op: 'add', args: [[2, 2], [3, 2]], result: [4, 2] },
          { label: '借方の合計 = 貸方の合計', op: 'add', args: [[4, 1], 0], result: [4, 2] },
          { label: '翌期首の前期繰越 = 次期繰越', op: 'add', args: [[3, 2], 0], result: [5, 1] },
        ],
        calc: [s1, carry],
        explanation: `売掛金(資産)は借方残高なので、残高 ${yen(carry.value)} を **貸方** に「次期繰越」と書いて貸借を合わせ、締め切る。翌期首に同じ金額を **借方** に「前期繰越」と書く。英米式では、この記入は仕訳しない。`,
        mistakes: [
          {
            cell: [3, 2],
            value: noOpening.value,
            calc: [noOpening],
            why: '期首の前期繰越も売掛金の残高に入っている。前期繰越 + 売上 − 回収 が期末の残高。',
          },
        ],
        ref: { topic: T, anchor: 'closing' },
      }),
    );
  }

  // 7. 損益計算書(勘定式)(表・名前も選ぶ)
  {
    const purchases = 520000;
    const begin = 40000;
    const end = 55000;
    const sales = 830000;
    const salary = 180000;
    const dep = 36000;
    const fee = 18000;
    const c1 = step('仕入 + 期首商品', 'add', [purchases, begin]);
    const cogs = step('売上原価(− 期末商品)', 'sub', [c1.value, end]);
    const rev = step('収益の合計', 'add', [sales, fee]);
    const exp = step('費用の合計', 'add', [cogs.value, salary, dep]);
    const ni = step('当期純利益', 'sub', [rev.value, exp.value]);
    const PL = ['仕入', '売上原価', '売上', '売上高', '当期純利益', '繰越利益剰余金', '損益'];
    const sel = (a) => blankSelect(PL, a);
    questions.push(
      tableQ({
        id: 'B14-007',
        topic: T,
        difficulty: 3,
        prompt: `決算整理後の残高は、売上 ${yen(sales)}、受取手数料 ${yen(fee)}、給料 ${yen(salary)}、減価償却費 ${yen(dep)} で、仕入は決算整理前が ${yen(purchases)}(期首商品棚卸高 ${yen(begin)}、期末商品棚卸高 ${yen(end)}、売上原価は仕入勘定で計算)である。勘定式の損益計算書の空欄に、表示する名前と金額を入れなさい。`,
        table: {
          title: '損益計算書',
          layout: 'sides',
          rowLabel: 'number',
          columns: [
            { label: '費用' },
            { label: '金額', say: '費用の金額', align: 'right' },
            { label: '収益' },
            { label: '金額', say: '収益の金額', align: 'right' },
          ],
          rows: [
            [sel('売上原価'), blankNum(cogs.value), sel('売上高'), blankNum(sales)],
            ['給料', salary, '受取手数料', fee],
            ['減価償却費', dep, null, null],
            [sel('当期純利益'), blankNum(ni.value), null, null],
            ['合計', blankNum(rev.value), '合計', blankNum(rev.value)],
          ],
        },
        checks: [
          { label: '借方(費用 + 当期純利益)の合計', op: 'add', args: [[0, 1], [1, 1], [2, 1], [3, 1]], result: [4, 1] },
          { label: '貸方(収益)の合計', op: 'add', args: [[0, 3], [1, 3]], result: [4, 3] },
          { label: '左右の合計が一致', op: 'add', args: [[4, 1], 0], result: [4, 3] },
        ],
        calc: [c1, cogs, rev, exp, ni],
        explanation: `損益計算書では、売上原価を計算した仕入は **売上原価**(${yen(cogs.value)})、売上は **売上高** と表示する。収益 ${yen(rev.value)} − 費用 ${yen(exp.value)} = **当期純利益** ${yen(ni.value)} を費用の側に書くと、左右の合計が一致する。`,
        mistakes: [
          { cell: [0, 0], value: '仕入', why: '損益計算書では、売上原価を計算した仕入は「売上原価」と表示する。' },
          { cell: [0, 2], value: '売上', why: '損益計算書では、売上は「売上高」と表示する。' },
          { cell: [0, 1], value: purchases, why: '決算整理前の仕入のまま。期首の在庫を足し、期末の在庫を引いた売上原価を書く。' },
          { cell: [3, 0], value: '繰越利益剰余金', why: '損益計算書では、差額は「当期純利益」と書く。繰越利益剰余金は貸借対照表の純資産。' },
        ],
        ref: { topic: T, anchor: 'statements' },
      }),
    );
  }

  // 8. 貸借対照表(勘定式)(表・名前も選ぶ)
  {
    const cash = 180000;
    const ar = 400000;
    const allowance = 8000;
    const stock = 85000;
    const prepaid = 12000;
    const equip = 300000;
    const acc = 135000;
    const ap = 240000;
    const accrued = 3000;
    const capital = 400000;
    const reBefore = 79000;
    const ni = 112000;
    const arNet = step('売掛金 − 貸倒引当金', 'sub', [ar, allowance]);
    const equipNet = step('備品 − 減価償却累計額', 'sub', [equip, acc]);
    const re = step('繰越利益剰余金(振替前 + 当期純利益)', 'add', [reBefore, ni]);
    const assets = step('資産の合計', 'add', [cash, arNet.value, stock, prepaid, equipNet.value]);
    const right = step('負債・純資産の合計', 'add', [ap, accrued, capital, re.value]);
    const BS = ['繰越商品', '商品', '前払費用', '前受収益', '未払費用', '未収収益'];
    const sel = (a) => blankSelect(BS, a);
    questions.push(
      tableQ({
        id: 'B14-008',
        topic: T,
        difficulty: 3,
        prompt: `決算整理後の残高は、現金 ${yen(cash)}、売掛金 ${yen(ar)}、貸倒引当金 ${yen(allowance)}、繰越商品 ${yen(stock)}、前払保険料 ${yen(prepaid)}、備品 ${yen(equip)}、備品減価償却累計額 ${yen(acc)}、買掛金 ${yen(ap)}、未払利息 ${yen(accrued)}、資本金 ${yen(capital)}、繰越利益剰余金 ${yen(reBefore)}(当期純利益の振替前)で、当期純利益は ${yen(ni)} である。勘定式の貸借対照表の空欄に、表示する名前と金額を入れなさい。`,
        table: {
          title: '貸借対照表',
          layout: 'sides',
          rowLabel: 'number',
          columns: [
            { label: '資産' },
            { label: '金額', say: '資産の金額', align: 'right' },
            { label: '負債・純資産' },
            { label: '金額', say: '負債・純資産の金額', align: 'right' },
          ],
          rows: [
            ['現金', cash, '買掛金', ap],
            ['売掛金(貸倒引当金を差し引いた額)', blankNum(arNet.value), sel('未払費用'), accrued],
            [sel('商品'), stock, '資本金', capital],
            [sel('前払費用'), prepaid, '繰越利益剰余金', blankNum(re.value)],
            ['備品(減価償却累計額を差し引いた額)', blankNum(equipNet.value), null, null],
            ['合計', blankNum(assets.value), '合計', blankNum(right.value)],
          ],
        },
        checks: [
          { label: '資産の合計', op: 'add', args: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], result: [5, 1] },
          { label: '負債・純資産の合計', op: 'add', args: [[0, 3], [1, 3], [2, 3], [3, 3]], result: [5, 3] },
          { label: '左右の合計が一致', op: 'add', args: [[5, 1], 0], result: [5, 3] },
        ],
        calc: [arNet, equipNet, re, assets, right],
        explanation: `繰越商品は **商品**、前払保険料は **前払費用**、未払利息は **未払費用** と表示する。貸倒引当金と減価償却累計額は資産から差し引く。繰越利益剰余金は当期純利益を足した ${yen(re.value)}。資産と負債・純資産の合計はどちらも ${yen(assets.value)}。`,
        mistakes: [
          { cell: [2, 0], value: '繰越商品', why: '貸借対照表では、繰越商品は「商品」と表示する。' },
          { cell: [3, 3], value: reBefore, why: '貸借対照表の繰越利益剰余金は、当期純利益を振り替えたあとの金額。' },
          { cell: [1, 2], value: '未収収益', why: '未払利息は、まだ払っていない費用なので未払費用(負債)。未収収益は資産。' },
          { cell: [1, 1], value: ar, why: '貸倒引当金は売掛金から差し引いて表示する。' },
        ],
        ref: { topic: T, anchor: 'names' },
      }),
    );
  }

  // 9. 英米式の締切(複数選択)
  questions.push(
    multiQ({
      id: 'B14-009',
      topic: T,
      difficulty: 2,
      prompt: '英米式の帳簿の締切について、正しいものをすべて選びなさい。',
      options: [
        '収益・費用の勘定は、損益勘定に振り替えて残高をゼロにしてから締め切る',
        '資産・負債・純資産の次期繰越と前期繰越は、仕訳帳に仕訳してから勘定に書く',
        '資産の勘定は、残高を貸方に「次期繰越」と書いて貸借を一致させ、締め切る',
        '資産の勘定は、翌期の最初の日に、借方に「前期繰越」と書く',
        '損益勘定の残高は、次期繰越として次の期に繰り越す',
      ],
      answer: [0, 2, 3],
      explanation:
        '英米式では、収益・費用は損益勘定へ振り替えて締め切る。資産・負債・純資産は、**仕訳をせずに** 勘定に直接「次期繰越」「前期繰越」を書く。損益勘定の残高は繰越利益剰余金に振り替えるので、次期には繰り越さない。',
      mistakes: [
        { options: [0, 1, 2, 3], why: '英米式では、次期繰越・前期繰越の記入に仕訳はしない。勘定に直接書く。' },
        { options: [0, 2, 3, 4], why: '損益勘定の残高(当期純利益)は繰越利益剰余金に振り替える。次期には繰り越さない。' },
        { options: [0, 2], why: '翌期首には、前期繰越を残高の側(資産なら借方)に書く(開始記入)。' },
      ],
      ref: { topic: T, anchor: 'closing' },
    }),
  );

  // 10. 貸借対照表の繰越利益剰余金(数値)
  {
    const before = 150000;
    const ni = 64000;
    const after = step('貸借対照表の繰越利益剰余金(振替前 + 当期純利益)', 'add', [before, ni]);
    questions.push(
      numericQ({
        id: 'B14-010',
        topic: T,
        difficulty: 1,
        prompt: `決算整理後残高試算表の繰越利益剰余金は ${yen(before)} で、当期純利益は ${yen(ni)} だった。貸借対照表に表示する繰越利益剰余金はいくらか。`,
        answer: after.value,
        calc: [after],
        explanation: '当期純利益は「損益 / 繰越利益剰余金」で繰越利益剰余金に振り替わるので、貸借対照表には足したあとの金額を書く。',
        mistakes: [
          { value: before, why: '試算表の金額は、当期純利益を振り替える前。貸借対照表には当期純利益を足した金額を書く。' },
          { value: ni, why: 'これは当期純利益だけ。前期までに積み上がった繰越利益剰余金に足す。' },
        ],
        ref: { topic: T, anchor: 'names' },
      }),
    );
  }

  return { topic: T, questions };
}
