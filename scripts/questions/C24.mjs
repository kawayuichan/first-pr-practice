// C24 製造業の決算 の問題(10問)
// 仕訳5問・数値3問・表1問(製造原価報告書)・複数選択1問。金額はすべて step() で計算する。
// 工場と本社の費用の区別、月次決算の調整、材料の棚卸減耗、原価差異の売上原価への賦課、製造原価報告書と売上原価。
// 原価差異の科目は公式表外の補助リストにある。

import { blankNum, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C24';

export default function build() {
  const questions = [];

  // 製造原価報告書(共通の資料)
  const d = { mBegin: 120000, mBuy: 1350000, mEnd: 150000, labor: 880000, exp: 420000, wBegin: 230000, wEnd: 260000, pBegin: 310000, pEnd: 290000, diff: 36000 };
  const data = `期首材料 ${yen(d.mBegin)}、当期材料仕入高 ${yen(d.mBuy)}、期末材料 ${yen(d.mEnd)}。労務費 ${yen(d.labor)}、経費 ${yen(d.exp)}。期首仕掛品 ${yen(d.wBegin)}、期末仕掛品 ${yen(d.wEnd)}。期首製品 ${yen(d.pBegin)}、期末製品 ${yen(d.pEnd)}。`;
  const m1 = step('期首材料 + 当期仕入', 'add', [d.mBegin, d.mBuy]);
  const mat = step('材料費(− 期末材料)', 'sub', [m1.value, d.mEnd]);
  const total = step('当期総製造費用(材料費 + 労務費 + 経費)', 'add', [mat.value, d.labor, d.exp]);
  const w1 = step('当期総製造費用 + 期首仕掛品', 'add', [total.value, d.wBegin]);
  const made = step('当期製品製造原価(− 期末仕掛品)', 'sub', [w1.value, d.wEnd]);
  const p1 = step('期首製品 + 当期製品製造原価', 'add', [d.pBegin, made.value]);
  const cogs = step('売上原価(差異の賦課前。− 期末製品)', 'sub', [p1.value, d.pEnd]);
  const madeSteps = [m1, mat, total, w1, made];

  // 1. 当期製品製造原価
  {
    const wrong1 = step('誤答: 当期総製造費用 + 期末仕掛品', 'add', [total.value, d.wEnd]);
    const wrong = step('誤答: − 期首仕掛品(期首と期末が逆)', 'sub', [wrong1.value, d.wBegin]);
    questions.push(
      numericQ({
        id: 'C24-001',
        topic: T,
        format: 'q3_statements',
        difficulty: 2,
        prompt: `${data}当期製品製造原価はいくらか。`,
        answer: made.value,
        calc: madeSteps,
        explanation: `材料費 = ${yen(d.mBegin)} + ${yen(d.mBuy)} − ${yen(d.mEnd)} = ${yen(mat.value)}。当期総製造費用 = 材料費 + 労務費 + 経費 = ${yen(total.value)}。+ 期首仕掛品 − 期末仕掛品 = ${yen(made.value)}。`,
        mistakes: [{ value: wrong.value, calc: [m1, mat, total, wrong1, wrong], why: '期首仕掛品を足し、期末仕掛品を引く。逆にしない。' }],
        ref: { topic: T, anchor: 'report' },
      }),
    );
  }

  // 2. 損益計算書の売上原価(原価差異を賦課)
  {
    const ans = step('損益計算書の売上原価(+ 不利な原価差異)', 'add', [cogs.value, d.diff]);
    const wrong = step('誤答: 不利な原価差異を引いた額', 'sub', [cogs.value, d.diff]);
    questions.push(
      numericQ({
        id: 'C24-002',
        topic: T,
        format: 'q3_statements',
        difficulty: 3,
        prompt: `${data}製造間接費の予定配賦で生じた原価差異 ${yen(d.diff)}(借方残高)は、売上原価に賦課する。損益計算書の売上原価はいくらか。`,
        answer: ans.value,
        calc: [...madeSteps, p1, cogs, ans],
        explanation: `当期製品製造原価は ${yen(made.value)}。売上原価 = 期首製品 ${yen(d.pBegin)} + ${yen(made.value)} − 期末製品 ${yen(d.pEnd)} = ${yen(cogs.value)}。借方残高の原価差異(不利差異)を加えて ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [...madeSteps, p1, cogs, wrong], why: '借方残高の原価差異は、実際が予定より多い不利差異。売上原価に加える。' }],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 3. 賞与引当金(工場と本社)
  {
    const factory = 420000;
    const office = 280000;
    const sum = step('賞与引当金の合計(工場 + 本社)', 'add', [factory, office]);
    questions.push(
      journalQ({
        id: 'C24-003',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、賞与引当金を設定する。工場の従業員の分は ${yen(factory)}、本社の従業員の分は ${yen(office)}。`,
        choices: ['製造間接費', '賞与引当金繰入', '賞与引当金', '仕掛品', '賃金・給料', '未払金'],
        debit: [line('製造間接費', factory), line('賞与引当金繰入', office)],
        credit: [line('賞与引当金', sum.value)],
        calc: [sum],
        explanation: `工場の分 ${yen(factory)} は製造のための費用なので **製造間接費**、本社の分 ${yen(office)} は **賞与引当金繰入**(販売費及び一般管理費)。`,
        mistakes: [
          {
            entry: { debit: [line('賞与引当金繰入', sum.value)], credit: [line('賞与引当金', sum.value)] },
            why: '工場の従業員の分は製造原価。製造間接費にする。',
          },
        ],
        ref: { topic: T, anchor: 'split' },
      }),
    );
  }

  // 4. 月次決算の調整(減価償却費)
  {
    const year = 960000;
    const month = 80000;
    const months = 11;
    const done = step('計上済みの額(月額 × 11か月)', 'mul', [month, months]);
    const rest = step('決算で計上する額(年額 − 計上済み)', 'sub', [year, done.value]);
    questions.push(
      journalQ({
        id: 'C24-004',
        topic: T,
        difficulty: 2,
        prompt: `工場の建物の減価償却費は、年額 ${yen(year)} を見積もり、毎月 ${yen(month)} を製造間接費に計上している(${months}か月分を計上済み)。決算で、年額との差額を計上する。記帳は間接法。`,
        choices: ['製造間接費', '建物減価償却累計額', '減価償却費', '建物', '仕掛品', '製品'],
        debit: [line('製造間接費', rest.value)],
        credit: [line('建物減価償却累計額', rest.value)],
        calc: [done, rest],
        explanation: `計上済みは ${yen(month)} × ${months} = ${yen(done.value)}。年額 ${yen(year)} との差 ${yen(rest.value)} だけを、工場の費用として **製造間接費** に計上する。`,
        mistakes: [
          {
            entry: { debit: [line('製造間接費', year)], credit: [line('建物減価償却累計額', year)] },
            why: '毎月の分はすでに計上してある。決算で計上するのは年額との差額だけ。',
          },
          {
            entry: { debit: [line('減価償却費', rest.value)], credit: [line('建物減価償却累計額', rest.value)] },
            why: '工場の建物の減価償却費は製造原価。製造間接費にする。',
          },
        ],
        ref: { topic: T, anchor: 'monthly' },
      }),
    );
  }

  // 5. 材料の棚卸減耗
  {
    const book = 158000;
    const real = 150000;
    const lost = step('棚卸減耗(帳簿 − 実地)', 'sub', [book, real]);
    questions.push(
      journalQ({
        id: 'C24-005',
        topic: T,
        difficulty: 1,
        prompt: `材料の帳簿棚卸高は ${yen(book)}、実地棚卸高は ${yen(real)} だった。棚卸減耗は正常なもの(原価性がある)である。`,
        choices: ['製造間接費', '材料', '棚卸減耗損', '仕掛品', '売上原価', '雑損'],
        debit: [line('製造間接費', lost.value)],
        credit: [line('材料', lost.value)],
        calc: [lost],
        explanation: `減った ${yen(lost.value)} だけ材料を減らす。正常な減耗は製造のための費用なので **製造間接費**(間接経費)。`,
        mistakes: [
          {
            entry: { debit: [line('棚卸減耗損', lost.value)], credit: [line('材料', lost.value)] },
            why: '工場の材料の正常な減耗は、製造原価(製造間接費)にする。',
          },
        ],
        ref: { topic: T, anchor: 'materials' },
      }),
    );
  }

  // 6〜7. 原価差異
  {
    const applied = 640000;
    const actual = 612000;
    const fav = step('原価差異(予定配賦額 − 実際発生額。有利の額)', 'sub', [applied, actual]);
    questions.push(
      journalQ({
        id: 'C24-006',
        topic: T,
        difficulty: 2,
        prompt: `製造間接費の予定配賦額は ${yen(applied)}、実際発生額は ${yen(actual)} だった。差額を原価差異勘定に振り替える。`,
        choices: ['製造間接費', '原価差異', '仕掛品', '売上原価', '製品', '材料'],
        debit: [line('製造間接費', fav.value)],
        credit: [line('原価差異', fav.value)],
        calc: [fav],
        explanation: `予定 ${yen(applied)} が実際 ${yen(actual)} より ${yen(fav.value)} 多い(有利差異)。製造間接費勘定の貸方残高を、原価差異の **貸方** へ振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('原価差異', fav.value)], credit: [line('製造間接費', fav.value)] },
            why: '実際が予定より少ないので有利差異(貸方)。逆にしない。',
          },
        ],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
    questions.push(
      journalQ({
        id: 'C24-007',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、原価差異勘定の貸方残高 ${yen(fav.value)}(有利差異)を、売上原価に賦課する。`,
        choices: ['原価差異', '売上原価', '製造間接費', '製品', '雑益', '仕掛品'],
        debit: [line('原価差異', fav.value)],
        credit: [line('売上原価', fav.value)],
        calc: [fav],
        explanation: `有利差異は、原価が予定より少なかった分。貸方残高を消し(借方)、**売上原価を減らす**(貸方)。`,
        mistakes: [
          {
            entry: { debit: [line('売上原価', fav.value)], credit: [line('原価差異', fav.value)] },
            why: '有利差異は売上原価から差し引く。売上原価を増やすのは不利差異のとき。',
          },
        ],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }

  // 8. 期末製品(数値)
  {
    const pBegin = 180000;
    const madeV = 2400000;
    const cogsV = 2350000;
    const p = step('期首製品 + 当期製品製造原価', 'add', [pBegin, madeV]);
    const end = step('期末製品(− 売上原価)', 'sub', [p.value, cogsV]);
    const wrong = step('誤答: 当期製品製造原価 − 売上原価(期首製品を入れない)', 'sub', [madeV, cogsV]);
    questions.push(
      numericQ({
        id: 'C24-008',
        topic: T,
        difficulty: 2,
        prompt: `期首製品は ${yen(pBegin)}、当期製品製造原価は ${yen(madeV)}、売上原価(原価差異の賦課前)は ${yen(cogsV)} である。期末製品はいくらか。`,
        answer: end.value,
        calc: [p, end],
        explanation: `製品勘定で考える。期首製品 ${yen(pBegin)} + 当期製品製造原価 ${yen(madeV)} = ${yen(p.value)} から、売上原価 ${yen(cogsV)} を引いた残り ${yen(end.value)} が期末製品。`,
        mistakes: [{ value: wrong.value, calc: [wrong], why: '期首製品も製品勘定の借方に入る。期首 + 当期製品製造原価 − 売上原価。' }],
        ref: { topic: T, anchor: 'flow' },
      }),
    );
  }

  // 9. 製造原価報告書(表)
  {
    const sumW = step('合計(当期総製造費用 + 期首仕掛品)', 'add', [total.value, d.wBegin]);
    questions.push(
      tableQ({
        id: 'C24-009',
        topic: T,
        format: 'q3_statements',
        difficulty: 2,
        prompt: `次の製造原価報告書の空欄を埋めなさい。${data}`,
        table: {
          title: '製造原価報告書',
          columns: [{ label: '項目' }, { label: '金額', align: 'right' }],
          rows: [
            ['材料費', blankNum(mat.value)],
            ['労務費', d.labor],
            ['経費', d.exp],
            ['当期総製造費用', blankNum(total.value)],
            ['期首仕掛品棚卸高', d.wBegin],
            ['合計', blankNum(sumW.value)],
            ['期末仕掛品棚卸高', d.wEnd],
            ['当期製品製造原価', blankNum(made.value)],
          ],
        },
        checks: [
          { label: '当期総製造費用 = 材料費 + 労務費 + 経費', op: 'add', args: [[0, 1], [1, 1], [2, 1]], result: [3, 1] },
          { label: '合計 = 当期総製造費用 + 期首仕掛品', op: 'add', args: [[3, 1], [4, 1]], result: [5, 1] },
          { label: '当期製品製造原価 = 合計 − 期末仕掛品', op: 'add', args: [[5, 1], ['-', 6, 1]], result: [7, 1] },
        ],
        calc: [m1, mat, total, sumW, made],
        explanation: `材料費 ${yen(mat.value)}(期首 + 仕入 − 期末)、当期総製造費用 ${yen(total.value)}、期首仕掛品を足して ${yen(sumW.value)}、期末仕掛品を引いて当期製品製造原価 ${yen(made.value)}。`,
        mistakes: [
          {
            cell: [0, 1],
            value: d.mBuy,
            why: '材料費は、当期の仕入高ではなく、期首材料 + 仕入 − 期末材料(実際に使った分)。',
          },
        ],
        ref: { topic: T, anchor: 'report' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C24-010',
      topic: T,
      difficulty: 2,
      prompt: '製造業の決算について、正しいものをすべて選びなさい。',
      options: [
        '本社の従業員の賞与引当金繰入は、製造間接費にする',
        '当期製品製造原価は、当期総製造費用に期首仕掛品を足し、期末仕掛品を引いて計算する',
        '月次決算で毎月計上してきた減価償却費は、決算で年額との差額だけを計上する',
        '有利な原価差異は、売上原価に加える',
        '貸借対照表には、期末の材料・仕掛品・製品を棚卸資産として表示する',
      ],
      answer: [1, 2, 4],
      explanation: '本社の分は販売費及び一般管理費(賞与引当金繰入)。有利な原価差異は売上原価から差し引く。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '本社の従業員の分は、製造原価ではなく販売費及び一般管理費。' },
        { options: [1, 2, 3, 4], why: '有利な原価差異は、売上原価から差し引く。' },
        { options: [1, 4], why: '月次で計上済みの分は、決算で年額との差額だけを計上する。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'split' },
    }),
  );

  return { topic: T, questions };
}
