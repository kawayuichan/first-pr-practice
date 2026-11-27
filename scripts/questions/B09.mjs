// B09 有形固定資産① の問題(12問)
// 仕訳8問・数値2問・表1問(固定資産台帳)・複数選択1問。金額はすべて step() で計算する。
// 決めたこと: 期中の取得・売却の月割は B09 で扱う。改良と修繕も扱う(区分表に明記がないので needs_review)。
// 除却・廃棄の科目は公式の勘定科目表どおり固定資産除却損(固定資産廃棄損は許容)。
// 200%定率法(保証率・改定償却率)・直接法・生産高比例法・買換えは C11。

import { blankNum, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B09';
const PERIOD = '会計期間は4月1日から3月31日までの1年である。';

export default function build() {
  const questions = [];

  // 1. 取得(付随費用)
  {
    const price = 450000;
    const freight = 15000;
    const install = 25000;
    const cost = step('取得原価(購入代価 + 運送費 + 据付費)', 'add', [price, freight, install]);
    const fees = step('誤答: 付随費用の合計', 'add', [freight, install]);
    questions.push(
      journalQ({
        id: 'B09-001',
        topic: T,
        difficulty: 1,
        prompt: `営業用の備品 ${yen(price)} を購入し、運送費 ${yen(freight)} と据付費 ${yen(install)} とあわせて、代金は月末に支払うことにした。`,
        choices: ['備品', '支払手数料', '未払金', '買掛金', '仕入', '普通預金'],
        debit: [line('備品', cost.value)],
        credit: [line('未払金', cost.value)],
        calc: [cost],
        explanation: `使える状態にするまでの運送費・据付費(**付随費用**)は取得原価に含める。備品は ${yen(cost.value)}。商品ではないので、あとで払う代金は **未払金**。`,
        mistakes: [
          {
            entry: { debit: [line('備品', price), line('支払手数料', fees.value)], credit: [line('未払金', cost.value)] },
            why: '運送費・据付費は、備品を使える状態にするための費用なので備品の取得原価に含める。費用にしない。',
          },
          {
            entry: { debit: [line('備品', cost.value)], credit: [line('買掛金', cost.value)] },
            why: '買掛金は商品の代金だけ。備品の代金は未払金。',
          },
        ],
        ref: { topic: T, anchor: 'acquire' },
      }),
    );
  }

  // 2. 改良と修繕(区分表に明記がないので needs_review)
  {
    const total = 600000;
    const improve = 400000;
    const repair = step('修繕(支払額 − 改良)', 'sub', [total, improve]);
    questions.push(
      journalQ({
        id: 'B09-002',
        topic: T,
        difficulty: 2,
        prompt: `建物の改良と修繕を行い、代金 ${yen(total)} を普通預金口座から支払った。このうち ${yen(improve)} は建物の価値を高め、使える年数を延ばす改良で、残りは壊れたところを元の状態に戻す修繕である。`,
        choices: ['建物', '修繕費', '普通預金', '未払金', '建物減価償却累計額', '減価償却費'],
        debit: [line('建物', improve), line('修繕費', repair.value)],
        credit: [line('普通預金', total)],
        calc: [repair],
        explanation: `価値を高める **改良**(資本的支出)${yen(improve)} は建物(資産)に加える。元に戻すだけの **修繕**(収益的支出)${yen(repair.value)} は修繕費(費用)。`,
        mistakes: [
          {
            entry: { debit: [line('修繕費', total)], credit: [line('普通預金', total)] },
            why: `改良の ${yen(improve)} は建物の価値を高めるので、費用ではなく建物(資産)に加える。`,
          },
          {
            entry: { debit: [line('建物', total)], credit: [line('普通預金', total)] },
            why: `修繕の ${yen(repair.value)} は元に戻すだけで価値は上がらないので、修繕費(費用)にする。`,
          },
        ],
        ref: { topic: T, anchor: 'improve' },
        needs_review: true,
        needs_review_reason:
          '区分表の有形固定資産(第二10)には資本的支出・収益的支出の明記がない。「ア 有形固定資産の取得」の一部として扱うことにした(scope.md 8章の6)。処理そのものは一般的な会計処理(改良は資産、修繕は費用)。',
      }),
    );
  }

  // 3. 定額法(残存価額あり)
  {
    const cost = 3000000;
    const life = 30;
    const r1 = step('取得原価 × 10', 'mul', [cost, 10]);
    const residual = step('残存価額(取得原価の10% = ÷ 100)', 'div', [r1.value, 100]);
    const base = step('償却する額(取得原価 − 残存価額)', 'sub', [cost, residual.value]);
    const dep = step(`1年分の減価償却費(÷ 耐用年数${life}年)`, 'div', [base.value, life]);
    const noResidual = step('誤答: 残存価額を引かずに割った', 'div', [cost, life]);
    questions.push(
      journalQ({
        id: 'B09-003',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、建物(取得原価 ${yen(cost)}、残存価額は取得原価の10%、耐用年数${life}年)の減価償却を定額法で行う。記帳は間接法による。`,
        choices: ['減価償却費', '建物減価償却累計額', '建物', '修繕費', '固定資産除却損', '未払金'],
        debit: [line('減価償却費', dep.value)],
        credit: [line('建物減価償却累計額', dep.value)],
        calc: [r1, residual, base, dep],
        explanation: `残存価額は ${yen(residual.value)}。(取得原価 − 残存価額)÷ ${life}年 = ${yen(dep.value)}。間接法なので、建物は減らさずに **建物減価償却累計額** に積み上げる。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', noResidual.value)], credit: [line('建物減価償却累計額', noResidual.value)] },
            why: '残存価額(取得原価の10%)を引いてから耐用年数で割る。',
          },
          {
            entry: { debit: [line('減価償却費', dep.value)], credit: [line('建物', dep.value)] },
            why: '記帳は間接法。建物を直接減らすのではなく、建物減価償却累計額を使う。',
          },
        ],
        ref: { topic: T, anchor: 'depreciation' },
      }),
    );
  }

  // 4. 定額法: 3年後の帳簿価額(数値)
  {
    const cost = 900000;
    const life = 6;
    const years = 4;
    const dep = step(`1年分の減価償却費(÷ ${life}年)`, 'div', [cost, life]);
    const acc = step(`${years}年分の減価償却累計額`, 'mul', [dep.value, years]);
    const book = step('帳簿価額(取得原価 − 減価償却累計額)', 'sub', [cost, acc.value]);
    const oneYear = step('誤答: 1年分しか引いていない', 'sub', [cost, dep.value]);
    questions.push(
      numericQ({
        id: 'B09-004',
        topic: T,
        difficulty: 1,
        prompt: `備品(取得原価 ${yen(cost)}、残存価額ゼロ、耐用年数${life}年)を、定額法で${years}年間償却した。${years}年目の決算後の帳簿価額はいくらか。`,
        answer: book.value,
        calc: [dep, acc, book],
        explanation: `定額法は毎年同じ ${yen(dep.value)}。${years}年分の減価償却累計額は ${yen(acc.value)} で、帳簿価額 = 取得原価 − 減価償却累計額。`,
        mistakes: [
          { value: oneYear.value, calc: [dep, oneYear], why: `${years}年分の減価償却が積み上がっている。1年分だけでなく${years}年分を引く。` },
          { value: acc.value, calc: [dep, acc], why: 'これは減価償却累計額。帳簿価額は、取得原価から減価償却累計額を引いた残り。' },
        ],
        ref: { topic: T, anchor: 'compare' },
      }),
    );
  }

  // 5. 期中に取得(月割)(数値)
  {
    const cost = 480000;
    const life = 4;
    const months = 5;
    const year = step(`1年分の減価償却費(÷ ${life}年)`, 'div', [cost, life]);
    const x = step(`1年分 × ${months}か月(11月〜3月)`, 'mul', [year.value, months]);
    const dep = step('月割の減価償却費(÷ 12)', 'div', [x.value, 12]);
    const x4 = step('誤答: 1年分 × 4か月', 'mul', [year.value, 4]);
    const dep4 = step('誤答: 4か月で月割', 'div', [x4.value, 12]);
    questions.push(
      numericQ({
        id: 'B09-005',
        topic: T,
        difficulty: 2,
        prompt: `${PERIOD}当期の11月1日に備品 ${yen(cost)}(残存価額ゼロ、耐用年数${life}年)を購入し、すぐに使い始めた。決算で定額法により月割で計上する減価償却費はいくらか。`,
        answer: dep.value,
        calc: [year, x, dep],
        explanation: `1年分は ${yen(year.value)}。使ったのは11月・12月・1月・2月・3月の **${months}か月** なので、${months}/12 にする。`,
        mistakes: [
          { value: year.value, calc: [year], why: '期の途中で買ったので、使った月数だけの月割にする。1年分ではない。' },
          { value: dep4.value, calc: [year, x4, dep4], why: '11月から3月までは、11月も入れて5か月。' },
        ],
        ref: { topic: T, anchor: 'monthly' },
      }),
    );
  }

  // 6. 期首に売却(売却益)
  {
    const cost = 800000;
    const acc = 480000;
    const price = 350000;
    const book = step('帳簿価額(取得原価 − 減価償却累計額)', 'sub', [cost, acc]);
    const gain = step('売却益(売却価額 − 帳簿価額)', 'sub', [price, book.value]);
    const wrongLoss = step('誤答: 取得原価と比べた差額', 'sub', [cost, price]);
    questions.push(
      journalQ({
        id: 'B09-006',
        topic: T,
        difficulty: 2,
        prompt: `備品(取得原価 ${yen(cost)}、減価償却累計額 ${yen(acc)})を期首に ${yen(price)} で売却し、代金は月末に受け取ることにした。記帳は間接法による。`,
        choices: ['未収入金', '売掛金', '備品', '備品減価償却累計額', '固定資産売却益', '固定資産売却損'],
        debit: [line('未収入金', price), line('備品減価償却累計額', acc)],
        credit: [line('備品', cost), line('固定資産売却益', gain.value)],
        calc: [book, gain],
        explanation: `備品と減価償却累計額をどちらも消す。帳簿価額は ${yen(book.value)} で、売却価額 ${yen(price)} のほうが多いので、差額 ${yen(gain.value)} が **固定資産売却益**。代金は商品ではないので未収入金。`,
        mistakes: [
          {
            entry: { debit: [line('未収入金', price), line('固定資産売却損', wrongLoss.value)], credit: [line('備品', cost)] },
            why: '売却益・売却損は帳簿価額(取得原価 − 減価償却累計額)と比べる。減価償却累計額も消す。',
          },
          {
            entry: { debit: [line('売掛金', price), line('備品減価償却累計額', acc)], credit: [line('備品', cost), line('固定資産売却益', gain.value)] },
            why: '備品は商品ではないので、あとで受け取る代金は売掛金ではなく未収入金。',
          },
        ],
        ref: { topic: T, anchor: 'sale' },
      }),
    );
  }

  // 7. 期中に売却(月割の減価償却 + 売却損)
  {
    const cost = 1500000;
    const acc = 900000;
    const life = 5;
    const price = 400000;
    const months = 5;
    const year = step(`1年分の減価償却費(÷ ${life}年)`, 'div', [cost, life]);
    const x = step(`1年分 × ${months}か月(4月〜8月)`, 'mul', [year.value, months]);
    const dep = step('当期の減価償却費(÷ 12)', 'div', [x.value, 12]);
    const book = step('売る直前の帳簿価額(取得原価 − 期首の累計額 − 当期の償却費)', 'sub', [cost, acc, dep.value]);
    const loss = step('売却損(帳簿価額 − 売却価額)', 'sub', [book.value, price]);
    const noDep = step('誤答: 当期の減価償却費を計上しない売却損', 'sub', [cost, acc, price]);
    questions.push(
      journalQ({
        id: 'B09-007',
        topic: T,
        difficulty: 3,
        prompt: `${PERIOD}車両運搬具(取得原価 ${yen(cost)}、期首の減価償却累計額 ${yen(acc)}、残存価額ゼロ、耐用年数${life}年、定額法)を8月31日に ${yen(price)} で売却し、代金は普通預金口座に振り込まれた。当期の減価償却費は月割で計上する。記帳は間接法による。`,
        choices: ['車両運搬具', '車両運搬具減価償却累計額', '減価償却費', '普通預金', '固定資産売却損', '固定資産売却益', '未収入金'],
        debit: [
          line('車両運搬具減価償却累計額', acc),
          line('減価償却費', dep.value),
          line('普通預金', price),
          line('固定資産売却損', loss.value),
        ],
        credit: [line('車両運搬具', cost)],
        calc: [year, x, dep, book, loss],
        explanation: `先に4月〜8月の${months}か月分の減価償却費 ${yen(dep.value)} を計上する。売る直前の帳簿価額は ${yen(book.value)} で、売却価額 ${yen(price)} のほうが少ないので、差額 ${yen(loss.value)} が **固定資産売却損**。`,
        mistakes: [
          {
            entry: {
              debit: [line('車両運搬具減価償却累計額', acc), line('普通預金', price), line('固定資産売却損', noDep.value)],
              credit: [line('車両運搬具', cost)],
            },
            why: `期の途中で売ったので、4月から売った月までの${months}か月分の減価償却費を先に計上する。その分、売却損は小さくなる。`,
          },
        ],
        ref: { topic: T, anchor: 'sale' },
      }),
    );
  }

  // 8. 除却(貯蔵品)
  {
    const cost = 600000;
    const acc = 500000;
    const scrap = 40000;
    const loss = step('除却損(取得原価 − 累計額 − 売れる見込みの額)', 'sub', [cost, acc, scrap]);
    const noScrap = step('誤答: 貯蔵品を書かない除却損', 'sub', [cost, acc]);
    questions.push(
      journalQ({
        id: 'B09-008',
        topic: T,
        difficulty: 2,
        prompt: `備品(取得原価 ${yen(cost)}、減価償却累計額 ${yen(acc)})を除却した。この備品は ${yen(scrap)} で売却できる見込みである。記帳は間接法による。`,
        choices: ['備品', '備品減価償却累計額', '貯蔵品', '固定資産除却損', '固定資産売却損', '現金'],
        debit: [line('備品減価償却累計額', acc), line('貯蔵品', scrap), line('固定資産除却損', loss.value)],
        credit: [line('備品', cost)],
        calc: [loss],
        explanation: `備品と減価償却累計額を消す。売れる見込みの ${yen(scrap)} は **貯蔵品**(資産)として残し、残りの ${yen(loss.value)} を **固定資産除却損** にする。`,
        mistakes: [
          {
            entry: { debit: [line('備品減価償却累計額', acc), line('固定資産除却損', noScrap.value)], credit: [line('備品', cost)] },
            why: `売れる見込みの ${yen(scrap)} は価値が残っているので、貯蔵品(資産)にする。全部を損失にしない。`,
          },
          {
            entry: { debit: [line('備品減価償却累計額', acc), line('現金', scrap), line('固定資産除却損', loss.value)], credit: [line('備品', cost)] },
            why: 'まだ売っていないので現金は受け取っていない。売れる見込みの分は貯蔵品にする。',
          },
        ],
        ref: { topic: T, anchor: 'disposal' },
      }),
    );
  }

  // 9. 廃棄(廃棄の費用を含める)
  {
    const cost = 250000;
    const acc = 225000;
    const fee = 8000;
    const book = step('帳簿価額(取得原価 − 累計額)', 'sub', [cost, acc]);
    const loss = step('除却損(帳簿価額 + 廃棄の費用)', 'add', [book.value, fee]);
    questions.push(
      journalQ({
        id: 'B09-009',
        topic: T,
        difficulty: 2,
        prompt: `備品(取得原価 ${yen(cost)}、減価償却累計額 ${yen(acc)})を廃棄し、廃棄のための費用 ${yen(fee)} を現金で支払った。記帳は間接法による。`,
        choices: ['備品', '備品減価償却累計額', '固定資産除却損', '固定資産廃棄損', '支払手数料', '現金'],
        debit: [line('備品減価償却累計額', acc), line('固定資産除却損', loss.value)],
        credit: [line('備品', cost), line('現金', fee)],
        calc: [book, loss],
        explanation: `帳簿価額 ${yen(book.value)} と、廃棄にかかった費用 ${yen(fee)} をあわせた ${yen(loss.value)} が損失。公式の勘定科目表では標準の科目は **固定資産除却損**(固定資産廃棄損でも正解)。`,
        mistakes: [
          {
            entry: {
              debit: [line('備品減価償却累計額', acc), line('固定資産除却損', book.value), line('支払手数料', fee)],
              credit: [line('備品', cost), line('現金', fee)],
            },
            why: '廃棄にかかった費用は、廃棄による損失に含める。支払手数料に分けない。',
          },
          {
            entry: { debit: [line('備品減価償却累計額', acc), line('固定資産除却損', book.value)], credit: [line('備品', cost)] },
            why: `廃棄の費用 ${yen(fee)} を現金で払っている。現金を減らし、その分も損失に含める。`,
          },
        ],
        ref: { topic: T, anchor: 'disposal' },
      }),
    );
  }

  // 10. 定率法(2年目以降)
  {
    const cost = 1000000;
    const acc = 360000;
    const rate = 20;
    const book = step('期首の帳簿価額(取得原価 − 累計額)', 'sub', [cost, acc]);
    const x = step(`帳簿価額 × ${rate}`, 'mul', [book.value, rate]);
    const dep = step(`減価償却費(÷ 100 = 償却率 0.${rate})`, 'div', [x.value, 100]);
    const xc = step('誤答: 取得原価 × 20', 'mul', [cost, rate]);
    const depCost = step('誤答: 取得原価に償却率をかけた', 'div', [xc.value, 100]);
    questions.push(
      journalQ({
        id: 'B09-010',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、備品(取得原価 ${yen(cost)}、減価償却累計額 ${yen(acc)})の減価償却を定率法(償却率 0.${rate})で行う。記帳は間接法による。`,
        choices: ['減価償却費', '備品減価償却累計額', '備品', '固定資産除却損', '修繕費', '未払金'],
        debit: [line('減価償却費', dep.value)],
        credit: [line('備品減価償却累計額', dep.value)],
        calc: [book, x, dep],
        explanation: `定率法は **期首の帳簿価額** × 償却率。帳簿価額は ${yen(book.value)} なので、減価償却費は ${yen(dep.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', depCost.value)], credit: [line('備品減価償却累計額', depCost.value)] },
            why: '定率法は、取得原価ではなく帳簿価額(取得原価 − 減価償却累計額)に償却率をかける。',
          },
          {
            entry: { debit: [line('減価償却費', dep.value)], credit: [line('備品', dep.value)] },
            why: '記帳は間接法。備品を直接減らさず、備品減価償却累計額を使う。',
          },
        ],
        ref: { topic: T, anchor: 'depreciation' },
      }),
    );
  }

  // 11. 固定資産台帳(表)
  {
    const a = { cost: 500000, acc: 200000, life: 5 };
    const b = { cost: 800000, acc: 350000, rate: 25 };
    const c = { cost: 240000, life: 4, months: 6 };
    const aDep = step('備品Aの減価償却費(÷ 5年)', 'div', [a.cost, a.life]);
    const aEnd = step('備品Aの期末の帳簿価額', 'sub', [a.cost, a.acc, aDep.value]);
    const bBook = step('備品Bの期首の帳簿価額', 'sub', [b.cost, b.acc]);
    const bX = step('備品Bの帳簿価額 × 25', 'mul', [bBook.value, b.rate]);
    const bDep = step('備品Bの減価償却費(÷ 100)', 'div', [bX.value, 100]);
    const bEnd = step('備品Bの期末の帳簿価額', 'sub', [b.cost, b.acc, bDep.value]);
    const cYear = step('備品Cの1年分(÷ 4年)', 'div', [c.cost, c.life]);
    const cX = step('備品Cの1年分 × 6か月(10月〜3月)', 'mul', [cYear.value, c.months]);
    const cDep = step('備品Cの減価償却費(÷ 12)', 'div', [cX.value, 12]);
    const cEnd = step('備品Cの期末の帳簿価額', 'sub', [c.cost, cDep.value]);
    const depTotal = step('当期の減価償却費の合計', 'add', [aDep.value, bDep.value, cDep.value]);
    const endTotal = step('期末の帳簿価額の合計', 'add', [aEnd.value, bEnd.value, cEnd.value]);
    const bWx = step('誤答: 備品Bの取得原価 × 25', 'mul', [b.cost, b.rate]);
    const bWrong = step('誤答: 備品Bで取得原価に償却率をかけた', 'div', [bWx.value, 100]);
    questions.push(
      tableQ({
        id: 'B09-011',
        topic: T,
        difficulty: 3,
        prompt: `${PERIOD}次の固定資産台帳の空欄を埋めなさい。どれも残存価額ゼロ。備品Aは定額法(耐用年数${a.life}年)、備品Bは定率法(償却率 0.${b.rate})、備品Cは当期の10月1日に購入し定額法(耐用年数${c.life}年)で月割償却する。`,
        table: {
          title: '固定資産台帳(当期末)',
          columns: [
            { label: '名称' },
            { label: '取得原価', align: 'right' },
            { label: '期首の累計額', align: 'right' },
            { label: '当期の償却費', align: 'right' },
            { label: '期末の帳簿価額', align: 'right' },
          ],
          rows: [
            ['備品A', a.cost, a.acc, blankNum(aDep.value), blankNum(aEnd.value)],
            ['備品B', b.cost, b.acc, blankNum(bDep.value), blankNum(bEnd.value)],
            ['備品C', c.cost, null, blankNum(cDep.value), blankNum(cEnd.value)],
            ['合計', null, null, blankNum(depTotal.value), blankNum(endTotal.value)],
          ],
        },
        checks: [
          { label: '備品Aの期末の帳簿価額', op: 'sub', args: [[0, 1], [0, 2], [0, 3]], result: [0, 4] },
          { label: '備品Bの期末の帳簿価額', op: 'sub', args: [[1, 1], [1, 2], [1, 3]], result: [1, 4] },
          { label: '備品Cの期末の帳簿価額(期首の累計額はゼロ)', op: 'sub', args: [[2, 1], 0, [2, 3]], result: [2, 4] },
          { label: '当期の償却費の合計', op: 'add', args: [[0, 3], [1, 3], [2, 3]], result: [3, 3] },
          { label: '期末の帳簿価額の合計', op: 'add', args: [[0, 4], [1, 4], [2, 4]], result: [3, 4] },
        ],
        calc: [aDep, aEnd, bBook, bX, bDep, bEnd, cYear, cX, cDep, cEnd, depTotal, endTotal],
        explanation: `期末の帳簿価額 = 取得原価 − 期首の累計額 − 当期の償却費。備品Bは定率法なので、期首の帳簿価額 ${yen(bBook.value)} に償却率をかける。備品Cは10月〜3月の6か月分。`,
        mistakes: [
          {
            cell: [1, 3],
            value: bWrong.value,
            calc: [bWx, bWrong],
            why: '定率法は、取得原価ではなく期首の帳簿価額(取得原価 − 期首の累計額)に償却率をかける。',
          },
          {
            cell: [2, 3],
            value: cYear.value,
            calc: [cYear],
            why: '備品Cは10月1日に買ったので、10月〜3月の6か月分だけ月割で償却する。',
          },
        ],
        ref: { topic: T, anchor: 'ledger' },
      }),
    );
  }

  // 12. 取得原価に含めるもの(複数選択)
  {
    const O = [
      '建物の購入代価',
      '購入した備品を運ぶための運送費',
      '機械を使える状態にするための据付費',
      '土地を買うときの仲介手数料と登記費用',
      '購入したあとに毎年かかる固定資産税',
      '購入したあとに壊れた部分を元に戻す修繕の費用',
    ];
    questions.push(
      multiQ({
        id: 'B09-012',
        topic: T,
        difficulty: 2,
        prompt: '次のうち、有形固定資産の取得原価に含めるものをすべて選びなさい。',
        options: O,
        answer: [0, 1, 2, 3],
        explanation:
          '取得原価 = 購入代価 + **使える状態にするまでの付随費用**(運送費・据付費・仲介手数料・登記費用など)。買ったあとに毎年かかる固定資産税は租税公課、元に戻す修繕は修繕費(どちらも費用)。',
        mistakes: [
          { options: [0, 1, 2, 3, 4], why: '固定資産税は、持っている間に毎年かかる税金。取得原価ではなく租税公課(費用)。' },
          { options: [0], why: '運送費・据付費・仲介手数料・登記費用などの付随費用も、取得原価に含める。' },
          { options: [0, 1, 2, 3, 5], why: '元の状態に戻すだけの修繕は、価値を高めないので修繕費(費用)。' },
        ],
        ref: { topic: T, anchor: 'acquire' },
      }),
    );
  }

  return { topic: T, questions };
}
