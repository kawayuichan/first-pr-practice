// B11 税金 の問題(10問)
// 仕訳8問・数値1問(未払消費税)・表1問(税金と科目)。金額はすべて step() で計算する。
// 決めたこと: 固定資産税は「納付時に租税公課」と「通知書を受け取ったときに未払固定資産税を計上」の両方を扱う。
// 法人税等の追徴・還付、消費税の還付(未収還付消費税)は2級の C17 で扱う。

import { blankSelect, journalQ, line, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B11';
const HOJINZEI = '法人税、住民税及び事業税';

/** 税抜金額 × 10% */
function taxSteps(label, base) {
  const x = step(`${label}: 税抜金額 × 10`, 'mul', [base, 10]);
  const tax = step(`${label}の消費税(÷ 100)`, 'div', [x.value, 100]);
  return [x, tax];
}

export default function build() {
  const questions = [];

  // 1. 固定資産税(納付時に費用)
  {
    const amt = 45000;
    questions.push(
      journalQ({
        id: 'B11-001',
        topic: T,
        difficulty: 1,
        prompt: `固定資産税の第2期分 ${yen(amt)} を、普通預金口座から納付した。固定資産税は、納付したときに費用として処理している。`,
        choices: ['租税公課', HOJINZEI, '仮払法人税等', '未払固定資産税', '普通預金', '支払手数料'],
        debit: [line('租税公課', amt)],
        credit: [line('普通預金', amt)],
        explanation: '固定資産税は、会社の費用になる税金なので **租税公課**。利益にかかる法人税等とは別の科目。',
        mistakes: [
          {
            entry: { debit: [line(HOJINZEI, amt)], credit: [line('普通預金', amt)] },
            why: '「法人税、住民税及び事業税」は、会社の利益(所得)にかかる税金。固定資産税は租税公課。',
          },
          {
            entry: { debit: [line('未払固定資産税', amt)], credit: [line('普通預金', amt)] },
            why: '納付したときに費用にする方法なので、未払固定資産税は計上していない。租税公課にする。',
          },
        ],
        ref: { topic: T, anchor: 'property-tax' },
      }),
    );
  }

  // 2. 固定資産税(通知書を受け取ったときに1年分を計上)
  {
    const amt = 160000;
    questions.push(
      journalQ({
        id: 'B11-002',
        topic: T,
        difficulty: 2,
        prompt: `固定資産税の納税通知書(1年分 ${yen(amt)}、4回に分けて納付)を受け取り、全額を未払固定資産税として計上した。`,
        choices: ['租税公課', '未払固定資産税', '未払法人税等', '普通預金', HOJINZEI, '仮払金'],
        debit: [line('租税公課', amt)],
        credit: [line('未払固定資産税', amt)],
        explanation: `通知書を受け取った時点で、1年分 ${yen(amt)} を **租税公課** にし、まだ納めていないので **未払固定資産税**(未払金でもよい)にする。`,
        mistakes: [
          {
            entry: { debit: [line('租税公課', amt)], credit: [line('普通預金', amt)] },
            why: '通知書を受け取っただけで、まだ納付していない。普通預金は減らさず、未払固定資産税にする。',
          },
          {
            entry: { debit: [line('租税公課', amt)], credit: [line('未払法人税等', amt)] },
            why: '未払法人税等は、法人税・住民税・事業税の未払い。固定資産税の未払いは未払固定資産税。',
          },
        ],
        ref: { topic: T, anchor: 'property-tax' },
      }),
    );
  }

  // 3. 通知書のときに計上した固定資産税の納付
  {
    const total = 160000;
    const first = step('第1期分(1年分 ÷ 4回)', 'div', [total, 4]);
    questions.push(
      journalQ({
        id: 'B11-003',
        topic: T,
        difficulty: 2,
        prompt: `固定資産税の納税通知書を受け取ったときに、1年分 ${yen(total)} を未払固定資産税として計上している。本日、第1期分(4回のうち1回分)を普通預金口座から納付した。`,
        choices: ['租税公課', '未払固定資産税', '普通預金', '仮払金', HOJINZEI, '未払金'],
        debit: [line('未払固定資産税', first.value)],
        credit: [line('普通預金', first.value)],
        calc: [first],
        explanation: `費用(租税公課)は通知書を受け取ったときに計上済み。納付したときは **未払固定資産税を減らす** だけ。1回分は ${yen(first.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('租税公課', first.value)], credit: [line('普通預金', first.value)] },
            why: '租税公課は通知書のときに1年分を計上している。ここでまた書くと費用が二重になる。未払固定資産税を減らす。',
          },
          {
            entry: { debit: [line('未払固定資産税', total)], credit: [line('普通預金', total)] },
            why: `納付したのは第1期分(4回のうち1回分)だけ。1年分 ${yen(total)} を全部払ったわけではない。`,
          },
        ],
        ref: { topic: T, anchor: 'property-tax' },
      }),
    );
  }

  // 4. 法人税等の中間申告
  {
    const prev = 560000;
    const half = step('中間納付額(前期の法人税等 ÷ 2)', 'div', [prev, 2]);
    questions.push(
      journalQ({
        id: 'B11-004',
        topic: T,
        difficulty: 2,
        prompt: `法人税・住民税・事業税の中間申告を行い、前期の法人税等 ${yen(prev)} の2分の1を普通預金口座から納付した。`,
        choices: ['仮払法人税等', HOJINZEI, '未払法人税等', '租税公課', '普通預金', '仮払金'],
        debit: [line('仮払法人税等', half.value)],
        credit: [line('普通預金', half.value)],
        calc: [half],
        explanation: `中間申告で納めた ${yen(half.value)} は、当期の税額がまだ確定していないので **仮払法人税等**(資産)にしておく。決算で1年分が決まったときに精算する。`,
        mistakes: [
          {
            entry: { debit: [line(HOJINZEI, half.value)], credit: [line('普通預金', half.value)] },
            why: '中間納付の時点では、当期の税額はまだ決まっていない。いったん仮払法人税等にし、決算で費用にする。',
          },
          {
            entry: { debit: [line('仮払法人税等', prev)], credit: [line('普通預金', prev)] },
            why: `納めたのは前期の法人税等の2分の1(${yen(half.value)})。`,
          },
        ],
        ref: { topic: T, anchor: 'corporate-tax' },
      }),
    );
  }

  // 5. 決算: 法人税等
  {
    const total = 620000;
    const interim = 280000;
    const unpaid = step('未払法人税等(1年分 − 中間納付)', 'sub', [total, interim]);
    questions.push(
      journalQ({
        id: 'B11-005',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、当期の法人税・住民税・事業税が ${yen(total)} と計算された。中間申告で ${yen(interim)} を納付し、仮払法人税等で処理している。`,
        choices: [HOJINZEI, '仮払法人税等', '未払法人税等', '租税公課', '普通預金', '未払金'],
        debit: [line(HOJINZEI, total)],
        credit: [line('仮払法人税等', interim), line('未払法人税等', unpaid.value)],
        calc: [unpaid],
        explanation: `1年分 ${yen(total)} を **法人税、住民税及び事業税** にする。中間で払った仮払法人税等を消し、残りの ${yen(unpaid.value)} を **未払法人税等** にする。`,
        mistakes: [
          {
            entry: { debit: [line(HOJINZEI, total)], credit: [line('未払法人税等', total)] },
            why: `中間申告で ${yen(interim)} をすでに納めている。仮払法人税等を消し、残りだけを未払法人税等にする。`,
          },
          {
            entry: { debit: [line(HOJINZEI, unpaid.value)], credit: [line('未払法人税等', unpaid.value)] },
            why: `当期の費用は1年分の ${yen(total)}。中間で納めた分も当期の法人税等なので、費用に含める。`,
          },
        ],
        ref: { topic: T, anchor: 'corporate-tax' },
      }),
    );
  }

  // 6. 消費税: 仕入
  {
    const base = 300000;
    const [x, tax] = taxSteps('仕入', base);
    const total = step('買掛金(税抜金額 + 消費税)', 'add', [base, tax.value]);
    questions.push(
      journalQ({
        id: 'B11-006',
        topic: T,
        difficulty: 1,
        prompt: `商品 ${yen(base)}(税抜)を仕入れ、消費税10%とあわせた代金は掛けとした。消費税は税抜方式で処理する。`,
        choices: ['仕入', '仮払消費税', '仮受消費税', '買掛金', '租税公課', '普通預金'],
        debit: [line('仕入', base), line('仮払消費税', tax.value)],
        credit: [line('買掛金', total.value)],
        calc: [x, tax, total],
        explanation: `仕入は税抜の ${yen(base)}。払う消費税 ${yen(tax.value)} は、あとで納める消費税から差し引ける分なので **仮払消費税**(資産)。`,
        mistakes: [
          {
            entry: { debit: [line('仕入', total.value)], credit: [line('買掛金', total.value)] },
            why: '税抜方式では、消費税を仕入に含めない。消費税の分は仮払消費税に分ける。',
          },
          {
            entry: { debit: [line('仕入', base), line('仮受消費税', tax.value)], credit: [line('買掛金', total.value)] },
            why: '仕入れたときに払う消費税は仮払消費税。仮受消費税は、売ったときに受け取る消費税。',
          },
        ],
        ref: { topic: T, anchor: 'consumption-tax' },
      }),
    );
  }

  // 7. 消費税: 売上
  {
    const base = 480000;
    const [x, tax] = taxSteps('売上', base);
    const total = step('売掛金(税抜金額 + 消費税)', 'add', [base, tax.value]);
    questions.push(
      journalQ({
        id: 'B11-007',
        topic: T,
        difficulty: 2,
        prompt: `商品 ${yen(base)}(税抜)を売り上げ、消費税10%とあわせた代金は掛けとした。消費税は税抜方式で処理する。`,
        choices: ['売掛金', '売上', '仮受消費税', '仮払消費税', '未払消費税', '現金'],
        debit: [line('売掛金', total.value)],
        credit: [line('売上', base), line('仮受消費税', tax.value)],
        calc: [x, tax, total],
        explanation: `売上は税抜の ${yen(base)}。お客さんから預かった消費税 ${yen(tax.value)} は、あとで国に納めるお金なので **仮受消費税**(負債)。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', total.value)], credit: [line('売上', total.value)] },
            why: '税抜方式では、消費税を売上に含めない。預かった消費税は仮受消費税に分ける。',
          },
          {
            entry: { debit: [line('売掛金', total.value)], credit: [line('売上', base), line('未払消費税', tax.value)] },
            why: '売ったときは仮受消費税。未払消費税は、決算で仮受と仮払の差額を出したときに使う。',
          },
        ],
        ref: { topic: T, anchor: 'consumption-tax' },
      }),
    );
  }

  // 8. 決算: 消費税
  {
    const paid = 36000;
    const received = 57000;
    const unpaid = step('未払消費税(仮受 − 仮払)', 'sub', [received, paid]);
    questions.push(
      journalQ({
        id: 'B11-008',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、消費税の納付額を計算する。仮払消費税の残高は ${yen(paid)}、仮受消費税の残高は ${yen(received)} である(税抜方式)。`,
        choices: ['仮受消費税', '仮払消費税', '未払消費税', '租税公課', '普通預金', '未払法人税等'],
        debit: [line('仮受消費税', received)],
        credit: [line('仮払消費税', paid), line('未払消費税', unpaid.value)],
        calc: [unpaid],
        explanation: `仮受消費税と仮払消費税を **両方消し**、差額 ${yen(unpaid.value)} を **未払消費税**(負債)にする。翌期の確定申告で納付する。`,
        mistakes: [
          {
            entry: { debit: [line('仮払消費税', paid), line('未払消費税', unpaid.value)], credit: [line('仮受消費税', received)] },
            why: '貸借が逆。仮受消費税(負債)は借方で消し、仮払消費税(資産)は貸方で消す。',
          },
          {
            entry: { debit: [line('租税公課', unpaid.value)], credit: [line('未払消費税', unpaid.value)] },
            why: '税抜方式では、消費税は会社の費用にしない。仮受消費税と仮払消費税を消して、差額を未払消費税にする。',
          },
        ],
        ref: { topic: T, anchor: 'consumption-tax' },
      }),
    );
  }

  // 9. 未払消費税(数値)
  {
    const purchases = 1500000;
    const sales = 2300000;
    const [xp, paid] = taxSteps('仕入', purchases);
    const [xs, received] = taxSteps('売上', sales);
    const unpaid = step('未払消費税(仮受 − 仮払)', 'sub', [received.value, paid.value]);
    const diffBase = step('誤答: 税抜の売上 − 税抜の仕入', 'sub', [sales, purchases]);
    questions.push(
      numericQ({
        id: 'B11-009',
        topic: T,
        difficulty: 2,
        prompt: `当期の商品の仕入は ${yen(purchases)}(税抜)、売上は ${yen(sales)}(税抜)で、消費税率はどちらも10%だった。ほかに消費税の取引はない。決算で計上する未払消費税はいくらか(税抜方式)。`,
        answer: unpaid.value,
        calc: [xp, paid, xs, received, unpaid],
        explanation: `仮払消費税は ${yen(paid.value)}、仮受消費税は ${yen(received.value)}。未払消費税 = 仮受消費税 − 仮払消費税。`,
        mistakes: [
          { value: received.value, calc: [xs, received], why: '仕入のときに払った消費税(仮払消費税)は、納める額から差し引ける。仮受消費税から引く。' },
          { value: diffBase.value, calc: [diffBase], why: 'これは税抜の金額の差。消費税は、その10%。' },
        ],
        ref: { topic: T, anchor: 'tax-flow' },
      }),
    );
  }

  // 10. 税金と科目(表で選ぶ)
  {
    const K = ['租税公課', '仮払法人税等', HOJINZEI, '未払法人税等', '仮払消費税', '仮受消費税', '所得税預り金'];
    const sel = (ans) => blankSelect(K, ans);
    questions.push(
      tableQ({
        id: 'B11-010',
        topic: T,
        difficulty: 2,
        prompt: '次の取引で、税金の部分に使う科目を選びなさい(消費税は税抜方式)。',
        table: {
          title: '税金と科目',
          columns: [{ label: '取引' }, { label: '科目' }],
          rows: [
            ['固定資産税を納めた(納付時に費用にする方法)', sel('租税公課')],
            ['契約書に貼る収入印紙を買った', sel('租税公課')],
            ['法人税等を中間申告で納めた', sel('仮払法人税等')],
            ['決算で当期の法人税等を計上した', sel(HOJINZEI)],
            ['商品を仕入れたときに消費税を払った', sel('仮払消費税')],
            ['従業員の給料から所得税を差し引いた', sel('所得税預り金')],
          ],
        },
        explanation:
          '固定資産税・印紙税は **租税公課**。法人税等は、中間納付が **仮払法人税等**、決算の1年分が **法人税、住民税及び事業税**。仕入で払った消費税は **仮払消費税**。従業員の所得税は会社が預かって納めるので **所得税預り金**。',
        mistakes: [
          { cell: [1, 1], value: '仮払消費税', why: '収入印紙は印紙税を納めるためのもので、会社の費用になる税金。租税公課。' },
          { cell: [2, 1], value: HOJINZEI, why: '中間納付の時点では税額が確定していないので、仮払法人税等にしておく。' },
          { cell: [4, 1], value: '仮受消費税', why: '仕入で払った消費税は仮払消費税。仮受消費税は売上で受け取った消費税。' },
          { cell: [5, 1], value: '租税公課', why: '従業員の所得税は会社の費用ではない。給料から預かって納めるので所得税預り金(B07)。' },
        ],
        ref: { topic: T, anchor: 'which-tax' },
      }),
    );
  }

  return { topic: T, questions };
}
