// C13 リース(新基準・借手側)の問題(12問)
// 仕訳9問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 新しいリース会計基準: 使用権資産・リース負債。利子込み法と利子抜き法(利息は定額法)。
// 短期・少額リースと不動産の賃借は支払リース料(2級では支払家賃・支払地代を使わない)。
// 旧基準の科目・区分は使わない。リースの識別・リース期間の決定は問題文で与える(1級の論点)。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C13';

export default function build() {
  const questions = [];

  // 1〜3. 利子込み法: 開始 → 支払い → 減価償却
  const g = { annual: 300000, years: 4 };
  const gTotal = step('リース料総額(年額 × 4年)', 'mul', [g.annual, g.years]);
  questions.push(
    journalQ({
      id: 'C13-001',
      topic: T,
      difficulty: 1,
      prompt: `期首に、営業用の車両をリースで借りて使い始めた。リース期間は${g.years}年、リース料は年額 ${yen(g.annual)}(毎年期末に後払い)。利子込み法で処理する。`,
      choices: ['使用権資産', 'リース負債', '車両運搬具', '未払金', '支払リース料', '支払利息'],
      debit: [line('使用権資産', gTotal.value)],
      credit: [line('リース負債', gTotal.value)],
      calc: [gTotal],
      explanation: `借りた車両を使う権利を **使用権資産**、払う義務を **リース負債** として計上する。利子込み法なので、リース料総額 ${yen(gTotal.value)} で計上する。`,
      mistakes: [
        {
          entry: { debit: [line('車両運搬具', gTotal.value)], credit: [line('未払金', gTotal.value)] },
          why: '買ったのではなく借りている。リースで借りたら使用権資産とリース負債。',
        },
        {
          entry: { debit: [line('使用権資産', g.annual)], credit: [line('リース負債', g.annual)] },
          why: `計上するのは1年分ではなく、リース期間全体のリース料総額 ${yen(gTotal.value)}。`,
        },
      ],
      ref: { topic: T, anchor: 'gross' },
    }),
  );
  questions.push(
    journalQ({
      id: 'C13-002',
      topic: T,
      difficulty: 1,
      prompt: `利子込み法で処理しているリース(リース料総額 ${yen(gTotal.value)}、年額 ${yen(g.annual)})について、期末に1回目のリース料を当座預金口座から支払った。`,
      choices: ['リース負債', '当座預金', '支払利息', '支払リース料', '使用権資産', '未払金'],
      debit: [line('リース負債', g.annual)],
      credit: [line('当座預金', g.annual)],
      explanation: '利子込み法では利息を分けていないので、払ったリース料は全額 **リース負債** を減らす。',
      mistakes: [
        {
          entry: { debit: [line('支払リース料', g.annual)], credit: [line('当座預金', g.annual)] },
          why: 'リース負債を計上しているので、払ったらリース負債を減らす。支払リース料は、使用権資産を計上しない賃貸借処理のとき。',
        },
      ],
      ref: { topic: T, anchor: 'gross' },
    }),
  );
  {
    const dep = step('減価償却費(使用権資産 ÷ 4年)', 'div', [gTotal.value, g.years]);
    questions.push(
      journalQ({
        id: 'C13-003',
        topic: T,
        difficulty: 1,
        prompt: `決算。期首に利子込み法で計上した使用権資産 ${yen(gTotal.value)} を、耐用年数${g.years}年(リース期間)、残存価額ゼロ、定額法で減価償却する。記帳は間接法。`,
        choices: ['減価償却費', '使用権資産減価償却累計額', '使用権資産', 'リース負債', '支払リース料', '車両運搬具減価償却累計額'],
        debit: [line('減価償却費', dep.value)],
        credit: [line('使用権資産減価償却累計額', dep.value)],
        calc: [dep],
        explanation: `使用権資産も固定資産と同じように減価償却する。${yen(gTotal.value)} ÷ ${g.years}年 = ${yen(dep.value)}。間接法なので **使用権資産減価償却累計額**。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', dep.value)], credit: [line('車両運搬具減価償却累計額', dep.value)] },
            why: '計上している資産は車両運搬具ではなく使用権資産。累計額も使用権資産減価償却累計額。',
          },
          {
            entry: { debit: [line('減価償却費', dep.value)], credit: [line('リース負債', dep.value)] },
            why: 'リース負債は、リース料を払ったときに減らす。減価償却で減らすのは使用権資産(間接法では累計額に積み上げる)。',
          },
        ],
        ref: { topic: T, anchor: 'gross' },
      }),
    );
  }

  // 4〜6. 利子抜き法: 開始 → 支払い → 減価償却
  const n = { annual: 180000, years: 5, interest: 100000 };
  const nTotal = step('リース料総額(年額 × 5年)', 'mul', [n.annual, n.years]);
  const nAsset = step('使用権資産(総額 − 利息相当額)', 'sub', [nTotal.value, n.interest]);
  const nYearInt = step('1年分の利息(利息相当額 ÷ 5年)', 'div', [n.interest, n.years]);
  questions.push(
    journalQ({
      id: 'C13-004',
      topic: T,
      difficulty: 2,
      prompt: `期首に、備品をリースで借りて使い始めた。リース期間は${n.years}年、リース料は年額 ${yen(n.annual)}(毎年期末に後払い)、リース料総額のうち利息相当額は ${yen(n.interest)}。利子抜き法で処理する。`,
      choices: ['使用権資産', 'リース負債', '前払利息', '支払利息', '備品', '未払金'],
      debit: [line('使用権資産', nAsset.value)],
      credit: [line('リース負債', nAsset.value)],
      calc: [nTotal, nAsset],
      explanation: `利子抜き法では、リース料総額 ${yen(nTotal.value)} から利息相当額 ${yen(n.interest)} を引いた ${yen(nAsset.value)} で計上する。利息は、払うたびに支払利息にする。`,
      mistakes: [
        {
          entry: { debit: [line('使用権資産', nTotal.value)], credit: [line('リース負債', nTotal.value)] },
          why: 'これは利子込み法の金額。利子抜き法では、利息相当額を引いた額で計上する。',
        },
        {
          entry: { debit: [line('使用権資産', nAsset.value), line('前払利息', n.interest)], credit: [line('リース負債', nTotal.value)] },
          why: '利子抜き法では、利息相当額を最初に前払利息として計上しない。使用権資産・リース負債を利息抜きの額で計上し、利息は払うたびに支払利息にする。',
        },
      ],
      ref: { topic: T, anchor: 'net' },
    }),
  );
  {
    const principal = step('リース負債を減らす額(年額 − 1年分の利息)', 'sub', [n.annual, nYearInt.value]);
    questions.push(
      journalQ({
        id: 'C13-005',
        topic: T,
        difficulty: 2,
        prompt: `利子抜き法で処理しているリース(リース期間${n.years}年、年額 ${yen(n.annual)}、利息相当額 ${yen(n.interest)})について、期末に1回目のリース料を普通預金口座から支払った。利息は定額法で配分する。`,
        choices: ['リース負債', '支払利息', '普通預金', '未払利息', '支払リース料', '使用権資産'],
        debit: [line('リース負債', principal.value), line('支払利息', nYearInt.value)],
        credit: [line('普通預金', n.annual)],
        calc: [nYearInt, principal],
        explanation: `1年分の利息は ${yen(n.interest)} ÷ ${n.years}年 = ${yen(nYearInt.value)}(定額法)。払った ${yen(n.annual)} のうち、利息分は **支払利息**、残り ${yen(principal.value)} は **リース負債** を減らす。`,
        mistakes: [
          {
            entry: { debit: [line('リース負債', n.annual)], credit: [line('普通預金', n.annual)] },
            why: '利子抜き法では、払ったリース料に利息が含まれている。利息分は支払利息にする。',
          },
          {
            entry: { debit: [line('支払リース料', n.annual)], credit: [line('普通預金', n.annual)] },
            why: '使用権資産・リース負債を計上しているので、支払リース料は使わない。',
          },
        ],
        ref: { topic: T, anchor: 'net' },
      }),
    );
  }
  {
    const dep = step('減価償却費(使用権資産 ÷ 5年)', 'div', [nAsset.value, n.years]);
    const wrong = step('誤答: リース料総額 ÷ 5年', 'div', [nTotal.value, n.years]);
    questions.push(
      journalQ({
        id: 'C13-006',
        topic: T,
        difficulty: 2,
        prompt: `決算。期首に利子抜き法で計上した使用権資産(リース料総額 ${yen(nTotal.value)}、利息相当額 ${yen(n.interest)})を、耐用年数${n.years}年(リース期間)、残存価額ゼロ、定額法で減価償却する。記帳は間接法。`,
        choices: ['減価償却費', '使用権資産減価償却累計額', '使用権資産', 'リース負債', '支払利息', '備品減価償却累計額'],
        debit: [line('減価償却費', dep.value)],
        credit: [line('使用権資産減価償却累計額', dep.value)],
        calc: [nAsset, dep],
        explanation: `使用権資産の帳簿の金額は、利息相当額を引いた ${yen(nAsset.value)}。これを${n.years}年で割って ${yen(dep.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', wrong.value)], credit: [line('使用権資産減価償却累計額', wrong.value)] },
            why: `利子抜き法の使用権資産は ${yen(nAsset.value)}(利息相当額を除く)。リース料総額で計算しない。`,
            calc: [wrong],
          },
        ],
        ref: { topic: T, anchor: 'net' },
      }),
    );
  }

  // 7〜8. 期の途中で始まったとき(決算)
  const m = { annual: 480000, years: 4, interest: 160000, months: 9 };
  const mTotal = step('リース料総額(年額 × 4年)', 'mul', [m.annual, m.years]);
  const mAsset = step('使用権資産(総額 − 利息相当額)', 'sub', [mTotal.value, m.interest]);
  const mPrompt = `7月1日に、機械をリースで借りて使い始めた(決算日は3月31日)。リース期間は${m.years}年、リース料は年額 ${yen(m.annual)}(毎年6月30日に後払い)、利息相当額は ${yen(m.interest)}。利子抜き法で処理し、利息は定額法で配分する。使用権資産は耐用年数${m.years}年(リース期間)、残存価額ゼロ、定額法、間接法で減価償却する。`;
  {
    const yInt = step('1年分の利息(利息相当額 ÷ 4年)', 'div', [m.interest, m.years]);
    const mInt9 = step('9か月分(1年分 × 9)', 'mul', [yInt.value, m.months]);
    const accrued = step('決算日までの利息(÷ 12か月)', 'div', [mInt9.value, 12]);
    questions.push(
      journalQ({
        id: 'C13-007',
        topic: T,
        difficulty: 3,
        prompt: `${mPrompt}決算にあたり、利息の計上の仕訳をしなさい。`,
        choices: ['支払利息', '未払利息', 'リース負債', '前払利息', '当座預金', '支払リース料'],
        debit: [line('支払利息', accrued.value)],
        credit: [line('未払利息', accrued.value)],
        calc: [yInt, mInt9, accrued],
        explanation: `リース料は6月30日に払うので、7月〜3月の${m.months}か月分の利息はまだ払っていない。1年分 ${yen(yInt.value)} の${m.months}か月分 ${yen(accrued.value)} を、**支払利息 / 未払利息** で計上する。`,
        mistakes: [
          {
            entry: { debit: [line('支払利息', yInt.value)], credit: [line('未払利息', yInt.value)] },
            why: `当期に借りていたのは7月〜3月の${m.months}か月。1年分にしない。`,
          },
          {
            entry: { debit: [line('支払利息', accrued.value)], credit: [line('リース負債', accrued.value)] },
            why: 'まだ払っていない利息は、未払利息(負債)で計上する。リース負債は増やさない。',
          },
        ],
        ref: { topic: T, anchor: 'midyear' },
      }),
    );
  }
  {
    const yDep = step('1年分の減価償却費(使用権資産 ÷ 4年)', 'div', [mAsset.value, m.years]);
    const d9 = step('9か月分(1年分 × 9)', 'mul', [yDep.value, m.months]);
    const dep = step('当期の減価償却費(÷ 12か月)', 'div', [d9.value, 12]);
    const wrongY = step('誤答: 1年分の減価償却費', 'div', [mAsset.value, m.years]);
    const wT = step('誤答: リース料総額 ÷ 4年', 'div', [mTotal.value, m.years]);
    const wT9 = step('誤答: その9か月分', 'mul', [wT.value, m.months]);
    const wrongTotal = step('誤答: リース料総額で計算した額(÷ 12)', 'div', [wT9.value, 12]);
    questions.push(
      numericQ({
        id: 'C13-008',
        topic: T,
        difficulty: 2,
        prompt: `${mPrompt}当期の減価償却費はいくらか。`,
        answer: dep.value,
        calc: [mTotal, mAsset, yDep, d9, dep],
        explanation: `使用権資産は ${yen(mTotal.value)} − ${yen(m.interest)} = ${yen(mAsset.value)}。1年分 ${yen(yDep.value)} の、7月〜3月の${m.months}か月分で ${yen(dep.value)}。`,
        mistakes: [
          { value: wrongY.value, calc: [wrongY], why: `期の途中(7月1日)から使い始めたので、当期の分は${m.months}か月だけ。` },
          { value: wrongTotal.value, calc: [wT, wT9, wrongTotal], why: '利子抜き法の使用権資産は、利息相当額を引いた額。リース料総額で計算しない。' },
        ],
        ref: { topic: T, anchor: 'midyear' },
      }),
    );
  }

  // 9. 短期リース(賃貸借処理)
  {
    const amt = 65000;
    questions.push(
      journalQ({
        id: 'C13-009',
        topic: T,
        difficulty: 1,
        prompt: `リース期間8か月の契約で借りている測定機器のリース料(月額) ${yen(amt)} を、普通預金口座から支払った。この契約は短期リースとして賃貸借処理する。`,
        choices: ['支払リース料', '普通預金', '使用権資産', 'リース負債', '支払利息'],
        debit: [line('支払リース料', amt)],
        credit: [line('普通預金', amt)],
        explanation: 'リース期間が12か月以内の **短期リース** は、使用権資産・リース負債を計上せず、払うたびに **支払リース料**(費用)にできる。',
        mistakes: [
          {
            entry: { debit: [line('リース負債', amt)], credit: [line('普通預金', amt)] },
            why: '賃貸借処理するので、リース負債は計上していない。払ったリース料はそのまま支払リース料。',
          },
          {
            entry: { debit: [line('使用権資産', amt)], credit: [line('普通預金', amt)] },
            why: '短期リースを賃貸借処理するときは、使用権資産を計上しない。',
          },
        ],
        ref: { topic: T, anchor: 'short' },
      }),
    );
  }

  // 10. 不動産の賃借(使用権資産として計上・利子込み法)
  {
    const annual = 1200000;
    const years = 3;
    const total = step('リース料総額(年額 × 3年)', 'mul', [annual, years]);
    questions.push(
      journalQ({
        id: 'C13-010',
        topic: T,
        difficulty: 2,
        prompt: `期首に、店舗用の建物を${years}年間借りる契約を結び、使い始めた。賃料は年額 ${yen(annual)}(毎年期末に後払い)。この賃借は、使用権資産として計上する方法(利子込み法)で処理する。`,
        choices: ['使用権資産', 'リース負債', '建物', '支払リース料', '未払金', '差入保証金'],
        debit: [line('使用権資産', total.value)],
        credit: [line('リース負債', total.value)],
        calc: [total],
        explanation: `不動産の賃借もリース。問題文の指示どおり、使用権資産として計上する方法なら、賃料の総額 ${yen(total.value)} で「**使用権資産 / リース負債**」。`,
        mistakes: [
          {
            entry: { debit: [line('建物', total.value)], credit: [line('未払金', total.value)] },
            why: '建物を買ったのではなく、借りている。使用権資産とリース負債を計上する。',
          },
          {
            entry: { debit: [line('支払リース料', annual)], credit: [line('リース負債', annual)] },
            why: '支払リース料を使うのは賃貸借処理のとき。この問題は使用権資産として計上する指示。',
          },
        ],
        ref: { topic: T, anchor: 'realestate' },
      }),
    );
  }

  // 11. 短期リースの判定(選択)
  questions.push(
    choiceQ({
      id: 'C13-011',
      topic: T,
      difficulty: 1,
      prompt: '次のリース(購入する権利の付かないもの)のうち、短期リースとして、使用権資産・リース負債を計上せずに賃貸借処理できるのはどれか。',
      options: ['リース期間2年の機械のリース', 'リース期間10か月の車両のリース', 'リース期間5年の複合機のリース', 'リース期間3年の店舗の賃借'],
      answer: 1,
      explanation: '短期リースは、リース期間が **12か月以内** のもの。10か月のリースが当てはまる。',
      mistakes: [
        { option: 0, why: '2年(24か月)は12か月を超えるので、短期リースではない。' },
        { option: 2, why: '5年は12か月を超えるので、短期リースではない。' },
        { option: 3, why: '3年は12か月を超えるので、短期リースではない(少額リースでもなければ、使用権資産として計上するか、問題文の指示に従う)。' },
      ],
      ref: { topic: T, anchor: 'short' },
    }),
  );

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C13-012',
      topic: T,
      difficulty: 2,
      prompt: 'リース(借手側)について、正しいものをすべて選びなさい。',
      options: [
        'リースで借りた資産は、使用権資産として計上する',
        '利子込み法では、リース料を払うたびに支払利息を計上する',
        '利子抜き法では、リース料総額から利息相当額を引いた額で使用権資産を計上する',
        '使用権資産は減価償却しない',
        '短期リースを賃貸借処理するときは、支払リース料を使う',
      ],
      answer: [0, 2, 4],
      explanation: '利子込み法は利息を分けないので支払利息は出てこない。使用権資産は、ふつうの固定資産と同じように減価償却する。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '利子込み法は利息を分けないので、払ったリース料は全額リース負債を減らす。支払利息は出てこない。' },
        { options: [0, 2, 3, 4], why: '使用権資産は、リース期間などにわたって減価償却する。' },
        { options: [0, 4], why: '利子抜き法では、利息相当額を引いた額で使用権資産を計上する。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'compare' },
    }),
  );

  return { topic: T, questions };
}
