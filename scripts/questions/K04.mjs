// K04 経費 の問題(6問)
// 仕訳2問・数値2問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 経費の分類(支払・月割・測定・発生)、直接経費(外注加工賃)と間接経費。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K04';

export default function build() {
  const questions = [];

  // 1. 経費の分類(選択)
  questions.push(
    choiceQ({
      id: 'K04-001',
      topic: T,
      difficulty: 1,
      prompt: '工場の電力料は、金額の決め方で分けると、どの経費になるか。',
      options: ['支払経費', '月割経費', '測定経費', '発生経費'],
      answer: 2,
      explanation: '電力料は、メーターで測った使用量 × 単価で当月の額を決めるので **測定経費**。',
      mistakes: [
        { option: 0, why: '支払経費は、修繕費など支払額をもとにするもの。電力料は測った量で決める。' },
        { option: 1, why: '月割経費は、減価償却費など1年分を12で割るもの。' },
        { option: 3, why: '発生経費は、材料の棚卸減耗費など発生した額のもの。' },
      ],
      ref: { topic: T, anchor: 'types' },
    }),
  );

  // 2. 外注加工賃(直接経費)
  {
    const amt = 150000;
    questions.push(
      journalQ({
        id: 'K04-002',
        topic: T,
        difficulty: 1,
        prompt: `製品の一部の加工を外部に頼み、外注加工賃 ${yen(amt)} を当座預金口座から支払った。外注加工賃は直接経費として処理する。`,
        choices: ['仕掛品', '当座預金', '製造間接費', '外注加工賃', '製品', '支払手数料'],
        debit: [line('仕掛品', amt)],
        credit: [line('当座預金', amt)],
        explanation: '特定の製品の加工にかかった **直接経費** なので、製品の原価として **仕掛品** に直接入れる。',
        mistakes: [
          {
            entry: { debit: [line('製造間接費', amt)], credit: [line('当座預金', amt)] },
            why: '外注加工賃は、どの製品の加工かわかる直接経費。製造間接費ではなく仕掛品。',
          },
        ],
        ref: { topic: T, anchor: 'direct' },
      }),
    );
  }

  // 3. 月割経費(減価償却費)
  {
    const year = 3000000;
    const month = step('当月分(年額 ÷ 12)', 'div', [year, 12]);
    questions.push(
      journalQ({
        id: 'K04-003',
        topic: T,
        difficulty: 2,
        prompt: `工場の建物の減価償却費(年額 ${yen(year)})の当月分を計上した。記帳は間接法。`,
        choices: ['製造間接費', '建物減価償却累計額', '仕掛品', '建物', '減価償却費', '製品'],
        debit: [line('製造間接費', month.value)],
        credit: [line('建物減価償却累計額', month.value)],
        calc: [month],
        explanation: `工場の建物の減価償却費は、どの製品のためか特定できない間接経費。年額の12分の1 ${yen(month.value)} を **製造間接費** にする。`,
        mistakes: [
          {
            entry: { debit: [line('製造間接費', year)], credit: [line('建物減価償却累計額', year)] },
            why: `月割経費なので、年額を12で割った当月分 ${yen(month.value)} だけ。`,
          },
          {
            entry: { debit: [line('仕掛品', month.value)], credit: [line('建物減価償却累計額', month.value)] },
            why: '工場の建物の減価償却費は間接経費。仕掛品ではなく製造間接費。',
          },
        ],
        ref: { topic: T, anchor: 'monthly' },
      }),
    );
  }

  // 4. 測定経費(数値)
  {
    const kwh = 5200;
    const unit = 28;
    const paid = 150000;
    const amt = step('当月の電力料(使用量 × 単価)', 'mul', [kwh, unit]);
    questions.push(
      numericQ({
        id: 'K04-004',
        topic: T,
        difficulty: 2,
        prompt: `当月の工場の電力の使用量は ${kwh.toLocaleString()}kWh、単価は1kWh ¥${unit}。当月の電力料の支払額は ${yen(paid)} だった。当月の電力料(原価)はいくらか。`,
        answer: amt.value,
        calc: [amt],
        explanation: `電力料は測定経費。支払額ではなく、使用量 × 単価で ${yen(amt.value)}。`,
        mistakes: [{ value: paid, why: '測定経費は、支払額ではなく当月に測った使用量で計算する。' }],
        ref: { topic: T, anchor: 'types' },
      }),
    );
  }

  // 5. 支払経費(数値)
  {
    const paid = 240000;
    const prev = 30000;
    const curr = 42000;
    const a = step('当月支払 − 前月未払', 'sub', [paid, prev]);
    const amt = step('当月の修繕費(+ 当月未払)', 'add', [a.value, curr]);
    questions.push(
      numericQ({
        id: 'K04-005',
        topic: T,
        difficulty: 2,
        prompt: `工場の修繕費の当月支払額は ${yen(paid)}、前月末の未払額は ${yen(prev)}、当月末の未払額は ${yen(curr)} である。当月の修繕費(原価)はいくらか。`,
        answer: amt.value,
        calc: [a, amt],
        explanation: `支払額には前月分が含まれるので引き、当月分の未払を足す。${yen(paid)} − ${yen(prev)} + ${yen(curr)} = ${yen(amt.value)}。`,
        mistakes: [{ value: paid, why: '当月の支払額には前月分が含まれ、当月分の未払が含まれていない。調整する。' }],
        ref: { topic: T, anchor: 'types' },
      }),
    );
  }

  // 6. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K04-006',
      topic: T,
      difficulty: 2,
      prompt: '経費について、正しいものをすべて選びなさい。',
      options: [
        '外注加工賃は、直接経費として仕掛品に入れる',
        '電力料は、当月の支払額を原価にする',
        '工場の建物の減価償却費は、1年分を12で割った額を毎月の原価にする',
        '工場の電力料や減価償却費は、直接経費である',
        '支払経費は、未払や前払を調整して当月の分を原価にする',
      ],
      answer: [0, 2, 4],
      explanation: '電力料は測定経費で、使用量 × 単価。電力料・減価償却費は間接経費(製造間接費)。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '電力料は測定経費。支払額ではなく、使用量 × 単価で計算する。' },
        { options: [0, 2, 3, 4], why: '電力料・減価償却費は、どの製品のためか特定できないので間接経費。' },
        { options: [0, 4], why: '減価償却費は月割経費で、年額 ÷ 12。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'where' },
    }),
  );

  return { topic: T, questions };
}
