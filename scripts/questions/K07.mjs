// K07 個別原価計算 の問題(10問)
// 仕訳3問・数値4問・選択2問・複数選択1問。金額はすべて step() で計算する。
// 原価計算表(賦課と予定配賦)、完成・引渡し・月末仕掛品、仕損費(補修指図書を発行する場合、当該指図書に賦課)。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K07';

export default function build() {
  const questions = [];
  const wage = 1100;
  const oh = 900;

  // 1. 指図書の製造原価(数値)
  {
    const dm = 250000;
    const h = 150;
    const dl = step('直接労務費(賃率 × 直接作業時間)', 'mul', [wage, h]);
    const ap = step('製造間接費(予定配賦率 × 直接作業時間)', 'mul', [oh, h]);
    const s = step('直接材料費 + 直接労務費', 'add', [dm, dl.value]);
    const total = step('製造原価(+ 製造間接費)', 'add', [s.value, ap.value]);
    questions.push(
      numericQ({
        id: 'K07-001',
        topic: T,
        difficulty: 1,
        prompt: `製造指図書 No.202 の当月の直接材料費は ${yen(dm)}、直接作業時間は ${h}時間。賃率は1時間 ¥${wage.toLocaleString()}、製造間接費の予定配賦率は1時間 ¥${oh}。No.202 の製造原価はいくらか(当月に作り始めて完成した)。`,
        answer: total.value,
        calc: [dl, ap, s, total],
        explanation: `直接材料費 ${yen(dm)} + 直接労務費 ${yen(dl.value)} + 製造間接費 ${yen(ap.value)} = ${yen(total.value)}。製造間接費も予定配賦率で指図書に配賦する。`,
        mistakes: [{ value: s.value, calc: [dl, s], why: '製造間接費も、直接作業時間 × 予定配賦率で各指図書に配賦する。' }],
        ref: { topic: T, anchor: 'cost-sheet' },
      }),
    );
  }

  // 2〜5. 原価計算表から月末仕掛品・売上原価・完成・引渡し
  const order = (no, carry, dm, h, note) => {
    const dl = step(`No.${no} 直接労務費(賃率 × 時間)`, 'mul', [wage, h]);
    const ap = step(`No.${no} 製造間接費(予定配賦率 × 時間)`, 'mul', [oh, h]);
    const first = carry || dm;
    const b = step(`No.${no} ${carry ? '前月繰越' : '直接材料費'} + 直接労務費`, 'add', [first, dl.value]);
    const total = step(`No.${no} の原価(+ 製造間接費)`, 'add', [b.value, ap.value]);
    return { no, carry, dm, h, note, dl, ap, steps: [dl, ap, b, total], total };
  };
  const o1 = order(201, 220000, 0, 40, '完成・引渡済');
  const o2 = order(202, 0, 250000, 150, '完成・未引渡');
  const o3 = order(203, 0, 160000, 90, '未完成');
  const desc = (o) => {
    const parts = [];
    if (o.carry) parts.push(`前月繰越 ${yen(o.carry)}`);
    if (o.dm) parts.push(`直接材料費 ${yen(o.dm)}`);
    parts.push(`直接作業 ${o.h}時間`);
    return `No.${o.no}(${parts.join('、')}。${o.note})`;
  };
  const table = `賃率は1時間 ¥${wage.toLocaleString()}、製造間接費の予定配賦率は1時間 ¥${oh}。当月の指図書は、${desc(o1)}、${desc(o2)}、${desc(o3)}。`;
  {
    const wrong = step('誤答: 未完成 + 完成・未引渡', 'add', [o3.total.value, o2.total.value]);
    questions.push(
      numericQ({
        id: 'K07-002',
        topic: T,
        difficulty: 2,
        prompt: `${table}月末の仕掛品の原価はいくらか。`,
        answer: o3.total.value,
        calc: o3.steps,
        explanation: `月末仕掛品は、未完成の No.203 だけ。${yen(o3.dm)} + ${yen(o3.dl.value)} + ${yen(o3.ap.value)} = ${yen(o3.total.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...o2.steps, wrong], why: '完成・未引渡の No.202 は、仕掛品ではなく製品として残る。' }],
        ref: { topic: T, anchor: 'where' },
      }),
    );
  }
  {
    const cur = step('誤答: 当月分だけ(直接労務費 + 製造間接費)', 'add', [o1.dl.value, o1.ap.value]);
    questions.push(
      numericQ({
        id: 'K07-003',
        topic: T,
        difficulty: 2,
        prompt: `${table}当月の売上原価はいくらか。`,
        answer: o1.total.value,
        calc: o1.steps,
        explanation: `売上原価は、完成・引渡済の No.201。前月繰越 ${yen(o1.carry)} も含めて、${yen(o1.carry)} + ${yen(o1.dl.value)} + ${yen(o1.ap.value)} = ${yen(o1.total.value)}。`,
        mistakes: [{ value: cur.value, calc: [o1.dl, o1.ap, cur], why: '前月に作り始めた指図書は、前月繰越(前月までの原価)も含める。' }],
        ref: { topic: T, anchor: 'cost-sheet' },
      }),
    );
  }
  {
    const done = step('完成品原価(No.201 + No.202)', 'add', [o1.total.value, o2.total.value]);
    questions.push(
      journalQ({
        id: 'K07-004',
        topic: T,
        difficulty: 2,
        prompt: `${table}完成した指図書の原価を振り替える。`,
        choices: ['製品', '仕掛品', '売上原価', '製造間接費', '材料', '売掛金'],
        debit: [line('製品', done.value)],
        credit: [line('仕掛品', done.value)],
        calc: [...o1.steps, ...o2.steps, done],
        explanation: `完成したのは No.201(${yen(o1.total.value)})と No.202(${yen(o2.total.value)})。引渡しの有無にかかわらず、完成したらまず **製品** へ振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('製品', o2.total.value)], credit: [line('仕掛品', o2.total.value)] },
            why: '前月に作り始めた No.201 も当月に完成したので、製品に振り替える。',
          },
        ],
        ref: { topic: T, anchor: 'complete' },
      }),
    );
  }
  {
    const done = step('誤答: 完成品すべての原価', 'add', [o1.total.value, o2.total.value]);
    questions.push(
      journalQ({
        id: 'K07-005',
        topic: T,
        difficulty: 1,
        prompt: `${table}No.201 を注文主に引き渡した。売上原価を計上する(売上の仕訳は別に行う)。`,
        choices: ['売上原価', '製品', '仕掛品', '売上', '売掛金', '製造間接費'],
        debit: [line('売上原価', o1.total.value)],
        credit: [line('製品', o1.total.value)],
        calc: o1.steps,
        explanation: `引き渡した No.201 の原価 ${yen(o1.total.value)} を、製品から **売上原価** へ振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('売上原価', done.value)], credit: [line('製品', done.value)] },
            why: 'No.202 はまだ引き渡していないので、製品のまま残す。',
            calc: [...o2.steps, done],
          },
        ],
        ref: { topic: T, anchor: 'complete' },
      }),
    );
  }

  // 6〜7. 仕損費
  const rDm = 12000;
  const rH = 15;
  const rDl = step('補修の直接労務費(賃率 × 時間)', 'mul', [wage, rH]);
  const rAp = step('補修の製造間接費(予定配賦率 × 時間)', 'mul', [oh, rH]);
  const r1 = step('補修の原価(直接材料費 + 直接労務費)', 'add', [rDm, rDl.value]);
  const repair = step('補修の原価(+ 製造間接費)', 'add', [r1.value, rAp.value]);
  const repairText = `製造指図書 No.301 の製品の一部に仕損が出たため、補修指図書 No.301-1 を出して直した。補修にかかった原価は、直接材料費 ${yen(rDm)}、直接作業 ${rH}時間(賃率は1時間 ¥${wage.toLocaleString()}、予定配賦率は1時間 ¥${oh})。`;
  questions.push(
    journalQ({
      id: 'K07-006',
      topic: T,
      difficulty: 2,
      prompt: `${repairText}補修指図書に集計した原価を、仕損費勘定に振り替える。`,
      choices: ['仕損費', '仕掛品', '製造間接費', '製品', '雑損', '売上原価'],
      debit: [line('仕損費', repair.value)],
      credit: [line('仕掛品', repair.value)],
      calc: [rDl, rAp, r1, repair],
      explanation: `補修の原価 = ${yen(rDm)} + ${yen(rDl.value)} + ${yen(rAp.value)} = ${yen(repair.value)}。補修指図書の原価(仕掛品)を **仕損費** に振り替え、このあと元の指図書 No.301 に賦課する。`,
      mistakes: [
        {
          entry: { debit: [line('仕掛品', repair.value)], credit: [line('仕損費', repair.value)] },
          why: 'これは仕損費を元の指図書に賦課する仕訳。先に、補修指図書の原価を仕損費に振り替える。',
        },
      ],
      ref: { topic: T, anchor: 'spoilage' },
    }),
  );
  {
    const base = 480000;
    const total = step('No.301 の原価(元の原価 + 仕損費)', 'add', [base, repair.value]);
    questions.push(
      numericQ({
        id: 'K07-007',
        topic: T,
        difficulty: 2,
        prompt: `${repairText}仕損費は No.301 に賦課する。補修前の No.301 の原価が ${yen(base)} のとき、仕損費を賦課したあとの No.301 の原価はいくらか。`,
        answer: total.value,
        calc: [rDl, rAp, r1, repair, total],
        explanation: `補修の原価 ${yen(repair.value)} は仕損費として元の指図書 No.301 に賦課する。${yen(base)} + ${yen(repair.value)} = ${yen(total.value)}。`,
        mistakes: [{ value: base, why: '補修の原価(仕損費)は、元の指図書 No.301 の原価に加える。' }],
        ref: { topic: T, anchor: 'spoilage' },
      }),
    );
  }

  // 8. 個別原価計算が向く生産(選択)
  questions.push(
    choiceQ({
      id: 'K07-008',
      topic: T,
      difficulty: 1,
      prompt: '個別原価計算が向いているのは、どのような生産か。',
      options: [
        '同じ規格の製品を、見込みで毎月大量に作る生産',
        '船や特注の機械など、注文を受けてから注文ごとに作る生産',
        '製品を作らず、サービスだけを提供する事業',
        '商品を仕入れてそのまま売る商売',
      ],
      answer: 1,
      explanation: '注文ごとに仕様がちがうので、製造指図書ごとに原価を集める **個別原価計算** を使う。',
      mistakes: [
        { option: 0, why: '同じ製品を大量に作るなら、1か月分をまとめて計算する総合原価計算(K08)。' },
        { option: 2, why: 'サービス業の原価は役務原価(C15)。製造指図書は使わない。' },
        { option: 3, why: '商品売買には製造原価の計算はない。' },
      ],
      ref: { topic: T, anchor: 'cost-sheet' },
    }),
  );

  // 9. 補修指図書の原価の扱い(選択)
  questions.push(
    choiceQ({
      id: 'K07-009',
      topic: T,
      difficulty: 2,
      prompt: '補修指図書を出して仕損を直したとき、補修指図書に集計した原価はどう処理するか。',
      options: [
        '仕損費として、仕損が出た元の製造指図書に賦課する',
        '当月のすべての製造指図書に、均等に分けて加える',
        '営業外費用として、損益計算書に計上する',
        '補修指図書の製品として、製品勘定に振り替える',
      ],
      answer: 0,
      explanation: '補修は、元の注文の製品を直すためにかかった原価。**仕損費** として、元の製造指図書に賦課する。',
      mistakes: [
        { option: 1, why: '仕損が出たのは元の指図書だけ。ほかの注文の原価には加えない。' },
        { option: 2, why: '製品を直すための原価なので、製造原価(元の指図書)に入れる。' },
        { option: 3, why: '補修指図書は新しい製品を作るものではない。元の指図書の原価に加える。' },
      ],
      ref: { topic: T, anchor: 'spoilage' },
    }),
  );

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K07-010',
      topic: T,
      difficulty: 2,
      prompt: '個別原価計算について、正しいものをすべて選びなさい。',
      options: [
        '製造間接費は、予定配賦率などで各製造指図書に配賦する',
        '完成したが引き渡していない指図書の原価は、売上原価にする',
        '前月に作り始めた指図書の原価には、前月繰越の金額も含める',
        '月末の仕掛品には、完成・未引渡の指図書の原価も含める',
        '補修指図書の原価は、仕損費として元の指図書に賦課する',
      ],
      answer: [0, 2, 4],
      explanation: '完成・未引渡は製品。月末仕掛品は未完成の指図書だけ。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '完成しても引き渡していなければ製品。売上原価は引き渡した分だけ。' },
        { options: [0, 2, 3, 4], why: '完成した指図書は仕掛品ではない。月末仕掛品は未完成の指図書だけ。' },
        { options: [0, 4], why: '前月繰越も、その指図書の原価の一部。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'where' },
    }),
  );

  return { topic: T, questions };
}
