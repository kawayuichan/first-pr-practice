// C28 連結③成果連結 の問題(10問)
// 仕訳7問・数値2問・複数選択1問。金額はすべて step() で計算する。
// 連結会社間の取引・債権債務・利息の相殺、貸倒引当金の修正(ダウンストリーム)、
// 未実現利益の消去(期末商品のダウン・アップストリーム、期首商品、土地)。2級は棚卸資産と土地に限る。

import { journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C28';
const F = 'q3_consolidation';
const HEAD = 'P社はS社の発行済株式の80%を持ち、支配している。';

export default function build() {
  const questions = [];

  // 1. 売上高と売上原価の相殺
  {
    const amt = 1500000;
    questions.push(
      journalQ({
        id: 'C28-001',
        topic: T,
        format: F,
        difficulty: 1,
        prompt: `${HEAD}当期に、P社はS社に商品 ${yen(amt)} を掛けで売った。連結会社間の取引の相殺消去の仕訳を答えなさい。`,
        choices: ['売上高', '売上原価', '売掛金', '買掛金', '商品', '利益剰余金当期首残高'],
        debit: [line('売上高', amt)],
        credit: [line('売上原価', amt)],
        explanation: 'P社の売上とS社の仕入(売上原価に含まれる)は、グループの中のやり取り。**売上高** と **売上原価** を消す。',
        mistakes: [
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('売掛金', amt)] },
            why: 'それは期末に残っている債権債務の相殺。当期の取引高は、売上高と売上原価で相殺する。',
          },
        ],
        ref: { topic: T, anchor: 'sales' },
      }),
    );
  }

  // 2. 債権債務の相殺と貸倒引当金
  {
    const ar = 400000;
    const rate = 3;
    const am = step('消す貸倒引当金(売掛金 × 3)', 'mul', [ar, rate]);
    const allow = step('消す貸倒引当金(÷ 100)', 'div', [am.value, 100]);
    questions.push(
      journalQ({
        id: 'C28-002',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${HEAD}期末に、P社の売掛金のうち ${yen(ar)} はS社に対するもの(S社の買掛金)。P社は売掛金の期末残高に ${rate}% の貸倒引当金を差額補充法で設定している。債権債務の相殺消去と、貸倒引当金の修正の仕訳を答えなさい。`,
        choices: ['買掛金', '売掛金', '貸倒引当金', '貸倒引当金繰入', '売上高', '売上原価'],
        debit: [line('買掛金', ar), line('貸倒引当金', allow.value)],
        credit: [line('売掛金', ar), line('貸倒引当金繰入', allow.value)],
        calc: [am, allow],
        explanation: `グループ内の売掛金と買掛金を消す。この売掛金に設定した貸倒引当金 ${yen(allow.value)} も不要なので消し、繰入額(費用)も取り消す。`,
        mistakes: [
          {
            entry: { debit: [line('買掛金', ar)], credit: [line('売掛金', ar)] },
            why: 'グループ内の売掛金に対して設定した貸倒引当金も消す。',
          },
        ],
        ref: { topic: T, anchor: 'receivables' },
      }),
    );
  }

  // 3. 期末商品の未実現利益(ダウンストリーム・売上総利益率)
  {
    const inv = 360000;
    const rate = 25;
    const m = step('期末商品 × 売上総利益率', 'mul', [inv, rate]);
    const ur = step('未実現利益(÷ 100)', 'div', [m.value, 100]);
    const nm = step('誤答: 未実現利益 × 非支配株主の比率', 'mul', [ur.value, 20]);
    const nci = step('誤答: 非支配株主の分(÷ 100)', 'div', [nm.value, 100]);
    questions.push(
      journalQ({
        id: 'C28-003',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${HEAD}S社の期末商品のうち ${yen(inv)} は、P社から仕入れたものである。P社のS社への売上総利益率は ${rate}%。未実現利益を消去する仕訳を答えなさい。`,
        choices: ['売上原価', '商品', '売上高', '非支配株主持分当期変動額', '非支配株主に帰属する当期純利益', '仕入'],
        debit: [line('売上原価', ur.value)],
        credit: [line('商品', ur.value)],
        calc: [m, ur],
        explanation: `未実現利益 = ${yen(inv)} × ${rate}% = ${yen(ur.value)}。商品を減らし、売上原価を増やす。親会社が売り手(ダウンストリーム)なので、非支配株主には負担させない。`,
        mistakes: [
          {
            entry: { debit: [line('売上原価', ur.value), line('非支配株主持分当期変動額', nci.value)], credit: [line('商品', ur.value), line('非支配株主に帰属する当期純利益', nci.value)] },
            why: '非支配株主に負担させるのは、子会社が売り手のとき(アップストリーム)だけ。',
            calc: [nm, nci],
          },
        ],
        ref: { topic: T, anchor: 'downstream' },
      }),
    );
  }

  // 4. 期末商品の未実現利益(アップストリーム)
  {
    const inv = 250000;
    const rate = 20;
    const m = step('期末商品 × 売上総利益率', 'mul', [inv, rate]);
    const ur = step('未実現利益(÷ 100)', 'div', [m.value, 100]);
    const nm = step('非支配株主の分(未実現利益 × 20)', 'mul', [ur.value, 20]);
    const nci = step('非支配株主の分(÷ 100)', 'div', [nm.value, 100]);
    questions.push(
      journalQ({
        id: 'C28-004',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `${HEAD}P社の期末商品のうち ${yen(inv)} は、S社から仕入れたものである。S社のP社への売上総利益率は ${rate}%。未実現利益の消去と、非支配株主への負担の仕訳を答えなさい。`,
        choices: ['売上原価', '商品', '非支配株主持分当期変動額', '非支配株主に帰属する当期純利益', '売上高', '利益剰余金当期首残高'],
        debit: [line('売上原価', ur.value), line('非支配株主持分当期変動額', nci.value)],
        credit: [line('商品', ur.value), line('非支配株主に帰属する当期純利益', nci.value)],
        calc: [m, ur, nm, nci],
        explanation: `未実現利益 ${yen(ur.value)} を消す。子会社が売り手(アップストリーム)なので、そのうち非支配株主の分 20% = ${yen(nci.value)} は、非支配株主持分を減らし、非支配株主に帰属する当期純利益も減らす。`,
        mistakes: [
          {
            entry: { debit: [line('売上原価', ur.value)], credit: [line('商品', ur.value)] },
            why: '子会社が売り手なので、消した利益のうち非支配株主の分(20%)は非支配株主に負担させる。',
          },
        ],
        ref: { topic: T, anchor: 'upstream' },
      }),
    );
  }

  // 5. 土地の未実現利益
  {
    const book = 1500000;
    const price = 1800000;
    const gain = step('未実現利益(売価 − 帳簿価額)', 'sub', [price, book]);
    questions.push(
      journalQ({
        id: 'C28-005',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${HEAD}当期に、P社は帳簿価額 ${yen(book)} の土地を ${yen(price)} でS社に売り、S社は期末もこの土地を持っている。未実現利益を消去する仕訳を答えなさい。`,
        choices: ['土地売却益', '土地', '売上原価', '商品', '非支配株主持分当期変動額', '売上高'],
        debit: [line('土地売却益', gain.value)],
        credit: [line('土地', gain.value)],
        calc: [gain],
        explanation: `P社が計上した土地売却益 ${yen(gain.value)} は、グループの外に売れていない未実現利益。土地を元の帳簿価額に戻し、売却益を消す。`,
        mistakes: [
          {
            entry: { debit: [line('売上原価', gain.value)], credit: [line('土地', gain.value)] },
            why: '土地の売却で出た利益は土地売却益。消すのは土地売却益。',
          },
        ],
        ref: { topic: T, anchor: 'land' },
      }),
    );
  }

  // 6. 貸付金・借入金と利息の相殺
  {
    const loan = 800000;
    const interest = 24000;
    questions.push(
      journalQ({
        id: 'C28-006',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${HEAD}P社はS社に ${yen(loan)} を貸し付けていて(期末残高)、当期の利息 ${yen(interest)} を受け取った(S社は支払利息で処理)。相殺消去の仕訳を答えなさい。`,
        choices: ['借入金', '受取利息', '貸付金', '支払利息', '未収収益', '未払費用'],
        debit: [line('借入金', loan), line('受取利息', interest)],
        credit: [line('貸付金', loan), line('支払利息', interest)],
        explanation: 'グループ内の貸し借りは、**貸付金と借入金**、**受取利息と支払利息** をそれぞれ相殺する。',
        mistakes: [
          {
            entry: { debit: [line('借入金', loan)], credit: [line('貸付金', loan)] },
            why: '利息もグループ内のやり取りなので、受取利息と支払利息も相殺する。',
          },
        ],
        ref: { topic: T, anchor: 'receivables' },
      }),
    );
  }

  // 7. 期首商品の未実現利益
  {
    const ur = 45000;
    questions.push(
      journalQ({
        id: 'C28-007',
        topic: T,
        format: F,
        difficulty: 3,
        prompt: `${HEAD}S社の期首商品には、P社から仕入れた分の未実現利益 ${yen(ur)} が含まれていた。この商品は当期にすべて外部に売れた。開始仕訳と実現の仕訳をまとめた仕訳を答えなさい。`,
        choices: ['利益剰余金当期首残高', '売上原価', '商品', '売上高', '非支配株主持分当期首残高', '利益剰余金'],
        debit: [line('利益剰余金当期首残高', ur)],
        credit: [line('売上原価', ur)],
        explanation: `開始仕訳「利益剰余金当期首残高 / 商品 ${yen(ur)}」と、当期に実現した分の「商品 / 売上原価 ${yen(ur)}」をまとめると、商品が消えて「**利益剰余金当期首残高 / 売上原価**」になる。`,
        mistakes: [
          {
            entry: { debit: [line('売上原価', ur)], credit: [line('商品', ur)] },
            why: 'それは期末商品の未実現利益の消去。期首商品の分は、前期の消去の開始仕訳と、当期の実現の仕訳をする。',
          },
        ],
        ref: { topic: T, anchor: 'beginning' },
      }),
    );
  }

  // 8. 未実現利益(原価に利益を加算)(数値)
  {
    const inv = 270000;
    const mark = 20;
    const base = step('売価の割合(100 + 利益の割合)', 'add', [100, mark]);
    const m = step('期末商品 × 利益の割合', 'mul', [inv, mark]);
    const ur = step('未実現利益(÷ 売価の割合)', 'div', [m.value, base.value]);
    const wrong = step('誤答: 期末商品 × 20%', 'div', [m.value, 100]);
    questions.push(
      numericQ({
        id: 'C28-008',
        topic: T,
        format: F,
        difficulty: 2,
        prompt: `${HEAD}S社の期末商品のうち ${yen(inv)} は、P社から仕入れたもの。P社は、原価に ${mark}% の利益を加えてS社に売っている。消去する未実現利益はいくらか。`,
        answer: ur.value,
        calc: [base, m, ur],
        explanation: `売価 = 原価 × 120% なので、売価の中の利益は 20 ÷ 120。${yen(inv)} × 20 ÷ 120 = ${yen(ur.value)}。`,
        mistakes: [{ value: wrong.value, calc: [m, wrong], why: '「原価に20%の利益を加算」は、売価の20%ではない。売価 × 20 ÷ 120 で計算する。' }],
        ref: { topic: T, anchor: 'ratio' },
      }),
    );
  }

  // 9. 連結損益計算書の売上高(数値)
  {
    const pSales = 6000000;
    const sSales = 2500000;
    const inter = 900000;
    const sum = step('P社とS社の売上高の合計', 'add', [pSales, sSales]);
    const ans = step('連結損益計算書の売上高(− グループ内の売上)', 'sub', [sum.value, inter]);
    questions.push(
      numericQ({
        id: 'C28-009',
        topic: T,
        format: F,
        difficulty: 1,
        prompt: `${HEAD}当期の売上高は、P社 ${yen(pSales)}、S社 ${yen(sSales)}。このうち P社からS社への売上は ${yen(inter)} である。連結損益計算書の売上高はいくらか。`,
        answer: ans.value,
        calc: [sum, ans],
        explanation: `合計 ${yen(sum.value)} から、グループ内の売上 ${yen(inter)} を引いて ${yen(ans.value)}。`,
        mistakes: [{ value: sum.value, calc: [sum], why: 'グループ内の売上は、売上原価と相殺して消す。' }],
        ref: { topic: T, anchor: 'sales' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C28-010',
      topic: T,
      difficulty: 2,
      prompt: '成果連結について、正しいものをすべて選びなさい。',
      options: [
        '親会社から子会社への売上高は、連結では売上原価と相殺する',
        '親会社が子会社に売った商品の未実現利益は、非支配株主にも持分比率で負担させる',
        'グループ内の売掛金に設定した貸倒引当金は、連結で消す',
        '期末商品の未実現利益の消去では、売上高を減らす',
        '子会社が親会社に売った商品の未実現利益は、非支配株主にも持分比率で負担させる',
      ],
      answer: [0, 2, 4],
      explanation: '非支配株主に負担させるのは、子会社が売り手のとき(アップストリーム)だけ。未実現利益の消去は「売上原価 / 商品」。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '親会社が売り手(ダウンストリーム)の未実現利益は、親会社が全額負担する。' },
        { options: [0, 2, 3, 4], why: '未実現利益の消去では、売上原価を増やし、商品を減らす。売上高は取引高の相殺で消す。' },
        { options: [0, 4], why: 'グループ内の売掛金は貸し倒れないので、その貸倒引当金も消す。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'direction' },
    }),
  );

  return { topic: T, questions };
}
