// B03 現金・預金 の問題(10問)
// 仕訳6問・表の穴埋め2問(小口現金出納帳・当座預金出納帳)・数値1問・選択1問。金額はすべて step() で計算する。

import { blankNum, blankSelect, choiceQ, journalQ, line, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B03';

export default function build() {
  const questions = [];

  // 1. 現金過不足の発生(実際が少ない)
  {
    const book = 50000;
    const actual = 47500;
    const diff = step('不足額(帳簿残高 − 実際有高)', 'sub', [book, actual]);
    questions.push(
      journalQ({
        id: 'B03-001',
        topic: T,
        difficulty: 1,
        prompt: `金庫の現金を数えたところ、実際有高は ${yen(actual)} で、帳簿残高は ${yen(book)} だった。原因は今のところわからない。`,
        choices: ['現金', '普通預金', '現金過不足', '雑損', '雑益', '支払手数料'],
        debit: [line('現金過不足', diff.value)],
        credit: [line('現金', diff.value)],
        calc: [diff],
        explanation: `実際の額に帳簿を合わせるので、現金を ${yen(diff.value)} 減らす(貸方)。原因はあとで調べるので、相手はいったん **現金過不足**。`,
        mistakes: [
          {
            entry: { debit: [line('雑損', diff.value)], credit: [line('現金', diff.value)] },
            why: '期中に見つけた不一致は、原因を調べるので、いったん現金過不足にする。雑損にするのは、決算まで原因がわからなかったとき。',
          },
          {
            entry: { debit: [line('現金', diff.value)], credit: [line('現金過不足', diff.value)] },
            why: '左右が逆です。実際の現金が少ないので、帳簿の現金を減らす(現金は貸方)。',
          },
        ],
        ref: { topic: T, anchor: 'over-short' },
      }),
    );
  }

  // 2. 原因の判明
  {
    const shortage = 5000;
    const found = 3600;
    questions.push(
      journalQ({
        id: 'B03-002',
        topic: T,
        difficulty: 2,
        prompt: `先日、現金の実際有高が帳簿残高より ${yen(shortage)} 少なかったため、現金過不足として処理していた。そのうち ${yen(found)} は、電話料金を支払ったときの記入漏れだとわかった。`,
        choices: ['現金', '現金過不足', '通信費', '雑損', '雑益', '未払金'],
        debit: [line('通信費', found)],
        credit: [line('現金過不足', found)],
        explanation:
          '原因がわかった分は、本来の科目(**通信費**)に振り替え、**現金過不足を取り消す**(貸方)。現金は、不足が見つかったときにすでに実際の額まで減らしてある。',
        mistakes: [
          {
            entry: { debit: [line('通信費', found)], credit: [line('現金', found)] },
            why: '現金は、不足が見つかったときにすでに減らしてある。ここで減らすのは現金過不足。',
          },
          {
            entry: { debit: [line('現金過不足', found)], credit: [line('通信費', found)] },
            why: '左右が逆です。費用(通信費)の発生は借方、現金過不足(借方にある残高)の取り消しは貸方。',
          },
        ],
        ref: { topic: T, anchor: 'over-short' },
      }),
    );
  }

  // 3. 決算: 現金過不足の貸方残高 → 雑益
  {
    const amt = 1200;
    questions.push(
      journalQ({
        id: 'B03-003',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、現金過不足勘定に ${yen(amt)} の貸方残高があった。原因はわからなかった。`,
        choices: ['現金', '現金過不足', '雑損', '雑益', '受取手数料', '仮受金'],
        debit: [line('現金過不足', amt)],
        credit: [line('雑益', amt)],
        explanation:
          '貸方残高は「実際の現金が多かった」ことを表す。原因がわからないまま決算になったので、**雑益(収益)** に振り替えて、現金過不足の残高をゼロにする。',
        mistakes: [
          {
            entry: { debit: [line('雑損', amt)], credit: [line('現金過不足', amt)] },
            why: '貸方残高(現金が多かった)は、もうけ側なので雑益。借方残高なら雑損。',
          },
          {
            entry: { debit: [line('現金過不足', amt)], credit: [line('現金', amt)] },
            why: '現金はすでに実際の額に合わせてある。決算では、現金過不足を雑益に振り替える。',
          },
        ],
        ref: { topic: T, anchor: 'traps' },
      }),
    );
  }

  // 4. 口座ごとの勘定と振込手数料
  {
    const amt = 250000;
    const fee = 330;
    const total = step('A銀行の普通預金の減少(振替額 + 手数料)', 'add', [amt, fee]);
    questions.push(
      journalQ({
        id: 'B03-004',
        topic: T,
        difficulty: 2,
        prompt: `当社は預金口座ごとに勘定を設定している。A銀行の普通預金口座から B銀行の当座預金口座へ ${yen(amt)} を振り替えた。その際、振込手数料 ${yen(fee)} が A銀行の普通預金口座から引き落とされた。`,
        choices: ['現金', '普通預金', '当座預金', '普通預金A銀行', '当座預金B銀行', '支払手数料'],
        debit: [line('当座預金B銀行', amt), line('支払手数料', fee)],
        credit: [line('普通預金A銀行', total.value)],
        calc: [total],
        explanation: `口座ごとに勘定を設定しているので、**当座預金B銀行** の増加(借方)と **普通預金A銀行** の減少(貸方)。手数料は **支払手数料(費用)**。A銀行の口座からは合計 ${yen(total.value)} が減る。`,
        mistakes: [
          {
            entry: { debit: [line('当座預金', amt), line('支払手数料', fee)], credit: [line('普通預金', total.value)] },
            why: '口座ごとに勘定を設定しているので、「普通預金A銀行」「当座預金B銀行」を使う。',
          },
          {
            entry: { debit: [line('当座預金B銀行', total.value)], credit: [line('普通預金A銀行', total.value)] },
            why: '手数料は B銀行の口座には入っていない。手数料は費用(支払手数料)にする。',
          },
        ],
        ref: { topic: T, anchor: 'deposits' },
      }),
    );
  }

  // 5. 決算: 当座借越への振替
  {
    const amt = 85000;
    questions.push(
      journalQ({
        id: 'B03-005',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、当座預金勘定が ${yen(amt)} の貸方残高になっていた。これは取引銀行と当座借越契約を結んでいるためである。この貸方残高を、適切な負債の勘定に振り替える。`,
        choices: ['現金', '普通預金', '当座預金', '当座借越', '借入金', '未払金', '前受金'],
        debit: [line('当座預金', amt)],
        credit: [line('当座借越', amt)],
        explanation:
          '当座預金の貸方残高は、銀行から一時的に借りている状態。決算では当座預金を借方に書いて残高をゼロにし、**当座借越(負債)** に振り替える。当座借越の代わりに「借入金」と答えても正解(許容される科目)。',
        mistakes: [
          {
            entry: { debit: [line('当座借越', amt)], credit: [line('当座預金', amt)] },
            why: '左右が逆です。当座預金の貸方残高をなくすので、当座預金は借方。負債(当座借越)の増加は貸方。',
          },
          {
            entry: { debit: [line('当座預金', amt)], credit: [line('未払金', amt)] },
            why: '銀行からの一時的な借入れなので当座借越(または借入金)。未払金は、商品以外のものの代金をあとで払う義務。',
          },
        ],
        ref: { topic: T, anchor: 'overdraft' },
      }),
    );
  }

  // 6. 小口現金: 報告と補給が同時
  {
    const comm = 3800;
    const travel = 5600;
    const supplies = 2100;
    const total = step('使った額の合計(= 補給する額)', 'add', [comm, travel, supplies]);
    questions.push(
      journalQ({
        id: 'B03-006',
        topic: T,
        difficulty: 2,
        prompt: `定額資金前渡法を採用している。小口係から、今週の支払いについて通信費 ${yen(comm)}、旅費交通費 ${yen(travel)}、消耗品費 ${yen(supplies)} の報告を受け、ただちに同額を普通預金口座から引き出して小口係に補給した。`,
        choices: ['現金', '普通預金', '小口現金', '通信費', '旅費交通費', '消耗品費', '雑費'],
        debit: [line('通信費', comm), line('旅費交通費', travel), line('消耗品費', supplies)],
        credit: [line('普通預金', total.value)],
        calc: [total],
        explanation: `使った額を費用として計上し、同じ額 ${yen(total.value)} を普通預金から補給する。報告と補給が同時なので、小口現金は「減ってすぐ同じ額だけ増える」ため、仕訳に出てこない。`,
        mistakes: [
          {
            entry: { debit: [line('小口現金', total.value)], credit: [line('普通預金', total.value)] },
            why: '補給しか書いていない。報告を受けた費用(通信費・旅費交通費・消耗品費)も計上する。',
          },
          {
            entry: {
              debit: [line('通信費', comm), line('旅費交通費', travel), line('消耗品費', supplies)],
              credit: [line('小口現金', total.value)],
            },
            why: '報告だけで、補給を書いていない。ただちに補給したので、小口現金は差し引きゼロになり、貸方は普通預金。',
          },
          {
            entry: {
              debit: [line('通信費', comm), line('旅費交通費', travel), line('消耗品費', supplies)],
              credit: [line('現金', total.value)],
            },
            why: '補給のお金は普通預金口座から引き出している。',
          },
        ],
        ref: { topic: T, anchor: 'petty' },
      }),
    );
  }

  // 7. 小口現金出納帳(内訳の記入と合計)
  {
    const rows = [
      ['ハガキ代', 1260, 'comm'],
      ['電車代', 2340, 'travel'],
      ['プリンター用インク', 3150, 'supplies'],
      ['タクシー代', 2800, 'travel'],
    ];
    const cols = ['comm', 'travel', 'supplies'];
    const amountsOf = (k) => rows.filter((r) => r[2] === k).map((r) => r[1]);
    const sumOf = (label, xs) => (xs.length === 1 ? null : step(label, 'add', xs));
    const payTotal = step('支払の合計', 'add', rows.map((r) => r[1]));
    const travelTotal = sumOf('旅費交通費の合計', amountsOf('travel'));
    const commTotal = amountsOf('comm')[0];
    const suppliesTotal = amountsOf('supplies')[0];
    const forgotGiven = step('誤答: 空欄の行だけの合計', 'add', [rows[2][1], rows[3][1]]);

    // 1〜2行目は記入済み、3〜4行目の内訳と合計行を記入する
    const tableRows = rows.map((r, i) => {
      const cells = cols.map((k) => (r[2] === k ? r[1] : null));
      return [r[0], r[1], ...(i < 2 ? cells : cells.map((v) => blankNum(v)))];
    });
    tableRows.push(['合計', blankNum(payTotal.value), blankNum(commTotal), blankNum(travelTotal.value), blankNum(suppliesTotal)]);
    const ROW_T = tableRows.length - 1;

    questions.push(
      tableQ({
        id: 'B03-007',
        topic: T,
        difficulty: 2,
        prompt:
          '次の小口現金出納帳の空欄を埋めなさい。支払いは、内訳の欄(通信費・旅費交通費・消耗品費)の当てはまる欄に書き、合計の行も記入する。当てはまらない欄は空けたままにする。',
        table: {
          title: '小口現金出納帳(内訳の部分)',
          columns: [
            { label: '摘要' },
            { label: '支払', align: 'right' },
            { label: '通信費', align: 'right' },
            { label: '旅費交通費', align: 'right' },
            { label: '消耗品費', align: 'right' },
          ],
          rows: tableRows,
        },
        checks: [
          { label: '支払の合計', op: 'add', args: [0, 1, 2, 3].map((r) => [r, 1]), result: [ROW_T, 1] },
          ...[2, 3, 4].map((c) => ({ label: `${c}列目の合計`, op: 'add', args: [0, 1, 2, 3].map((r) => [r, c]), result: [ROW_T, c] })),
          { label: '内訳の合計 = 支払の合計', op: 'add', args: [[ROW_T, 2], [ROW_T, 3], [ROW_T, 4]], result: [ROW_T, 1] },
          ...[0, 1, 2, 3].map((r) => ({ label: `${r + 1}行目: 支払 = 内訳`, op: 'add', args: [[r, 2], [r, 3], [r, 4]], result: [r, 1] })),
        ],
        calc: [payTotal, travelTotal],
        explanation: `インクはすぐに使う事務用品なので **消耗品費**、タクシー代は移動の費用なので **旅費交通費**。合計の行は、記入済みの行も含めて縦に足す。支払の合計 ${yen(payTotal.value)} は、内訳の合計とも一致する。`,
        mistakes: [
          {
            cell: [2, 2],
            value: rows[2][1],
            why: 'インクはすぐに使う事務用品なので消耗品費。通信費は郵便・電話・インターネットの費用。',
          },
          {
            cell: [3, 4],
            value: rows[3][1],
            why: 'タクシー代は移動のための費用なので旅費交通費。',
          },
          {
            cell: [ROW_T, 1],
            value: forgotGiven.value,
            why: '合計には、最初から書かれている行(ハガキ代・電車代)も含める。',
          },
        ],
        ref: { topic: T, anchor: 'petty-book' },
      }),
    );
  }

  // 8. 当座預金出納帳(借/貸と残高)
  {
    const opening = 120000;
    const inflow = 60000;
    const out1 = 200000;
    const out2 = 30000;
    const bal1 = step('10日の残高(預金)= 前月繰越 + 預入', 'add', [opening, inflow]);
    const bal2 = step('18日の残高(借越)= 引出 − それまでの預金', 'sub', [out1, bal1.value]);
    const bal3 = step('25日の残高(借越)= 借越 + さらに引き出した額', 'add', [bal2.value, out2]);
    const wrongBal3 = step('誤答: 借越から引出額を引いた額', 'sub', [out2, bal2.value]);
    const KB = ['借', '貸'];

    questions.push(
      tableQ({
        id: 'B03-008',
        topic: T,
        difficulty: 3,
        prompt:
          '当社は取引銀行と当座借越契約(限度額 ¥300,000)を結んでいる。次の当座預金出納帳の空欄を埋めなさい。「借/貸」の欄は、預金があるときは「借」、当座借越の状態のときは「貸」とする。',
        table: {
          title: '当座預金出納帳',
          columns: [
            { label: '日付' },
            { label: '摘要' },
            { label: '預入', align: 'right' },
            { label: '引出', align: 'right' },
            { label: '借/貸' },
            { label: '残高', align: 'right' },
          ],
          rows: [
            ['1', '前月繰越', opening, null, '借', opening],
            ['10', '売掛金の回収(振込)', inflow, null, blankSelect(KB, '借'), blankNum(bal1.value)],
            ['18', '買掛金の支払(引落し)', null, out1, blankSelect(KB, '貸'), blankNum(bal2.value)],
            ['25', '電子記録債務の支払(引落し)', null, out2, blankSelect(KB, '貸'), blankNum(bal3.value)],
          ],
        },
        checks: [
          { label: '10日の残高', op: 'add', args: [[0, 5], [1, 2]], result: [1, 5] },
          { label: '18日の残高(借越)', op: 'sub', args: [[2, 3], [1, 5]], result: [2, 5] },
          { label: '25日の残高(借越)', op: 'add', args: [[2, 5], [3, 3]], result: [3, 5] },
        ],
        calc: [bal1, bal2, bal3],
        explanation: `18日は、預金 ${yen(bal1.value)} を超えて ${yen(out1)} が引き落とされたので、差額 ${yen(bal2.value)} が当座借越(**貸**)。借越の状態でさらに引き出すと、借越は **増える**(${yen(bal3.value)})。`,
        mistakes: [
          {
            cell: [2, 4],
            value: '借',
            why: '引出が預金の残高を超えたので、残高はマイナス(当座借越)。「貸」と書く。',
          },
          {
            cell: [3, 5],
            value: wrongBal3.value,
            why: '借越の状態でさらに引き出すと、借越は増える。借越の額に引出額を足す。',
            calc: [wrongBal3],
          },
        ],
        ref: { topic: T, anchor: 'bank-book' },
      }),
    );
  }

  // 9. 小口現金の残高(補給前)
  {
    const fixed = 40000;
    const used = [
      ['通信費', 4200],
      ['旅費交通費', 6800],
      ['雑費', 2700],
    ];
    const total = step('今週使った額の合計', 'add', used.map((u) => u[1]));
    const remain = step('補給前の残高(定額 − 使った額)', 'sub', [fixed, total.value]);
    const wrongAdd = step('誤答: 定額 + 使った額', 'add', [fixed, total.value]);
    questions.push(
      numericQ({
        id: 'B03-009',
        topic: T,
        difficulty: 2,
        prompt: `定額資金前渡法により、小口係に ${yen(fixed)} を渡している。今週の支払いは、${used.map(([a, v]) => `${a} ${yen(v)}`).join('、')} だった。週末に補給する前の、小口係の手元にある小口現金はいくらか。`,
        answer: remain.value,
        calc: [total, remain],
        explanation: `使った額の合計は ${yen(total.value)}。補給する前の手元の残高は、定額から使った額を引いた ${yen(remain.value)}。このあと ${yen(total.value)} を補給して、定額の ${yen(fixed)} に戻る。`,
        mistakes: [
          {
            value: total.value,
            calc: [total],
            why: 'それは使った額(= 補給する額)。聞いているのは、補給する前に手元に残っている額。',
          },
          {
            value: wrongAdd.value,
            calc: [total, wrongAdd],
            why: '使った分だけ手元のお金は減る。定額から使った額を引く。',
          },
        ],
        ref: { topic: T, anchor: 'petty' },
      }),
    );
  }

  // 10. 当座借越の表示
  questions.push(
    choiceQ({
      id: 'B03-010',
      topic: T,
      difficulty: 2,
      prompt: '当座借越契約がある当座預金で、決算日に当座預金勘定が貸方残高(当座借越)になっていた。貸借対照表ではどう表示するか。',
      options: [
        '資産の部に、当座預金のマイナスとして表示する',
        '負債の部に、当座借越(借入金)として表示する',
        '純資産の部から差し引いて表示する',
        '貸借対照表には表示しない',
      ],
      answer: 1,
      explanation:
        '当座借越は、銀行から一時的にお金を借りている状態なので **負債**。決算で当座借越(または借入金)に振り替えて、負債の部に表示する。',
      mistakes: [
        { option: 0, why: '資産をマイナスで表示することはしない。借りている状態なので負債に振り替える。' },
        { option: 2, why: '純資産は株主の出資ともうけのたくわえ。銀行からの借入れは負債。' },
        { option: 3, why: '銀行に返す義務があるので、負債として必ず表示する。' },
      ],
      ref: { topic: T, anchor: 'overdraft' },
    }),
  );

  return { topic: T, questions };
}
