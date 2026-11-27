// K02 材料費 の問題(10問)
// 仕訳7問・数値2問・複数選択1問。金額はすべて step() で計算する。
// 購入原価(材料副費の予定配賦)、消費単価(先入先出法・平均法)、予定価格と材料消費価格差異、棚卸減耗。

import { journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K02';

export default function build() {
  const questions = [];

  // 1. 購入(引取運賃)
  {
    const price = 450000;
    const freight = 9000;
    const cost = step('材料の取得原価(購入代価 + 引取運賃)', 'add', [price, freight]);
    questions.push(
      journalQ({
        id: 'K02-001',
        topic: T,
        difficulty: 1,
        prompt: `材料 ${yen(price)} を掛けで買い、引取運賃 ${yen(freight)} を現金で支払った。`,
        choices: ['材料', '買掛金', '現金', '発送費', '製造間接費', '仕掛品'],
        debit: [line('材料', cost.value)],
        credit: [line('買掛金', price), line('現金', freight)],
        calc: [cost],
        explanation: `引取運賃は材料を手に入れるための費用(材料副費)なので、材料の取得原価に含める。${yen(cost.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('材料', price), line('発送費', freight)], credit: [line('買掛金', price), line('現金', freight)] },
            why: '材料を買うときの引取運賃は、材料の取得原価に含める。発送費は製品を送るときの費用。',
          },
        ],
        ref: { topic: T, anchor: 'purchase' },
      }),
    );
  }

  // 2〜4. 材料副費の予定配賦 → 実際 → 差異
  const buy = 800000;
  const pct = 3;
  const pTimes = step('購入代価 × 3', 'mul', [buy, pct]);
  const planned = step('材料副費の予定配賦額(÷ 100)', 'div', [pTimes.value, 100]);
  {
    const cost = step('材料(購入代価 + 予定配賦額)', 'add', [buy, planned.value]);
    questions.push(
      journalQ({
        id: 'K02-002',
        topic: T,
        difficulty: 2,
        prompt: `材料 ${yen(buy)} を掛けで買った。材料副費は、購入代価の${pct}%を予定配賦する。`,
        choices: ['材料', '買掛金', '材料副費', '材料副費差異', '製造間接費', '現金'],
        debit: [line('材料', cost.value)],
        credit: [line('買掛金', buy), line('材料副費', planned.value)],
        calc: [pTimes, planned, cost],
        explanation: `材料副費を予定配賦するので、${yen(buy)} × ${pct}% = ${yen(planned.value)} を材料の取得原価に含め、相手は **材料副費**(貸方)。`,
        mistakes: [
          {
            entry: { debit: [line('材料', buy)], credit: [line('買掛金', buy)] },
            why: '材料副費を予定配賦するので、予定配賦額も材料の取得原価に含める。',
          },
        ],
        ref: { topic: T, anchor: 'overhead' },
      }),
    );
  }
  const actual = 22800;
  questions.push(
    journalQ({
      id: 'K02-003',
      topic: T,
      difficulty: 1,
      prompt: `当月の材料の保管費・検収費など(材料副費の実際発生額) ${yen(actual)} を、普通預金口座から支払った。`,
      choices: ['材料副費', '普通預金', '材料', '材料副費差異', '製造間接費', '支払手数料'],
      debit: [line('材料副費', actual)],
      credit: [line('普通預金', actual)],
      explanation: '実際に発生した材料副費は、いったん **材料副費** 勘定の借方に集める。予定配賦額(貸方)との差が材料副費差異になる。',
      mistakes: [
        {
          entry: { debit: [line('材料', actual)], credit: [line('普通預金', actual)] },
          why: '予定配賦をしているので、材料にはすでに予定配賦額を含めている。実際の副費は材料副費勘定に集める。',
        },
      ],
      ref: { topic: T, anchor: 'overhead' },
    }),
  );
  {
    const diff = step('差異(予定配賦額 − 実際発生額)', 'sub', [planned.value, actual]);
    questions.push(
      journalQ({
        id: 'K02-004',
        topic: T,
        difficulty: 2,
        prompt: `月末。材料副費の予定配賦額は ${yen(planned.value)}、実際発生額は ${yen(actual)} だった。差額を材料副費差異勘定に振り替える。`,
        choices: ['材料副費', '材料副費差異', '材料', '製造間接費', '売上原価', '材料消費価格差異'],
        debit: [line('材料副費', diff.value)],
        credit: [line('材料副費差異', diff.value)],
        calc: [diff],
        explanation: `予定 ${yen(planned.value)} より実際 ${yen(actual)} が ${yen(diff.value)} 少ない(有利差異)。材料副費勘定は貸方が多いので、借方に記入して残高をなくし、**材料副費差異** の貸方へ。`,
        mistakes: [
          {
            entry: { debit: [line('材料副費差異', diff.value)], credit: [line('材料副費', diff.value)] },
            why: '実際が予定より少ないので有利差異(貸方)。材料副費勘定の貸方の残りを、差異の貸方へ振り替える。',
          },
        ],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 5〜6. 消費単価(数値)
  const beginQty = 200;
  const beginPrice = 300;
  const buyQty = 600;
  const buyPrice = 320;
  const useQty = 500;
  {
    const a = step('月初の分(月初の数量 × 単価)', 'mul', [beginQty, beginPrice]);
    const restQty = step('購入分から消費した数量(消費 − 月初)', 'sub', [useQty, beginQty]);
    const b = step('購入分から消費した額(数量 × 購入単価)', 'mul', [restQty.value, buyPrice]);
    const fifo = step('先入先出法の消費額(月初の分 + 購入分)', 'add', [a.value, b.value]);
    const w = step('誤答: すべて購入単価で計算', 'mul', [useQty, buyPrice]);
    questions.push(
      numericQ({
        id: 'K02-005',
        topic: T,
        difficulty: 2,
        prompt: `月初に材料 ${beginQty}kg(@¥${beginPrice})があり、月中に ${buyQty}kg(@¥${buyPrice})を買った。当月は ${useQty}kg を消費した。先入先出法による当月の材料消費額はいくらか。`,
        answer: fifo.value,
        calc: [a, restQty, b, fifo],
        explanation: `先入先出法では古いものから消費する。月初の ${beginQty}kg(${yen(a.value)})+ 購入分 ${restQty.value}kg(${yen(b.value)})= ${yen(fifo.value)}。`,
        mistakes: [{ value: w.value, calc: [w], why: '先入先出法では、月初の材料(@300)から先に消費したと考える。' }],
        ref: { topic: T, anchor: 'unit-cost' },
      }),
    );
  }
  {
    const a = step('月初の金額', 'mul', [beginQty, beginPrice]);
    const b = step('購入の金額', 'mul', [buyQty, buyPrice]);
    const total = step('金額の合計', 'add', [a.value, b.value]);
    const qty = step('数量の合計', 'add', [beginQty, buyQty]);
    const avg = step('平均単価(金額の合計 ÷ 数量の合計)', 'div', [total.value, qty.value]);
    const used = step('平均法の消費額(平均単価 × 消費量)', 'mul', [avg.value, useQty]);
    const a2 = step('誤答: 月初と購入の単価の単純平均 × 消費量の計算(単価の合計)', 'add', [beginPrice, buyPrice]);
    const a3 = step('誤答: 単純平均の単価(÷ 2)', 'div', [a2.value, 2]);
    const wrong = step('誤答: 単純平均の単価 × 消費量', 'mul', [a3.value, useQty]);
    questions.push(
      numericQ({
        id: 'K02-006',
        topic: T,
        difficulty: 2,
        prompt: `月初に材料 ${beginQty}kg(@¥${beginPrice})があり、月中に ${buyQty}kg(@¥${buyPrice})を買った。当月は ${useQty}kg を消費した。平均法(総平均法)による当月の材料消費額はいくらか。`,
        answer: used.value,
        calc: [a, b, total, qty, avg, used],
        explanation: `平均単価 = (${yen(a.value)} + ${yen(b.value)})÷ ${qty.value}kg = @¥${avg.value}。× ${useQty}kg = ${yen(used.value)}。`,
        mistakes: [{ value: wrong.value, calc: [a2, a3, wrong], why: '単価を単純に平均しない。数量の重みを考えて、金額の合計 ÷ 数量の合計で平均単価を出す。' }],
        ref: { topic: T, anchor: 'unit-cost' },
      }),
    );
  }

  // 7〜8. 予定価格による消費 → 材料消費価格差異
  const planPrice = 310;
  const directQty = 420;
  const indirectQty = 80;
  {
    const d = step('直接材料費(予定価格 × 直接分の数量)', 'mul', [planPrice, directQty]);
    const i = step('間接材料費(予定価格 × 間接分の数量)', 'mul', [planPrice, indirectQty]);
    const sum = step('予定消費額の合計', 'add', [d.value, i.value]);
    questions.push(
      journalQ({
        id: 'K02-007',
        topic: T,
        difficulty: 2,
        prompt: `材料 ${directQty + indirectQty}kg を消費した(直接材料 ${directQty}kg、間接材料 ${indirectQty}kg)。消費額は予定価格 @¥${planPrice} で計算する。`,
        choices: ['仕掛品', '製造間接費', '材料', '材料消費価格差異', '製品', '買掛金'],
        debit: [line('仕掛品', d.value), line('製造間接費', i.value)],
        credit: [line('材料', sum.value)],
        calc: [d, i, sum],
        explanation: `予定価格で計算する。直接材料 ${yen(d.value)} は仕掛品、間接材料 ${yen(i.value)} は製造間接費。`,
        mistakes: [
          {
            entry: { debit: [line('仕掛品', sum.value)], credit: [line('材料', sum.value)] },
            why: '間接材料の分は、仕掛品ではなく製造間接費。',
          },
        ],
        ref: { topic: T, anchor: 'planned' },
      }),
    );
  }
  {
    const planTotal = step('予定消費額(予定価格 × 消費量)', 'mul', [planPrice, directQty + indirectQty]);
    const actualTotal = 158000;
    const diff = step('差異(実際消費額 − 予定消費額)', 'sub', [actualTotal, planTotal.value]);
    questions.push(
      journalQ({
        id: 'K02-008',
        topic: T,
        difficulty: 3,
        prompt: `月末。当月の材料の予定消費額は ${yen(planTotal.value)}、実際消費額は ${yen(actualTotal)} だった。差額を材料消費価格差異勘定に振り替える。`,
        choices: ['材料消費価格差異', '材料', '製造間接費', '仕掛品', '材料副費差異', '売上原価'],
        debit: [line('材料消費価格差異', diff.value)],
        credit: [line('材料', diff.value)],
        calc: [planTotal, diff],
        explanation: `実際 ${yen(actualTotal)} が予定 ${yen(planTotal.value)} より ${yen(diff.value)} 多い(不利差異)。材料勘定から実際額との差を減らし、**材料消費価格差異** の借方へ。`,
        mistakes: [
          {
            entry: { debit: [line('材料', diff.value)], credit: [line('材料消費価格差異', diff.value)] },
            why: '実際の消費額のほうが多いので不利差異(借方)。材料をさらに減らす。',
          },
        ],
        ref: { topic: T, anchor: 'planned' },
      }),
    );
  }

  // 9. 棚卸減耗
  {
    const book = 120;
    const actual = 116;
    const price = 250;
    const lost = step('減った数量(帳簿 − 実際)', 'sub', [book, actual]);
    const amt = step('棚卸減耗費(減った数量 × 単価)', 'mul', [lost.value, price]);
    questions.push(
      journalQ({
        id: 'K02-009',
        topic: T,
        difficulty: 2,
        prompt: `月末に材料の実地棚卸をしたところ、帳簿の数量 ${book}kg に対し、実際の数量は ${actual}kg だった(単価 @¥${price})。減耗はふつうに起きる程度のものである。`,
        choices: ['製造間接費', '材料', '仕掛品', '棚卸減耗損', '売上原価', '雑損'],
        debit: [line('製造間接費', amt.value)],
        credit: [line('材料', amt.value)],
        calc: [lost, amt],
        explanation: `${lost.value}kg × @¥${price} = ${yen(amt.value)}。ふつうに起きる材料の減耗は、間接経費として **製造間接費** にする。`,
        mistakes: [
          {
            entry: { debit: [line('仕掛品', amt.value)], credit: [line('材料', amt.value)] },
            why: '減耗はどの製品の原価か特定できないので、仕掛品ではなく製造間接費。',
          },
        ],
        ref: { topic: T, anchor: 'shrinkage' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K02-010',
      topic: T,
      difficulty: 2,
      prompt: '材料費について、正しいものをすべて選びなさい。',
      options: [
        '引取運賃などの材料副費は、材料の取得原価に含める',
        '先入先出法では、新しく買った材料から先に消費したと考える',
        '予定価格で消費を記録したら、実際との差を材料消費価格差異にする',
        '実際の消費額が予定より多いときの差異は、有利差異である',
        '通常起こる程度の材料の棚卸減耗費は、製造間接費にする',
      ],
      answer: [0, 2, 4],
      explanation: '先入先出法は古いものから消費する。実際の原価が予定より多ければ不利差異(借方)。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '先入先出法は、先に受け入れた(古い)材料から消費したと考える。' },
        { options: [0, 2, 3, 4], why: '実際の消費額のほうが多いのは、予定よりコストが高いので不利差異。' },
        { options: [0, 4], why: '予定価格で記録したときは、実際との差を材料消費価格差異にする。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'variance' },
    }),
  );

  return { topic: T, questions };
}
