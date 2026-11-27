// C03 引当金 の問題(12問)
// 仕訳8問・数値2問・表1問(場面と科目)・複数選択1問。金額はすべて step() で計算する。
// 決めたこと: 修繕と改良を組み合わせた問題を出す。賞与支給時の預り金は入れない。
// 退職給付引当金は繰入額を問題文で与える簡単な形(退職給付債務の計算は1級)。

import { blankSelect, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C03';
const PERIOD = '会計期間は4月1日から3月31日までの1年である。';

export default function build() {
  const questions = [];

  // 1. 商品保証引当金の繰入
  {
    const sales = 4500000;
    const pct = 2;
    const x = step(`売上高 × ${pct}`, 'mul', [sales, pct]);
    const amt = step('商品保証引当金(÷ 100)', 'div', [x.value, 100]);
    questions.push(
      journalQ({
        id: 'C03-001',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、当期の売上高 ${yen(sales)} の${pct}%を、商品の無料修理に備えて商品保証引当金として設定する。商品保証引当金の残高はない。`,
        choices: ['商品保証引当金繰入', '商品保証引当金', '商品保証費', '商品保証引当金戻入', '売上', '修繕費'],
        debit: [line('商品保証引当金繰入', amt.value)],
        credit: [line('商品保証引当金', amt.value)],
        calc: [x, amt],
        explanation: `当期に売った商品の、将来の無料修理に備える。売上高の${pct}% = ${yen(amt.value)} を費用(商品保証引当金繰入)と負債(**商品保証引当金**)にする。`,
        mistakes: [
          {
            entry: { debit: [line('商品保証費', amt.value)], credit: [line('商品保証引当金', amt.value)] },
            why: '決算で設定するときの費用は商品保証引当金繰入。商品保証費は、引当金で足りずに実際に払った修理代。',
          },
          {
            entry: { debit: [line('商品保証引当金繰入', sales)], credit: [line('商品保証引当金', sales)] },
            why: `売上高の全額ではなく、${pct}% の分だけ設定する。`,
          },
        ],
        ref: { topic: T, anchor: 'warranty' },
      }),
    );
  }

  // 2. 保証修理(引当金で足りる)
  {
    const cost = 18000;
    const bal = 30000;
    questions.push(
      journalQ({
        id: 'C03-002',
        topic: T,
        difficulty: 1,
        prompt: `前期に販売した商品について、保証期間内の無料修理を行い、修理代 ${yen(cost)} を現金で支払った。商品保証引当金の残高は ${yen(bal)} ある。`,
        choices: ['商品保証引当金', '商品保証費', '商品保証引当金繰入', '修繕費', '現金', '売上'],
        debit: [line('商品保証引当金', cost)],
        credit: [line('現金', cost)],
        explanation: `前期の売上に備えて設定した **商品保証引当金** を取り崩す。残高 ${yen(bal)} で足りるので、費用は出ない。`,
        mistakes: [
          {
            entry: { debit: [line('商品保証費', cost)], credit: [line('現金', cost)] },
            why: '前期に販売した商品の修理なので、そのために設定した商品保証引当金を取り崩す。費用にすると二重になる。',
          },
          {
            entry: { debit: [line('修繕費', cost)], credit: [line('現金', cost)] },
            why: '売った商品の保証による修理は、商品保証引当金で処理する。自社の建物などの修繕費とは別。',
          },
        ],
        ref: { topic: T, anchor: 'warranty' },
      }),
    );
  }

  // 3. 保証期間が終わって戻入
  {
    const left = 7000;
    questions.push(
      journalQ({
        id: 'C03-003',
        topic: T,
        difficulty: 2,
        prompt: `前期に販売した商品の保証期間が終わり、これに対して設定していた商品保証引当金が ${yen(left)} 残った。`,
        choices: ['商品保証引当金', '商品保証引当金戻入', '商品保証引当金繰入', '商品保証費', '雑益', '現金'],
        debit: [line('商品保証引当金', left)],
        credit: [line('商品保証引当金戻入', left)],
        explanation: `もう修理をすることがないので、残った引当金 ${yen(left)} を取り崩し、**商品保証引当金戻入**(収益)にする。`,
        mistakes: [
          {
            entry: { debit: [line('商品保証引当金繰入', left)], credit: [line('商品保証引当金', left)] },
            why: '残った引当金は減らす(取り崩す)。繰入は引当金を増やす仕訳なので逆。',
          },
          {
            entry: { debit: [line('商品保証引当金', left)], credit: [line('雑益', left)] },
            why: '引当金が余ったときの収益は、専用の科目の商品保証引当金戻入を使う。',
          },
        ],
        ref: { topic: T, anchor: 'warranty' },
      }),
    );
  }

  // 4. 修繕引当金の繰入
  {
    const amt = 250000;
    questions.push(
      journalQ({
        id: 'C03-004',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、次期に行う建物の定期的な修繕に備えて、修繕引当金 ${yen(amt)} を設定する。`,
        choices: ['修繕引当金繰入', '修繕引当金', '修繕費', '建物', '未払金', '減価償却費'],
        debit: [line('修繕引当金繰入', amt)],
        credit: [line('修繕引当金', amt)],
        explanation: '次期の修繕のうち、当期までに使った分に原因がある金額を、費用(**修繕引当金繰入**)と負債(**修繕引当金**)にする。',
        mistakes: [
          {
            entry: { debit: [line('修繕費', amt)], credit: [line('修繕引当金', amt)] },
            why: '決算で引当金を設定するときの費用は修繕引当金繰入。修繕費は、実際に修繕して引当金で足りなかった分。',
          },
          {
            entry: { debit: [line('修繕引当金繰入', amt)], credit: [line('未払金', amt)] },
            why: 'まだ修繕していないので、払う義務(未払金)はない。将来の支出に備える修繕引当金にする。',
          },
        ],
        ref: { topic: T, anchor: 'repair' },
      }),
    );
  }

  // 5. 修繕と改良(引当金が足りない)
  {
    const total = 900000;
    const improve = 400000;
    const bal = 420000;
    const repair = step('修繕の分(支払額 − 改良)', 'sub', [total, improve]);
    const short = step('修繕費(修繕の分 − 引当金)', 'sub', [repair.value, bal]);
    questions.push(
      journalQ({
        id: 'C03-005',
        topic: T,
        difficulty: 3,
        prompt: `建物の修繕と改良を行い、代金 ${yen(total)} を当座預金口座から支払った。このうち ${yen(improve)} は建物の価値を高める改良(資本的支出)である。修繕引当金の残高は ${yen(bal)} ある。`,
        choices: ['修繕引当金', '修繕費', '建物', '当座預金', '修繕引当金繰入', '減価償却費'],
        debit: [line('修繕引当金', bal), line('修繕費', short.value), line('建物', improve)],
        credit: [line('当座預金', total)],
        calc: [repair, short],
        explanation: `改良の ${yen(improve)} は **建物** に加える。修繕の分 ${yen(repair.value)} は、まず修繕引当金 ${yen(bal)} を全部使い、足りない ${yen(short.value)} を **修繕費** にする。`,
        mistakes: [
          {
            entry: { debit: [line('修繕引当金', repair.value), line('建物', improve)], credit: [line('当座預金', total)] },
            why: `修繕引当金は ${yen(bal)} しかない。足りない分は修繕費にする。`,
          },
          {
            entry: { debit: [line('修繕引当金', bal), line('修繕費', step('誤答: 改良も修繕費にした', 'sub', [total, bal]).value)], credit: [line('当座預金', total)] },
            why: `改良の ${yen(improve)} は建物の価値を高めるので、費用ではなく建物(資産)に加える。`,
          },
        ],
        ref: { topic: T, anchor: 'repair' },
      }),
    );
  }

  // 6. 賞与引当金の繰入額(数値)
  {
    const bonus = 900000;
    const x = step('支給見込額 × 当期の月数(12月〜3月の4か月)', 'mul', [bonus, 4]);
    const amt = step('賞与引当金(÷ 支給対象期間の6か月)', 'div', [x.value, 6]);
    const x3 = step('誤答: × 3か月', 'mul', [bonus, 3]);
    const wrong3 = step('誤答: 3か月で計算', 'div', [x3.value, 6]);
    questions.push(
      numericQ({
        id: 'C03-006',
        topic: T,
        difficulty: 2,
        prompt: `${PERIOD}6月に支給する賞与の見込額は ${yen(bonus)} で、12月1日から5月31日までの6か月の勤務に対するものである。決算で設定する賞与引当金はいくらか。`,
        answer: amt.value,
        calc: [x, amt],
        explanation: '支給対象期間6か月のうち、決算日(3月31日)までの12月〜3月の **4か月** が当期の分。見込額 × 4/6。',
        mistakes: [
          { value: bonus, why: '全額ではない。4月・5月の分は次の期の勤務に対するもの。' },
          { value: wrong3.value, calc: [x3, wrong3], why: '12月・1月・2月・3月の4か月。12月も入れて数える。' },
        ],
        ref: { topic: T, anchor: 'bonus' },
      }),
    );
  }

  // 7. 賞与の支給
  {
    const bonus = 900000;
    const x = step('支給額 × 4', 'mul', [bonus, 4]);
    const allow = step('前期末の賞与引当金(4/6)', 'div', [x.value, 6]);
    const cur = step('当期の分の賞与(支給額 − 引当金)', 'sub', [bonus, allow.value]);
    questions.push(
      journalQ({
        id: 'C03-007',
        topic: T,
        difficulty: 2,
        prompt: `6月に賞与 ${yen(bonus)} を普通預金口座から支給した。前期末に、このうち ${yen(allow.value)} を賞与引当金として設定している。`,
        choices: ['賞与引当金', '賞与', '賞与引当金繰入', '普通預金', '未払賞与', '給料'],
        debit: [line('賞与引当金', allow.value), line('賞与', cur.value)],
        credit: [line('普通預金', bonus)],
        calc: [x, allow, cur],
        explanation: `前期の勤務の分 ${yen(allow.value)} は **賞与引当金** を取り崩す。残りの ${yen(cur.value)} は当期(4月・5月)の勤務の分なので **賞与**(費用)。`,
        mistakes: [
          {
            entry: { debit: [line('賞与', bonus)], credit: [line('普通預金', bonus)] },
            why: '前期末に設定した賞与引当金を取り崩す。全額を賞与にすると、前期の分が二重に費用になる。',
          },
          {
            entry: { debit: [line('賞与引当金', bonus)], credit: [line('普通預金', bonus)] },
            why: `賞与引当金は ${yen(allow.value)} しかない。当期の勤務の分は賞与(費用)。`,
          },
        ],
        ref: { topic: T, anchor: 'bonus' },
      }),
    );
  }

  // 8. 退職給付引当金の繰入
  {
    const amt = 750000;
    questions.push(
      journalQ({
        id: 'C03-008',
        topic: T,
        difficulty: 1,
        prompt: `決算にあたり、退職給付引当金の当期の繰入額は ${yen(amt)} と計算された。`,
        choices: ['退職給付費用', '退職給付引当金', '給料', '未払金', '普通預金', '賞与引当金'],
        debit: [line('退職給付費用', amt)],
        credit: [line('退職給付引当金', amt)],
        explanation: '将来の退職金のうち当期の勤務に対する分を、費用(**退職給付費用**)と負債(**退職給付引当金**)にする。公式表の標準は退職給付費用(退職給付引当金繰入でも正解)。',
        mistakes: [
          {
            entry: { debit: [line('退職給付引当金', amt)], credit: [line('退職給付費用', amt)] },
            why: '貸借が逆。引当金(負債)を増やすので貸方、費用を借方。',
          },
          {
            entry: { debit: [line('退職給付費用', amt)], credit: [line('未払金', amt)] },
            why: '退職金はまだ払う時期が決まっていない将来の支出。未払金ではなく退職給付引当金にする。',
          },
        ],
        ref: { topic: T, anchor: 'retirement' },
      }),
    );
  }

  // 9. 退職金の支払い
  {
    const amt = 1800000;
    questions.push(
      journalQ({
        id: 'C03-009',
        topic: T,
        difficulty: 1,
        prompt: `従業員が退職し、退職金 ${yen(amt)} を普通預金口座から支払った。退職給付引当金の残高は十分にある。`,
        choices: ['退職給付引当金', '退職給付費用', '普通預金', '給料', '未払金', '賞与'],
        debit: [line('退職給付引当金', amt)],
        credit: [line('普通預金', amt)],
        explanation: '退職金は、これまでの決算で積み立ててきた **退職給付引当金** を取り崩して払う。費用は繰入のときに計上済み。',
        mistakes: [
          {
            entry: { debit: [line('退職給付費用', amt)], credit: [line('普通預金', amt)] },
            why: '費用は決算の繰入のときに計上済み。ここでまた費用にすると二重になる。引当金を取り崩す。',
          },
        ],
        ref: { topic: T, anchor: 'retirement' },
      }),
    );
  }

  // 10. 場面と科目(表)
  {
    const K = ['賞与引当金繰入', '賞与', '商品保証引当金', '商品保証引当金戻入', '退職給付引当金', '退職給付費用', '修繕費'];
    const sel = (a) => blankSelect(K, a);
    questions.push(
      tableQ({
        id: 'C03-010',
        topic: T,
        difficulty: 2,
        prompt: '次の場面の仕訳で、かっこの側(借方・貸方)に書く科目を選びなさい。',
        table: {
          title: '引当金の場面と科目',
          columns: [{ label: '場面' }, { label: '科目' }],
          rows: [
            ['決算で、次の賞与のうち当期の分を見積もった(借方)', sel('賞与引当金繰入')],
            ['前期に売った商品を無料で修理した(借方)', sel('商品保証引当金')],
            ['保証期間が終わり、商品保証引当金が残った(貸方)', sel('商品保証引当金戻入')],
            ['従業員が退職し、退職金を払った(借方)', sel('退職給付引当金')],
            ['決算で、退職給付引当金を繰り入れた(借方)', sel('退職給付費用')],
          ],
        },
        explanation:
          '決算で設定するときは「○○引当金繰入」(退職給付は退職給付費用)。実際に使ったときは「○○引当金」を取り崩す。残ったら「○○引当金戻入」。',
        mistakes: [
          { cell: [1, 1], value: '修繕費', why: '売った商品の保証修理は、商品保証引当金を取り崩す。' },
          { cell: [3, 1], value: '退職給付費用', why: '退職給付費用は決算の繰入のとき。退職金を払ったら退職給付引当金を取り崩す。' },
          { cell: [0, 1], value: '賞与', why: 'まだ払っていない。決算で見積もるときは賞与引当金繰入。賞与は支給したときの当期の分。' },
        ],
        ref: { topic: T, anchor: 'overview' },
      }),
    );
  }

  // 11. 修繕費の額(数値)
  {
    const total = 1000000;
    const improve = 350000;
    const bal = 600000;
    const repair = step('修繕の分(支払額 − 改良)', 'sub', [total, improve]);
    const fee = step('修繕費(修繕の分 − 引当金)', 'sub', [repair.value, bal]);
    const noImprove = step('誤答: 改良を分けずに計算', 'sub', [total, bal]);
    questions.push(
      numericQ({
        id: 'C03-011',
        topic: T,
        difficulty: 2,
        prompt: `建物の修繕と改良を行い、${yen(total)} を支払った。このうち ${yen(improve)} は改良(資本的支出)である。修繕引当金の残高は ${yen(bal)} ある。この取引で計上する修繕費はいくらか。`,
        answer: fee.value,
        calc: [repair, fee],
        explanation: `修繕の分は ${yen(repair.value)}。修繕引当金 ${yen(bal)} を使い、足りない分が修繕費。改良の分は建物に加えるので、修繕費には入れない。`,
        mistakes: [
          { value: noImprove.value, calc: [noImprove], why: `改良の ${yen(improve)} は建物に加える。修繕の分だけで計算する。` },
          { value: repair.value, calc: [repair], why: '修繕引当金があるので、まずそれを使う。修繕費は足りない分だけ。' },
        ],
        ref: { topic: T, anchor: 'repair' },
      }),
    );
  }

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C03-012',
      topic: T,
      difficulty: 2,
      prompt: '引当金について、正しいものをすべて選びなさい。',
      options: [
        '賞与引当金は、支給対象期間のうち決算日までの月数の分だけ設定する',
        '修繕と改良をいっしょに行ったときは、改良の分を建物に加える',
        '退職給付引当金を繰り入れるときの費用の科目は、退職給付費用(標準)である',
        '引当金の残高を超えて支出した分も、引当金を取り崩して処理する',
        '保証期間が終わって残った商品保証引当金は、商品保証費にする',
      ],
      answer: [0, 1, 2],
      explanation:
        '引当金は残高までしか取り崩せない。足りない分は費用(修繕費・賞与・商品保証費)。使われずに残った引当金は、戻入(収益)にする。',
      mistakes: [
        { options: [0, 1, 2, 3], why: '引当金の残高より多くは取り崩せない。足りない分は修繕費などの費用にする。' },
        { options: [0, 1, 2, 4], why: '残った商品保証引当金は、取り崩して商品保証引当金戻入(収益)にする。商品保証費は費用。' },
        { options: [0, 2], why: '改良の分は建物の価値を高めるので、建物(資産)に加える。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'overview' },
    }),
  );

  return { topic: T, questions };
}
