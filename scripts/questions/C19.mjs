// C19 純資産(2級)の問題(12問)
// 仕訳9問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 資本準備金(払込金の2分の1以上を資本金)、株式申込証拠金・別段預金、株式交付費など、
// 剰余金の配当・処分(準備金積立額の算定)、その他資本剰余金からの配当、計数の変動、任意積立金。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C19';

/** 準備金の積立額 = min(配当 ÷ 10, 資本金 ÷ 4 − 準備金の合計) */
function reserveSteps(dividend, capital, capRes, earnRes) {
  const tenth = step('① 配当の10分の1(配当 ÷ 10)', 'div', [dividend, 10]);
  const quarter = step('資本金の4分の1(資本金 ÷ 4)', 'div', [capital, 4]);
  const room = step('② 積立ての上限(資本金の4分の1 − 資本準備金 − 利益準備金)', 'sub', [quarter.value, capRes, earnRes]);
  const amount = tenth.value <= room.value ? tenth : room;
  return { tenth, quarter, room, amount };
}

export default function build() {
  const questions = [];

  // 1. 増資(資本準備金)
  {
    const shares = 400;
    const price = 60000;
    const paid = step('払込金(1株 × 株数)', 'mul', [price, shares]);
    const half = step('資本金(払込金 ÷ 2)', 'div', [paid.value, 2]);
    const rest = step('資本準備金(払込金 − 資本金)', 'sub', [paid.value, half.value]);
    questions.push(
      journalQ({
        id: 'C19-001',
        topic: T,
        difficulty: 2,
        prompt: `増資のため、株式${shares}株を1株 ${yen(price)} で発行し、払込金が当座預金口座に入金された。資本金は会社法で認められる最低額とする。`,
        choices: ['当座預金', '資本金', '資本準備金', 'その他資本剰余金', '利益準備金', '株式申込証拠金'],
        debit: [line('当座預金', paid.value)],
        credit: [line('資本金', half.value), line('資本準備金', rest.value)],
        calc: [paid, half, rest],
        explanation: `会社法の最低額は払込金の **2分の1**。資本金 ${yen(half.value)}、残り ${yen(rest.value)} は **資本準備金**。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', paid.value)], credit: [line('資本金', paid.value)] },
            why: '「最低額を資本金」の指示があるので、半分は資本準備金にする(指示がなければ全額資本金)。',
          },
          {
            entry: { debit: [line('当座預金', paid.value)], credit: [line('資本金', half.value), line('その他資本剰余金', rest.value)] },
            why: '株式の発行で資本金にしなかった分は、資本準備金にする。',
          },
        ],
        ref: { topic: T, anchor: 'capital-reserve' },
      }),
    );
  }

  // 2〜3. 株式申込証拠金
  const sub = 4800000;
  questions.push(
    journalQ({
      id: 'C19-002',
      topic: T,
      difficulty: 1,
      prompt: `増資にあたり株式の申込みを受け、申込証拠金 ${yen(sub)} を受け取り、別段預金とした。`,
      choices: ['別段預金', '株式申込証拠金', '資本金', '当座預金', '預り金', '資本準備金'],
      debit: [line('別段預金', sub)],
      credit: [line('株式申込証拠金', sub)],
      explanation: '払込期日までは、まだ株主になっていないので資本金にしない。受け取った額は **株式申込証拠金**、預金は自由に使えない **別段預金**。',
      mistakes: [
        {
          entry: { debit: [line('別段預金', sub)], credit: [line('資本金', sub)] },
          why: '払込期日までは資本金にしない。株式申込証拠金にしておく。',
        },
        {
          entry: { debit: [line('当座預金', sub)], credit: [line('株式申込証拠金', sub)] },
          why: '申込証拠金は、払込期日まで会社が自由に使えないので別段預金にする。',
        },
      ],
      ref: { topic: T, anchor: 'subscription' },
    }),
  );
  {
    const half = step('資本金(払込金 ÷ 2)', 'div', [sub, 2]);
    const rest = step('資本準備金(払込金 − 資本金)', 'sub', [sub, half.value]);
    questions.push(
      journalQ({
        id: 'C19-003',
        topic: T,
        difficulty: 2,
        prompt: `払込期日になり、株式申込証拠金 ${yen(sub)} を払込金に充てた。資本金は払込金の2分の1とし、残りは資本準備金とする。あわせて、別段預金を当座預金に移した。`,
        choices: ['株式申込証拠金', '資本金', '資本準備金', '当座預金', '別段預金', 'その他資本剰余金'],
        debit: [line('株式申込証拠金', sub), line('当座預金', sub)],
        credit: [line('資本金', half.value), line('資本準備金', rest.value), line('別段預金', sub)],
        calc: [half, rest],
        explanation: `株式申込証拠金を資本金 ${yen(half.value)} と資本準備金 ${yen(rest.value)} に振り替える。別段預金は当座預金に移す。`,
        mistakes: [
          {
            entry: { debit: [line('株式申込証拠金', sub)], credit: [line('資本金', half.value), line('資本準備金', rest.value)] },
            why: '別段預金を当座預金に移す仕訳(当座預金 / 別段預金)も忘れずに書く。',
          },
        ],
        ref: { topic: T, anchor: 'subscription' },
      }),
    );
  }

  // 4. 株式交付費
  {
    const amt = 250000;
    questions.push(
      journalQ({
        id: 'C19-004',
        topic: T,
        difficulty: 1,
        prompt: `増資のための株式の発行に関する費用(広告費など) ${yen(amt)} を、当座預金口座から支払った。`,
        choices: ['株式交付費', '当座預金', '創立費', '開業費', '広告宣伝費', '資本金'],
        debit: [line('株式交付費', amt)],
        credit: [line('当座預金', amt)],
        explanation: '会社を作ったあとに株式を発行するための費用は **株式交付費**。支払ったときに費用にする。',
        mistakes: [
          {
            entry: { debit: [line('創立費', amt)], credit: [line('当座預金', amt)] },
            why: '創立費は会社を作るまでの費用。設立後の増資のための費用は株式交付費。',
          },
          {
            entry: { debit: [line('広告宣伝費', amt)], credit: [line('当座預金', amt)] },
            why: '株式を発行するための広告は、ふつうの広告宣伝費ではなく株式交付費。',
          },
        ],
        ref: { topic: T, anchor: 'costs' },
      }),
    );
  }

  // 5. 剰余金の配当・処分(上限に届かない)
  {
    const dividend = 1500000;
    const betto = 200000;
    const capital = 30000000;
    const capRes = 4000000;
    const earnRes = 2000000;
    const { tenth, quarter, room, amount } = reserveSteps(dividend, capital, capRes, earnRes);
    const total = step('繰越利益剰余金から減らす額(配当 + 利益準備金 + 別途積立金)', 'add', [dividend, amount.value, betto]);
    questions.push(
      journalQ({
        id: 'C19-005',
        topic: T,
        difficulty: 2,
        prompt: `株主総会で、繰越利益剰余金から配当 ${yen(dividend)} を行い、別途積立金 ${yen(betto)} を積み立てることが決まった。会社法に定める利益準備金も積み立てる。資本金は ${yen(capital)}、資本準備金は ${yen(capRes)}、利益準備金は ${yen(earnRes)} である。`,
        choices: ['繰越利益剰余金', '未払配当金', '利益準備金', '別途積立金', '資本準備金', '当座預金'],
        debit: [line('繰越利益剰余金', total.value)],
        credit: [line('未払配当金', dividend), line('利益準備金', amount.value), line('別途積立金', betto)],
        calc: [tenth, quarter, room, total],
        explanation: `配当の10分の1は ${yen(tenth.value)}、上限は ${yen(quarter.value)} −(${yen(capRes)} + ${yen(earnRes)})= ${yen(room.value)}。少ない方の ${yen(amount.value)} を利益準備金に積み立てる。`,
        mistakes: [
          {
            entry: { debit: [line('繰越利益剰余金', dividend + betto)], credit: [line('未払配当金', dividend), line('別途積立金', betto)] },
            why: '繰越利益剰余金から配当するときは、会社法により利益準備金も積み立てる。',
          },
        ],
        ref: { topic: T, anchor: 'reserve' },
      }),
    );
  }

  // 6. 準備金の積立額(上限に届く・数値)
  {
    const dividend = 1000000;
    const capital = 10000000;
    const capRes = 1800000;
    const earnRes = 650000;
    const { tenth, quarter, room, amount } = reserveSteps(dividend, capital, capRes, earnRes);
    questions.push(
      numericQ({
        id: 'C19-006',
        topic: T,
        difficulty: 3,
        prompt: `繰越利益剰余金から配当 ${yen(dividend)} を行う。資本金は ${yen(capital)}、資本準備金は ${yen(capRes)}、利益準備金は ${yen(earnRes)} である。会社法により積み立てる利益準備金の額はいくらか。`,
        answer: amount.value,
        calc: [tenth, quarter, room],
        explanation: `配当の10分の1は ${yen(tenth.value)}。上限は ${yen(quarter.value)} −(${yen(capRes)} + ${yen(earnRes)})= ${yen(room.value)}。少ない方の ${yen(amount.value)} を積み立てる。`,
        mistakes: [{ value: tenth.value, calc: [tenth], why: `配当の10分の1をそのまま使わない。資本金の4分の1までの残り ${yen(room.value)} と比べて、少ない方。` }],
        ref: { topic: T, anchor: 'reserve-rule' },
      }),
    );
  }

  // 7. その他資本剰余金からの配当
  {
    const dividend = 800000;
    const res = step('資本準備金(配当 ÷ 10)', 'div', [dividend, 10]);
    const total = step('その他資本剰余金から減らす額(配当 + 資本準備金)', 'add', [dividend, res.value]);
    questions.push(
      journalQ({
        id: 'C19-007',
        topic: T,
        difficulty: 3,
        prompt: `株主総会で、その他資本剰余金から配当 ${yen(dividend)} を行うことが決まった。会社法に定める準備金を積み立てる(準備金の合計は資本金の4分の1に達していない)。`,
        choices: ['その他資本剰余金', '未払配当金', '資本準備金', '利益準備金', '繰越利益剰余金', '資本金'],
        debit: [line('その他資本剰余金', total.value)],
        credit: [line('未払配当金', dividend), line('資本準備金', res.value)],
        calc: [res, total],
        explanation: `資本の側(その他資本剰余金)から配当したので、積み立てるのも資本の側の **資本準備金**(配当の10分の1で ${yen(res.value)})。`,
        mistakes: [
          {
            entry: { debit: [line('その他資本剰余金', total.value)], credit: [line('未払配当金', dividend), line('利益準備金', res.value)] },
            why: 'その他資本剰余金からの配当では、利益準備金ではなく資本準備金を積み立てる。',
          },
          {
            entry: { debit: [line('繰越利益剰余金', total.value)], credit: [line('未払配当金', dividend), line('資本準備金', res.value)] },
            why: '配当の元手はその他資本剰余金。繰越利益剰余金は減らさない。',
          },
        ],
        ref: { topic: T, anchor: 'capital-surplus' },
      }),
    );
  }

  // 8. 計数の変動
  {
    const amt = 1500000;
    questions.push(
      journalQ({
        id: 'C19-008',
        topic: T,
        difficulty: 1,
        prompt: `株主総会の決議により、資本準備金 ${yen(amt)} を資本金に組み入れた。`,
        choices: ['資本準備金', '資本金', 'その他資本剰余金', '利益準備金', '当座預金', '繰越利益剰余金'],
        debit: [line('資本準備金', amt)],
        credit: [line('資本金', amt)],
        explanation: '純資産の中で金額を振り替えるだけ(計数の変動)。資本準備金を減らし、資本金を増やす。お金は動かない。',
        mistakes: [
          {
            entry: { debit: [line('資本金', amt)], credit: [line('資本準備金', amt)] },
            why: '向きが逆。組み入れられる資本金が増える(貸方)。',
          },
        ],
        ref: { topic: T, anchor: 'transfer' },
      }),
    );
  }

  // 9. 任意積立金の取崩し
  {
    const amt = 500000;
    questions.push(
      journalQ({
        id: 'C19-009',
        topic: T,
        difficulty: 1,
        prompt: `株主総会の決議により、別途積立金 ${yen(amt)} を取り崩して、繰越利益剰余金に振り替えた。`,
        choices: ['別途積立金', '繰越利益剰余金', '利益準備金', '未払配当金', '当座預金', '雑益'],
        debit: [line('別途積立金', amt)],
        credit: [line('繰越利益剰余金', amt)],
        explanation: '任意積立金(別途積立金)を取り崩して、繰越利益剰余金を増やす。利益剰余金の中での振替なので、収益(雑益)にはしない。',
        mistakes: [
          {
            entry: { debit: [line('別途積立金', amt)], credit: [line('雑益', amt)] },
            why: '積立金の取崩しは、純資産の中の振替。収益にはしない。',
          },
        ],
        ref: { topic: T, anchor: 'transfer' },
      }),
    );
  }

  // 10. 配当金の支払い
  {
    const amt = 1500000;
    questions.push(
      journalQ({
        id: 'C19-010',
        topic: T,
        difficulty: 1,
        prompt: `株主総会で決まった配当金 ${yen(amt)}(未払配当金で処理済み)を、当座預金口座から支払った。`,
        choices: ['未払配当金', '当座預金', '繰越利益剰余金', '利益準備金', '支払手数料', '資本金'],
        debit: [line('未払配当金', amt)],
        credit: [line('当座預金', amt)],
        explanation: '決議のときに未払配当金(負債)を計上済み。支払ったら **未払配当金** を減らす。',
        mistakes: [
          {
            entry: { debit: [line('繰越利益剰余金', amt)], credit: [line('当座預金', amt)] },
            why: '繰越利益剰余金は、株主総会で決議したときに減らしている。支払いでは未払配当金を減らす。',
          },
        ],
        ref: { topic: T, anchor: 'reserve' },
      }),
    );
  }

  // 11. 純資産の分類(選択)
  questions.push(
    choiceQ({
      id: 'C19-011',
      topic: T,
      difficulty: 1,
      prompt: '貸借対照表の純資産の部で、利益準備金はどの区分に表示するか。',
      options: ['資本金', '資本剰余金', '利益剰余金', '評価・換算差額等'],
      answer: 2,
      explanation: '利益準備金は、稼いだ利益から積み立てたものなので **利益剰余金**。資本準備金は資本剰余金。',
      mistakes: [
        { option: 0, why: '資本金の区分には、資本金だけを表示する。' },
        { option: 1, why: '資本剰余金に入るのは、資本準備金とその他資本剰余金。利益準備金は利益剰余金。' },
        { option: 3, why: '評価・換算差額等は、その他有価証券評価差額金など。' },
      ],
      ref: { topic: T, anchor: 'equity' },
    }),
  );

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C19-012',
      topic: T,
      difficulty: 2,
      prompt: '純資産について、正しいものをすべて選びなさい。',
      options: [
        '株式の払込金のうち、2分の1以上を資本金にすれば、残りを資本準備金にできる',
        '申込証拠金を受け取ったときに、資本金を計上する',
        '利益準備金の積立額は、配当の10分の1と、資本金の4分の1までの残りの少ない方である',
        'その他資本剰余金から配当したときは、利益準備金を積み立てる',
        '増資のための株式発行の費用は、株式交付費で処理する',
      ],
      answer: [0, 2, 4],
      explanation: '申込証拠金は払込期日まで株式申込証拠金。その他資本剰余金からの配当では資本準備金を積み立てる。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '払込期日までは株主ではないので、資本金にしない。株式申込証拠金にする。' },
        { options: [0, 2, 3, 4], why: 'その他資本剰余金(資本の側)からの配当では、資本準備金を積み立てる。' },
        { options: [0, 4], why: '準備金の積立額は、配当の10分の1と上限の残りの少ない方。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'reserve-rule' },
    }),
  );

  return { topic: T, questions };
}
