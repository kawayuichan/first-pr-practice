// C09 有価証券②満期保有目的債券・子会社株式・関連会社株式・その他有価証券 の問題(12問)
// 仕訳8問・表1問・数値1問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 償却原価法は定額法(利息法は1級)、期中取得の月割りを含む。その他有価証券は全部純資産直入法(部分純資産直入法は1級)。
// 税効果会計を使う仕訳は C18 で扱う(ユーザーと相談)。

import { blankSelect, choiceQ, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'C09';
const AFS_NOTE = '全部純資産直入法により処理し、税効果会計は考えない。';

export default function build() {
  const questions = [];

  // 1. 保有目的による分類(表)
  {
    const K = ['売買目的有価証券', '満期保有目的債券', '子会社株式', '関連会社株式', 'その他有価証券'];
    const sel = (a) => blankSelect(K, a);
    questions.push(
      tableQ({
        id: 'C09-001',
        topic: T,
        difficulty: 1,
        prompt: '次の有価証券は、どの分類になるか。表の空欄に入る分類を選びなさい。',
        table: {
          title: '保有目的による分類',
          columns: [{ label: '持っている有価証券' }, { label: '分類' }],
          rows: [
            ['値上がりで利益を得るため、短い期間で売り買いする株式', sel('売買目的有価証券')],
            ['満期まで持ち続けるつもりで買った社債', sel('満期保有目的債券')],
            ['発行済株式の70%を持ち、支配している会社の株式', sel('子会社株式')],
            ['発行済株式の30%を持ち、大きな影響を与えられる会社の株式', sel('関連会社株式')],
            ['取引先との関係を保つために長く持つ株式', sel('その他有価証券')],
          ],
        },
        explanation: '持つ目的で分ける。短期の売買は **売買目的有価証券**、満期まで持つ債券は **満期保有目的債券**、支配している会社(50%超など)は **子会社株式**、影響を与えられる会社(20%以上など)は **関連会社株式**、どれにも当たらないものは **その他有価証券**。',
        mistakes: [
          { cell: [3, 1], value: '子会社株式', why: '30%では支配まではしていない。20%以上などで大きな影響を与えられる会社は関連会社。' },
          { cell: [4, 1], value: '売買目的有価証券', why: '関係を保つために長く持つ株式は、売買が目的ではない。どれにも当たらないのでその他有価証券。' },
        ],
        ref: { topic: T, anchor: 'classes' },
      }),
    );
  }

  // 2. 満期保有目的債券を買う
  {
    const face = 5000000;
    const times = step('額面 × 98(額面100円につき98円)', 'mul', [face, 98]);
    const cost = step('取得価額(÷ 100)', 'div', [times.value, 100]);
    questions.push(
      journalQ({
        id: 'C09-002',
        topic: T,
        difficulty: 1,
        prompt: `満期まで持つ目的で、社債(額面 ${yen(face)})を額面 ¥100 につき ¥98 で買い、代金は当座預金口座から支払った。`,
        choices: ['満期保有目的債券', '当座預金', '売買目的有価証券', 'その他有価証券', '有価証券利息', '未払金'],
        debit: [line('満期保有目的債券', cost.value)],
        credit: [line('当座預金', cost.value)],
        calc: [times, cost],
        explanation: `満期まで持つ目的の債券は **満期保有目的債券**。取得価額は ${yen(face)} × 98 ÷ 100 = ${yen(cost.value)}(額面で記録しない)。`,
        mistakes: [
          {
            entry: { debit: [line('売買目的有価証券', cost.value)], credit: [line('当座預金', cost.value)] },
            why: '満期まで持つ目的なので、売買目的有価証券ではなく満期保有目的債券。',
          },
          {
            entry: { debit: [line('満期保有目的債券', face)], credit: [line('当座預金', face)] },
            why: `記録するのは実際に払った取得価額 ${yen(cost.value)}。額面の差額は、毎期の償却原価法で少しずつ足していく。`,
          },
        ],
        ref: { topic: T, anchor: 'htm-buy' },
      }),
    );
  }

  // 3. 償却原価法(期首に取得)
  {
    const face = 3000000;
    const cost = 2940000;
    const years = 5;
    const diff = step('差額(額面 − 取得価額)', 'sub', [face, cost]);
    const yearly = step('1年分の償却額(差額 ÷ 5年)', 'div', [diff.value, years]);
    questions.push(
      journalQ({
        id: 'C09-003',
        topic: T,
        difficulty: 2,
        prompt: `当期首に、満期保有目的で社債(額面 ${yen(face)}、満期まで${years}年)を ${yen(cost)} で買っている。額面と取得価額の差額は金利の調整と認められる。決算にあたり、償却原価法(定額法)を適用する。`,
        choices: ['満期保有目的債券', '有価証券利息', '有価証券評価益', 'その他有価証券評価差額金', '受取配当金', '売買目的有価証券'],
        debit: [line('満期保有目的債券', yearly.value)],
        credit: [line('有価証券利息', yearly.value)],
        calc: [diff, yearly],
        explanation: `差額 ${yen(diff.value)} を${years}年に分けて、1年分 ${yen(yearly.value)} を帳簿価額に足す。差額は利息の調整なので、相手の科目は **有価証券利息**。`,
        mistakes: [
          {
            entry: { debit: [line('満期保有目的債券', yearly.value)], credit: [line('有価証券評価益', yearly.value)] },
            why: '償却原価法は時価への評価替えではない。差額は利息の調整なので有価証券利息にする。',
          },
          {
            entry: { debit: [line('満期保有目的債券', diff.value)], credit: [line('有価証券利息', diff.value)] },
            why: `差額 ${yen(diff.value)} は満期までの${years}年に分けて配分する。1年分は ${yen(yearly.value)}。`,
          },
        ],
        ref: { topic: T, anchor: 'amortized' },
      }),
    );
  }

  // 4. 償却原価法(期の途中で取得・月割り)
  {
    const face = 2000000;
    const cost = 1952000;
    const months = 48;
    const held = 6;
    const diff = step('差額(額面 − 取得価額)', 'sub', [face, cost]);
    const perMonth = step('1か月分(差額 ÷ 48か月)', 'div', [diff.value, months]);
    const amort = step('当期の償却額(1か月分 × 6か月)', 'mul', [perMonth.value, held]);
    const wrongYear = step('誤答: 1年分(1か月分 × 12か月)', 'mul', [perMonth.value, 12]);
    questions.push(
      journalQ({
        id: 'C09-004',
        topic: T,
        difficulty: 3,
        prompt: `X1年10月1日に、満期保有目的で社債(額面 ${yen(face)}、満期はX5年9月30日)を ${yen(cost)} で買った。X2年3月31日の決算にあたり、償却原価法(定額法)を月割りで適用する。差額は金利の調整と認められる。`,
        choices: ['満期保有目的債券', '有価証券利息', '有価証券評価益', '受取利息', '売買目的有価証券', 'その他有価証券'],
        debit: [line('満期保有目的債券', amort.value)],
        credit: [line('有価証券利息', amort.value)],
        calc: [diff, perMonth, amort],
        explanation: `満期まで4年(${months}か月)なので、1か月分は ${yen(diff.value)} ÷ ${months} = ${yen(perMonth.value)}。当期に持っていたのは10月〜3月の${held}か月なので、${yen(amort.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('満期保有目的債券', wrongYear.value)], credit: [line('有価証券利息', wrongYear.value)] },
            why: `期の途中(10月1日)に買ったので、当期の分は${held}か月だけ。1年分にしない。`,
            calc: [wrongYear],
          },
          {
            entry: { debit: [line('満期保有目的債券', amort.value)], credit: [line('有価証券評価益', amort.value)] },
            why: '償却原価法の相手の科目は有価証券利息。評価益ではない。',
          },
        ],
        ref: { topic: T, anchor: 'midyear' },
      }),
    );
  }

  // 5. 2年後の帳簿価額(数値)
  {
    const face = 1000000;
    const cost = 960000;
    const years = 8;
    const diff = step('差額(額面 − 取得価額)', 'sub', [face, cost]);
    const yearly = step('1年分の償却額(差額 ÷ 8年)', 'div', [diff.value, years]);
    const two = step('2年分の償却額', 'mul', [yearly.value, 2]);
    const book = step('2年目の決算後の帳簿価額(取得価額 + 2年分)', 'add', [cost, two.value]);
    const one = step('誤答: 1年分しか足していない帳簿価額', 'add', [cost, yearly.value]);
    questions.push(
      numericQ({
        id: 'C09-005',
        topic: T,
        difficulty: 2,
        prompt: `前期首に、満期保有目的で社債(額面 ${yen(face)}、満期まで${years}年)を ${yen(cost)} で買った。前期・当期とも、決算で償却原価法(定額法)を適用している。当期の決算後の、この社債の帳簿価額はいくらか。`,
        answer: book.value,
        calc: [diff, yearly, two, book],
        explanation: `1年分の償却額は ${yen(diff.value)} ÷ ${years}年 = ${yen(yearly.value)}。前期と当期の2回分を足して ${yen(cost)} + ${yen(two.value)} = ${yen(book.value)}。`,
        mistakes: [
          { value: one.value, calc: [yearly, one], why: '前期の決算でも償却している。前期と当期の2年分を足す。' },
          { value: face, why: '額面になるのは満期の日。それまでは毎期少しずつ額面に近づく。' },
        ],
        ref: { topic: T, anchor: 't-htm' },
      }),
    );
  }

  // 6. 子会社株式を買う
  {
    const shares = 2400;
    const price = 2500;
    const cost = step('取得原価(1株の値段 × 株数)', 'mul', [price, shares]);
    questions.push(
      journalQ({
        id: 'C09-006',
        topic: T,
        difficulty: 1,
        prompt: `D社の発行済株式4,000株のうち${shares}株(60%)を1株 ${yen(price)} で買い、D社を支配した。代金は当座預金口座から支払った。`,
        choices: ['子会社株式', '当座預金', '関連会社株式', '売買目的有価証券', 'その他有価証券', '未払金'],
        debit: [line('子会社株式', cost.value)],
        credit: [line('当座預金', cost.value)],
        calc: [cost],
        explanation: `発行済株式の60%を持って支配しているので **子会社株式**。金額は ${yen(price)} × ${shares}株 = ${yen(cost.value)}。`,
        mistakes: [
          {
            entry: { debit: [line('関連会社株式', cost.value)], credit: [line('当座預金', cost.value)] },
            why: '60%(50%超)を持って支配しているので、関連会社ではなく子会社。',
          },
          {
            entry: { debit: [line('売買目的有価証券', cost.value)], credit: [line('当座預金', cost.value)] },
            why: '支配するために持つ株式は、売買が目的ではない。子会社株式にする。',
          },
        ],
        ref: { topic: T, anchor: 'affiliates' },
      }),
    );
  }

  // 7. 関連会社株式を買う
  {
    const amt = 1800000;
    questions.push(
      journalQ({
        id: 'C09-007',
        topic: T,
        difficulty: 1,
        prompt: `E社の発行済株式の25%を ${yen(amt)} で買い、E社の方針に大きな影響を与えられるようになった。代金は普通預金口座から支払った。`,
        choices: ['関連会社株式', '普通預金', '子会社株式', 'その他有価証券', '売買目的有価証券', '満期保有目的債券'],
        debit: [line('関連会社株式', amt)],
        credit: [line('普通預金', amt)],
        explanation: '20%以上を持ち、大きな影響を与えられる会社の株式は **関連会社株式**。支配(50%超など)まではしていないので子会社ではない。',
        mistakes: [
          {
            entry: { debit: [line('子会社株式', amt)], credit: [line('普通預金', amt)] },
            why: '25%では支配まではしていない。大きな影響を与えられる会社は関連会社。',
          },
          {
            entry: { debit: [line('その他有価証券', amt)], credit: [line('普通預金', amt)] },
            why: '影響を与えられる会社の株式は関連会社株式。その他有価証券は、どの分類にも当たらないもの。',
          },
        ],
        ref: { topic: T, anchor: 'affiliates' },
      }),
    );
  }

  // 8. 子会社株式は評価替えしない(選択)
  {
    const book = 6000000;
    const fair = 6400000;
    questions.push(
      choiceQ({
        id: 'C09-008',
        topic: T,
        difficulty: 1,
        prompt: `決算で、子会社株式(取得原価 ${yen(book)})の時価が ${yen(fair)} になっていた。正しい処理はどれか。`,
        options: ['時価との差額をその他有価証券評価差額金にする', '時価との差額を有価証券評価益にする', '仕訳はしない(取得原価のまま)', '時価との差額を有価証券利息にする'],
        answer: 2,
        explanation: '子会社株式・関連会社株式は、売るためではなく支配や影響のために持つので、決算でも **取得原価のまま**。仕訳はしない。',
        mistakes: [
          { option: 0, why: 'その他有価証券評価差額金を使うのは、その他有価証券の評価替え。子会社株式は評価替えしない。' },
          { option: 1, why: '時価に評価替えして評価益にするのは、売買目的有価証券。' },
          { option: 3, why: '有価証券利息を使うのは、満期保有目的債券の償却原価法。' },
        ],
        ref: { topic: T, anchor: 'affiliates' },
      }),
    );
  }

  // 9. その他有価証券の評価替え(下落)
  {
    const cost = 800000;
    const fair = 740000;
    const diff = step('評価差額(取得原価 − 時価)', 'sub', [cost, fair]);
    questions.push(
      journalQ({
        id: 'C09-009',
        topic: T,
        difficulty: 2,
        prompt: `決算で、その他有価証券(取得原価 ${yen(cost)})を時価 ${yen(fair)} に評価替えする。${AFS_NOTE}`,
        choices: ['その他有価証券評価差額金', 'その他有価証券', '有価証券評価損', '投資有価証券売却損', '繰越利益剰余金', '有価証券利息'],
        debit: [line('その他有価証券評価差額金', diff.value)],
        credit: [line('その他有価証券', diff.value)],
        calc: [diff],
        explanation: `時価が ${yen(diff.value)} 下がったので、その他有価証券を減らす。差額は損益にせず **その他有価証券評価差額金**(純資産)を減らす(借方)。`,
        mistakes: [
          {
            entry: { debit: [line('有価証券評価損', diff.value)], credit: [line('その他有価証券', diff.value)] },
            why: '全部純資産直入法では、評価差額を損益にしない。その他有価証券評価差額金にする。',
          },
          {
            entry: { debit: [line('その他有価証券', diff.value)], credit: [line('その他有価証券評価差額金', diff.value)] },
            why: '貸借が逆。時価が下がったので、その他有価証券は減らす(貸方)。',
          },
        ],
        ref: { topic: T, anchor: 'afs' },
      }),
    );
  }

  // 10・11. その他有価証券: 翌期首の戻し → 売却
  const afsCost = 450000;
  const afsFair = 490000;
  const afsPrice = 470000;
  {
    const diff = step('前期末の評価差額(時価 − 取得原価)', 'sub', [afsFair, afsCost]);
    questions.push(
      journalQ({
        id: 'C09-010',
        topic: T,
        difficulty: 2,
        prompt: `前期末に、その他有価証券(取得原価 ${yen(afsCost)})を時価 ${yen(afsFair)} に評価替えした。当期首に、この評価替えを元に戻す。${AFS_NOTE}`,
        choices: ['その他有価証券評価差額金', 'その他有価証券', '有価証券評価益', '投資有価証券売却益', '繰越利益剰余金', '普通預金'],
        debit: [line('その他有価証券評価差額金', diff.value)],
        credit: [line('その他有価証券', diff.value)],
        calc: [diff],
        explanation: `前期末の仕訳は「その他有価証券 ${yen(diff.value)} / その他有価証券評価差額金 ${yen(diff.value)}」。期首にこの **逆の仕訳** をして、取得原価 ${yen(afsCost)} に戻す。`,
        mistakes: [
          {
            entry: { debit: [line('その他有価証券', diff.value)], credit: [line('その他有価証券評価差額金', diff.value)] },
            why: 'これは前期末の評価替えと同じ仕訳。期首には逆の仕訳で元に戻す。',
          },
          {
            entry: { debit: [line('有価証券評価益', diff.value)], credit: [line('その他有価証券', diff.value)] },
            why: 'その他有価証券の評価差額は、損益(評価益)ではなく、その他有価証券評価差額金で記録している。戻すのもその他有価証券評価差額金。',
          },
        ],
        ref: { topic: T, anchor: 'afs' },
      }),
    );
  }
  {
    const gain = step('売却益(売却価額 − 取得原価)', 'sub', [afsPrice, afsCost]);
    const wrongLoss = step('誤答: 前期末の時価との差(売却損)', 'sub', [afsFair, afsPrice]);
    questions.push(
      journalQ({
        id: 'C09-011',
        topic: T,
        difficulty: 3,
        prompt: `その他有価証券(取得原価 ${yen(afsCost)}、前期末の時価 ${yen(afsFair)}、当期首に評価差額を戻し済み)をすべて ${yen(afsPrice)} で売り、代金は普通預金口座に入金された。`,
        choices: ['普通預金', 'その他有価証券', '投資有価証券売却益', '投資有価証券売却損', '有価証券売却益', 'その他有価証券評価差額金'],
        debit: [line('普通預金', afsPrice)],
        credit: [line('その他有価証券', afsCost), line('投資有価証券売却益', gain.value)],
        calc: [gain],
        explanation: `期首に取得原価 ${yen(afsCost)} へ戻しているので、売却益は ${yen(afsPrice)} − ${yen(afsCost)} = ${yen(gain.value)}。その他有価証券の売却益は **投資有価証券売却益**。`,
        mistakes: [
          {
            entry: { debit: [line('普通預金', afsPrice), line('投資有価証券売却損', wrongLoss.value)], credit: [line('その他有価証券', afsFair)] },
            why: `期首に元へ戻しているので、帳簿価額は前期末の時価ではなく取得原価 ${yen(afsCost)}。`,
            calc: [wrongLoss],
          },
          {
            entry: { debit: [line('普通預金', afsPrice)], credit: [line('その他有価証券', afsCost), line('有価証券売却益', gain.value)] },
            why: '有価証券売却益は、売買目的有価証券を売ったときの科目。その他有価証券は投資有価証券売却益。',
          },
        ],
        ref: { topic: T, anchor: 'afs' },
      }),
    );
  }

  // 12. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C09-012',
      topic: T,
      difficulty: 2,
      prompt: '有価証券について、正しいものをすべて選びなさい。',
      options: [
        '満期保有目的債券の償却原価法による増加額は、有価証券利息として処理する',
        '子会社株式は、決算で時価に評価替えする',
        'その他有価証券の評価差額は、損益計算書に計上する(全部純資産直入法)',
        'その他有価証券評価差額金は、貸借対照表の純資産に表示する',
        'その他有価証券(全部純資産直入法)は、翌期首に評価差額を戻して取得原価に戻す',
      ],
      answer: [0, 3, 4],
      explanation: '償却原価法の相手は有価証券利息。子会社株式は取得原価のまま。その他有価証券の評価差額は損益にせず、純資産のその他有価証券評価差額金にして、翌期首に戻す。',
      mistakes: [
        { options: [0, 1, 3, 4], why: '子会社株式・関連会社株式は、決算でも取得原価のまま。評価替えしない。' },
        { options: [0, 2, 3, 4], why: '全部純資産直入法では、評価差額を損益にせず、全部を純資産(その他有価証券評価差額金)に入れる。' },
        { options: [0, 3], why: 'その他有価証券は、翌期首に評価差額を戻して取得原価に戻す。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'display' },
    }),
  );

  return { topic: T, questions };
}
