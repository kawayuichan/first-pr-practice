// B08 貸倒れと貸倒引当金 の問題(10問)
// 仕訳6問・数値2問・表1問(貸倒引当金勘定)・複数選択1問。金額はすべて step() で計算する。
// 決めたこと: 設定の対象は売掛金と電子記録債権。3級の範囲(実績法・差額補充法)だけ。
// 2級の個別評価・営業外債権の区分は C02 で扱う。

import { blankNum, journalQ, line, multiQ, numericQ, step, tableQ, yen } from '../lib/qlib.mjs';

const T = 'B08';

/** 見積額 = (売掛金 + 電子記録債権) × 実績率(%) ÷ 100 */
function estimateSteps(ar, denshi, ratePct) {
  const base = step('設定の対象(売掛金 + 電子記録債権)', 'add', [ar, denshi]);
  const x = step(`対象 × ${ratePct}`, 'mul', [base.value, ratePct]);
  const est = step('見積額(÷ 100)', 'div', [x.value, 100]);
  return { base, steps: [base, x, est], est };
}

const ALLOWANCE = ['貸倒引当金繰入', '貸倒引当金', '貸倒引当金戻入', '貸倒損失'];

export default function build() {
  const questions = [];

  // 1. 決算: 繰入(差額補充法)
  {
    const ar = 450000;
    const denshi = 250000;
    const rate = 2;
    const bal = 5000;
    const { steps, est } = estimateSteps(ar, denshi, rate);
    const add = step('繰入額(見積額 − 残高)', 'sub', [est.value, bal]);
    const arOnlyX = step('誤答: 売掛金だけ × 2', 'mul', [ar, rate]);
    const arOnly = step('誤答: 売掛金だけの見積額', 'div', [arOnlyX.value, 100]);
    const arOnlyAdd = step('誤答: 売掛金だけの繰入額', 'sub', [arOnly.value, bal]);
    questions.push(
      journalQ({
        id: 'B08-001',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、売掛金の期末残高 ${yen(ar)} と電子記録債権の期末残高 ${yen(denshi)} に対して、貸倒実績率${rate}%で貸倒引当金を設定する(差額補充法)。貸倒引当金の残高は ${yen(bal)} である。`,
        choices: [...ALLOWANCE, '売掛金', '電子記録債権'],
        debit: [line('貸倒引当金繰入', add.value)],
        credit: [line('貸倒引当金', add.value)],
        calc: [...steps, add],
        explanation: `見積額は (売掛金 + 電子記録債権) × ${rate}% = ${yen(est.value)}。残高が ${yen(bal)} あるので、差額の ${yen(add.value)} だけ **貸倒引当金繰入(費用)** にする。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金繰入', est.value)], credit: [line('貸倒引当金', est.value)] },
            why: `差額補充法では、見積額から残高 ${yen(bal)} を引いた差額だけ繰り入れる。見積額をそのまま書かない。`,
          },
          {
            entry: { debit: [line('貸倒引当金繰入', arOnlyAdd.value)], credit: [line('貸倒引当金', arOnlyAdd.value)] },
            why: '電子記録債権も設定の対象。売掛金と電子記録債権を合わせた額に実績率をかける。',
          },
          {
            entry: { debit: [line('貸倒引当金繰入', add.value)], credit: [line('売掛金', add.value)] },
            why: 'まだ貸倒れたわけではないので、売掛金は減らさない。見積もった分は貸倒引当金(債権から差し引く科目)にする。',
          },
        ],
        ref: { topic: T, anchor: 'setting' },
      }),
    );
  }

  // 2. 決算: 戻入
  {
    const ar = 320000;
    const denshi = 180000;
    const rate = 1;
    const bal = 7000;
    const { steps, est } = estimateSteps(ar, denshi, rate);
    const back = step('戻入額(残高 − 見積額)', 'sub', [bal, est.value]);
    questions.push(
      journalQ({
        id: 'B08-002',
        topic: T,
        difficulty: 2,
        prompt: `決算にあたり、売掛金の期末残高 ${yen(ar)} と電子記録債権の期末残高 ${yen(denshi)} に対して、貸倒実績率${rate}%で貸倒引当金を設定する(差額補充法)。貸倒引当金の残高は ${yen(bal)} である。`,
        choices: [...ALLOWANCE, '売掛金', '電子記録債権'],
        debit: [line('貸倒引当金', back.value)],
        credit: [line('貸倒引当金戻入', back.value)],
        calc: [...steps, back],
        explanation: `見積額は ${yen(est.value)} で、残高 ${yen(bal)} のほうが多い。多すぎる ${yen(back.value)} を減らし、**貸倒引当金戻入(収益)** にする。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金繰入', back.value)], credit: [line('貸倒引当金', back.value)] },
            why: '残高が見積額より多いので、引当金は増やすのではなく減らす。左右が逆。',
          },
          {
            entry: { debit: [line('貸倒引当金繰入', est.value)], credit: [line('貸倒引当金', est.value)] },
            why: `差額補充法では、残高 ${yen(bal)} と見積額の差だけを調整する。今回は残高のほうが多いので戻入になる。`,
          },
        ],
        ref: { topic: T, anchor: 'setting' },
      }),
    );
  }

  // 3. 繰入額(期中に貸倒れがあった年)
  {
    const opening = 15000;
    const writeoff = 9000;
    const ar = 560000;
    const denshi = 340000;
    const rate = 3;
    const left = step('決算の前の残高(期首 − 取り崩し)', 'sub', [opening, writeoff]);
    const { steps, est } = estimateSteps(ar, denshi, rate);
    const add = step('繰入額(見積額 − 決算の前の残高)', 'sub', [est.value, left.value]);
    const noWriteoff = step('誤答: 取り崩しを忘れた繰入額', 'sub', [est.value, opening]);
    questions.push(
      numericQ({
        id: 'B08-003',
        topic: T,
        difficulty: 3,
        prompt: `貸倒引当金の期首の残高は ${yen(opening)} だった。期中に、前期に販売した商品の売掛金 ${yen(writeoff)} が貸倒れ、貸倒引当金を取り崩した。決算で、売掛金 ${yen(ar)} と電子記録債権 ${yen(denshi)} の期末残高に対して、貸倒実績率${rate}%で貸倒引当金を設定する(差額補充法)。貸倒引当金繰入の金額はいくらか。`,
        answer: add.value,
        calc: [left, ...steps, add],
        explanation: `期中の貸倒れで引当金を取り崩したので、決算の前の残高は ${yen(left.value)}。見積額 ${yen(est.value)} との差額を繰り入れる。`,
        mistakes: [
          { value: est.value, calc: steps, why: '見積額をそのまま答えている。差額補充法では、決算の前の残高との差額だけ繰り入れる。' },
          {
            value: noWriteoff.value,
            calc: [...steps, noWriteoff],
            why: `期中の貸倒れで ${yen(writeoff)} を取り崩しているので、決算の前の残高は期首より少ない。`,
          },
        ],
        ref: { topic: T, anchor: 't-allowance' },
      }),
    );
  }

  // 4. 前期の売掛金の貸倒れ(引当金で足りる)
  {
    const amt = 6000;
    const bal = 10000;
    questions.push(
      journalQ({
        id: 'B08-004',
        topic: T,
        difficulty: 1,
        prompt: `前期に販売した商品の売掛金 ${yen(amt)} が、得意先の倒産により回収できなくなった。貸倒引当金の残高は ${yen(bal)} ある。`,
        choices: [...ALLOWANCE, '売掛金', '現金'],
        debit: [line('貸倒引当金', amt)],
        credit: [line('売掛金', amt)],
        explanation: `前期の債権の貸倒れなので、前期末に備えておいた **貸倒引当金** を取り崩す。残高 ${yen(bal)} で足りるので、貸倒損失は出ない。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒損失', amt)], credit: [line('売掛金', amt)] },
            why: '前期の債権の貸倒れには、まず貸倒引当金を使う。引当金で足りる分は貸倒損失にしない。',
          },
          {
            entry: { debit: [line('貸倒引当金繰入', amt)], credit: [line('売掛金', amt)] },
            why: '貸倒引当金繰入は、決算で引当金を設定するときの費用。貸倒れが起きたときは貸倒引当金を減らす。',
          },
        ],
        ref: { topic: T, anchor: 'writeoff' },
      }),
    );
  }

  // 5. 前期の売掛金の貸倒れ(引当金が足りない)
  {
    const amt = 15000;
    const bal = 9000;
    const loss = step('貸倒損失(貸倒れ − 引当金の残高)', 'sub', [amt, bal]);
    questions.push(
      journalQ({
        id: 'B08-005',
        topic: T,
        difficulty: 2,
        prompt: `前期に販売した商品の売掛金 ${yen(amt)} が貸倒れた。貸倒引当金の残高は ${yen(bal)} である。`,
        choices: [...ALLOWANCE, '売掛金', '現金'],
        debit: [line('貸倒引当金', bal), line('貸倒損失', loss.value)],
        credit: [line('売掛金', amt)],
        calc: [loss],
        explanation: `引当金の残高 ${yen(bal)} を全部取り崩し、足りない ${yen(loss.value)} は **貸倒損失(費用)** にする。`,
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金', amt)], credit: [line('売掛金', amt)] },
            why: `貸倒引当金は ${yen(bal)} しかない。残高より多くは取り崩せないので、足りない分は貸倒損失。`,
          },
          {
            entry: { debit: [line('貸倒損失', amt)], credit: [line('売掛金', amt)] },
            why: '前期の債権の貸倒れなので、まず貸倒引当金を取り崩す。貸倒損失は足りない分だけ。',
          },
        ],
        ref: { topic: T, anchor: 'writeoff' },
      }),
    );
  }

  // 6. 当期に発生した売掛金の貸倒れ
  {
    const amt = 4000;
    const bal = 8000;
    questions.push(
      journalQ({
        id: 'B08-006',
        topic: T,
        difficulty: 2,
        prompt: `当期に販売した商品の売掛金 ${yen(amt)} が貸倒れた。貸倒引当金の残高は ${yen(bal)} ある。`,
        choices: [...ALLOWANCE, '売掛金', '現金'],
        debit: [line('貸倒損失', amt)],
        credit: [line('売掛金', amt)],
        explanation: '貸倒引当金は、前期末にあった債権に備えて設定したもの。**当期に発生した** 債権の貸倒れには使わず、全額 **貸倒損失** にする。',
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金', amt)], credit: [line('売掛金', amt)] },
            why: '当期に販売した分の売掛金は、前期末の引当金の対象ではない。引当金の残高があっても貸倒損失にする。',
          },
        ],
        ref: { topic: T, anchor: 'writeoff' },
      }),
    );
  }

  // 7. 前期の電子記録債権の貸倒れ
  {
    const amt = 20000;
    const bal = 25000;
    questions.push(
      journalQ({
        id: 'B08-007',
        topic: T,
        difficulty: 1,
        prompt: `前期に発生した得意先に対する電子記録債権 ${yen(amt)} が、得意先の倒産により回収できなくなった。貸倒引当金の残高は ${yen(bal)} ある。`,
        choices: [...ALLOWANCE, '売掛金', '電子記録債権'],
        debit: [line('貸倒引当金', amt)],
        credit: [line('電子記録債権', amt)],
        explanation: '電子記録債権も貸倒引当金の対象。前期の債権なので貸倒引当金を取り崩し、回収できなくなった **電子記録債権** を減らす。',
        mistakes: [
          {
            entry: { debit: [line('貸倒引当金', amt)], credit: [line('売掛金', amt)] },
            why: '回収できなくなったのは電子記録債権。売掛金ではなく電子記録債権を減らす。',
          },
          {
            entry: { debit: [line('貸倒損失', amt)], credit: [line('電子記録債権', amt)] },
            why: '前期の債権で、引当金の残高も足りている。貸倒損失ではなく貸倒引当金を取り崩す。',
          },
        ],
        ref: { topic: T, anchor: 'writeoff' },
      }),
    );
  }

  // 8. 償却債権取立益
  {
    const total = 12000;
    const got = 5000;
    questions.push(
      journalQ({
        id: 'B08-008',
        topic: T,
        difficulty: 2,
        prompt: `前期に貸倒れとして処理した売掛金 ${yen(total)} のうち、${yen(got)} を現金で回収した。`,
        choices: ['現金', '売掛金', '償却債権取立益', '貸倒引当金', '貸倒引当金戻入', '貸倒損失'],
        debit: [line('現金', got)],
        credit: [line('償却債権取立益', got)],
        explanation: '売掛金は貸倒れのときに消しているので、もう帳簿にない。思いがけず戻ってきたお金として **償却債権取立益(収益)** にする。',
        mistakes: [
          {
            entry: { debit: [line('現金', got)], credit: [line('売掛金', got)] },
            why: '売掛金は前期の貸倒れのときに消している。ないものは減らせないので、償却債権取立益にする。',
          },
          {
            entry: { debit: [line('現金', got)], credit: [line('貸倒引当金', got)] },
            why: '回収したお金は収益の償却債権取立益。貸倒引当金は決算の見積もりで調整する。',
          },
        ],
        ref: { topic: T, anchor: 'recovery' },
      }),
    );
  }

  // 9. 貸倒引当金勘定(1年間)
  {
    const opening = 16000;
    const writeoff = 10000;
    const ar = 560000;
    const denshi = 340000;
    const rate = 2;
    const left = step('決算の前の残高(前期繰越 − 貸倒れ)', 'sub', [opening, writeoff]);
    const { steps, est } = estimateSteps(ar, denshi, rate);
    const add = step('繰入額(見積額 − 決算の前の残高)', 'sub', [est.value, left.value]);
    const debitTotal = step('借方の合計(貸倒れ + 次期繰越)', 'add', [writeoff, est.value]);
    const creditTotal = step('貸方の合計(前期繰越 + 繰入)', 'add', [opening, add.value]);
    const noWriteoff = step('誤答: 貸倒れを忘れた繰入額', 'sub', [est.value, opening]);
    questions.push(
      tableQ({
        id: 'B08-009',
        topic: T,
        difficulty: 3,
        prompt: `次の貸倒引当金勘定の空欄を埋めなさい。会計期間は4月1日から3月31日まで。期首の残高は ${yen(opening)}。7月10日に前期に販売した商品の売掛金 ${yen(writeoff)} が貸倒れ、貸倒引当金を取り崩した。決算で、売掛金 ${yen(ar)} と電子記録債権 ${yen(denshi)} の期末残高に対して、貸倒実績率${rate}%で貸倒引当金を設定する(差額補充法)。最後に次期繰越を記入して締め切る。`,
        table: {
          title: '貸倒引当金',
          columns: [{ label: '日付・摘要' }, { label: '借方', align: 'right' }, { label: '貸方', align: 'right' }],
          rows: [
            ['4月1日 前期繰越', null, opening],
            ['7月10日 売掛金', blankNum(writeoff), null],
            ['3月31日 貸倒引当金繰入', null, blankNum(add.value)],
            ['3月31日 次期繰越', blankNum(est.value), null],
            ['合計', blankNum(debitTotal.value), blankNum(creditTotal.value)],
          ],
        },
        checks: [
          { label: '借方の合計', op: 'add', args: [[1, 1], [3, 1]], result: [4, 1] },
          { label: '貸方の合計', op: 'add', args: [[0, 2], [2, 2]], result: [4, 2] },
          { label: '借方の合計 = 貸方の合計', op: 'add', args: [[4, 1], 0], result: [4, 2] },
        ],
        calc: [left, ...steps, add, debitTotal, creditTotal],
        explanation: `貸倒れで ${yen(writeoff)} を取り崩すと、決算の前の残高は ${yen(left.value)}。見積額 ${yen(est.value)} との差額 ${yen(add.value)} を繰り入れる。期末の残高(**次期繰越**)は見積額と同じ ${yen(est.value)} になり、借方と貸方の合計がどちらも ${yen(debitTotal.value)} で一致する。`,
        mistakes: [
          {
            cell: [2, 2],
            value: est.value,
            why: '見積額をそのまま繰り入れている。決算の前の残高との差額だけを繰り入れる。',
          },
          {
            cell: [2, 2],
            value: noWriteoff.value,
            calc: [...steps, noWriteoff],
            why: `7月10日の貸倒れで ${yen(writeoff)} を取り崩しているので、決算の前の残高は ${yen(left.value)}。`,
          },
          {
            cell: [3, 1],
            value: left.value,
            calc: [left],
            why: '次期繰越は、繰り入れたあとの期末の残高。差額補充法では、必ず見積額と同じになる。',
          },
        ],
        ref: { topic: T, anchor: 't-allowance' },
      }),
    );
  }

  // 10. 貸倒損失を使う場面(複数選択)
  {
    const O = [
      '当期に販売した商品の売掛金が貸倒れた',
      '前期に販売した商品の売掛金が貸倒れ、貸倒引当金の残高で足りた',
      '前期に販売した商品の売掛金が貸倒れ、貸倒引当金の残高では足りなかった(足りない分)',
      '前期に貸倒れとして処理した売掛金を回収した',
      '決算で、見積額が貸倒引当金の残高より多かった',
    ];
    questions.push(
      multiQ({
        id: 'B08-010',
        topic: T,
        difficulty: 2,
        prompt: '次のうち、貸倒損失を使う場面をすべて選びなさい。',
        options: O,
        answer: [0, 2],
        explanation:
          '**貸倒損失** を使うのは、引当金で備えていない貸倒れ。当期に発生した債権の貸倒れと、前期以前の債権で引当金が足りない分。前期以前の債権で引当金が足りれば貸倒引当金を取り崩す。回収は償却債権取立益、決算の差額は貸倒引当金繰入。',
        mistakes: [
          { options: [2], why: '当期に販売した分の売掛金が貸倒れたときも貸倒損失。前期末の引当金はこの売掛金に備えたものではない。' },
          { options: [0, 1, 2], why: '前期の債権で引当金の残高が足りるときは、貸倒引当金を取り崩す。貸倒損失は使わない。' },
          { options: [0, 2, 4], why: '決算で見積額が残高より多いときは、差額を貸倒引当金繰入にする。貸倒損失ではない。' },
        ],
        ref: { topic: T, anchor: 'writeoff' },
      }),
    );
  }

  return { topic: T, questions };
}
