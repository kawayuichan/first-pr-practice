// K12 CVP分析 の問題(10問)
// 数値8問・選択1問・複数選択1問。金額はすべて step() で計算する。
// 貢献利益率、損益分岐点(販売量・売上高)、目標営業利益・目標売上高営業利益率、安全余裕率、損益分岐図表。

import { choiceQ, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K12';

export default function build() {
  const questions = [];

  const d = { price: 2000, vMfg: 1100, vSell: 100, fMfg: 1200000, fSga: 600000 };
  const data = `製品の販売単価は ¥${d.price.toLocaleString()}。1個あたりの変動費は、変動製造原価 ¥${d.vMfg.toLocaleString()}、変動販売費 ¥${d.vSell}。固定費は、固定製造原価 ${yen(d.fMfg)}、固定販売費及び一般管理費 ${yen(d.fSga)}。`;
  const v = step('1個あたりの変動費(変動製造原価 + 変動販売費)', 'add', [d.vMfg, d.vSell]);
  const cm = step('1個あたりの貢献利益(販売単価 − 変動費)', 'sub', [d.price, v.value]);
  const cmM = step('貢献利益 × 100', 'mul', [cm.value, 100]);
  const cmr = step('貢献利益率(%)(÷ 販売単価)', 'div', [cmM.value, d.price]);
  const f = step('固定費の合計(固定製造原価 + 固定販売費及び一般管理費)', 'add', [d.fMfg, d.fSga]);
  const bepQ = step('損益分岐点の販売量(固定費 ÷ 1個あたりの貢献利益)', 'div', [f.value, cm.value]);
  const bepS = step('損益分岐点の売上高(販売量 × 販売単価)', 'mul', [bepQ.value, d.price]);
  const base = [v, cm, f];

  // 1. 貢献利益率
  {
    const vM = step('誤答: 変動費 × 100', 'mul', [v.value, 100]);
    const vr = step('誤答: 変動費率(%)', 'div', [vM.value, d.price]);
    questions.push(
      numericQ({
        id: 'K12-001',
        topic: T,
        difficulty: 1,
        unit: '%',
        prompt: `${data}貢献利益率は何%か。`,
        answer: cmr.value,
        calc: [v, cm, cmM, cmr],
        explanation: `1個あたりの変動費は ¥${d.vMfg.toLocaleString()} + ¥${d.vSell} = ¥${v.value.toLocaleString()}、貢献利益は ¥${d.price.toLocaleString()} − ¥${v.value.toLocaleString()} = ¥${cm.value}。¥${cm.value} ÷ ¥${d.price.toLocaleString()} = ${cmr.value}%。`,
        mistakes: [{ value: vr.value, calc: [v, vM, vr], why: 'それは変動費率。貢献利益率は、販売単価から変動費を引いた貢献利益の割合。' }],
        ref: { topic: T, anchor: 'ratio' },
      }),
    );
  }

  // 2. 損益分岐点の販売量
  {
    const wrong = step('誤答: 固定製造原価だけを割った販売量', 'div', [d.fMfg, cm.value]);
    questions.push(
      numericQ({
        id: 'K12-002',
        topic: T,
        difficulty: 2,
        unit: '個',
        prompt: `${data}損益分岐点の販売量は何個か。`,
        answer: bepQ.value,
        calc: [...base, bepQ],
        explanation: `固定費は ${yen(d.fMfg)} + ${yen(d.fSga)} = ${yen(f.value)}。これを1個あたりの貢献利益 ¥${cm.value} で割って ${bepQ.value.toLocaleString()}個。`,
        mistakes: [{ value: wrong.value, calc: [v, cm, wrong], why: '固定費には、固定販売費及び一般管理費も含める。' }],
        ref: { topic: T, anchor: 'bep' },
      }),
    );
  }

  // 3. 損益分岐点の売上高
  {
    const vM = step('誤答: 変動費 × 100', 'mul', [v.value, 100]);
    const vr = step('誤答: 変動費率(%)', 'div', [vM.value, d.price]);
    const wM = step('誤答: 固定費 × 100', 'mul', [f.value, 100]);
    const wrong = step('誤答: 固定費 ÷ 変動費率', 'div', [wM.value, vr.value]);
    questions.push(
      numericQ({
        id: 'K12-003',
        topic: T,
        difficulty: 2,
        prompt: `${data}損益分岐点の売上高はいくらか。`,
        answer: bepS.value,
        calc: [...base, bepQ, bepS],
        explanation: `損益分岐点の販売量 ${bepQ.value.toLocaleString()}個 × ¥${d.price.toLocaleString()} = ${yen(bepS.value)}。固定費 ${yen(f.value)} ÷ 貢献利益率 ${cmr.value}% と計算しても同じ。`,
        mistakes: [{ value: wrong.value, calc: [v, f, vM, vr, wM, wrong], why: '固定費は、変動費率ではなく貢献利益率で割る。' }],
        ref: { topic: T, anchor: 'bep' },
      }),
    );
  }

  // 4〜5. 目標営業利益
  const target = 600000;
  const need = step('固定費 + 目標営業利益', 'add', [f.value, target]);
  const tQ = step('目標営業利益を出す販売量(÷ 1個あたりの貢献利益)', 'div', [need.value, cm.value]);
  const tS = step('目標営業利益を出す売上高(販売量 × 販売単価)', 'mul', [tQ.value, d.price]);
  {
    const wrong = step('誤答: 目標営業利益だけを割った販売量', 'div', [target, cm.value]);
    questions.push(
      numericQ({
        id: 'K12-004',
        topic: T,
        difficulty: 2,
        unit: '個',
        prompt: `${data}営業利益 ${yen(target)} を出すために必要な販売量は何個か。`,
        answer: tQ.value,
        calc: [...base, need, tQ],
        explanation: `(固定費 ${yen(f.value)} + 目標営業利益 ${yen(target)})÷ ¥${cm.value} = ${tQ.value.toLocaleString()}個。貢献利益で、まず固定費を回収し、残りが利益になる。`,
        mistakes: [{ value: wrong.value, calc: [v, cm, wrong], why: '貢献利益は、まず固定費の回収に使われる。固定費と目標利益の合計を割る。' }],
        ref: { topic: T, anchor: 'target' },
      }),
    );
  }
  {
    const vM = step('誤答: 変動費 × 100', 'mul', [v.value, 100]);
    const vr = step('誤答: 変動費率(%)', 'div', [vM.value, d.price]);
    const wM = step('誤答: (固定費 + 目標営業利益)× 100', 'mul', [need.value, 100]);
    const wrong = step('誤答: 変動費率で割った売上高', 'div', [wM.value, vr.value]);
    questions.push(
      numericQ({
        id: 'K12-005',
        topic: T,
        difficulty: 2,
        prompt: `${data}営業利益 ${yen(target)} を出すために必要な売上高はいくらか。`,
        answer: tS.value,
        calc: [...base, need, tQ, tS],
        explanation: `必要な販売量は(${yen(f.value)} + ${yen(target)})÷ ¥${cm.value} = ${tQ.value.toLocaleString()}個。× ¥${d.price.toLocaleString()} = ${yen(tS.value)}(${yen(need.value)} ÷ 貢献利益率 ${cmr.value}% と同じ)。`,
        mistakes: [{ value: wrong.value, calc: [v, f, need, vM, vr, wM, wrong], why: '貢献利益率で割る。変動費率で割らない。' }],
        ref: { topic: T, anchor: 'target' },
      }),
    );
  }

  // 6. 安全余裕率
  {
    const plan = 7500000;
    const diff = step('予定売上高 − 損益分岐点の売上高', 'sub', [plan, bepS.value]);
    const m = step('差 × 100', 'mul', [diff.value, 100]);
    const ans = step('安全余裕率(%)(÷ 予定売上高)', 'div', [m.value, plan]);
    const bm = step('誤答: 損益分岐点の売上高 × 100', 'mul', [bepS.value, 100]);
    const wrong = step('誤答: 損益分岐点比率(%)', 'div', [bm.value, plan]);
    questions.push(
      numericQ({
        id: 'K12-006',
        topic: T,
        difficulty: 2,
        unit: '%',
        prompt: `${data}来期の予定売上高は ${yen(plan)} である。安全余裕率は何%か。`,
        answer: ans.value,
        calc: [...base, bepQ, bepS, diff, m, ans],
        explanation: `損益分岐点の売上高は ${yen(bepS.value)}。(${yen(plan)} − ${yen(bepS.value)})÷ ${yen(plan)} = ${ans.value}%。売上高が ${ans.value}% 減るまでは赤字にならない。`,
        mistakes: [{ value: wrong.value, calc: [...base, bepQ, bepS, bm, wrong], why: 'それは損益分岐点比率(損益分岐点の売上高 ÷ 売上高)。安全余裕率は 100% からそれを引いた割合。' }],
        ref: { topic: T, anchor: 'safety' },
      }),
    );
  }

  // 7. 目標売上高営業利益率
  {
    const rate = 20;
    const gap = step('貢献利益率 − 目標の売上高営業利益率(%)', 'sub', [cmr.value, rate]);
    const m = step('固定費 × 100', 'mul', [f.value, 100]);
    const ans = step('売上高(固定費 ÷ その差)', 'div', [m.value, gap.value]);
    const add = step('誤答: 貢献利益率 + 目標の利益率', 'add', [cmr.value, rate]);
    const wrong = step('誤答: 固定費 ÷ その合計', 'div', [m.value, add.value]);
    questions.push(
      numericQ({
        id: 'K12-007',
        topic: T,
        difficulty: 3,
        prompt: `${data}売上高営業利益率 ${rate}% を達成するために必要な売上高はいくらか。`,
        answer: ans.value,
        calc: [v, cm, cmM, cmr, f, gap, m, ans],
        explanation: `売上高を S とすると、貢献利益 ${cmr.value}%S − 固定費 ${yen(f.value)} = 営業利益 ${rate}%S。${cmr.value}% − ${rate}% = ${gap.value}% なので、S = ${yen(f.value)} ÷ ${gap.value}% = ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [v, cm, cmM, cmr, f, m, add, wrong], why: '営業利益の分は、貢献利益率から引く(足さない)。' }],
        ref: { topic: T, anchor: 'target' },
      }),
    );
  }

  // 8. 販売量から営業利益
  {
    const qty = 2500;
    const c = step('貢献利益(販売量 × 1個あたりの貢献利益)', 'mul', [qty, cm.value]);
    const op = step('営業利益(貢献利益 − 固定費)', 'sub', [c.value, f.value]);
    const wcm = step('誤答: 変動販売費を入れない1個あたりの貢献利益', 'sub', [d.price, d.vMfg]);
    const wc = step('誤答: その貢献利益 × 販売量', 'mul', [qty, wcm.value]);
    const wrong = step('誤答: − 固定費', 'sub', [wc.value, f.value]);
    questions.push(
      numericQ({
        id: 'K12-008',
        topic: T,
        difficulty: 2,
        prompt: `${data}販売量が ${qty.toLocaleString()}個のとき、営業利益はいくらか。`,
        answer: op.value,
        calc: [...base, c, op],
        explanation: `貢献利益 = ${qty.toLocaleString()}個 × ¥${cm.value} = ${yen(c.value)}。固定費 ${yen(f.value)} を引いて ${yen(op.value)}。`,
        mistakes: [{ value: wrong.value, calc: [f, wcm, wc, wrong], why: '変動費には変動販売費も含める。1個あたりの貢献利益は販売単価 − 変動製造原価 − 変動販売費。' }],
        ref: { topic: T, anchor: 'chart' },
      }),
    );
  }

  // 9. 損益分岐図表(選択)
  questions.push(
    choiceQ({
      id: 'K12-009',
      topic: T,
      difficulty: 1,
      prompt: '損益分岐図表で、損益分岐点はどこか。',
      options: [
        '売上高線と総原価線が交わる点',
        '売上高線と固定費線が交わる点',
        '総原価線が縦軸と交わる点',
        '売上高線が原点を通る点',
      ],
      answer: 0,
      explanation: '売上高と総原価(固定費 + 変動費)がちょうど等しく、利益が0になる点。**売上高線と総原価線の交点**。',
      mistakes: [
        { option: 1, why: '固定費だけでなく、変動費も含めた総原価と比べる。' },
        { option: 2, why: 'そこは販売量が0のときの総原価(=固定費)の点。' },
        { option: 3, why: '販売量0のとき売上高も0になる点で、損益分岐点ではない(このとき固定費の分だけ損失)。' },
      ],
      ref: { topic: T, anchor: 'chart' },
    }),
  );

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K12-010',
      topic: T,
      difficulty: 2,
      prompt: 'CVP分析について、正しいものをすべて選びなさい。',
      options: [
        '損益分岐点の売上高は、固定費を貢献利益率で割って求める',
        '安全余裕率は、売上高と損益分岐点の売上高の差を、損益分岐点の売上高で割って求める',
        '目標営業利益を出す売上高は、固定費と目標営業利益の合計を貢献利益率で割って求める',
        '変動費には、変動製造原価だけを含め、変動販売費は含めない',
        '貢献利益率と変動費率を足すと 100% になる',
      ],
      answer: [0, 2, 4],
      explanation: '安全余裕率の分母は売上高。変動費には変動販売費も含める。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '安全余裕率の分母は、損益分岐点の売上高ではなく、実際(予定)の売上高。' },
        { options: [0, 2, 3, 4], why: '変動販売費も、販売量に比例する変動費。' },
        { options: [0, 2], why: '貢献利益率 = 1 − 変動費率。足すと 100% になる。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'ratio' },
    }),
  );

  return { topic: T, questions };
}
