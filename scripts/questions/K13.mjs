// K13 製品の受払い・本社工場会計 の問題(10問)
// 仕訳6問・数値2問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 製品の販売と売上原価、払出原価(先入先出法・平均法)、営業費、工場会計の独立(本社勘定・工場勘定)。
// 本社・工場の勘定は公式表外の補助リストにある。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K13';
const FACTORY = '工場会計を独立させている。工場の帳簿には、材料・賃金・給料・製造間接費・仕掛品・製品・本社の勘定があり、それ以外の勘定は本社の帳簿にある。';

export default function build() {
  const questions = [];

  // 1. 製品の販売(売上と売上原価)
  {
    const price = 720000;
    const cost = 480000;
    questions.push(
      journalQ({
        id: 'K13-001',
        topic: T,
        difficulty: 1,
        prompt: `製品(原価 ${yen(cost)})を ${yen(price)} で得意先に掛けで売った。売上と売上原価を記帳する。`,
        choices: ['売掛金', '売上原価', '売上', '製品', '仕掛品', '買掛金'],
        debit: [line('売掛金', price), line('売上原価', cost)],
        credit: [line('売上', price), line('製品', cost)],
        explanation: `売上の仕訳(売掛金 / 売上 ${yen(price)})と同時に、売った製品の原価 ${yen(cost)} を **製品 → 売上原価** に振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('売掛金', price)], credit: [line('売上', price)] },
            why: '製品を売ったら、売上原価 / 製品 の仕訳も必要。',
          },
          {
            entry: { debit: [line('売掛金', price), line('売上原価', cost)], credit: [line('売上', price), line('仕掛品', cost)] },
            why: '売れた製品はすでに完成して製品勘定にある。貸方は仕掛品ではなく製品。',
          },
        ],
        ref: { topic: T, anchor: 'products' },
      }),
    );
  }

  // 2〜3. 払い出す製品の原価
  const f = { bQty: 200, bCost: 3000, inQty: 800, inCost: 3200, sold: 700 };
  const fData = `月初の製品は ${f.bQty}個(1個 ¥${f.bCost.toLocaleString()})、当月の完成品は ${f.inQty}個(1個 ¥${f.inCost.toLocaleString()})。当月に ${f.sold}個を売った。`;
  const b = step('月初の製品の原価(数量 × 単価)', 'mul', [f.bQty, f.bCost]);
  const rest = step('当月完成分から売った数量(販売量 − 月初の数量)', 'sub', [f.sold, f.bQty]);
  const r = step('当月完成分から売った原価(数量 × 単価)', 'mul', [rest.value, f.inCost]);
  const fifo = step('売上原価(先入先出法)', 'add', [b.value, r.value]);
  const i = step('当月完成品の原価(数量 × 単価)', 'mul', [f.inQty, f.inCost]);
  const tot = step('原価の合計(月初 + 当月完成)', 'add', [b.value, i.value]);
  const qty = step('数量の合計(月初 + 当月完成)', 'add', [f.bQty, f.inQty]);
  const avg = step('平均の単価(原価の合計 ÷ 数量の合計)', 'div', [tot.value, qty.value]);
  const avgC = step('売上原価(平均法)', 'mul', [f.sold, avg.value]);
  const fifoSteps = [b, rest, r, fifo];
  const avgSteps = [b, i, tot, qty, avg, avgC];
  questions.push(
    numericQ({
      id: 'K13-002',
      topic: T,
      difficulty: 2,
      prompt: `${fData}先入先出法で、当月の売上原価はいくらか。`,
      answer: fifo.value,
      calc: fifoSteps,
      explanation: `月初の ${f.bQty}個(${yen(b.value)})から先に売り、残りの ${rest.value}個は当月の完成品(¥${f.inCost.toLocaleString()} × ${rest.value} = ${yen(r.value)})。合計 ${yen(fifo.value)}。`,
      mistakes: [{ value: avgC.value, calc: avgSteps, why: 'それは平均法の結果。先入先出法は、月初の製品から先に払い出す。' }],
      ref: { topic: T, anchor: 'cost-flow' },
    }),
  );
  {
    const wrong = step('誤答: 販売量 × 当月完成品の単価', 'mul', [f.sold, f.inCost]);
    questions.push(
      numericQ({
        id: 'K13-003',
        topic: T,
        difficulty: 2,
        prompt: `${fData}平均法(月初と当月完成の平均)で、当月の売上原価はいくらか。`,
        answer: avgC.value,
        calc: avgSteps,
        explanation: `平均の単価 = (${yen(b.value)} + ${yen(i.value)})÷ ${qty.value.toLocaleString()}個 = ¥${avg.value.toLocaleString()}。× ${f.sold}個 = ${yen(avgC.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wrong], why: '平均法では、月初の製品と当月の完成品を合わせた平均の単価を使う。' }],
        ref: { topic: T, anchor: 'cost-flow' },
      }),
    );
  }

  // 4. 営業費(本社の建物の減価償却費)
  {
    const year = 1800000;
    const month = step('当月分(年額 ÷ 12)', 'div', [year, 12]);
    questions.push(
      journalQ({
        id: 'K13-004',
        topic: T,
        difficulty: 2,
        prompt: `本社の建物の減価償却費(年額 ${yen(year)})の当月分を計上した。記帳は間接法。`,
        choices: ['減価償却費', '建物減価償却累計額', '製造間接費', '仕掛品', '建物', '製品'],
        debit: [line('減価償却費', month.value)],
        credit: [line('建物減価償却累計額', month.value)],
        calc: [month],
        explanation: `本社の建物は、製品を作るためではなく会社全体を管理するためのもの。当月分 ${yen(month.value)} は **一般管理費**(減価償却費)で、製造原価に入れない。`,
        mistakes: [
          {
            entry: { debit: [line('製造間接費', month.value)], credit: [line('建物減価償却累計額', month.value)] },
            why: '製造間接費にするのは工場の建物の減価償却費。本社の建物の分は営業費(一般管理費)。',
          },
        ],
        ref: { topic: T, anchor: 'selling' },
      }),
    );
  }

  // 5. 営業費の分類(選択)
  questions.push(
    choiceQ({
      id: 'K13-005',
      topic: T,
      difficulty: 1,
      prompt: '次のうち、製造原価ではなく営業費(販売費及び一般管理費)になるものはどれか。',
      options: ['工場の電力料', '製品を得意先に送る発送費', '工場長の給料', '材料を買ったときの引取運賃'],
      answer: 1,
      explanation: '製品を売るための費用(発送費)は **販売費**。製造原価には入れない。',
      mistakes: [
        { option: 0, why: '工場の電力料は製造のための費用なので、製造原価(製造間接費)。' },
        { option: 2, why: '工場長の給料は製造のための費用なので、製造原価(間接労務費)。' },
        { option: 3, why: '材料の引取運賃は材料の購入原価(材料副費)に含める。' },
      ],
      ref: { topic: T, anchor: 'selling' },
    }),
  );

  // 6〜7. 工場会計の独立: 材料の購入
  {
    const amt = 350000;
    const prompt = `${FACTORY}本社が材料 ${yen(amt)} を掛けで買い、工場の倉庫に直接届けてもらった。`;
    questions.push(
      journalQ({
        id: 'K13-006',
        topic: T,
        difficulty: 2,
        prompt: `${prompt}工場の仕訳を答えなさい。`,
        choices: ['材料', '本社', '買掛金', '工場', '仕掛品', '製造間接費'],
        debit: [line('材料', amt)],
        credit: [line('本社', amt)],
        explanation: '材料は工場の帳簿に記録する。代金の買掛金は本社の帳簿にあるので、工場では相手を **本社** とする。',
        mistakes: [
          {
            entry: { debit: [line('材料', amt)], credit: [line('買掛金', amt)] },
            why: '買掛金は本社の帳簿にある。工場の仕訳では、相手の勘定を本社にする。',
          },
        ],
        ref: { topic: T, anchor: 'branch' },
      }),
    );
    questions.push(
      journalQ({
        id: 'K13-007',
        topic: T,
        difficulty: 2,
        prompt: `${prompt}本社の仕訳を答えなさい。`,
        choices: ['工場', '買掛金', '材料', '本社', '仕入', '未払金'],
        debit: [line('工場', amt)],
        credit: [line('買掛金', amt)],
        explanation: '材料は工場の帳簿にあるので、本社では借方を **工場** とする(工場に対する貸し)。買掛金は本社の帳簿に記録する。',
        mistakes: [
          {
            entry: { debit: [line('材料', amt)], credit: [line('買掛金', amt)] },
            why: '材料勘定は工場の帳簿にある。本社では、工場に送った分として工場勘定を使う。',
          },
        ],
        ref: { topic: T, anchor: 'branch' },
      }),
    );
  }

  // 8. 工場会計の独立: 賃金の支払い(工場の仕訳)
  {
    const gross = 900000;
    const withheld = 70000;
    const net = step('本社が払う手取額(総額 − 源泉所得税)', 'sub', [gross, withheld]);
    questions.push(
      journalQ({
        id: 'K13-008',
        topic: T,
        difficulty: 2,
        prompt: `${FACTORY}工場の従業員の賃金 ${yen(gross)} を、本社が源泉所得税 ${yen(withheld)} を差し引いて当座預金口座から支払った。工場の仕訳を答えなさい。`,
        choices: ['賃金・給料', '本社', '預り金', '当座預金', '製造間接費', '工場'],
        debit: [line('賃金・給料', gross)],
        credit: [line('本社', gross)],
        calc: [net],
        explanation: `工場では、賃金・給料を総額 ${yen(gross)} で記録し、相手は **本社**。預り金と当座預金(手取 ${yen(net.value)})は本社の帳簿に記録する。`,
        mistakes: [
          {
            entry: { debit: [line('賃金・給料', gross)], credit: [line('預り金', withheld), line('当座預金', net.value)] },
            why: '預り金と当座預金は本社の帳簿にある。工場では、相手をまとめて本社とする。',
          },
        ],
        ref: { topic: T, anchor: 'branch' },
      }),
    );
  }

  // 9. 工場会計の独立: 製品の発送(工場の仕訳)
  {
    const cost = 520000;
    const price = 780000;
    questions.push(
      journalQ({
        id: 'K13-009',
        topic: T,
        difficulty: 3,
        prompt: `${FACTORY}本社の指示で、工場が製品(原価 ${yen(cost)})を得意先に発送した。本社はこれを ${yen(price)} で掛け売りした。工場の仕訳を答えなさい。`,
        choices: ['本社', '製品', '売上原価', '売掛金', '売上', '仕掛品'],
        debit: [line('本社', cost)],
        credit: [line('製品', cost)],
        explanation: `工場では、製品が減る(貸方)。売上原価・売掛金・売上は本社の帳簿にあるので、相手は **本社** で、金額は原価 ${yen(cost)}。`,
        mistakes: [
          {
            entry: { debit: [line('売上原価', cost)], credit: [line('製品', cost)] },
            why: '売上原価は本社の帳簿にある。工場の仕訳では本社勘定を使う。',
          },
          {
            entry: { debit: [line('本社', price)], credit: [line('製品', price)] },
            why: '工場が記録するのは製品の原価。売価は本社が売上として記録する。',
          },
        ],
        ref: { topic: T, anchor: 'branch' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K13-010',
      topic: T,
      difficulty: 2,
      prompt: '製品の受払い・営業費・工場会計の独立について、正しいものをすべて選びなさい。',
      options: [
        '製品を売ったときは、売上の仕訳とともに、製品の原価を売上原価に振り替える',
        '本社の建物の減価償却費は、製造間接費として製品の原価に入れる',
        '工場会計を独立させると、工場の帳簿では本社との取引を本社勘定で記録する',
        '本社勘定と工場勘定の残高は、貸借が同じ側に出る',
        '営業費は、製品の原価に入れず、発生した期の費用にする',
      ],
      answer: [0, 2, 4],
      explanation: '本社の建物の減価償却費は営業費(一般管理費)。本社勘定と工場勘定の残高は、貸借が反対側で一致する。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '本社の建物は製造のためのものではないので、営業費(一般管理費)。' },
        { options: [0, 2, 3, 4], why: '本社勘定(工場の帳簿)と工場勘定(本社の帳簿)の残高は、貸借が反対側で一致する。' },
        { options: [0, 2], why: '営業費は期間の費用で、製品の原価には入れない。これも正しい。' },
      ],
      ref: { topic: T, anchor: 't-branch' },
    }),
  );

  return { topic: T, questions };
}
