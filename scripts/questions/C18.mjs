// C18 税効果会計 の問題(12問)
// 仕訳8問・数値2問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 2級は引当金・減価償却・その他有価証券の一時差異だけ。繰延税金資産の回収可能性の検討は扱わない。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C18';
const RATE = 30;
const RATE_NOTE = `法人税等の実効税率は${RATE}%とする。`;

/** 差異 × 税率 */
function taxEffect(diff, label = '税効果(一時差異 × 30)') {
  const t = step(label, 'mul', [diff, RATE]);
  const v = step('税効果(÷ 100)', 'div', [t.value, 100]);
  return [t, v];
}

export default function build() {
  const questions = [];

  // 1. 貸倒引当金の損金不算入
  {
    const diff = 60000;
    const [t, eff] = taxEffect(diff);
    questions.push(
      journalQ({
        id: 'C18-001',
        topic: T,
        difficulty: 2,
        prompt: `決算で貸倒引当金を繰り入れたが、このうち ${yen(diff)} は税法上、損金不算入となった。税効果会計を適用する。${RATE_NOTE}`,
        choices: ['繰延税金資産', '法人税等調整額', '繰延税金負債', '貸倒引当金', '未払法人税等', '法人税、住民税及び事業税'],
        debit: [line('繰延税金資産', eff.value)],
        credit: [line('法人税等調整額', eff.value)],
        calc: [t, eff],
        explanation: `損金不算入の ${yen(diff)} は、将来税法でも費用になったときに税金を減らすので、${yen(diff)} × ${RATE}% = ${yen(eff.value)} を **繰延税金資産** にする。相手は **法人税等調整額**(法人税等を減らす)。`,
        mistakes: [
          {
            entry: { debit: [line('法人税等調整額', eff.value)], credit: [line('繰延税金負債', eff.value)] },
            why: '損金不算入の差異は、将来の税金を減らすので資産(繰延税金資産)。',
          },
          {
            entry: { debit: [line('繰延税金資産', diff)], credit: [line('法人税等調整額', diff)] },
            why: `税効果の額は差異 ${yen(diff)} に税率をかけた ${yen(eff.value)}。`,
          },
        ],
        ref: { topic: T, anchor: 'allowance' },
      }),
    );
  }

  // 2. 差異の解消
  {
    const diff = 60000;
    const [t, eff] = taxEffect(diff);
    questions.push(
      journalQ({
        id: 'C18-002',
        topic: T,
        difficulty: 2,
        prompt: `前期に損金不算入となった貸倒引当金の繰入額 ${yen(diff)} について、当期に貸倒れが起き、税法上も損金に算入された(一時差異の解消)。前期に税効果会計を適用している。${RATE_NOTE}`,
        choices: ['法人税等調整額', '繰延税金資産', '繰延税金負債', '貸倒損失', '法人税、住民税及び事業税', '未払法人税等'],
        debit: [line('法人税等調整額', eff.value)],
        credit: [line('繰延税金資産', eff.value)],
        calc: [t, eff],
        explanation: `差異がなくなったので、前期に計上した繰延税金資産 ${yen(eff.value)} を、**逆の仕訳** で取り崩す。`,
        mistakes: [
          {
            entry: { debit: [line('繰延税金資産', eff.value)], credit: [line('法人税等調整額', eff.value)] },
            why: 'これは差異が発生したときの仕訳。解消したら逆の仕訳で取り崩す。',
          },
        ],
        ref: { topic: T, anchor: 'allowance' },
      }),
    );
  }

  // 3. 減価償却の限度超過
  {
    const cost = 900000;
    const bookLife = 3;
    const taxLife = 5;
    const bookDep = step('会計の減価償却費(取得原価 ÷ 3年)', 'div', [cost, bookLife]);
    const taxDep = step('税法の限度額(取得原価 ÷ 5年)', 'div', [cost, taxLife]);
    const diff = step('限度超過額(会計 − 税法)', 'sub', [bookDep.value, taxDep.value]);
    const [t, eff] = taxEffect(diff.value);
    questions.push(
      journalQ({
        id: 'C18-003',
        topic: T,
        difficulty: 3,
        prompt: `当期首に取得した備品(取得原価 ${yen(cost)})を、会計上は耐用年数${bookLife}年で減価償却した(定額法・残存価額ゼロ)。税法上の耐用年数は${taxLife}年で、限度を超える分は損金不算入となる。税効果会計を適用する。${RATE_NOTE}`,
        choices: ['繰延税金資産', '法人税等調整額', '繰延税金負債', '減価償却費', '備品減価償却累計額', '法人税、住民税及び事業税'],
        debit: [line('繰延税金資産', eff.value)],
        credit: [line('法人税等調整額', eff.value)],
        calc: [bookDep, taxDep, diff, t, eff],
        explanation: `会計の減価償却費 ${yen(bookDep.value)} のうち、税法の限度 ${yen(taxDep.value)} を超える ${yen(diff.value)} が損金不算入。× ${RATE}% = ${yen(eff.value)} を繰延税金資産にする。`,
        mistakes: [
          {
            entry: { debit: [line('繰延税金資産', diff.value)], credit: [line('法人税等調整額', diff.value)] },
            why: `限度超過額 ${yen(diff.value)} に税率をかける。`,
          },
        ],
        ref: { topic: T, anchor: 'depreciation' },
      }),
    );
  }

  // 4. 減価償却の差異の累計(数値)
  {
    const cost = 1200000;
    const bookLife = 4;
    const taxLife = 6;
    const bookDep = step('会計の1年分(取得原価 ÷ 4年)', 'div', [cost, bookLife]);
    const taxDep = step('税法の1年分(取得原価 ÷ 6年)', 'div', [cost, taxLife]);
    const yearDiff = step('1年分の差異(会計 − 税法)', 'sub', [bookDep.value, taxDep.value]);
    const twoYears = step('2年分の差異の累計', 'mul', [yearDiff.value, 2]);
    const [t, dta] = taxEffect(twoYears.value, '繰延税金資産の残高(差異の累計 × 30)');
    const [wt, wrong] = taxEffect(yearDiff.value, '誤答: 1年分の差異 × 30');
    questions.push(
      numericQ({
        id: 'C18-004',
        topic: T,
        difficulty: 3,
        prompt: `前期首に取得した備品(取得原価 ${yen(cost)})を、会計上は耐用年数${bookLife}年、税法上は${taxLife}年で償却している(定額法・残存価額ゼロ)。限度超過額は損金不算入で、前期・当期とも税効果会計を適用している。当期末の、この備品に関する繰延税金資産の残高はいくらか。${RATE_NOTE}`,
        answer: dta.value,
        calc: [bookDep, taxDep, yearDiff, twoYears, t, dta],
        explanation: `1年分の差異は ${yen(yearDiff.value)}。前期と当期の2年分で ${yen(twoYears.value)} がたまっているので、× ${RATE}% = ${yen(dta.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wt, wrong], why: '前期の差異も解消していないので残っている。2年分の累計に税率をかける。' }],
        ref: { topic: T, anchor: 'depreciation' },
      }),
    );
  }

  // 5. 引当金の差異が増えた(差額で計上)
  {
    const begin = 100000;
    const end = 150000;
    const inc = step('差異の増加(期末 − 期首)', 'sub', [end, begin]);
    const [t, eff] = taxEffect(inc.value);
    const [wt, wrongEff] = taxEffect(end, '誤答: 期末の差異 × 30');
    questions.push(
      journalQ({
        id: 'C18-005',
        topic: T,
        difficulty: 3,
        prompt: `賞与引当金のうち損金不算入となっている額(一時差異)は、期首が ${yen(begin)}、期末が ${yen(end)} である。期首の差異に対する繰延税金資産は計上済みで、決算で差異の増加分について税効果会計を適用する。${RATE_NOTE}`,
        choices: ['繰延税金資産', '法人税等調整額', '繰延税金負債', '賞与引当金', '未払法人税等', '法人税、住民税及び事業税'],
        debit: [line('繰延税金資産', eff.value)],
        credit: [line('法人税等調整額', eff.value)],
        calc: [inc, t, eff],
        explanation: `期首の分は計上済みなので、増えた ${yen(inc.value)} の分だけ。× ${RATE}% = ${yen(eff.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('繰延税金資産', wrongEff.value)], credit: [line('法人税等調整額', wrongEff.value)] },
            why: `期首の差異の分 ${yen(begin)} は計上済み。増えた分だけ仕訳する。`,
            calc: [wt, wrongEff],
          },
        ],
        ref: { topic: T, anchor: 'summary-table' },
      }),
    );
  }

  // 6. その他有価証券(評価差益)
  {
    const cost = 500000;
    const fair = 580000;
    const diff = step('評価差額(時価 − 取得原価)', 'sub', [fair, cost]);
    const [t, dtl] = taxEffect(diff.value);
    const net = step('その他有価証券評価差額金(評価差額 − 税効果)', 'sub', [diff.value, dtl.value]);
    questions.push(
      journalQ({
        id: 'C18-006',
        topic: T,
        difficulty: 2,
        prompt: `決算で、その他有価証券(取得原価 ${yen(cost)})を時価 ${yen(fair)} に評価替えする。全部純資産直入法により処理し、税効果会計を適用する。${RATE_NOTE}`,
        choices: ['その他有価証券', '繰延税金負債', 'その他有価証券評価差額金', '法人税等調整額', '繰延税金資産', '有価証券評価益'],
        debit: [line('その他有価証券', diff.value)],
        credit: [line('繰延税金負債', dtl.value), line('その他有価証券評価差額金', net.value)],
        calc: [diff, t, dtl, net],
        explanation: `評価差益 ${yen(diff.value)} は、売れば税金がかかるので、${RATE}% の ${yen(dtl.value)} を **繰延税金負債** にする。残り ${yen(net.value)} が **その他有価証券評価差額金**。法人税等調整額は使わない。`,
        mistakes: [
          {
            entry: { debit: [line('その他有価証券', diff.value), line('法人税等調整額', dtl.value)], credit: [line('繰延税金負債', dtl.value), line('その他有価証券評価差額金', diff.value)] },
            why: 'その他有価証券の税効果は、損益計算書を通さない。法人税等調整額を使わず、評価差額金から直接差し引く。',
          },
          {
            entry: { debit: [line('その他有価証券', diff.value)], credit: [line('その他有価証券評価差額金', diff.value)] },
            why: '税効果会計を適用するので、評価差額のうち税率分を繰延税金負債にする。',
          },
        ],
        ref: { topic: T, anchor: 'afs' },
      }),
    );
  }

  // 7. その他有価証券(評価差損)
  {
    const cost = 700000;
    const fair = 640000;
    const diff = step('評価差額(取得原価 − 時価)', 'sub', [cost, fair]);
    const [t, dta] = taxEffect(diff.value);
    const net = step('その他有価証券評価差額金(評価差額 − 税効果)', 'sub', [diff.value, dta.value]);
    questions.push(
      journalQ({
        id: 'C18-007',
        topic: T,
        difficulty: 3,
        prompt: `決算で、その他有価証券(取得原価 ${yen(cost)})を時価 ${yen(fair)} に評価替えする。全部純資産直入法により処理し、税効果会計を適用する。${RATE_NOTE}`,
        choices: ['繰延税金資産', 'その他有価証券評価差額金', 'その他有価証券', '繰延税金負債', '法人税等調整額', '有価証券評価損'],
        debit: [line('繰延税金資産', dta.value), line('その他有価証券評価差額金', net.value)],
        credit: [line('その他有価証券', diff.value)],
        calc: [diff, t, dta, net],
        explanation: `評価差損 ${yen(diff.value)} のうち、${RATE}% の ${yen(dta.value)} は **繰延税金資産**、残り ${yen(net.value)} は **その他有価証券評価差額金**(借方)。`,
        mistakes: [
          {
            entry: { debit: [line('繰延税金負債', dta.value), line('その他有価証券評価差額金', net.value)], credit: [line('その他有価証券', diff.value)] },
            why: '評価差損のときは、将来の税金を減らすので繰延税金資産。繰延税金負債は評価差益のとき。',
          },
        ],
        ref: { topic: T, anchor: 'afs' },
      }),
    );
  }

  // 8. その他有価証券(翌期首の戻し)
  {
    const cost = 500000;
    const fair = 580000;
    const diff = step('前期末の評価差額(時価 − 取得原価)', 'sub', [fair, cost]);
    const [t, dtl] = taxEffect(diff.value);
    const net = step('その他有価証券評価差額金(評価差額 − 税効果)', 'sub', [diff.value, dtl.value]);
    questions.push(
      journalQ({
        id: 'C18-008',
        topic: T,
        difficulty: 3,
        prompt: `前期末に、その他有価証券(取得原価 ${yen(cost)})を時価 ${yen(fair)} に評価替えし、税効果会計を適用した(全部純資産直入法)。当期首に、この評価替えを元に戻す。${RATE_NOTE}`,
        choices: ['繰延税金負債', 'その他有価証券評価差額金', 'その他有価証券', '法人税等調整額', '繰延税金資産', '有価証券評価益'],
        debit: [line('繰延税金負債', dtl.value), line('その他有価証券評価差額金', net.value)],
        credit: [line('その他有価証券', diff.value)],
        calc: [diff, t, dtl, net],
        explanation: `前期末の仕訳「その他有価証券 ${yen(diff.value)} / 繰延税金負債 ${yen(dtl.value)}・その他有価証券評価差額金 ${yen(net.value)}」の **逆の仕訳** をする。`,
        mistakes: [
          {
            entry: { debit: [line('その他有価証券評価差額金', diff.value)], credit: [line('その他有価証券', diff.value)] },
            why: '前期末に繰延税金負債も計上しているので、それも一緒に戻す。',
          },
        ],
        ref: { topic: T, anchor: 'afs' },
      }),
    );
  }

  // 9. 法人税等調整額の意味(選択)
  questions.push(
    choiceQ({
      id: 'C18-009',
      topic: T,
      difficulty: 1,
      prompt: '貸倒引当金の損金不算入について税効果会計を適用したとき、損益計算書で法人税等を調整する科目はどれか。',
      options: ['法人税等調整額', 'その他有価証券評価差額金', '未払法人税等', '追徴法人税等'],
      answer: 0,
      explanation: '引当金・減価償却の一時差異の税効果は、**法人税等調整額** で損益計算書の法人税等を調整する。',
      mistakes: [
        { option: 1, why: 'その他有価証券評価差額金を使うのは、その他有価証券の税効果。' },
        { option: 2, why: '未払法人税等は、まだ払っていない法人税等の負債。税効果の調整には使わない。' },
        { option: 3, why: '追徴法人税等は、前の年度の法人税等を追加で払うときの科目。' },
      ],
      ref: { topic: T, anchor: 'summary-table' },
    }),
  );

  // 10. 当期純利益(数値)
  {
    const pretax = 2000000;
    const tax = 642000;
    const adj = 42000;
    const total = step('法人税等合計(法人税等 − 法人税等調整額(貸方))', 'sub', [tax, adj]);
    const ni = step('当期純利益(税引前当期純利益 − 法人税等合計)', 'sub', [pretax, total.value]);
    const wTotal = step('誤答: 法人税等調整額を足した法人税等', 'add', [tax, adj]);
    const wrong = step('誤答: 法人税等調整額を足したときの当期純利益', 'sub', [pretax, wTotal.value]);
    questions.push(
      numericQ({
        id: 'C18-010',
        topic: T,
        difficulty: 2,
        prompt: `税引前当期純利益は ${yen(pretax)}、法人税、住民税及び事業税は ${yen(tax)} である。税効果会計で、法人税等調整額 ${yen(adj)} を貸方に計上した。当期純利益はいくらか。`,
        answer: ni.value,
        calc: [total, ni],
        explanation: `法人税等調整額が貸方なので、法人税等を減らす。法人税等合計は ${yen(total.value)}、当期純利益は ${yen(pretax)} − ${yen(total.value)} = ${yen(ni.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wTotal, wrong], why: '貸方の法人税等調整額は、法人税等を減らす(当期純利益を増やす)。' }],
        ref: { topic: T, anchor: 'pl' },
      }),
    );
  }

  // 11. その他有価証券で法人税等調整額を使うか(選択)
  questions.push(
    choiceQ({
      id: 'C18-011',
      topic: T,
      difficulty: 2,
      prompt: 'その他有価証券の評価差額(全部純資産直入法)に税効果会計を適用するとき、正しいものはどれか。',
      options: [
        '税効果の額は、法人税等調整額で処理する',
        '税効果の額は、その他有価証券評価差額金から直接差し引く',
        '評価差益の税効果は、繰延税金資産にする',
        '税効果会計は適用しない',
      ],
      answer: 1,
      explanation: 'その他有価証券の評価差額は損益計算書を通らないので、税効果も法人税等調整額を使わず、**その他有価証券評価差額金から直接** 差し引く。評価差益なら繰延税金負債。',
      mistakes: [
        { option: 0, why: '評価差額が損益計算書を通らないので、法人税等調整額は使わない。' },
        { option: 2, why: '評価差益は、売れば税金がかかるので繰延税金負債。' },
        { option: 3, why: 'その他有価証券は、2級の税効果会計の対象。' },
      ],
      ref: { topic: T, anchor: 'afs' },
    }),
  );

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C18-012',
      topic: T,
      difficulty: 2,
      prompt: '税効果会計について、正しいものをすべて選びなさい。',
      options: [
        '税効果の額は、一時差異に税率をかけて計算する',
        '引当金の繰入額の損金不算入は、繰延税金負債を計上する',
        '一時差異が解消したら、発生したときの逆の仕訳をする',
        'その他有価証券の税効果は、法人税等調整額で処理する',
        '法人税等調整額が貸方のときは、損益計算書の法人税等を減らす',
      ],
      answer: [0, 2, 4],
      explanation: '引当金・減価償却の損金不算入は、将来の税金を減らすので繰延税金資産。その他有価証券の税効果は、評価差額金から直接差し引く。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '引当金の損金不算入は、将来の税金を減らすので繰延税金資産。' },
        { options: [0, 2, 3, 4], why: 'その他有価証券の税効果は、法人税等調整額を使わず、評価差額金から直接差し引く。' },
        { options: [0, 4], why: '差異が解消したら、逆の仕訳で取り崩す。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'summary-table' },
    }),
  );

  return { topic: T, questions };
}
