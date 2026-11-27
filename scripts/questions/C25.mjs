// C25 本支店会計 の問題(10問)
// 仕訳6問・数値3問・複数選択1問。金額はすべて step() で計算する。
// 本支店間取引(商品は原価で送付。内部利益なし)、本店集中計算制度、未達事項、支店の損益の振替、合併財務諸表。

import { journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'C25';

export default function build() {
  const questions = [];

  // 1〜2. 商品の送付(本店・支店)
  {
    const amt = 180000;
    const prompt = `本店は、支店に商品 ${yen(amt)}(原価)を送った。商品は原価のまま送る。`;
    questions.push(
      journalQ({
        id: 'C25-001',
        topic: T,
        format: 'q2_topic',
        difficulty: 1,
        prompt: `${prompt}本店の仕訳を答えなさい。`,
        choices: ['支店', '仕入', '売上', '本店', '繰越商品', '売掛金'],
        debit: [line('支店', amt)],
        credit: [line('仕入', amt)],
        explanation: '本店の帳簿では、支店との取引を **支店** 勘定で記録する。商品は原価で送るので、仕入を減らす(貸方)。',
        mistakes: [
          {
            entry: { debit: [line('支店', amt)], credit: [line('売上', amt)] },
            why: '支店は同じ会社の中。原価で送るときは売上ではなく、仕入を減らす。',
          },
        ],
        ref: { topic: T, anchor: 'between' },
      }),
    );
    questions.push(
      journalQ({
        id: 'C25-002',
        topic: T,
        format: 'q2_topic',
        difficulty: 1,
        prompt: `${prompt}支店の仕訳を答えなさい。`,
        choices: ['仕入', '本店', '支店', '買掛金', '繰越商品', '売上'],
        debit: [line('仕入', amt)],
        credit: [line('本店', amt)],
        explanation: '支店の帳簿では、本店との取引を **本店** 勘定で記録する。商品を受け取ったので仕入(借方)。',
        mistakes: [
          {
            entry: { debit: [line('仕入', amt)], credit: [line('買掛金', amt)] },
            why: '本店から受け取った商品なので、買掛金ではなく本店勘定。',
          },
        ],
        ref: { topic: T, anchor: 'between' },
      }),
    );
  }

  // 3. 本店集中計算制度(支店の仕訳)
  {
    const amt = 75000;
    questions.push(
      journalQ({
        id: 'C25-003',
        topic: T,
        format: 'q2_topic',
        difficulty: 2,
        prompt: `東支店は、西支店の買掛金 ${yen(amt)} を現金で支払った。支店どうしの取引は本店集中計算制度で記録している。西支店の仕訳を答えなさい。`,
        choices: ['買掛金', '本店', '現金', '支店', '未払金', '仕入'],
        debit: [line('買掛金', amt)],
        credit: [line('本店', amt)],
        explanation: '西支店は、自分の買掛金がなくなった(借方)。本店集中計算制度では、相手を東支店ではなく **本店** とする(本店が東支店に払ってもらったと考える)。',
        mistakes: [
          {
            entry: { debit: [line('買掛金', amt)], credit: [line('現金', amt)] },
            why: '現金を払ったのは東支店。西支店の現金は減らない。',
          },
        ],
        ref: { topic: T, anchor: 'branches' },
      }),
    );
  }

  // 4. 未達事項(支店側)
  {
    const amt = 80000;
    questions.push(
      journalQ({
        id: 'C25-004',
        topic: T,
        format: 'q3_statements',
        difficulty: 2,
        prompt: `決算日に、本店が支店に送った現金 ${yen(amt)} が、まだ支店に届いていなかった(本店は記録済み)。未達事項を整理する仕訳を答えなさい。`,
        choices: ['現金', '本店', '支店', '仮払金', '未収入金', '仕入'],
        debit: [line('現金', amt)],
        credit: [line('本店', amt)],
        explanation: '本店はすでに「支店 / 現金」と記録している。届いていない **支店の帳簿** で「現金 / 本店」と記録して、本店勘定と支店勘定を合わせる。',
        mistakes: [
          {
            entry: { debit: [line('支店', amt)], credit: [line('現金', amt)] },
            why: 'それは本店がすでにした仕訳。未達事項は、届いていない側(支店)で仕訳する。',
          },
        ],
        ref: { topic: T, anchor: 'unarrived' },
      }),
    );
  }

  // 5. 未達整理後の残高(数値)
  {
    const shiten = 640000;
    const honten = 535000;
    const goods = 70000;
    const cash = 35000;
    const after = step('整理後の支店勘定(本店で現金の未達を記録)', 'sub', [shiten, cash]);
    const check = step('整理後の本店勘定(支店で商品の未達を記録)', 'add', [honten, goods]);
    const w1 = step('誤答: 支店勘定 + 商品の未達', 'add', [shiten, goods]);
    const wrong = step('誤答: − 現金の未達(どちらも本店側で直した額)', 'sub', [w1.value, cash]);
    questions.push(
      numericQ({
        id: 'C25-005',
        topic: T,
        format: 'q3_statements',
        difficulty: 3,
        prompt: `決算日に、本店の支店勘定は借方残高 ${yen(shiten)}、支店の本店勘定は貸方残高 ${yen(honten)} だった。未達事項は、①本店が支店に送った商品 ${yen(goods)} が支店に未達、②支店が本店に送った現金 ${yen(cash)} が本店に未達。未達事項を整理したあとの支店勘定の残高はいくらか。`,
        answer: after.value,
        calc: [check, after],
        explanation: `①は支店の帳簿で記録するので、本店勘定が ${yen(honten)} + ${yen(goods)} = ${yen(check.value)} になる。②は本店の帳簿で「現金 / 支店」と記録するので、支店勘定は ${yen(shiten)} − ${yen(cash)} = ${yen(after.value)}。2つは一致する。`,
        mistakes: [{ value: wrong.value, calc: [w1, wrong], why: '①の商品の未達は支店の帳簿で直す。本店の支店勘定は変わらない。' }],
        ref: { topic: T, anchor: 'unarrived' },
      }),
    );
  }

  // 6〜7. 支店の損益の振替
  {
    const ni = 340000;
    questions.push(
      journalQ({
        id: 'C25-006',
        topic: T,
        format: 'q2_topic',
        difficulty: 2,
        prompt: `決算にあたり、支店の損益勘定で計算した当期純利益 ${yen(ni)} を本店に振り替えた。支店の仕訳を答えなさい。`,
        choices: ['損益', '本店', '繰越利益剰余金', '支店', '現金', '資本金'],
        debit: [line('損益', ni)],
        credit: [line('本店', ni)],
        explanation: '支店は、損益勘定の貸方残高(当期純利益)を消して(借方)、**本店** に送る(貸方)。支店には繰越利益剰余金はない。',
        mistakes: [
          {
            entry: { debit: [line('損益', ni)], credit: [line('繰越利益剰余金', ni)] },
            why: '繰越利益剰余金は本店の帳簿にある。支店の利益は本店勘定を通して本店に振り替える。',
          },
        ],
        ref: { topic: T, anchor: 'closing' },
      }),
    );
    questions.push(
      journalQ({
        id: 'C25-007',
        topic: T,
        format: 'q2_topic',
        difficulty: 2,
        prompt: `決算にあたり、支店から、支店の当期純利益 ${yen(ni)} を振り替えたと連絡を受けた。本店の仕訳を答えなさい。`,
        choices: ['支店', '損益', '繰越利益剰余金', '本店', '受取手数料', '資本金'],
        debit: [line('支店', ni)],
        credit: [line('損益', ni)],
        explanation: '本店は、支店の利益を自分の **損益** 勘定に受け入れる(貸方)。相手は **支店** 勘定。こうして本店の損益勘定に会社全体の利益が集まる。',
        mistakes: [
          {
            entry: { debit: [line('支店', ni)], credit: [line('繰越利益剰余金', ni)] },
            why: 'いったん本店の損益勘定に入れて、本店の利益と合わせてから繰越利益剰余金に振り替える。',
          },
        ],
        ref: { topic: T, anchor: 'closing' },
      }),
    );
  }

  // 8〜9. 合併財務諸表(数値)
  {
    const hCash = 420000;
    const sCash = 180000;
    const unCash = 45000;
    const a = step('本店の現金 + 支店の現金', 'add', [hCash, sCash]);
    const ans = step('合併貸借対照表の現金(+ 未達の現金)', 'add', [a.value, unCash]);
    questions.push(
      numericQ({
        id: 'C25-008',
        topic: T,
        format: 'q3_statements',
        difficulty: 2,
        prompt: `決算整理後の現金は、本店 ${yen(hCash)}、支店 ${yen(sCash)}。支店が本店に送った現金 ${yen(unCash)} が本店に未達で、まだ整理していない。本支店合併貸借対照表の現金はいくらか。`,
        answer: ans.value,
        calc: [a, ans],
        explanation: `未達の現金は、会社の現金としてまだどちらの帳簿にもない(支店は減らし、本店はまだ増やしていない)。${yen(hCash)} + ${yen(sCash)} + ${yen(unCash)} = ${yen(ans.value)}。`,
        mistakes: [{ value: a.value, calc: [a], why: '未達の現金を本店の帳簿に加えてから合計する。' }],
        ref: { topic: T, anchor: 'combine' },
      }),
    );
  }
  {
    const hInv = 350000;
    const sInv = 160000;
    const unGoods = 50000;
    const a = step('本店の期末商品 + 支店の期末商品', 'add', [hInv, sInv]);
    const ans = step('合併貸借対照表の商品(+ 未達の商品)', 'add', [a.value, unGoods]);
    questions.push(
      numericQ({
        id: 'C25-009',
        topic: T,
        format: 'q3_statements',
        difficulty: 2,
        prompt: `期末商品棚卸高(実地)は、本店 ${yen(hInv)}、支店 ${yen(sInv)}。本店が支店に送った商品 ${yen(unGoods)}(原価)が支店に未達である。本支店合併貸借対照表の商品はいくらか。`,
        answer: ans.value,
        calc: [a, ans],
        explanation: `未達の商品は、本店の手元にも支店の倉庫にもないが、会社の商品。支店の期末商品に加えて、${yen(hInv)} + ${yen(sInv)} + ${yen(unGoods)} = ${yen(ans.value)}。`,
        mistakes: [{ value: a.value, calc: [a], why: '未達の商品は、支店の仕入に加えるとともに、期末商品にも加える。' }],
        ref: { topic: T, anchor: 'combine' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'C25-010',
      topic: T,
      difficulty: 2,
      prompt: '本支店会計について、正しいものをすべて選びなさい。',
      options: [
        '本店の支店勘定と支店の本店勘定は、未達事項を整理すると貸借反対で一致する',
        '未達事項は、すでに記録した側で、取り消しの仕訳をする',
        '本支店合併財務諸表では、本店勘定と支店勘定を相殺して表示しない',
        '本店集中計算制度では、支店どうしの取引を、各支店は相手の支店勘定で記録する',
        '支店の当期純利益は、本店の損益勘定に振り替えてから、繰越利益剰余金に振り替える',
      ],
      answer: [0, 2, 4],
      explanation: '未達事項は、届いていない側で仕訳する。本店集中計算制度では、各支店は相手を本店として記録する。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '未達事項は取り消さない。届いていない側で記録して、両方の帳簿をそろえる。' },
        { options: [0, 2, 3, 4], why: '本店集中計算制度では、各支店は相手を本店とする。相手の支店勘定を使うのは、もう1つの方法(支店分散計算制度)。' },
        { options: [0, 2], why: '支店の利益は本店の損益勘定に集める。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'combine' },
    }),
  );

  return { topic: T, questions };
}
