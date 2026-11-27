// C11 有形固定資産③償却・未決算 の問題(12問)
// 仕訳8問・数値2問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 生産高比例法、直接法、200%定率法(保証率・改定償却率への切り替えまで)、買換え(期首・期中)、未決算(火災)。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C11';

export default function build() {
  const questions = [];

  // 1. 生産高比例法
  {
    const cost = 4000000;
    const residualPct = 10;
    const total = 200000;
    const used = 15000;
    const resTimes = step('残存価額(取得原価 × 10)', 'mul', [cost, residualPct]);
    const residual = step('残存価額(÷ 100)', 'div', [resTimes.value, 100]);
    const base = step('償却する総額(取得原価 − 残存価額)', 'sub', [cost, residual.value]);
    const times = step('償却する総額 × 当期の走行距離', 'mul', [base.value, used]);
    const dep = step('減価償却費(÷ 見積総走行距離)', 'div', [times.value, total]);
    const wTimes = step('誤答: 取得原価 × 当期の走行距離', 'mul', [cost, used]);
    const wrong = step('誤答: 残存価額を引かずに計算', 'div', [wTimes.value, total]);
    questions.push(
      journalQ({
        id: 'C11-001',
        topic: T,
        difficulty: 2,
        prompt: `決算で、車両運搬具(取得原価 ${yen(cost)}、残存価額は取得原価の${residualPct}%、見積総走行距離 200,000km)を生産高比例法で減価償却する。当期の走行距離は 15,000km。記帳は間接法。`,
        choices: ['減価償却費', '車両運搬具減価償却累計額', '車両運搬具', '修繕費', '未払金', '固定資産売却損'],
        debit: [line('減価償却費', dep.value)],
        credit: [line('車両運搬具減価償却累計額', dep.value)],
        calc: [resTimes, residual, base, times, dep],
        explanation: `(取得原価 − 残存価額 ${yen(residual.value)})= ${yen(base.value)} を、総走行距離のうち当期に使った分(15,000km ÷ 200,000km)だけ償却して ${yen(dep.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', wrong.value)], credit: [line('車両運搬具減価償却累計額', wrong.value)] },
            why: `残存価額 ${yen(residual.value)} を引いてから、利用量の割合をかける。`,
            calc: [wTimes, wrong],
          },
          {
            entry: { debit: [line('減価償却費', dep.value)], credit: [line('車両運搬具', dep.value)] },
            why: '記帳は間接法なので、車両運搬具は減らさず、車両運搬具減価償却累計額に積み上げる。',
          },
        ],
        ref: { topic: T, anchor: 'units' },
      }),
    );
  }

  // 2. 直接法
  {
    const cost = 1440000;
    const life = 8;
    const dep = step('減価償却費(取得原価 ÷ 8年)', 'div', [cost, life]);
    questions.push(
      journalQ({
        id: 'C11-002',
        topic: T,
        difficulty: 1,
        prompt: `決算で、機械装置(取得原価 ${yen(cost)}、残存価額ゼロ、耐用年数${life}年)を定額法で減価償却する。記帳は直接法。`,
        choices: ['減価償却費', '機械装置', '備品減価償却累計額', '修繕費', '固定資産除却損', '未払金'],
        debit: [line('減価償却費', dep.value)],
        credit: [line('機械装置', dep.value)],
        calc: [dep],
        explanation: `1年分は ${yen(cost)} ÷ ${life}年 = ${yen(dep.value)}。**直接法** なので、減価償却累計額を使わず、機械装置そのものを減らす。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', dep.value)], credit: [line('備品減価償却累計額', dep.value)] },
            why: '直接法では減価償却累計額を使わない。また、機械装置の償却に備品の累計額は使わない。機械装置を直接減らす。',
          },
          {
            entry: { debit: [line('機械装置', dep.value)], credit: [line('減価償却費', dep.value)] },
            why: '貸借が逆。減価償却費は費用なので借方、機械装置は減るので貸方。',
          },
        ],
        ref: { topic: T, anchor: 'direct' },
      }),
    );
  }

  // 3. 200%定率法の償却率(選択)
  questions.push(
    choiceQ({
      id: 'C11-003',
      topic: T,
      difficulty: 1,
      prompt: '耐用年数8年の固定資産を200%定率法で償却する。償却率はいくつか。',
      options: ['0.125', '0.25', '0.2', '0.0625'],
      answer: 1,
      explanation: '200%定率法の償却率は「1 ÷ 耐用年数 × 2」。1 ÷ 8 × 2 = **0.25**。',
      mistakes: [
        { option: 0, why: '0.125 は 1 ÷ 8(定額法の償却率)。200%定率法はその2倍。' },
        { option: 2, why: '0.2 は耐用年数10年のときの償却率(1 ÷ 10 × 2)。' },
        { option: 3, why: '0.0625 は 1 ÷ 8 ÷ 2。2で割るのではなく、2をかける。' },
      ],
      ref: { topic: T, anchor: 'ddb' },
    }),
  );

  // 4〜5. 200%定率法: 切り替え前・切り替え後(数値)
  const ddbCost = 2000000;
  const g1 = step('償却保証額(取得原価 × 108)', 'mul', [ddbCost, 108]);
  const guarantee = step('償却保証額(÷ 1,000。保証率0.108)', 'div', [g1.value, 1000]);
  {
    const acc = 800000;
    const book = step('期首の帳簿価額(取得原価 − 減価償却累計額)', 'sub', [ddbCost, acc]);
    const r1 = step('調整前償却額(期首の帳簿価額 × 4)', 'mul', [book.value, 4]);
    const pre = step('調整前償却額(÷ 10。償却率0.4)', 'div', [r1.value, 10]);
    const w1 = step('誤答: 取得原価 × 4', 'mul', [ddbCost, 4]);
    const wrongCost = step('誤答: 取得原価に償却率をかけた額', 'div', [w1.value, 10]);
    questions.push(
      numericQ({
        id: 'C11-004',
        topic: T,
        difficulty: 2,
        prompt: `備品(取得原価 ${yen(ddbCost)}、耐用年数5年)を200%定率法(償却率0.4、保証率0.108、改定償却率0.5)で償却している。当期首の減価償却累計額は ${yen(acc)} である。当期の減価償却費はいくらか。`,
        answer: pre.value,
        calc: [g1, guarantee, book, r1, pre],
        explanation: `調整前償却額は期首の帳簿価額 ${yen(book.value)} × 0.4 = ${yen(pre.value)}。償却保証額 ${yen(ddbCost)} × 0.108 = ${yen(guarantee.value)} を下回っていないので、そのまま ${yen(pre.value)}。`,
        mistakes: [
          { value: wrongCost.value, calc: [w1, wrongCost], why: '定率法は、取得原価ではなく期首の帳簿価額に償却率をかける。' },
          { value: guarantee.value, calc: [g1, guarantee], why: '償却保証額は比べるための額。調整前償却額が下回っていないので、調整前償却額をそのまま使う。' },
        ],
        ref: { topic: T, anchor: 'ddb' },
      }),
    );
  }
  {
    const acc = 1568000;
    const book = step('期首の帳簿価額(取得原価 − 減価償却累計額)', 'sub', [ddbCost, acc]);
    const r1 = step('調整前償却額(期首の帳簿価額 × 4)', 'mul', [book.value, 4]);
    const pre = step('調整前償却額(÷ 10。償却率0.4)', 'div', [r1.value, 10]);
    const revised = step('改定償却率で計算した額(期首の帳簿価額 ÷ 2。改定償却率0.5)', 'div', [book.value, 2]);
    questions.push(
      numericQ({
        id: 'C11-005',
        topic: T,
        difficulty: 3,
        prompt: `備品(取得原価 ${yen(ddbCost)}、耐用年数5年)を200%定率法(償却率0.4、保証率0.108、改定償却率0.5)で償却している。当期首の減価償却累計額は ${yen(acc)} で、これまで改定償却率は使っていない。当期の減価償却費はいくらか。`,
        answer: revised.value,
        calc: [book, r1, pre, g1, guarantee, revised],
        explanation: `調整前償却額 ${yen(book.value)} × 0.4 = ${yen(pre.value)} は、償却保証額 ${yen(guarantee.value)} を **下回る**。そこで当期から改定償却率に切り替え、${yen(book.value)} × 0.5 = ${yen(revised.value)}。`,
        mistakes: [
          { value: pre.value, calc: [r1, pre], why: `調整前償却額 ${yen(pre.value)} は償却保証額 ${yen(guarantee.value)} を下回るので、改定償却率に切り替える。` },
        ],
        ref: { topic: T, anchor: 'ddb' },
      }),
    );
  }

  // 6. 買換え(期首)
  {
    const oldCost = 2600000;
    const oldAcc = 1950000;
    const tradeIn = 700000;
    const newCost = 3000000;
    const book = step('古い車両の帳簿価額(取得原価 − 減価償却累計額)', 'sub', [oldCost, oldAcc]);
    const gain = step('売却益(下取り価格 − 帳簿価額)', 'sub', [tradeIn, book.value]);
    const unpaid = step('未払金(新しい車両 − 下取り価格)', 'sub', [newCost, tradeIn]);
    questions.push(
      journalQ({
        id: 'C11-006',
        topic: T,
        difficulty: 2,
        prompt: `期首に、古い車両(取得原価 ${yen(oldCost)}、減価償却累計額 ${yen(oldAcc)}、間接法)を ${yen(tradeIn)} で下取りに出し、新しい車両 ${yen(newCost)} を買った。下取り価格を差し引いた残額は翌月末に支払う。`,
        choices: ['車両運搬具', '車両運搬具減価償却累計額', '未払金', '固定資産売却益', '固定資産売却損', '減価償却費'],
        debit: [line('車両運搬具', newCost), line('車両運搬具減価償却累計額', oldAcc)],
        credit: [line('車両運搬具', oldCost), line('未払金', unpaid.value), line('固定資産売却益', gain.value)],
        calc: [book, gain, unpaid],
        explanation: `古い車両を下取り価格 ${yen(tradeIn)} で売ったと考える。帳簿価額 ${yen(book.value)} との差額 ${yen(gain.value)} が **固定資産売却益**。新しい車両は全額 ${yen(newCost)} で記録し、下取り価格を引いた ${yen(unpaid.value)} が未払金。`,
        mistakes: [
          {
            entry: {
              debit: [line('車両運搬具', newCost), line('車両運搬具減価償却累計額', oldAcc), line('固定資産売却損', book.value)],
              credit: [line('車両運搬具', oldCost), line('未払金', newCost)],
            },
            why: `下取り価格 ${yen(tradeIn)} は、古い車両を売った代金として新しい車両の代金に充てている。未払金は残額の ${yen(unpaid.value)} で、帳簿価額との差は売却益になる。`,
          },
          {
            entry: { debit: [line('車両運搬具', newCost), line('車両運搬具減価償却累計額', oldAcc), line('固定資産売却損', gain.value)], credit: [line('車両運搬具', oldCost), line('未払金', unpaid.value)] },
            why: `下取り価格 ${yen(tradeIn)} は帳簿価額 ${yen(book.value)} より高いので、差額は売却益(貸方)。`,
          },
        ],
        ref: { topic: T, anchor: 'trade-in' },
      }),
    );
  }

  // 7. 買換え(期の途中・月割り)
  {
    const oldCost = 2400000;
    const oldAcc = 1200000;
    const life = 8;
    const months = 9;
    const tradeIn = 800000;
    const newCost = 3200000;
    const yearly = step('1年分の減価償却費(取得原価 ÷ 8年)', 'div', [oldCost, life]);
    const m = step('9か月分(1年分 × 9)', 'mul', [yearly.value, months]);
    const dep = step('当期の減価償却費(÷ 12か月)', 'div', [m.value, 12]);
    const b1 = step('期首の帳簿価額(取得原価 − 期首の減価償却累計額)', 'sub', [oldCost, oldAcc]);
    const book = step('下取り時の帳簿価額(期首の帳簿価額 − 当期の減価償却費)', 'sub', [b1.value, dep.value]);
    const loss = step('売却損(帳簿価額 − 下取り価格)', 'sub', [book.value, tradeIn]);
    const unpaid = step('未払金(新しい車両 − 下取り価格)', 'sub', [newCost, tradeIn]);
    const wrongLoss = step('誤答: 当期の減価償却費を計上しないときの売却損', 'sub', [b1.value, tradeIn]);
    questions.push(
      journalQ({
        id: 'C11-007',
        topic: T,
        difficulty: 3,
        prompt: `決算日は3月31日。12月31日に、古い車両(取得原価 ${yen(oldCost)}、期首の減価償却累計額 ${yen(oldAcc)}、定額法・耐用年数${life}年・残存価額ゼロ、間接法)を ${yen(tradeIn)} で下取りに出し、新しい車両 ${yen(newCost)} を買った。残額は翌月末に支払う。古い車両の当期分の減価償却費は月割りで計上する。`,
        choices: ['車両運搬具', '車両運搬具減価償却累計額', '減価償却費', '固定資産売却損', '未払金', '固定資産売却益'],
        debit: [
          line('車両運搬具', newCost),
          line('車両運搬具減価償却累計額', oldAcc),
          line('減価償却費', dep.value),
          line('固定資産売却損', loss.value),
        ],
        credit: [line('車両運搬具', oldCost), line('未払金', unpaid.value)],
        calc: [yearly, m, dep, b1, book, loss, unpaid],
        explanation: `4月〜12月の${months}か月分の減価償却費 ${yen(dep.value)} を計上する。下取り時の帳簿価額は ${yen(book.value)}、下取り価格 ${yen(tradeIn)} との差 ${yen(loss.value)} が **固定資産売却損**。`,
        mistakes: [
          {
            entry: {
              debit: [line('車両運搬具', newCost), line('車両運搬具減価償却累計額', oldAcc), line('固定資産売却損', wrongLoss.value)],
              credit: [line('車両運搬具', oldCost), line('未払金', unpaid.value)],
            },
            why: `期の途中で手放したので、期首から12月31日までの${months}か月分の減価償却費 ${yen(dep.value)} を計上してから売却損を出す。`,
            calc: [wrongLoss],
          },
        ],
        ref: { topic: T, anchor: 'trade-in-mid' },
      }),
    );
  }

  // 8〜10. 火災 → 未決算 → 保険金の確定
  const bCost = 6000000;
  const bAcc = 2400000;
  const unsettled = step('未決算(建物の帳簿価額 = 取得原価 − 減価償却累計額)', 'sub', [bCost, bAcc]);
  questions.push(
    journalQ({
      id: 'C11-008',
      topic: T,
      difficulty: 2,
      prompt: `期首に、倉庫(建物。取得原価 ${yen(bCost)}、減価償却累計額 ${yen(bAcc)}、間接法)が火災で焼けた。保険(保険金額 ¥4,000,000)をかけているので、保険会社に保険金を請求した。`,
      choices: ['建物減価償却累計額', '未決算', '建物', '火災損失', '未収入金', '保険差益'],
      debit: [line('建物減価償却累計額', bAcc), line('未決算', unsettled.value)],
      credit: [line('建物', bCost)],
      calc: [unsettled],
      explanation: `保険金がいくらになるか決まるまで、建物の帳簿価額 ${yen(unsettled.value)} を **未決算** にしておく。`,
      mistakes: [
        {
          entry: { debit: [line('建物減価償却累計額', bAcc), line('火災損失', unsettled.value)], credit: [line('建物', bCost)] },
          why: '保険をかけていて保険金を請求したので、損失はまだ決まっていない。未決算にしておく。',
        },
        {
          entry: { debit: [line('建物減価償却累計額', bAcc), line('未収入金', unsettled.value)], credit: [line('建物', bCost)] },
          why: '保険金の額はまだ決まっていないので、未収入金にはしない。決まるまでは未決算。',
        },
      ],
      ref: { topic: T, anchor: 'fire' },
    }),
  );
  {
    const paid = 3900000;
    const gain = step('保険差益(保険金 − 未決算)', 'sub', [paid, unsettled.value]);
    questions.push(
      journalQ({
        id: 'C11-009',
        topic: T,
        difficulty: 2,
        prompt: `火災で焼けた倉庫について、未決算 ${yen(unsettled.value)} を計上している。保険会社から、保険金 ${yen(paid)} を支払うと連絡があった(後日受け取る)。`,
        choices: ['未収入金', '未決算', '保険差益', '火災損失', '建物', '普通預金'],
        debit: [line('未収入金', paid)],
        credit: [line('未決算', unsettled.value), line('保険差益', gain.value)],
        calc: [gain],
        explanation: `保険金 ${yen(paid)} は未決算 ${yen(unsettled.value)} より多いので、差額 ${yen(gain.value)} は **保険差益**(収益)。保険金はまだ受け取っていないので未収入金。`,
        mistakes: [
          {
            entry: { debit: [line('未収入金', paid)], credit: [line('建物', unsettled.value), line('保険差益', gain.value)] },
            why: '建物は火災のときにすでに減らしている。ここで減らすのは未決算。',
          },
          {
            entry: { debit: [line('未収入金', paid)], credit: [line('未決算', paid)] },
            why: `未決算は ${yen(unsettled.value)} だけ減らし、保険金との差額を保険差益にする。`,
          },
        ],
        ref: { topic: T, anchor: 'fire' },
      }),
    );
  }
  {
    const paid = 3300000;
    const loss = step('火災損失(未決算 − 保険金)', 'sub', [unsettled.value, paid]);
    questions.push(
      journalQ({
        id: 'C11-010',
        topic: T,
        difficulty: 2,
        prompt: `火災で焼けた倉庫について、未決算 ${yen(unsettled.value)} を計上している。保険会社から、保険金 ${yen(paid)} を支払うと連絡があった(後日受け取る)。`,
        choices: ['未収入金', '火災損失', '未決算', '保険差益', '建物', '雑損'],
        debit: [line('未収入金', paid), line('火災損失', loss.value)],
        credit: [line('未決算', unsettled.value)],
        calc: [loss],
        explanation: `保険金 ${yen(paid)} は未決算 ${yen(unsettled.value)} より少ないので、足りない ${yen(loss.value)} は **火災損失**(費用)。`,
        mistakes: [
          {
            entry: { debit: [line('未収入金', paid), line('保険差益', loss.value)], credit: [line('未決算', unsettled.value)] },
            why: '保険金が未決算より少ないので、差額は損失(火災損失)。保険差益は保険金が多いとき。',
          },
          {
            entry: { debit: [line('未収入金', paid), line('雑損', loss.value)], credit: [line('未決算', unsettled.value)] },
            why: '火災による損失には、専用の科目(火災損失)を使う。',
          },
        ],
        ref: { topic: T, anchor: 'fire' },
      }),
    );
  }

  // 11. 保険なしの火災
  {
    const cost = 1500000;
    const acc = 900000;
    const book = step('帳簿価額(取得原価 − 減価償却累計額)', 'sub', [cost, acc]);
    questions.push(
      journalQ({
        id: 'C11-011',
        topic: T,
        difficulty: 1,
        prompt: `期首に、物置(建物。取得原価 ${yen(cost)}、減価償却累計額 ${yen(acc)}、間接法)が火災で焼けた。この建物には保険をかけていなかった。`,
        choices: ['建物減価償却累計額', '火災損失', '建物', '未決算', '未収入金', '保険差益'],
        debit: [line('建物減価償却累計額', acc), line('火災損失', book.value)],
        credit: [line('建物', cost)],
        calc: [book],
        explanation: `保険をかけていないので、保険金は入らない。帳簿価額 ${yen(book.value)} がそのまま **火災損失** になる(未決算は使わない)。`,
        mistakes: [
          {
            entry: { debit: [line('建物減価償却累計額', acc), line('未決算', book.value)], credit: [line('建物', cost)] },
            why: '未決算は、保険金を請求して額が決まるのを待つときに使う。保険がなければ、すぐに火災損失。',
          },
        ],
        ref: { topic: T, anchor: 'fire' },
      }),
    );
  }

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C11-012',
      topic: T,
      difficulty: 2,
      prompt: '固定資産の償却と火災について、正しいものをすべて選びなさい。',
      options: [
        '直接法では、減価償却費の分だけ固定資産そのものを減らす',
        '200%定率法の償却率は、1 ÷ 耐用年数 ÷ 2 で求める',
        '買換えでは、新しい資産を取得原価の全額で記録し、古い資産は下取り価格で売ったものとして処理する',
        '保険をかけていない建物が火災で焼けたときは、帳簿価額を未決算にする',
        '保険金が未決算より多く確定したときは、差額を保険差益にする',
      ],
      answer: [0, 2, 4],
      explanation: '200%定率法の償却率は「1 ÷ 耐用年数 × 2」。未決算は、保険金を請求して額が決まるのを待つときに使い、保険がなければすぐに火災損失にする。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '200%定率法の償却率は、定額法の償却率(1 ÷ 耐用年数)の2倍。2で割るのではなく、2をかける。' },
        { options: [0, 2, 3, 4], why: '保険をかけていなければ保険金は入らないので、帳簿価額はすぐに火災損失にする。' },
        { options: [0, 4], why: '買換えでは、新しい資産を全額で記録し、古い資産を下取り価格で売ったと考える。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'fire' },
    }),
  );

  return { topic: T, questions };
}
