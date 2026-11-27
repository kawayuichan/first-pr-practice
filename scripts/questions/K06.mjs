// K06 部門別計算 の問題(10問)
// 仕訳4問・数値4問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 第1次集計(部門個別費・部門共通費)、直接配賦法、相互配賦法(簡便法)、部門別の予定配賦と配賦差異。
// 部門費の科目名(切削部門費など)は公式表外の補助リストにある。

import { choiceQ, journalQ, line, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K06';
const DEPTS = ['切削部門費', '組立部門費', '動力部門費', '修繕部門費'];

export default function build() {
  const questions = [];

  // 1. 部門共通費の配賦(数値)
  const common = 240000;
  const area = { 切削: 500, 組立: 300, 動力: 150, 修繕: 50 };
  const a1 = step('床面積の合計(切削 + 組立)', 'add', [area.切削, area.組立]);
  const a2 = step('床面積の合計(+ 動力)', 'add', [a1.value, area.動力]);
  const aAll = step('床面積の合計(+ 修繕)', 'add', [a2.value, area.修繕]);
  const share = (n, label) => {
    const m = step(`${label}: 共通費 × 床面積`, 'mul', [common, area[n]]);
    const v = step(`${label}への配賦額(÷ 床面積の合計)`, 'div', [m.value, aAll.value]);
    return [m, v];
  };
  const [cutM, cutC] = share('切削', '切削部門');
  const [asmM, asmC] = share('組立', '組立部門');
  const [pwrM, pwrC] = share('動力', '動力部門');
  const [rprM, rprC] = share('修繕', '修繕部門');
  const areaText = `切削部門 ${area.切削}㎡、組立部門 ${area.組立}㎡、動力部門 ${area.動力}㎡、修繕部門 ${area.修繕}㎡`;
  {
    const wm = step('誤答: 共通費 × 切削の床面積', 'mul', [common, area.切削]);
    const wrong = step('誤答: 製造部門の床面積(切削 + 組立)だけで割った額', 'div', [wm.value, a1.value]);
    questions.push(
      numericQ({
        id: 'K06-001',
        topic: T,
        difficulty: 1,
        prompt: `工場の建物の減価償却費 ${yen(common)}(部門共通費)を、床面積で各部門に配賦する。床面積は、${areaText}。切削部門への配賦額はいくらか。`,
        answer: cutC.value,
        calc: [a1, a2, aAll, cutM, cutC],
        explanation: `床面積の合計 ${aAll.value.toLocaleString()}㎡ のうち、切削部門は ${area.切削}㎡。${yen(common)} × ${area.切削} ÷ ${aAll.value.toLocaleString()} = ${yen(cutC.value)}。`,
        mistakes: [{ value: wrong.value, calc: [a1, wm, wrong], why: '部門共通費は補助部門にも配賦する。床面積の合計には動力・修繕部門も入れる。' }],
        ref: { topic: T, anchor: 'first' },
      }),
    );
  }

  // 2. 第1次集計の仕訳
  {
    const own = { 切削: 180000, 組立: 140000, 動力: 50000, 修繕: 30000 };
    const tCut = step('切削部門費(個別費 + 共通費)', 'add', [own.切削, cutC.value]);
    const tAsm = step('組立部門費(個別費 + 共通費)', 'add', [own.組立, asmC.value]);
    const tPwr = step('動力部門費(個別費 + 共通費)', 'add', [own.動力, pwrC.value]);
    const tRpr = step('修繕部門費(個別費 + 共通費)', 'add', [own.修繕, rprC.value]);
    const s1 = step('合計(切削 + 組立)', 'add', [tCut.value, tAsm.value]);
    const s2 = step('合計(+ 動力)', 'add', [s1.value, tPwr.value]);
    const total = step('製造間接費から振り替える合計(+ 修繕)', 'add', [s2.value, tRpr.value]);
    questions.push(
      journalQ({
        id: 'K06-002',
        topic: T,
        difficulty: 2,
        prompt: `製造間接費を各部門に集計する(第1次集計)。部門個別費は、切削部門 ${yen(own.切削)}、組立部門 ${yen(own.組立)}、動力部門 ${yen(own.動力)}、修繕部門 ${yen(own.修繕)}。部門共通費の配賦額は、切削部門 ${yen(cutC.value)}、組立部門 ${yen(asmC.value)}、動力部門 ${yen(pwrC.value)}、修繕部門 ${yen(rprC.value)}。`,
        choices: [...DEPTS, '製造間接費', '仕掛品'],
        debit: [line('切削部門費', tCut.value), line('組立部門費', tAsm.value), line('動力部門費', tPwr.value), line('修繕部門費', tRpr.value)],
        credit: [line('製造間接費', total.value)],
        calc: [tCut, tAsm, tPwr, tRpr, s1, s2, total],
        explanation: `各部門費は、部門個別費 + 部門共通費の配賦額。補助部門(動力 ${yen(tPwr.value)}・修繕 ${yen(tRpr.value)})にも集計し、合計 ${yen(total.value)} を製造間接費から振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('切削部門費', tCut.value), line('組立部門費', tAsm.value)], credit: [line('製造間接費', s1.value)] },
            why: '第1次集計では、補助部門(動力・修繕)にも部門費を集計する。製造部門への配賦は第2次集計で行う。',
          },
        ],
        ref: { topic: T, anchor: 'first' },
      }),
    );
  }

  // 3〜4. 直接配賦法
  const power = 80000;
  const kwh = { 切削: 1200, 組立: 800, 修繕: 400 };
  const repair = 45000;
  const hrs = { 切削: 70, 組立: 20, 動力: 30 };
  const kwhProd = step('製造部門の電力使用量(切削 + 組立)', 'add', [kwh.切削, kwh.組立]);
  const pCutM = step('動力部門費 × 切削の使用量', 'mul', [power, kwh.切削]);
  const pCut = step('切削部門への配賦額(÷ 製造部門の使用量)', 'div', [pCutM.value, kwhProd.value]);
  const pAsm = step('組立部門への配賦額(動力部門費 − 切削への配賦額)', 'sub', [power, pCut.value]);
  const powerText = `動力部門費 ${yen(power)} は電力の使用量(切削部門 ${kwh.切削.toLocaleString()}kWh、組立部門 ${kwh.組立}kWh、修繕部門 ${kwh.修繕}kWh)で配賦する。`;
  {
    const all = step('誤答: 修繕を含めた使用量の合計', 'add', [kwhProd.value, kwh.修繕]);
    const wrong = step('誤答: 修繕を含めた合計で割った額', 'div', [pCutM.value, all.value]);
    questions.push(
      numericQ({
        id: 'K06-003',
        topic: T,
        difficulty: 2,
        prompt: `補助部門費を直接配賦法で製造部門に配賦する。${powerText}切削部門への配賦額はいくらか。`,
        answer: pCut.value,
        calc: [kwhProd, pCutM, pCut],
        explanation: `直接配賦法では、補助部門(修繕部門)が使った分を基準から除く。${yen(power)} × ${kwh.切削.toLocaleString()} ÷ ${kwhProd.value.toLocaleString()} = ${yen(pCut.value)}。`,
        mistakes: [{ value: wrong.value, calc: [all, wrong], why: '直接配賦法では、修繕部門の使用量を基準に入れない。製造部門の使用量の合計で割る。' }],
        ref: { topic: T, anchor: 'direct' },
      }),
    );
  }
  {
    const hProd = step('製造部門の修繕時間(切削 + 組立)', 'add', [hrs.切削, hrs.組立]);
    const rCutM = step('修繕部門費 × 切削の修繕時間', 'mul', [repair, hrs.切削]);
    const rCut = step('切削部門への配賦額(÷ 製造部門の修繕時間)', 'div', [rCutM.value, hProd.value]);
    const rAsm = step('組立部門への配賦額(修繕部門費 − 切削への配賦額)', 'sub', [repair, rCut.value]);
    const dCut = step('切削部門費の借方(動力分 + 修繕分)', 'add', [pCut.value, rCut.value]);
    const dAsm = step('組立部門費の借方(動力分 + 修繕分)', 'add', [pAsm.value, rAsm.value]);
    const sum = step('補助部門費の合計', 'add', [power, repair]);
    questions.push(
      journalQ({
        id: 'K06-004',
        topic: T,
        difficulty: 3,
        prompt: `補助部門費を直接配賦法で製造部門に配賦する。${powerText}修繕部門費 ${yen(repair)} は修繕時間(切削部門 ${hrs.切削}時間、組立部門 ${hrs.組立}時間、動力部門 ${hrs.動力}時間)で配賦する。`,
        choices: [...DEPTS, '仕掛品', '製造間接費'],
        debit: [line('切削部門費', dCut.value), line('組立部門費', dAsm.value)],
        credit: [line('動力部門費', power), line('修繕部門費', repair)],
        calc: [kwhProd, pCutM, pCut, pAsm, hProd, rCutM, rCut, rAsm, dCut, dAsm],
        explanation: `動力: 切削 ${yen(pCut.value)}、組立 ${yen(pAsm.value)}。修繕: 動力部門の ${hrs.動力}時間を除いて、切削 ${yen(rCut.value)}、組立 ${yen(rAsm.value)}。製造部門費の借方は合計 ${yen(sum.value)} で、補助部門費の合計と同じ。`,
        mistakes: [
          {
            entry: { debit: [line('仕掛品', sum.value)], credit: [line('動力部門費', power), line('修繕部門費', repair)] },
            why: '補助部門費は、まず製造部門に配賦する。仕掛品へは製造部門費から予定配賦する。',
            calc: [sum],
          },
        ],
        ref: { topic: T, anchor: 'direct' },
      }),
    );
  }

  // 5. 相互配賦法(簡便法)(数値)
  {
    const pw = 90000;
    const k = { 切削: 500, 組立: 300, 修繕: 100 };
    const rp = 40000;
    const h = { 切削: 30, 組立: 10, 動力: 10 };
    const k1 = step('1回目の電力の基準(切削 + 組立)', 'add', [k.切削, k.組立]);
    const kAll = step('1回目の電力の基準(+ 修繕)', 'add', [k1.value, k.修繕]);
    const h1 = step('1回目の修繕時間の基準(切削 + 組立)', 'add', [h.切削, h.組立]);
    const hAll = step('1回目の修繕時間の基準(+ 動力)', 'add', [h1.value, h.動力]);
    const p1m = step('1回目 動力 → 切削(動力部門費 × 切削の使用量)', 'mul', [pw, k.切削]);
    const p1 = step('1回目 動力 → 切削(÷ 全部の使用量)', 'div', [p1m.value, kAll.value]);
    const p2rm = step('1回目 動力 → 修繕(動力部門費 × 修繕の使用量)', 'mul', [pw, k.修繕]);
    const p2r = step('1回目 動力 → 修繕(÷ 全部の使用量)', 'div', [p2rm.value, kAll.value]);
    const r1m = step('1回目 修繕 → 切削(修繕部門費 × 切削の時間)', 'mul', [rp, h.切削]);
    const r1 = step('1回目 修繕 → 切削(÷ 全部の時間)', 'div', [r1m.value, hAll.value]);
    const r2pm = step('1回目 修繕 → 動力(修繕部門費 × 動力の時間)', 'mul', [rp, h.動力]);
    const r2p = step('1回目 修繕 → 動力(÷ 全部の時間)', 'div', [r2pm.value, hAll.value]);
    const q1m = step('2回目 動力が受け取った分 → 切削(× 切削の使用量)', 'mul', [r2p.value, k.切削]);
    const q1 = step('2回目 動力 → 切削(÷ 製造部門の使用量)', 'div', [q1m.value, k1.value]);
    const q2m = step('2回目 修繕が受け取った分 → 切削(× 切削の時間)', 'mul', [p2r.value, h.切削]);
    const q2 = step('2回目 修繕 → 切削(÷ 製造部門の時間)', 'div', [q2m.value, h1.value]);
    const t1 = step('切削への配賦額(1回目 動力 + 1回目 修繕)', 'add', [p1.value, r1.value]);
    const t2 = step('(+ 2回目 動力)', 'add', [t1.value, q1.value]);
    const total = step('切削部門への配賦額の合計(+ 2回目 修繕)', 'add', [t2.value, q2.value]);
    const wp = step('誤答: 直接配賦法の動力分(動力部門費 × 切削 ÷ 製造部門の使用量)', 'div', [p1m.value, k1.value]);
    const wr = step('誤答: 直接配賦法の修繕分(修繕部門費 × 切削 ÷ 製造部門の時間)', 'div', [r1m.value, h1.value]);
    const wrong = step('誤答: 直接配賦法で計算した合計', 'add', [wp.value, wr.value]);
    questions.push(
      numericQ({
        id: 'K06-005',
        topic: T,
        difficulty: 3,
        prompt: `補助部門費を相互配賦法(簡便法)で製造部門に配賦する。動力部門費 ${yen(pw)} は電力の使用量(切削部門 ${k.切削}kWh、組立部門 ${k.組立}kWh、修繕部門 ${k.修繕}kWh)、修繕部門費 ${yen(rp)} は修繕時間(切削部門 ${h.切削}時間、組立部門 ${h.組立}時間、動力部門 ${h.動力}時間)で配賦する。切削部門に配賦される補助部門費の合計はいくらか。`,
        answer: total.value,
        calc: [k1, kAll, h1, hAll, p1m, p1, p2rm, p2r, r1m, r1, r2pm, r2p, q1m, q1, q2m, q2, t1, t2, total],
        explanation: `1回目(補助部門にも配る): 動力 → 切削 ${yen(p1.value)}・修繕 ${yen(p2r.value)}、修繕 → 切削 ${yen(r1.value)}・動力 ${yen(r2p.value)}。2回目(製造部門だけ): 動力が受け取った ${yen(r2p.value)} → 切削 ${yen(q1.value)}、修繕が受け取った ${yen(p2r.value)} → 切削 ${yen(q2.value)}。合計 ${yen(total.value)}。`,
        mistakes: [{ value: wrong.value, calc: [k1, h1, p1m, wp, r1m, wr, wrong], why: 'それは直接配賦法の結果。相互配賦法では、1回目に補助部門どうしにも配賦する。' }],
        ref: { topic: T, anchor: 'mutual' },
      }),
    );
  }

  // 6. 相互配賦法の2回目(選択)
  questions.push(
    choiceQ({
      id: 'K06-006',
      topic: T,
      difficulty: 2,
      prompt: '相互配賦法(簡便法)で、1回目の配賦でほかの補助部門から受け取った額は、2回目にどう配賦するか。',
      options: [
        '直接配賦法と同じように、製造部門だけに配賦する',
        '1回目と同じように、補助部門どうしにも配賦する',
        '配賦せず、補助部門に残しておく',
        '製造部門を通さず、仕掛品に直接振り替える',
      ],
      answer: 0,
      explanation: '簡便法の相互配賦法は、1回目だけ補助部門どうしのやり取りを考え、**2回目は製造部門だけ** に配賦して終わる。',
      mistakes: [
        { option: 1, why: '2回目も補助部門どうしに配ると、いつまでも終わらない。2回目は製造部門だけ。' },
        { option: 2, why: '補助部門費は、最後にはすべて製造部門に配賦する。' },
        { option: 3, why: '補助部門費は製造部門に配賦し、仕掛品へは製造部門費から予定配賦する。' },
      ],
      ref: { topic: T, anchor: 'mutual' },
    }),
  );

  // 7〜9. 部門別の予定配賦と配賦差異
  const rateCut = 400;
  const rateAsm = 300;
  const hCut = 520;
  const hAsm = 450;
  const apCut = step('切削部門の予定配賦額(予定配賦率 × 実際作業時間)', 'mul', [rateCut, hCut]);
  const apAsm = step('組立部門の予定配賦額(予定配賦率 × 実際作業時間)', 'mul', [rateAsm, hAsm]);
  {
    const sum = step('仕掛品への予定配賦額の合計', 'add', [apCut.value, apAsm.value]);
    questions.push(
      journalQ({
        id: 'K06-007',
        topic: T,
        difficulty: 2,
        prompt: `製造部門ごとの予定配賦率は、切削部門が1時間 ¥${rateCut}、組立部門が1時間 ¥${rateAsm}。当月の実際の作業時間は、切削部門 ${hCut}時間、組立部門 ${hAsm}時間だった。製品に予定配賦する。`,
        choices: ['仕掛品', '切削部門費', '組立部門費', '製造間接費', '動力部門費', '製品'],
        debit: [line('仕掛品', sum.value)],
        credit: [line('切削部門費', apCut.value), line('組立部門費', apAsm.value)],
        calc: [apCut, apAsm, sum],
        explanation: `切削 ¥${rateCut} × ${hCut}時間 = ${yen(apCut.value)}、組立 ¥${rateAsm} × ${hAsm}時間 = ${yen(apAsm.value)}。部門別計算では、貸方は **各製造部門費**。`,
        mistakes: [
          {
            entry: { debit: [line('仕掛品', sum.value)], credit: [line('製造間接費', sum.value)] },
            why: '部門別計算では、製造間接費はすでに各部門費に振り替えてある。貸方は切削部門費・組立部門費。',
          },
        ],
        ref: { topic: T, anchor: 'apply' },
      }),
    );
  }
  {
    const actual = 131000;
    const diff = step('配賦差異(予定配賦額 − 実際の部門費。有利の額)', 'sub', [apAsm.value, actual]);
    questions.push(
      journalQ({
        id: 'K06-008',
        topic: T,
        difficulty: 2,
        prompt: `月末。組立部門費の実際発生額(補助部門費の配賦後)は ${yen(actual)}、予定配賦額は ${yen(apAsm.value)} だった。差額を製造部門費配賦差異勘定に振り替える。`,
        choices: ['組立部門費', '製造部門費配賦差異', '仕掛品', '製造間接費', '切削部門費', '売上原価'],
        debit: [line('組立部門費', diff.value)],
        credit: [line('製造部門費配賦差異', diff.value)],
        calc: [diff],
        explanation: `実際 ${yen(actual)} が予定 ${yen(apAsm.value)} より ${yen(diff.value)} 少ない(有利差異)。組立部門費勘定の貸方残高を、製造部門費配賦差異の **貸方** へ振り替える。`,
        mistakes: [
          {
            entry: { debit: [line('製造部門費配賦差異', diff.value)], credit: [line('組立部門費', diff.value)] },
            why: '実際が予定より少ないので有利差異(貸方)。逆にしない。',
          },
        ],
        ref: { topic: T, anchor: 'variance' },
      }),
    );
  }
  {
    const bCut = 3000000;
    const nCut = 7500;
    const bAsm = 1500000;
    const nAsm = 5000;
    const rate = step('切削部門の予定配賦率(年間予算 ÷ 年間基準操業度)', 'div', [bCut, nCut]);
    const bAll = step('誤答: 工場全体の予算', 'add', [bCut, bAsm]);
    const nAll = step('誤答: 工場全体の基準操業度', 'add', [nCut, nAsm]);
    const wrong = step('誤答: 工場全体の率', 'div', [bAll.value, nAll.value]);
    questions.push(
      numericQ({
        id: 'K06-009',
        topic: T,
        difficulty: 1,
        unit: '円/時間',
        prompt: `製造部門ごとに予定配賦率を決める。年間の予算と基準操業度は、切削部門が ${yen(bCut)}・${nCut.toLocaleString()}時間、組立部門が ${yen(bAsm)}・${nAsm.toLocaleString()}時間。切削部門の予定配賦率(1時間あたり)はいくらか。`,
        answer: rate.value,
        calc: [rate],
        explanation: `切削部門の予算 ÷ 切削部門の基準操業度 = ${yen(bCut)} ÷ ${nCut.toLocaleString()}時間 = 1時間 ¥${rate.value}。部門ごとに率を決めると、作業の内容のちがいが原価に反映される。`,
        mistakes: [{ value: wrong.value, calc: [bAll, nAll, wrong], why: 'それは工場全体の率。部門別計算では、部門ごとの予算と基準操業度で割る。' }],
        ref: { topic: T, anchor: 'apply' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K06-010',
      topic: T,
      difficulty: 2,
      prompt: '部門別計算について、正しいものをすべて選びなさい。',
      options: [
        '部門個別費は、発生した部門に直接集計する',
        '部門共通費は、製造部門だけに配賦し、補助部門には配賦しない',
        '直接配賦法では、補助部門どうしのサービスのやり取りを無視して、製造部門だけに配賦する',
        '相互配賦法(簡便法)では、2回目の配賦も補助部門どうしで行う',
        '製造部門ごとに予定配賦率を決めると、部門ごとの作業のちがいを製品の原価に反映しやすい',
      ],
      answer: [0, 2, 4],
      explanation: '部門共通費は補助部門にも配賦する。相互配賦法の2回目は製造部門だけ。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '部門共通費は、補助部門を含むすべての部門に配賦する。' },
        { options: [0, 2, 3, 4], why: '相互配賦法(簡便法)で補助部門どうしに配るのは1回目だけ。' },
        { options: [0, 2], why: '部門別の予定配賦率のほうが、工場全体の率より原価が正確になる。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'methods' },
    }),
  );

  return { topic: T, questions };
}
