// C01 商品売買(2級) の問題(12問)
// 仕訳5問・数値5問・表1問(期末商品の図)・複数選択1問。金額はすべて step() で計算する。
// 決めたこと: 「月次による処理」は区分表に説明がないため、一般的な意味(毎月末に売上原価を計算)で1問作った(ユーザー確認済み)。
// 棚卸減耗損・商品評価損を売上原価に含める処理も扱う。売上割戻は C14。

import { blankNum, blankSelect, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C01';

/** 単価 × 数量 */
const times = (label, price, qty) => step(label, 'mul', [price, qty]);

export default function build() {
  const questions = [];

  // 1. 仕入割戻
  {
    const amt = 12000;
    questions.push(
      journalQ({
        id: 'C01-001',
        topic: T,
        difficulty: 1,
        prompt: `仕入先から、一定期間に多額の仕入を行ったことによる割戻し ${yen(amt)} を受け、買掛金と相殺した。`,
        choices: ['買掛金', '仕入割戻', '仕入', '売上割戻', '売掛金', '現金'],
        debit: [line('買掛金', amt)],
        credit: [line('仕入割戻', amt)],
        explanation: '割戻しは、たくさん仕入れたお礼に代金を減らしてもらうこと。買掛金が減り、仕入から差し引く。公式の勘定科目表の標準は **仕入割戻**(「仕入」でも正解)。',
        mistakes: [
          {
            entry: { debit: [line('仕入割戻', amt)], credit: [line('買掛金', amt)] },
            why: '貸借が逆。払う代金(買掛金)が減るので借方、仕入を減らす仕入割戻は貸方。',
          },
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('売上割戻', amt)] },
            why: '売上割戻は、売った側が得意先に代金を減らしてあげるとき。仕入れた側が受けるのは仕入割戻。',
          },
        ],
        ref: { topic: T, anchor: 'rebate' },
      }),
    );
  }

  // 2. 純仕入高(補助簿の集計)
  {
    const gross = 980000;
    const returned = 25000;
    const rebate = 15000;
    const net = step('純仕入高(総仕入高 − 仕入戻し − 仕入割戻)', 'sub', [gross, returned, rebate]);
    const noRebate = step('誤答: 仕入割戻を引いていない', 'sub', [gross, returned]);
    questions.push(
      numericQ({
        id: 'C01-002',
        topic: T,
        difficulty: 1,
        prompt: `仕入帳を集計したところ、総仕入高は ${yen(gross)}、仕入戻し(返品)は ${yen(returned)}、仕入割戻は ${yen(rebate)} だった。純仕入高はいくらか。`,
        answer: net.value,
        calc: [net],
        explanation: '純仕入高は、総仕入高から仕入戻し(返品)と仕入割戻の両方を差し引いた金額。',
        mistakes: [
          { value: noRebate.value, calc: [noRebate], why: '仕入割戻も仕入を減らす。返品と同じように差し引く。' },
          { value: gross, why: '総仕入高のまま。返品と割戻しを差し引いた純仕入高を答える。' },
        ],
        ref: { topic: T, anchor: 'subledgers' },
      }),
    );
  }

  // 3. 総平均法
  {
    const begin = { qty: 20, price: 700 };
    const buy1 = { qty: 40, price: 760 };
    const buy2 = { qty: 40, price: 790 };
    const sold = 70;
    const a0 = times('前月繰越の金額', begin.price, begin.qty);
    const a1 = times('1回目の仕入の金額', buy1.price, buy1.qty);
    const a2 = times('2回目の仕入の金額', buy2.price, buy2.qty);
    const amt = step('金額の合計', 'add', [a0.value, a1.value, a2.value]);
    const qty = step('数量の合計', 'add', [begin.qty, buy1.qty, buy2.qty]);
    const avg = step('平均単価(金額の合計 ÷ 数量の合計)', 'div', [amt.value, qty.value]);
    const cogs = times('売上原価(平均単価 × 売った数量)', avg.value, sold);
    const simpleAvgSum = step('誤答: 単価の合計', 'add', [begin.price, buy1.price, buy2.price]);
    const simpleAvg = step('誤答: 単価どうしの平均', 'div', [simpleAvgSum.value, 3]);
    const wrongCogs = times('誤答: 単価どうしの平均で計算', simpleAvg.value, sold);
    questions.push(
      numericQ({
        id: 'C01-003',
        topic: T,
        difficulty: 2,
        prompt: `ある月の商品の動きは、前月繰越 ${begin.qty}個(@${yen(begin.price)})、仕入 ${buy1.qty}個(@${yen(buy1.price)})、仕入 ${buy2.qty}個(@${yen(buy2.price)})で、この月に ${sold}個を売り上げた。払出単価を総平均法で計算するとき、この月の売上原価はいくらか。`,
        answer: cogs.value,
        calc: [a0, a1, a2, amt, qty, avg, cogs],
        explanation: `総平均法の単価は、期間の金額の合計 ÷ 数量の合計 = ${yen(avg.value)}。売った ${sold}個にこの単価をかける。`,
        mistakes: [
          {
            value: wrongCogs.value,
            calc: [simpleAvgSum, simpleAvg, wrongCogs],
            why: '単価どうしを平均しない。数量の違いを反映するため、金額の合計 ÷ 数量の合計で平均単価を出す。',
          },
        ],
        ref: { topic: T, anchor: 'average' },
      }),
    );
  }

  // 4. 月次による処理(区分表に説明がないため一般的な意味で作った。2026-11-27 ユーザー確認済み。scope.md 8章の8)
  {
    const begin = 48000;
    const end = 57000;
    questions.push(
      journalQ({
        id: 'C01-004',
        topic: T,
        difficulty: 2,
        prompt: `当社は三分法で記帳し、毎月末に売上原価を仕入勘定で計算している(月次による処理)。5月の月初商品棚卸高は ${yen(begin)}、5月末の商品棚卸高は ${yen(end)} である。5月末の売上原価を計算する仕訳を答えなさい。`,
        choices: ['仕入', '繰越商品', '売上原価', '商品', '売上', '買掛金'],
        debit: [line('仕入', begin), line('繰越商品', end)],
        credit: [line('繰越商品', begin), line('仕入', end)],
        explanation: `決算と同じ「しーくりくりしー」を毎月末に行う。月初の在庫 ${yen(begin)} を仕入に足し(仕入 / 繰越商品)、月末の在庫 ${yen(end)} を仕入から引く(繰越商品 / 仕入)。`,
        mistakes: [
          {
            entry: { debit: [line('繰越商品', begin), line('仕入', end)], credit: [line('仕入', begin), line('繰越商品', end)] },
            why: '月初と月末が逆。月初の在庫は仕入に足し、月末の在庫は仕入から引く。',
          },
        ],
        ref: { topic: T, anchor: 'monthly' },
      }),
    );
  }

  // 5. 棚卸減耗損
  {
    const bookQty = 200;
    const realQty = 192;
    const cost = 500;
    const market = 470;
    const lost = step('減った数量(帳簿 − 実地)', 'sub', [bookQty, realQty]);
    const loss = times('棚卸減耗損(原価 × 減った数量)', cost, lost.value);
    const wrongMarket = times('誤答: 時価 × 減った数量', market, lost.value);
    questions.push(
      journalQ({
        id: 'C01-005',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、商品の帳簿数量は ${bookQty}個、実地数量は ${realQty}個だった。原価は @${yen(cost)}、時価(正味売却価額)は @${yen(market)} である。棚卸減耗損を計上する(商品評価損はこの問題では考えない)。`,
        choices: ['棚卸減耗損', '商品評価損', '繰越商品', '仕入', '商品', '売上原価'],
        debit: [line('棚卸減耗損', loss.value)],
        credit: [line('繰越商品', loss.value)],
        calc: [lost, loss],
        explanation: `なくなった ${lost.value}個は、もう手元にないので **原価** のまま損失にする。原価 × 減った数量 = ${yen(loss.value)}。繰越商品(在庫)を減らす。`,
        mistakes: [
          {
            entry: { debit: [line('棚卸減耗損', wrongMarket.value)], credit: [line('繰越商品', wrongMarket.value)] },
            why: '棚卸減耗損は原価で計算する。時価は、手元に残っている商品の評価(商品評価損)に使う。',
          },
          {
            entry: { debit: [line('商品評価損', loss.value)], credit: [line('繰越商品', loss.value)] },
            why: '数量が減ったことによる損失は棚卸減耗損。商品評価損は、値下がりによる損失。',
          },
        ],
        ref: { topic: T, anchor: 'inventory' },
      }),
    );
  }

  // 6. 商品評価損
  {
    const bookQty = 200;
    const realQty = 192;
    const cost = 500;
    const market = 470;
    const diff = step('値下がり(原価 − 時価)', 'sub', [cost, market]);
    const loss = times('商品評価損(値下がり × 実地数量)', diff.value, realQty);
    const wrongBook = times('誤答: 値下がり × 帳簿数量', diff.value, bookQty);
    questions.push(
      journalQ({
        id: 'C01-006',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、商品の帳簿数量は ${bookQty}個、実地数量は ${realQty}個だった。原価は @${yen(cost)}、時価(正味売却価額)は @${yen(market)} である。棚卸減耗損は計上済みとして、商品評価損を計上する。`,
        choices: ['棚卸減耗損', '商品評価損', '繰越商品', '仕入', '商品', '売上原価'],
        debit: [line('商品評価損', loss.value)],
        credit: [line('繰越商品', loss.value)],
        calc: [diff, loss],
        explanation: `値下がりした ${yen(diff.value)} を、手元に **実際にある** ${realQty}個にかける。(原価 − 時価)× 実地数量 = ${yen(loss.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('商品評価損', wrongBook.value)], credit: [line('繰越商品', wrongBook.value)] },
            why: '帳簿数量ではなく実地数量にかける。なくなった分は、棚卸減耗損として原価で処理済み。',
          },
        ],
        ref: { topic: T, anchor: 'inventory' },
      }),
    );
  }

  // 7. 期末商品の図(表)
  {
    const bookQty = 150;
    const realQty = 144;
    const cost = 1200;
    const market = 1100;
    const bookAmt = times('帳簿棚卸高(原価 × 帳簿数量)', cost, bookQty);
    const lost = step('減った数量', 'sub', [bookQty, realQty]);
    const loss = times('棚卸減耗損(原価 × 減った数量)', cost, lost.value);
    const diff = step('原価 − 時価', 'sub', [cost, market]);
    const evalLoss = times('商品評価損((原価 − 時価)× 実地数量)', diff.value, realQty);
    const bs = times('貸借対照表の商品(時価 × 実地数量)', market, realQty);
    const wrongEval = times('誤答: (原価 − 時価)× 帳簿数量', diff.value, bookQty);
    // 選択肢はスマホの選択欄に収まるよう短くする(差額 = 原価 − 時価、減少 = 帳簿数量 − 実地数量)
    const F = ['原価×帳簿', '原価×減少', '時価×減少', '差額×実地', '差額×帳簿', '時価×実地'];
    const sel = (a) => blankSelect(F, a);
    questions.push(
      tableQ({
        id: 'C01-007',
        topic: T,
        difficulty: 3,
        prompt: `決算にあたり、商品の帳簿数量は ${bookQty}個、実地数量は ${realQty}個、原価は @${yen(cost)}、時価(正味売却価額)は @${yen(market)} だった。期末商品の図の空欄に、計算のしかたと金額を入れなさい。計算のしかたの「帳簿」は帳簿数量、「実地」は実地数量、「減少」は減った数量(帳簿 − 実地)、「差額」は原価 − 時価のこと。`,
        table: {
          title: '期末商品の金額',
          columns: [{ label: '項目' }, { label: '計算のしかた' }, { label: '金額', align: 'right' }],
          rows: [
            ['帳簿棚卸高', sel('原価×帳簿'), blankNum(bookAmt.value)],
            ['棚卸減耗損', sel('原価×減少'), blankNum(loss.value)],
            ['商品評価損', sel('差額×実地'), blankNum(evalLoss.value)],
            ['貸借対照表の商品', sel('時価×実地'), blankNum(bs.value)],
          ],
        },
        checks: [{ label: '帳簿棚卸高 − 減耗損 − 評価損 = 貸借対照表の商品', op: 'sub', args: [[0, 2], [1, 2], [2, 2]], result: [3, 2] }],
        calc: [bookAmt, lost, loss, diff, evalLoss, bs],
        explanation: `帳簿棚卸高 ${yen(bookAmt.value)} から、棚卸減耗損 ${yen(loss.value)}(原価のまま)と商品評価損 ${yen(evalLoss.value)}(値下がり分 × 実地数量)を引くと、貸借対照表の商品 ${yen(bs.value)}(時価 × 実地数量)と一致する。`,
        mistakes: [
          { cell: [1, 1], value: '時価×減少', why: 'なくなった商品は原価のまま損失にする。棚卸減耗損は原価 × 減った数量。' },
          { cell: [2, 1], value: '差額×帳簿', why: '値下がりは手元にある商品だけ。実地数量にかける。' },
          { cell: [2, 2], value: wrongEval.value, calc: [diff, wrongEval], why: '帳簿数量ではなく実地数量にかける。' },
        ],
        ref: { topic: T, anchor: 'box' },
      }),
    );
  }

  // 8. 減耗損・評価損を売上原価に算入
  {
    const loss = 6400;
    const evalLoss = 9300;
    const total = step('売上原価に算入する額(減耗損 + 評価損)', 'add', [loss, evalLoss]);
    questions.push(
      journalQ({
        id: 'C01-008',
        topic: T,
        difficulty: 2,
        prompt: `決算で計上した棚卸減耗損 ${yen(loss)} と商品評価損 ${yen(evalLoss)} を、売上原価に算入する。売上原価は仕入勘定で計算している。`,
        choices: ['仕入', '棚卸減耗損', '商品評価損', '繰越商品', '売上原価', '損益'],
        debit: [line('仕入', total.value)],
        credit: [line('棚卸減耗損', loss), line('商品評価損', evalLoss)],
        calc: [total],
        explanation: '売上原価を仕入勘定で計算しているので、売上原価に含める費用は **仕入** に振り替える。棚卸減耗損・商品評価損は貸方に書いて消す。',
        mistakes: [
          {
            entry: { debit: [line('棚卸減耗損', loss), line('商品評価損', evalLoss)], credit: [line('仕入', total.value)] },
            why: '貸借が逆。減耗損・評価損(費用)を消して、仕入(売上原価)を増やす。',
          },
          {
            entry: { debit: [line('売上原価', total.value)], credit: [line('棚卸減耗損', loss), line('商品評価損', evalLoss)] },
            why: '売上原価は仕入勘定で計算している指示なので、売上原価勘定ではなく仕入に振り替える。',
          },
        ],
        ref: { topic: T, anchor: 'inventory' },
      }),
    );
  }

  // 9. 売上原価(減耗損・評価損を含める)(数値)
  {
    const begin = 60000;
    const purchases = 500000;
    const bookEnd = 80000;
    const loss = 4000;
    const evalLoss = 3000;
    const s1 = step('期首 + 仕入', 'add', [begin, purchases]);
    const s2 = step('− 帳簿棚卸高', 'sub', [s1.value, bookEnd]);
    const cogs = step('+ 棚卸減耗損 + 商品評価損(売上原価)', 'add', [s2.value, loss, evalLoss]);
    const bsEnd = step('誤答用: 貸借対照表の商品(帳簿棚卸高 − 減耗損 − 評価損)', 'sub', [bookEnd, loss, evalLoss]);
    const d1 = step('誤答: 期首 + 仕入 − 貸借対照表の商品', 'sub', [s1.value, bsEnd.value]);
    const doubled = step('誤答: さらに減耗損・評価損を足した', 'add', [d1.value, loss, evalLoss]);
    questions.push(
      numericQ({
        id: 'C01-009',
        topic: T,
        difficulty: 3,
        prompt: `期首商品棚卸高 ${yen(begin)}、当期の純仕入高 ${yen(purchases)}、期末商品の帳簿棚卸高 ${yen(bookEnd)} である。決算で棚卸減耗損 ${yen(loss)} と商品評価損 ${yen(evalLoss)} を計上し、どちらも売上原価に算入する。売上原価はいくらか。`,
        answer: cogs.value,
        calc: [s1, s2, cogs],
        explanation: '期首 + 仕入 − 帳簿棚卸高 で、まず売れた分の原価を出す。売上原価に算入する指示があるので、棚卸減耗損と商品評価損を足す。',
        mistakes: [
          { value: s2.value, calc: [s1, s2], why: '減耗損・評価損を売上原価に算入する指示がある。足すのを忘れている。' },
          {
            value: doubled.value,
            calc: [s1, bsEnd, d1, doubled],
            why: '貸借対照表の商品(減耗損・評価損を引いたあと)で差し引くと、減耗損・評価損がすでに入っている。そこにまた足すと二重になる。',
          },
        ],
        ref: { topic: T, anchor: 'inventory' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C01-010',
      topic: T,
      difficulty: 2,
      prompt: '次のうち、正しいものをすべて選びなさい。',
      options: [
        '時価が原価より高いときは、評価替をせず原価のままにする',
        '棚卸減耗損は、原価 × 減った数量で計算する',
        '商品評価損は、(原価 − 時価)× 帳簿数量で計算する',
        '仕入割戻を受けたときは、仕入を減らす',
        '総平均法では、仕入のたびに平均単価を計算し直す',
      ],
      answer: [0, 1, 3],
      explanation:
        '評価損は値下がりしたときだけで、評価益は計上しない。減耗損は原価で、評価損は **実地数量** で計算する。仕入割戻は仕入を減らす。仕入のたびに単価を出し直すのは移動平均法で、総平均法は期間の最後に一度だけ。',
      mistakes: [
        { options: [0, 1, 2, 3], why: '商品評価損は実地数量にかける。なくなった分は減耗損として処理済み。' },
        { options: [0, 1, 3, 4], why: '仕入のたびに単価を出し直すのは移動平均法。総平均法は期間の最後にまとめて出す。' },
        { options: [1, 3], why: '時価が原価より高いときは評価替をしない(評価益は計上しない)。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'inventory' },
    }),
  );

  // 11. 売上総利益(補助簿の集計)(数値)
  {
    const gross = 1500000;
    const returned = 30000;
    const cogs = 1020000;
    const netSales = step('純売上高(総売上高 − 売上戻り)', 'sub', [gross, returned]);
    const profit = step('売上総利益(純売上高 − 売上原価)', 'sub', [netSales.value, cogs]);
    const noReturn = step('誤答: 売上戻りを引いていない', 'sub', [gross, cogs]);
    questions.push(
      numericQ({
        id: 'C01-011',
        topic: T,
        difficulty: 2,
        prompt: `売上帳を集計したところ、総売上高は ${yen(gross)}、売上戻り(返品)は ${yen(returned)} だった。売上原価は ${yen(cogs)} である。売上総利益はいくらか。`,
        answer: profit.value,
        calc: [netSales, profit],
        explanation: `純売上高 = 総売上高 − 売上戻り = ${yen(netSales.value)}。売上総利益 = 純売上高 − 売上原価。`,
        mistakes: [{ value: noReturn.value, calc: [noReturn], why: '返品された分は売上ではない。売上戻りを差し引いた純売上高から計算する。' }],
        ref: { topic: T, anchor: 'subledgers' },
      }),
    );
  }

  // 12. 貸借対照表の商品(数値)
  {
    const bookQty = 80;
    const realQty = 76;
    const cost = 2500;
    const market = 2300;
    const bs = times('貸借対照表の商品(時価 × 実地数量)', market, realQty);
    const wrongCost = times('誤答: 原価 × 実地数量', cost, realQty);
    const wrongBook = times('誤答: 時価 × 帳簿数量', market, bookQty);
    questions.push(
      numericQ({
        id: 'C01-012',
        topic: T,
        difficulty: 2,
        prompt: `期末の商品の帳簿数量は ${bookQty}個、実地数量は ${realQty}個、原価は @${yen(cost)}、時価(正味売却価額)は @${yen(market)} である。棚卸減耗損と商品評価損を計上したあと、貸借対照表に表示する商品の金額はいくらか。`,
        answer: bs.value,
        calc: [bs],
        explanation: '減耗損(なくなった分)と評価損(値下がり分)を引いた残りは、手元にある商品を時価で評価した額。時価 × 実地数量で直接求められる。',
        mistakes: [
          { value: wrongCost.value, calc: [wrongCost], why: '値下がりしているので、評価損を引いた時価で表示する。原価のままではない。' },
          { value: wrongBook.value, calc: [wrongBook], why: 'なくなった分は棚卸減耗損で減らしている。実地数量で計算する。' },
        ],
        ref: { topic: T, anchor: 'box' },
      }),
    );
  }

  return { topic: T, questions };
}
