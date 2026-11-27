// B12 株式会社の資本 の問題(10問)
// 仕訳5問・数値2問・表1問(純資産の部)・複数選択1問・選択1問。金額はすべて step() で計算する。
// 決めたこと: 当期純利益の繰越利益剰余金への振替は参考書で紹介だけ(問題は B14)。
// 3級の範囲なので、払込額は全額資本金、利益準備金の積立額は問題文で与える(積立額の算定・資本準備金・株式交付費は C19)。

import { blankNum, choiceQ, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B12';
const DIV_CHOICES = ['繰越利益剰余金', '未払配当金', '利益準備金', '資本金', '普通預金', '損益'];

/** 配当の決議の問題 */
function dividendQ({ id, difficulty, prompt, div, reserve, mistakes }) {
  const total = step('繰越利益剰余金の減少(配当金 + 利益準備金)', 'add', [div, reserve]);
  return journalQ({
    id,
    topic: T,
    difficulty,
    prompt,
    choices: DIV_CHOICES,
    debit: [line('繰越利益剰余金', total.value)],
    credit: [line('未払配当金', div), line('利益準備金', reserve)],
    calc: [total],
    explanation: `配当金 ${yen(div)} はまだ払っていないので **未払配当金**(負債)、積み立てる ${yen(reserve)} は **利益準備金**。どちらも繰越利益剰余金から出すので、繰越利益剰余金は合計 ${yen(total.value)} 減る。`,
    mistakes: mistakes(total.value),
    ref: { topic: T, anchor: 'dividend' },
  });
}

export default function build() {
  const questions = [];

  // 1. 設立
  {
    const shares = 200;
    const price = 40000;
    const cap = step('払込額(株数 × 1株の金額)', 'mul', [shares, price]);
    questions.push(
      journalQ({
        id: 'B12-001',
        topic: T,
        difficulty: 1,
        prompt: `会社の設立にあたり、株式${shares}株を1株 ${yen(price)} で発行し、全額が普通預金口座に払い込まれた。払込額は全額を資本金とする。`,
        choices: ['普通預金', '資本金', '借入金', '繰越利益剰余金', '利益準備金', '売上'],
        debit: [line('普通預金', cap.value)],
        credit: [line('資本金', cap.value)],
        calc: [cap],
        explanation: `払い込まれたのは ${shares}株 × ${yen(price)} = ${yen(cap.value)}。株主から受け取った会社の元手なので **資本金**(純資産)。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', price)], credit: [line('資本金', price)] },
            why: `${yen(price)} は1株の金額。${shares}株分が払い込まれている。`,
          },
          {
            entry: { debit: [line('普通預金', cap.value)], credit: [line('借入金', cap.value)] },
            why: '株主から払い込まれたお金は返す必要がないので、借入金(負債)ではなく資本金(純資産)。',
          },
        ],
        ref: { topic: T, anchor: 'establish' },
      }),
    );
  }

  // 2. 増資
  {
    const shares = 50;
    const price = 70000;
    const cap = step('払込額(株数 × 1株の金額)', 'mul', [shares, price]);
    questions.push(
      journalQ({
        id: 'B12-002',
        topic: T,
        difficulty: 1,
        prompt: `取締役会の決議により、新たに株式${shares}株を1株 ${yen(price)} で発行し、全額が当座預金口座に払い込まれた。払込額は全額を資本金とする。`,
        choices: ['当座預金', '資本金', '借入金', '繰越利益剰余金', '利益準備金', '受取手数料'],
        debit: [line('当座預金', cap.value)],
        credit: [line('資本金', cap.value)],
        calc: [cap],
        explanation: `会社ができたあとで株式を追加で発行する(**増資**)ときも、設立と同じく払込額 ${yen(cap.value)} を **資本金** にする。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', cap.value)], credit: [line('繰越利益剰余金', cap.value)] },
            why: '繰越利益剰余金は、会社が稼いだ利益の残り。株主が払い込んだお金は資本金。',
          },
          {
            entry: { debit: [line('当座預金', cap.value)], credit: [line('受取手数料', cap.value)] },
            why: '株式の払込みは会社の収益ではない。元手が増えるので資本金(純資産)。',
          },
        ],
        ref: { topic: T, anchor: 'increase' },
      }),
    );
  }

  // 3. 配当の決議
  questions.push(
    dividendQ({
      id: 'B12-003',
      difficulty: 2,
      prompt: `株主総会で、繰越利益剰余金を財源として株主配当金 ${yen(400000)} を支払うことと、利益準備金 ${yen(40000)} を積み立てることが決まった。`,
      div: 400000,
      reserve: 40000,
      mistakes: (total) => [
        {
          entry: { debit: [line('繰越利益剰余金', total)], credit: [line('普通預金', 400000), line('利益準備金', 40000)] },
          why: '株主総会で決めただけで、配当金はまだ払っていない。普通預金ではなく未払配当金(負債)。',
        },
        {
          entry: { debit: [line('繰越利益剰余金', 400000)], credit: [line('未払配当金', 400000)] },
          why: `利益準備金 ${yen(40000)} の積立も決まっている。利益準備金も繰越利益剰余金から積み立てる。`,
        },
      ],
    }),
  );

  // 4. 配当金の支払い
  {
    const amt = 400000;
    questions.push(
      journalQ({
        id: 'B12-004',
        topic: T,
        difficulty: 1,
        prompt: `先日の株主総会で決まった株主配当金 ${yen(amt)} を、普通預金口座から株主に支払った。`,
        choices: DIV_CHOICES,
        debit: [line('未払配当金', amt)],
        credit: [line('普通預金', amt)],
        explanation: `株主総会のときに **未払配当金**(負債)にしているので、払ったときはそれを減らす。繰越利益剰余金は株主総会のときに減らし済み。`,
        mistakes: [
          {
            entry: { debit: [line('繰越利益剰余金', amt)], credit: [line('普通預金', amt)] },
            why: '繰越利益剰余金は株主総会のときに減らしている。ここでまた減らすと二重になる。未払配当金を減らす。',
          },
        ],
        ref: { topic: T, anchor: 'dividend' },
      }),
    );
  }

  // 5. 配当の決議(残高が書いてある)
  {
    const balance = 2000000;
    questions.push(
      dividendQ({
        id: 'B12-005',
        difficulty: 2,
        prompt: `株主総会で、繰越利益剰余金(残高 ${yen(balance)})を財源として、株主配当金 ${yen(250000)} と利益準備金の積立 ${yen(25000)} が決まった。`,
        div: 250000,
        reserve: 25000,
        mistakes: (total) => [
          {
            entry: { debit: [line('未払配当金', 250000), line('利益準備金', 25000)], credit: [line('繰越利益剰余金', total)] },
            why: '貸借が逆。繰越利益剰余金(純資産)を借方で減らし、未払配当金と利益準備金を貸方に書く。',
          },
          {
            entry: { debit: [line('繰越利益剰余金', total)], credit: [line('未払配当金', total)] },
            why: '利益準備金の積立分は株主に払うお金ではないので、未払配当金に入れない。利益準備金に分ける。',
          },
        ],
      }),
    );
  }

  // 6. 配当後の繰越利益剰余金(数値)
  {
    const balance = 1600000;
    const div = 300000;
    const reserve = 30000;
    const after = step('配当後の残高(残高 − 配当金 − 利益準備金)', 'sub', [balance, div, reserve]);
    const noReserve = step('誤答: 利益準備金を引いていない', 'sub', [balance, div]);
    questions.push(
      numericQ({
        id: 'B12-006',
        topic: T,
        difficulty: 2,
        prompt: `繰越利益剰余金の残高は ${yen(balance)} だった。株主総会で、株主配当金 ${yen(div)} と利益準備金の積立 ${yen(reserve)} が決まった。この仕訳のあとの繰越利益剰余金の残高はいくらか。`,
        answer: after.value,
        calc: [after],
        explanation: '配当金だけでなく、利益準備金の積立も繰越利益剰余金から出す。残高 − 配当金 − 積立額。',
        mistakes: [{ value: noReserve.value, calc: [noReserve], why: '利益準備金の積立も繰越利益剰余金を減らす。' }],
        ref: { topic: T, anchor: 'dividend' },
      }),
    );
  }

  // 7. 繰越利益剰余金の1年間(数値)
  {
    const opening = 900000;
    const div = 200000;
    const reserve = 20000;
    const income = 500000;
    const s1 = step('前期繰越 + 当期純利益', 'add', [opening, income]);
    const end = step('期末の残高(− 配当金 − 利益準備金)', 'sub', [s1.value, div, reserve]);
    const noIncome = step('誤答: 当期純利益を足していない', 'sub', [opening, div, reserve]);
    const noReserve = step('誤答: 利益準備金を引いていない', 'sub', [s1.value, div]);
    questions.push(
      numericQ({
        id: 'B12-007',
        topic: T,
        difficulty: 3,
        prompt: `繰越利益剰余金の期首の残高は ${yen(opening)} だった。期中の株主総会で、株主配当金 ${yen(div)} と利益準備金の積立 ${yen(reserve)} が決まった。決算で、当期純利益 ${yen(income)} を繰越利益剰余金に振り替えた。期末の繰越利益剰余金の残高はいくらか。`,
        answer: end.value,
        calc: [s1, end],
        explanation: '繰越利益剰余金は、当期純利益で増え、配当金と利益準備金の積立で減る。期首 + 当期純利益 − 配当金 − 積立額。',
        mistakes: [
          { value: noIncome.value, calc: [noIncome], why: '決算で当期純利益を振り替えると、繰越利益剰余金は増える。' },
          { value: noReserve.value, calc: [s1, noReserve], why: '利益準備金の積立も繰越利益剰余金を減らす。' },
        ],
        ref: { topic: T, anchor: 't-retained' },
      }),
    );
  }

  // 8. 純資産の部(表)
  {
    const cap0 = 6000000;
    const res0 = 100000;
    const re0 = 1200000;
    const issue = 2000000;
    const div = 150000;
    const reserve = 15000;
    const income = 600000;
    const total0 = step('前期末の純資産合計', 'add', [cap0, res0, re0]);
    const cap1 = step('当期末の資本金(+ 増資)', 'add', [cap0, issue]);
    const res1 = step('当期末の利益準備金(+ 積立)', 'add', [res0, reserve]);
    const re1a = step('繰越利益剰余金 + 当期純利益', 'add', [re0, income]);
    const re1 = step('当期末の繰越利益剰余金(− 配当金 − 積立)', 'sub', [re1a.value, div, reserve]);
    const total1 = step('当期末の純資産合計', 'add', [cap1.value, res1.value, re1.value]);
    const wrongRe = step('誤答: 積立を引いていない繰越利益剰余金', 'sub', [re1a.value, div]);
    questions.push(
      tableQ({
        id: 'B12-008',
        topic: T,
        difficulty: 3,
        prompt: `当期に次の取引があった。当期末の純資産の部の空欄を埋めなさい。(1) 株式を発行し、払込額 ${yen(issue)} を全額資本金とした。(2) 株主総会で、繰越利益剰余金から株主配当金 ${yen(div)} と利益準備金の積立 ${yen(reserve)} が決まった。(3) 決算で、当期純利益 ${yen(income)} を繰越利益剰余金に振り替えた。`,
        table: {
          title: '純資産の部',
          columns: [{ label: '項目' }, { label: '前期末', align: 'right' }, { label: '当期末', align: 'right' }],
          rows: [
            ['資本金', cap0, blankNum(cap1.value)],
            ['利益準備金', res0, blankNum(res1.value)],
            ['繰越利益剰余金', re0, blankNum(re1.value)],
            ['純資産合計', blankNum(total0.value), blankNum(total1.value)],
          ],
        },
        checks: [
          { label: '前期末の合計', op: 'add', args: [[0, 1], [1, 1], [2, 1]], result: [3, 1] },
          { label: '当期末の合計', op: 'add', args: [[0, 2], [1, 2], [2, 2]], result: [3, 2] },
          { label: '資本金は増資の分だけ増える', op: 'add', args: [[0, 1], issue], result: [0, 2] },
          { label: '利益準備金は積立の分だけ増える', op: 'add', args: [[1, 1], reserve], result: [1, 2] },
        ],
        calc: [total0, cap1, res1, re1a, re1, total1],
        explanation: `資本金は増資で ${yen(issue)} 増える。利益準備金は積立で ${yen(reserve)} 増える。繰越利益剰余金は当期純利益で増え、配当金と積立で減る。`,
        mistakes: [
          {
            cell: [2, 2],
            value: wrongRe.value,
            calc: [re1a, wrongRe],
            why: '利益準備金の積立分も、繰越利益剰余金から出している。配当金と積立の両方を引く。',
          },
          {
            cell: [1, 2],
            value: res0,
            why: `株主総会で利益準備金を ${yen(reserve)} 積み立てたので、利益準備金は増える。`,
          },
        ],
        ref: { topic: T, anchor: 'equity-section' },
      }),
    );
  }

  // 9. 純資産になるもの(複数選択)
  {
    const O = ['資本金', '利益準備金', '繰越利益剰余金', '未払配当金', '借入金'];
    questions.push(
      multiQ({
        id: 'B12-009',
        topic: T,
        difficulty: 1,
        prompt: '次のうち、貸借対照表の純資産の部に入るものをすべて選びなさい。',
        options: O,
        answer: [0, 1, 2],
        explanation:
          '**資本金**(株主が払い込んだ元手)、**利益準備金**・**繰越利益剰余金**(稼いだ利益の残り)が純資産。未払配当金は株主に払う義務、借入金は返す義務なので、どちらも負債。',
        mistakes: [
          { options: [0, 1, 2, 3], why: '未払配当金は、決まった配当をこれから株主に払う義務なので負債。' },
          { options: [0, 2], why: '利益準備金も、利益から積み立てた純資産。' },
        ],
        ref: { topic: T, anchor: 'equity-section' },
      }),
    );
  }

  // 10. 繰越利益剰余金とは(選択)
  questions.push(
    choiceQ({
      id: 'B12-010',
      topic: T,
      difficulty: 2,
      prompt: '繰越利益剰余金の説明として正しいものはどれか。',
      options: [
        '株主が会社に払い込んだお金',
        '会社がこれまでに稼いだ利益のうち、配当などで使わずに残っている分',
        '会社が手元に持っている現金の額',
        '会社法で積み立てることが決められている分',
      ],
      answer: 1,
      explanation:
        '繰越利益剰余金は、これまでの利益の積み重ねから配当などを引いた残り。**現金の額ではない** ので、繰越利益剰余金が大きくてもお金が手元にあるとは限らない。',
      mistakes: [
        { option: 0, why: '株主が払い込んだお金は資本金。' },
        { option: 2, why: '繰越利益剰余金は利益の積み重ねで、現金とは別もの。利益は在庫や設備などに使われていることもある。' },
        { option: 3, why: '会社法で積み立てるのは利益準備金。' },
      ],
      ref: { topic: T, anchor: 'net-income' },
    }),
  );

  return { topic: T, questions };
}
