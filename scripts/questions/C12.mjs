// C12 無形固定資産・研究開発費 の問題(10問)
// 仕訳9問・複数選択1問。金額はすべて step() で計算する。
// のれん(償却が中心。事業の譲受けで生まれる問題は区分表に名前がないため needs_review)、ソフトウェア(自社利用のみ)、
// ソフトウェア仮勘定、特許権、研究開発費、長期前払費用。のれんの減損・受注制作のソフトウェアは1級なので扱わない。

import { journalQ, line, multiQ, step, yen } from '../lib/qlib.mjs';

const T = 'C12';

export default function build() {
  const questions = [];

  // 1. 事業の譲受け(のれんの発生)
  {
    const price = 5000000;
    const ar = 1600000;
    const bldg = 3000000;
    const equip = 800000;
    const ap = 1000000;
    const loan = 900000;
    const assets = step('受け入れた資産の合計(売掛金 + 建物 + 備品)', 'add', [ar, bldg, equip]);
    const liabs = step('受け入れた負債の合計(買掛金 + 借入金)', 'add', [ap, loan]);
    const net = step('受け入れた純資産(資産 − 負債)', 'sub', [assets.value, liabs.value]);
    const gw = step('のれん(払った額 − 純資産)', 'sub', [price, net.value]);
    questions.push(
      journalQ({
        id: 'C12-001',
        topic: T,
        difficulty: 3,
        prompt: `C社の事業の一部を ${yen(price)} で譲り受け、代金は当座預金口座から支払った。受け入れた資産と負債(時価)は、売掛金 ${yen(ar)}、建物 ${yen(bldg)}、備品 ${yen(equip)}、買掛金 ${yen(ap)}、借入金 ${yen(loan)} である。`,
        choices: ['売掛金', '建物', '備品', 'のれん', '買掛金', '借入金', '当座預金', 'のれん償却'],
        debit: [line('売掛金', ar), line('建物', bldg), line('備品', equip), line('のれん', gw.value)],
        credit: [line('買掛金', ap), line('借入金', loan), line('当座預金', price)],
        calc: [assets, liabs, net, gw],
        explanation: `受け入れた純資産は ${yen(assets.value)} − ${yen(liabs.value)} = ${yen(net.value)}。払った ${yen(price)} との差 ${yen(gw.value)} が **のれん**(無形固定資産)。`,
        mistakes: [
          {
            entry: { debit: [line('のれん', price)], credit: [line('当座預金', price)] },
            why: '払った額の全部がのれんではない。受け入れた資産・負債を記録し、純資産より多く払った分だけがのれん。',
          },
          {
            entry: {
              debit: [line('売掛金', ar), line('建物', bldg), line('備品', equip), line('のれん償却', gw.value)],
              credit: [line('買掛金', ap), line('借入金', loan), line('当座預金', price)],
            },
            why: 'のれん償却は決算で償却するときの費用。譲り受けたときの差額は、資産の「のれん」。',
          },
        ],
        needs_review: true,
        needs_review_reason:
          '2027年度の区分表(2級)には、無形固定資産の「のれん」はあるが、「事業の譲受け」という項目の名前はない(会社の合併は C20)。のれんが生まれる場面として一般的な事業の譲受けを1問入れたが、試験でこの形が出るかは未確定。',
        ref: { topic: T, anchor: 'goodwill' },
      }),
    );
  }

  // 2. のれんの償却(期首に取得)
  {
    const gw = 2400000;
    const years = 20;
    const amort = step('1年分の償却額(のれん ÷ 20年)', 'div', [gw, years]);
    const wrong10 = step('誤答: 10年で割った額', 'div', [gw, 10]);
    questions.push(
      journalQ({
        id: 'C12-002',
        topic: T,
        difficulty: 1,
        prompt: `決算。当期首に事業を譲り受けたときに計上したのれん ${yen(gw)} を、${years}年にわたり定額法で償却する。`,
        choices: ['のれん償却', 'のれん', '減価償却費', '特許権償却', '研究開発費', '普通預金'],
        debit: [line('のれん償却', amort.value)],
        credit: [line('のれん', amort.value)],
        calc: [amort],
        explanation: `${yen(gw)} ÷ ${years}年 = ${yen(amort.value)}。費用は **のれん償却**、無形固定資産は直接法なので、のれんを直接減らす。`,
        mistakes: [
          {
            entry: { debit: [line('減価償却費', amort.value)], credit: [line('のれん', amort.value)] },
            why: 'のれんの償却には、専用の科目(のれん償却)を使う。',
          },
          {
            entry: { debit: [line('のれん償却', wrong10.value)], credit: [line('のれん', wrong10.value)] },
            why: `償却の期間は問題文の${years}年。10年で割らない。`,
            calc: [wrong10],
          },
        ],
        ref: { topic: T, anchor: 'goodwill-amort' },
      }),
    );
  }

  // 3. のれんの償却(期の途中で取得・月割り)
  {
    const gw = 1800000;
    const years = 20;
    const months = 6;
    const yearly = step('1年分(のれん ÷ 20年)', 'div', [gw, years]);
    const m = step('6か月分(1年分 × 6)', 'mul', [yearly.value, months]);
    const amort = step('当期の償却額(÷ 12か月)', 'div', [m.value, 12]);
    questions.push(
      journalQ({
        id: 'C12-003',
        topic: T,
        difficulty: 2,
        prompt: `決算日(3月31日)。当期の10月1日に計上したのれん ${yen(gw)} を、${years}年にわたり定額法で償却する。当期の分は月割りで計算する。`,
        choices: ['のれん償却', 'のれん', '減価償却費', '未払金', 'ソフトウェア償却', '当座預金'],
        debit: [line('のれん償却', amort.value)],
        credit: [line('のれん', amort.value)],
        calc: [yearly, m, amort],
        explanation: `1年分は ${yen(yearly.value)}。当期に持っていたのは10月〜3月の${months}か月なので、${yen(amort.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('のれん償却', yearly.value)], credit: [line('のれん', yearly.value)] },
            why: `期の途中(10月1日)に計上したので、当期の分は${months}か月だけ。1年分にしない。`,
          },
        ],
        ref: { topic: T, anchor: 'goodwill-amort' },
      }),
    );
  }

  // 4. ソフトウェアを買う(付随費用を含める)
  {
    const price = 480000;
    const setup = 20000;
    const cost = step('取得原価(購入代価 + 設定作業の費用)', 'add', [price, setup]);
    questions.push(
      journalQ({
        id: 'C12-004',
        topic: T,
        difficulty: 1,
        prompt: `自社で使う会計ソフトを ${yen(price)} で買い、使えるようにするための設定作業の費用 ${yen(setup)} とともに、普通預金口座から支払った。`,
        choices: ['ソフトウェア', '普通預金', '支払手数料', '備品', 'ソフトウェア仮勘定', '研究開発費'],
        debit: [line('ソフトウェア', cost.value)],
        credit: [line('普通預金', cost.value)],
        calc: [cost],
        explanation: `自社で使うソフトウェアは無形固定資産の **ソフトウェア**。使えるようにするための設定作業の費用も取得原価に含めて ${yen(cost.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('ソフトウェア', price), line('支払手数料', setup)], credit: [line('普通預金', cost.value)] },
            why: '使えるようにするための設定作業の費用は、付随費用として取得原価に含める。',
          },
          {
            entry: { debit: [line('備品', cost.value)], credit: [line('普通預金', cost.value)] },
            why: 'ソフトウェアは形のない資産なので、備品(有形固定資産)ではなくソフトウェア(無形固定資産)。',
          },
        ],
        ref: { topic: T, anchor: 'software' },
      }),
    );
  }

  // 5. ソフトウェアの償却(期の途中で使い始めた・月割り)
  {
    const cost = 600000;
    const years = 5;
    const months = 9;
    const yearly = step('1年分(取得原価 ÷ 5年)', 'div', [cost, years]);
    const m = step('9か月分(1年分 × 9)', 'mul', [yearly.value, months]);
    const amort = step('当期の償却額(÷ 12か月)', 'div', [m.value, 12]);
    questions.push(
      journalQ({
        id: 'C12-005',
        topic: T,
        difficulty: 2,
        prompt: `決算日(3月31日)。当期の7月1日に取得して使い始めた自社利用のソフトウェア ${yen(cost)} を、${years}年にわたり定額法で償却する。当期の分は月割りで計算する。`,
        choices: ['ソフトウェア償却', 'ソフトウェア', '減価償却費', '備品減価償却累計額', 'のれん償却', '研究開発費'],
        debit: [line('ソフトウェア償却', amort.value)],
        credit: [line('ソフトウェア', amort.value)],
        calc: [yearly, m, amort],
        explanation: `1年分は ${yen(yearly.value)}。7月〜3月の${months}か月分で ${yen(amort.value)}。費用は **ソフトウェア償却**、ソフトウェアを直接減らす。`,
        mistakes: [
          {
            entry: { debit: [line('ソフトウェア償却', yearly.value)], credit: [line('ソフトウェア', yearly.value)] },
            why: `7月1日から使い始めたので、当期の分は${months}か月だけ。`,
          },
          {
            entry: { debit: [line('減価償却費', amort.value)], credit: [line('備品減価償却累計額', amort.value)] },
            why: 'ソフトウェアは無形固定資産なので、ソフトウェア償却を計上し、直接法でソフトウェアを直接減らす。',
          },
        ],
        ref: { topic: T, anchor: 'software' },
      }),
    );
  }

  // 6〜7. ソフトウェア仮勘定 → 完成
  const total = 1500000;
  const paid = 700000;
  questions.push(
    journalQ({
      id: 'C12-006',
      topic: T,
      difficulty: 1,
      prompt: `自社で使う予約管理システムの開発を外部に頼み(代金 ${yen(total)})、制作の途中で ${yen(paid)} を当座預金口座から支払った。`,
      choices: ['ソフトウェア仮勘定', '当座預金', 'ソフトウェア', '前払金', '建設仮勘定', '研究開発費'],
      debit: [line('ソフトウェア仮勘定', paid)],
      credit: [line('当座預金', paid)],
      explanation: 'まだ完成していないソフトウェアへの支払いは **ソフトウェア仮勘定** にしておく。完成して引渡しを受けたらソフトウェアへ振り替える。',
      mistakes: [
        {
          entry: { debit: [line('ソフトウェア', paid)], credit: [line('当座預金', paid)] },
          why: 'まだ完成していないので、ソフトウェアにはしない。ソフトウェア仮勘定にしておく。',
        },
        {
          entry: { debit: [line('建設仮勘定', paid)], credit: [line('当座預金', paid)] },
          why: '建設仮勘定は建物など有形固定資産の建設中の支払い。ソフトウェアはソフトウェア仮勘定。',
        },
      ],
      ref: { topic: T, anchor: 'software-cip' },
    }),
  );
  {
    const rest = step('残りの代金(代金 − 支払済み)', 'sub', [total, paid]);
    questions.push(
      journalQ({
        id: 'C12-007',
        topic: T,
        difficulty: 2,
        prompt: `開発を頼んでいた自社利用のシステム(代金 ${yen(total)})が完成して引渡しを受け、残りの代金を普通預金口座から支払った。制作の途中で支払った ${yen(paid)} は、ソフトウェア仮勘定で処理している。`,
        choices: ['ソフトウェア', 'ソフトウェア仮勘定', '普通預金', 'ソフトウェア償却', '前払金', '未払金'],
        debit: [line('ソフトウェア', total)],
        credit: [line('ソフトウェア仮勘定', paid), line('普通預金', rest.value)],
        calc: [rest],
        explanation: `完成したので、代金の全額 ${yen(total)} を **ソフトウェア** にする。ソフトウェア仮勘定 ${yen(paid)} を減らし、残り ${yen(rest.value)} を支払う。`,
        mistakes: [
          {
            entry: { debit: [line('ソフトウェア', rest.value)], credit: [line('普通預金', rest.value)] },
            why: `ソフトウェア仮勘定 ${yen(paid)} をソフトウェアへ振り替えるのを忘れている。ソフトウェアは全額の ${yen(total)}。`,
          },
        ],
        ref: { topic: T, anchor: 'software-cip' },
      }),
    );
  }

  // 8. 研究開発費
  {
    const salary = 600000;
    const device = 400000;
    const sum = step('研究開発費(研究員の給料 + 研究専用の測定機器)', 'add', [salary, device]);
    questions.push(
      journalQ({
        id: 'C12-008',
        topic: T,
        difficulty: 2,
        prompt: `研究開発部門の研究員の給料 ${yen(salary)} と、研究開発にだけ使う測定機器 ${yen(device)} の代金を、当座預金口座から支払った。`,
        choices: ['研究開発費', '当座預金', '給料', '機械装置', '備品', '減価償却費'],
        debit: [line('研究開発費', sum.value)],
        credit: [line('当座預金', sum.value)],
        calc: [sum],
        explanation: `研究開発のための支出は、成果が出るかわからないので全額をその期の **研究開発費** にする。研究にだけ使う機器も、研究員の給料も研究開発費。合計 ${yen(sum.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('給料', salary), line('機械装置', device)], credit: [line('当座預金', sum.value)] },
            why: '研究開発のための支出は、研究員の給料も研究専用の機器も、全額を研究開発費にする。',
          },
          {
            entry: { debit: [line('研究開発費', salary), line('備品', device)], credit: [line('当座預金', sum.value)] },
            why: '研究開発にだけ使う機器は、固定資産にせず研究開発費にする。',
          },
        ],
        ref: { topic: T, anchor: 'rd' },
      }),
    );
  }

  // 9. 長期前払費用(決算)
  {
    const total4 = 480000;
    const years = 4;
    const perYear = step('1年分(保険料 ÷ 4年)', 'div', [total4, years]);
    const longPart = step('長期前払保険料(1年分 × 2年分)', 'mul', [perYear.value, 2]);
    const credit = step('保険料から減らす額(前払保険料 + 長期前払保険料)', 'add', [perYear.value, longPart.value]);
    questions.push(
      journalQ({
        id: 'C12-009',
        topic: T,
        difficulty: 3,
        prompt: `当期首に4年分の保険料 ${yen(total4)} を支払い、保険料で処理した。決算にあたり、次期以降の分を前払いとして処理する。決算日の翌日から1年以内の分は前払保険料、1年を超える分は長期前払保険料とする。`,
        choices: ['前払保険料', '長期前払保険料', '保険料', '未払保険料', '普通預金', '前払金'],
        debit: [line('前払保険料', perYear.value), line('長期前払保険料', longPart.value)],
        credit: [line('保険料', credit.value)],
        calc: [perYear, longPart, credit],
        explanation: `1年分は ${yen(perYear.value)}。当期の分は保険料のまま、次期の1年分 ${yen(perYear.value)} は **前払保険料**、その先の2年分 ${yen(longPart.value)} は **長期前払保険料**。`,
        mistakes: [
          {
            entry: { debit: [line('前払保険料', credit.value)], credit: [line('保険料', credit.value)] },
            why: `決算日の翌日から1年を超える分(${yen(longPart.value)})は、前払保険料ではなく長期前払保険料に分ける。`,
          },
          {
            entry: { debit: [line('長期前払保険料', credit.value)], credit: [line('保険料', credit.value)] },
            why: `次期の1年分 ${yen(perYear.value)} は、決算日の翌日から1年以内なので前払保険料。長期前払保険料にするのは、その先の分だけ。`,
          },
        ],
        ref: { topic: T, anchor: 'long-prepaid' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C12-010',
      topic: T,
      difficulty: 2,
      prompt: '無形固定資産・研究開発費について、正しいものをすべて選びなさい。',
      options: [
        '無形固定資産は、残存価額ゼロの定額法で償却し、直接法で記帳する',
        'のれんは、50年以内のその効果が及ぶ期間で償却する',
        '制作途中の自社利用ソフトウェアへの支払いは、ソフトウェア仮勘定で処理する',
        '研究開発にだけ使う機械を買ったときは、機械装置として減価償却する',
        '決算日の翌日から1年を超えて費用になる前払保険料は、長期前払費用にする',
      ],
      answer: [0, 2, 4],
      explanation: 'のれんは20年以内で償却する。研究開発にだけ使う機械は、固定資産にせず研究開発費にする。',
      mistakes: [
        { options: [0, 1, 2, 4], why: 'のれんの償却期間は、20年以内のその効果が及ぶ期間。' },
        { options: [0, 2, 3, 4], why: '研究開発にだけ使う機械は、全額を研究開発費(費用)にする。固定資産にはしない。' },
        { options: [0, 2], why: '1年を超えて先に費用になる分の前払いは、長期前払費用。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'long-prepaid' },
    }),
  );

  return { topic: T, questions };
}
