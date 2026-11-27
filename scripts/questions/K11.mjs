// K11 直接原価計算と原価予測 の問題(10問)
// 数値7問・選択2問・複数選択1問。金額はすべて step() で計算する。
// 直接原価計算の損益計算書(貢献利益)、全部原価計算との比較、固定費調整、費目別精査法、高低点法(正常操業圏)。

import { choiceQ, multiQ, numericQ, step, yen } from '../lib/qlib.mjs';

const T = 'K11';

export default function build() {
  const questions = [];

  // 1〜3. 直接原価計算と全部原価計算(共通の資料)
  const d = { price: 1200, vMfg: 500, vSell: 60, fMfg: 480000, fSga: 150000, made: 1200, sold: 1000 };
  const data = `製品の販売単価は ¥${d.price.toLocaleString()}。変動製造原価は1個 ¥${d.vMfg}、固定製造原価は ${yen(d.fMfg)}、変動販売費は1個 ¥${d.vSell}、固定販売費及び一般管理費は ${yen(d.fSga)}。当期は ${d.made.toLocaleString()}個を作り、${d.sold.toLocaleString()}個を売った(期首の在庫はない)。`;
  const sales = step('売上高(販売量 × 販売単価)', 'mul', [d.sold, d.price]);
  const vCogs = step('変動売上原価(販売量 × 変動製造原価)', 'mul', [d.sold, d.vMfg]);
  const margin = step('変動製造マージン(売上高 − 変動売上原価)', 'sub', [sales.value, vCogs.value]);
  const vSell = step('変動販売費(販売量 × 1個あたり)', 'mul', [d.sold, d.vSell]);
  const contrib = step('貢献利益(変動製造マージン − 変動販売費)', 'sub', [margin.value, vSell.value]);
  const fAll = step('固定費の合計(固定製造原価 + 固定販売費及び一般管理費)', 'add', [d.fMfg, d.fSga]);
  const dcOp = step('直接原価計算の営業利益(貢献利益 − 固定費)', 'sub', [contrib.value, fAll.value]);
  const dcSteps = [sales, vCogs, margin, vSell, contrib];
  const fUnit = step('1個あたりの固定製造原価(固定製造原価 ÷ 生産量)', 'div', [d.fMfg, d.made]);
  const unit = step('全部原価計算の1個の製造原価(変動 + 固定)', 'add', [d.vMfg, fUnit.value]);
  const cogs = step('売上原価(販売量 × 1個の製造原価)', 'mul', [d.sold, unit.value]);
  const gross = step('売上総利益(売上高 − 売上原価)', 'sub', [sales.value, cogs.value]);
  const sga = step('販売費及び一般管理費(変動販売費 + 固定)', 'add', [vSell.value, d.fSga]);
  const acOp = step('全部原価計算の営業利益(売上総利益 − 販売費及び一般管理費)', 'sub', [gross.value, sga.value]);
  const acSteps = [sales, fUnit, unit, cogs, gross, vSell, sga, acOp];

  questions.push(
    numericQ({
      id: 'K11-001',
      topic: T,
      difficulty: 1,
      prompt: `${data}直接原価計算による貢献利益はいくらか。`,
      answer: contrib.value,
      calc: dcSteps,
      explanation: `売上高 ${yen(sales.value)} − 変動売上原価 ${yen(vCogs.value)} = 変動製造マージン ${yen(margin.value)}。ここから変動販売費 ${yen(vSell.value)} を引いて、貢献利益 ${yen(contrib.value)}。`,
      mistakes: [{ value: margin.value, calc: [sales, vCogs, margin], why: 'それは変動製造マージン。貢献利益は、さらに変動販売費を引く。' }],
      ref: { topic: T, anchor: 'direct-pl' },
    }),
  );
  {
    const wf = step('誤答: 売った分の固定製造原価(1個あたり × 販売量)', 'mul', [fUnit.value, d.sold]);
    const w1 = step('誤答: 貢献利益 − 売った分の固定製造原価', 'sub', [contrib.value, wf.value]);
    const wrong = step('誤答: さらに固定販売費及び一般管理費を引いた額', 'sub', [w1.value, d.fSga]);
    questions.push(
      numericQ({
        id: 'K11-002',
        topic: T,
        difficulty: 2,
        prompt: `${data}直接原価計算による営業利益はいくらか。`,
        answer: dcOp.value,
        calc: [...dcSteps, fAll, dcOp],
        explanation: `貢献利益 ${yen(contrib.value)} から、固定費 ${yen(d.fMfg)} + ${yen(d.fSga)} = ${yen(fAll.value)} を引いて ${yen(dcOp.value)}。固定製造原価は、作った量や売った量に関係なく **全額** を当期の費用にする。`,
        mistakes: [{ value: wrong.value, calc: [fUnit, wf, w1, wrong], why: '直接原価計算では、固定製造原価を売った分だけに分けない。全額を当期の費用にする。' }],
        ref: { topic: T, anchor: 'direct-pl' },
      }),
    );
  }
  questions.push(
    numericQ({
      id: 'K11-003',
      topic: T,
      difficulty: 2,
      prompt: `${data}全部原価計算による営業利益はいくらか。`,
      answer: acOp.value,
      calc: acSteps,
      explanation: `1個の製造原価 = ¥${d.vMfg} + ${yen(d.fMfg)} ÷ ${d.made.toLocaleString()}個 = ¥${unit.value}。売上原価 ${yen(cogs.value)}、売上総利益 ${yen(gross.value)}、販売費及び一般管理費 ${yen(sga.value)} を引いて ${yen(acOp.value)}。`,
      mistakes: [{ value: dcOp.value, calc: [...dcSteps, fAll, dcOp], why: 'それは直接原価計算の営業利益。全部原価計算では、売れ残った製品に固定製造原価の一部が残る。' }],
      ref: { topic: T, anchor: 'full-pl' },
    }),
  );

  // 4. 固定費調整
  {
    const op = 250000;
    const bQty = 300;
    const bF = 200;
    const eQty = 500;
    const eF = 180;
    const endF = step('期末在庫の固定製造原価(数量 × 1個あたり)', 'mul', [eQty, eF]);
    const begF = step('期首在庫の固定製造原価(数量 × 1個あたり)', 'mul', [bQty, bF]);
    const a1 = step('直接原価計算の営業利益 + 期末在庫の固定製造原価', 'add', [op, endF.value]);
    const ans = step('全部原価計算の営業利益(− 期首在庫の固定製造原価)', 'sub', [a1.value, begF.value]);
    const w1 = step('誤答: 直接原価計算の営業利益 + 期首在庫の分', 'add', [op, begF.value]);
    const wrong = step('誤答: − 期末在庫の分', 'sub', [w1.value, endF.value]);
    questions.push(
      numericQ({
        id: 'K11-004',
        topic: T,
        difficulty: 2,
        prompt: `直接原価計算による営業利益は ${yen(op)}。製品の期首在庫は ${bQty}個(1個あたりの固定製造原価 ¥${bF})、期末在庫は ${eQty}個(1個あたりの固定製造原価 ¥${eF})。固定費調整を行い、全部原価計算による営業利益を求めなさい。`,
        answer: ans.value,
        calc: [endF, begF, a1, ans],
        explanation: `期末在庫の固定製造原価 ${yen(endF.value)} は全部原価計算では翌期へ繰り越されるので足し、期首在庫の ${yen(begF.value)} は当期の費用になるので引く。${yen(op)} + ${yen(endF.value)} − ${yen(begF.value)} = ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [endF, begF, w1, wrong], why: '期末在庫の分を足し、期首在庫の分を引く。逆にしない。' }],
        ref: { topic: T, anchor: 'adjust' },
      }),
    );
  }

  // 5〜6. 高低点法
  const months = [
    { m: '1月', h: 900, cost: 455000 },
    { m: '2月', h: 1300, cost: 575000 },
    { m: '3月', h: 700, cost: 395000 },
    { m: '4月', h: 1600, cost: 710000 },
  ];
  const [, hi, lo, out] = months;
  const hlData = `機械運転時間と電力料は、${months.map((x) => `${x.m} ${x.h.toLocaleString()}時間・${yen(x.cost)}`).join('、')} だった。正常操業圏は月 700〜1,400時間である。`;
  const dc = step('原価の差(最高の月 − 最低の月)', 'sub', [hi.cost, lo.cost]);
  const dh = step('操業度の差(最高 − 最低)', 'sub', [hi.h, lo.h]);
  const vr = step('変動費率(原価の差 ÷ 操業度の差)', 'div', [dc.value, dh.value]);
  const vHi = step('最高の月の変動費(変動費率 × 時間)', 'mul', [vr.value, hi.h]);
  const fixed = step('固定費(最高の月の原価 − 変動費)', 'sub', [hi.cost, vHi.value]);
  const wdc = step('誤答: 正常操業圏外の4月を最高とした原価の差', 'sub', [out.cost, lo.cost]);
  const wdh = step('誤答: 4月を最高とした操業度の差', 'sub', [out.h, lo.h]);
  const wvr = step('誤答: 4月を使った変動費率', 'div', [wdc.value, wdh.value]);
  questions.push(
    numericQ({
      id: 'K11-005',
      topic: T,
      difficulty: 2,
      unit: '円/時間',
      prompt: `${hlData}高低点法で、電力料の変動費率(1時間あたり)を求めなさい。`,
      answer: vr.value,
      calc: [dc, dh, vr],
      explanation: `4月(1,600時間)は正常操業圏の外なので使わない。最高は2月、最低は3月。(${yen(hi.cost)} − ${yen(lo.cost)}) ÷ (${hi.h.toLocaleString()} − ${lo.h})時間 = ¥${vr.value}。`,
      mistakes: [{ value: wvr.value, calc: [wdc, wdh, wvr], why: '正常操業圏の外の月(4月)は使わない。正常操業圏の中の最高と最低の月で計算する。' }],
      ref: { topic: T, anchor: 'estimate' },
    }),
  );
  {
    const wv = step('誤答: 4月の変動費(4月の変動費率 × 時間)', 'mul', [wvr.value, out.h]);
    const wrong = step('誤答: 4月を使った固定費', 'sub', [out.cost, wv.value]);
    questions.push(
      numericQ({
        id: 'K11-006',
        topic: T,
        difficulty: 3,
        prompt: `${hlData}高低点法で、電力料の固定費(月額)を求めなさい。`,
        answer: fixed.value,
        calc: [dc, dh, vr, vHi, fixed],
        explanation: `変動費率は ¥${vr.value}(2月と3月から)。最高の2月で、${yen(hi.cost)} − ¥${vr.value} × ${hi.h.toLocaleString()}時間 = ${yen(fixed.value)}。`,
        mistakes: [{ value: wrong.value, calc: [wdc, wdh, wvr, wv, wrong], why: '正常操業圏の外の4月は使わない。' }],
        ref: { topic: T, anchor: 'estimate' },
      }),
    );
  }

  // 7. 費目別精査法(選択)
  questions.push(
    choiceQ({
      id: 'K11-007',
      topic: T,
      difficulty: 1,
      prompt: '費目別精査法で原価を分けるとき、ふつう固定費に分類するものはどれか。',
      options: ['直接材料費', '外注加工賃', '工場の建物の減価償却費(定額法)', '製品の発送費'],
      answer: 2,
      explanation: '定額法の減価償却費は、生産量に関係なく毎月同じ額なので **固定費**。',
      mistakes: [
        { option: 0, why: '直接材料費は、作る量に比例して増えるので変動費。' },
        { option: 1, why: '外注加工賃は、外部に頼む加工の量に比例するので変動費。' },
        { option: 3, why: '発送費は、売った量に比例するので変動費(変動販売費)。' },
      ],
      ref: { topic: T, anchor: 'estimate' },
    }),
  );

  // 8. 営業利益の大小(選択)
  questions.push(
    choiceQ({
      id: 'K11-008',
      topic: T,
      difficulty: 2,
      prompt: '期首の在庫はなく、当期の生産量が販売量より多かった。直接原価計算と全部原価計算の営業利益について、正しいものはどれか。',
      options: [
        '全部原価計算の営業利益のほうが大きい',
        '直接原価計算の営業利益のほうが大きい',
        'どちらも同じになる',
        '販売単価によってどちらが大きいかが変わる',
      ],
      answer: 0,
      explanation: '全部原価計算では、売れ残った在庫に固定製造原価の一部が入ったまま翌期へ繰り越され、当期の費用が少なくなる。だから **全部原価計算** の営業利益のほうが大きい。',
      mistakes: [
        { option: 1, why: '直接原価計算では固定製造原価を全額費用にするので、在庫が増えるときは利益が小さくなる。' },
        { option: 2, why: '同じになるのは、期首と期末の在庫に含まれる固定製造原価が同じとき(在庫がないときなど)。' },
        { option: 3, why: '差は在庫に含まれる固定製造原価だけで決まり、販売単価は関係ない。' },
      ],
      ref: { topic: T, anchor: 'which' },
    }),
  );

  // 9. 費目別精査法による原価の予測(数値)
  {
    const base = 1000;
    const next = 1200;
    const items = { 直接材料費: 400000, 補助材料費: 50000, 外注加工賃: 150000, 減価償却費: 160000, 固定資産税: 60000 };
    const v1 = step('変動費(直接材料費 + 補助材料費)', 'add', [items.直接材料費, items.補助材料費]);
    const v = step('変動費の合計(+ 外注加工賃)', 'add', [v1.value, items.外注加工賃]);
    const f = step('固定費の合計(減価償却費 + 固定資産税)', 'add', [items.減価償却費, items.固定資産税]);
    const rate = step('変動費率(変動費 ÷ 生産量)', 'div', [v.value, base]);
    const vNext = step('翌月の変動費(変動費率 × 予定生産量)', 'mul', [rate.value, next]);
    const ans = step('翌月の製造原価の予測(変動費 + 固定費)', 'add', [vNext.value, f.value]);
    const tot = step('誤答: 当月の製造原価の合計', 'add', [v.value, f.value]);
    const wm = step('誤答: 合計 × 予定生産量', 'mul', [tot.value, next]);
    const wrong = step('誤答: 全額を生産量に比例させた額(÷ 当月の生産量)', 'div', [wm.value, base]);
    questions.push(
      numericQ({
        id: 'K11-009',
        topic: T,
        difficulty: 3,
        prompt: `当月の生産量は ${base.toLocaleString()}個で、製造原価は、直接材料費 ${yen(items.直接材料費)}、補助材料費 ${yen(items.補助材料費)}、外注加工賃 ${yen(items.外注加工賃)}、工場の減価償却費 ${yen(items.減価償却費)}、工場の固定資産税 ${yen(items.固定資産税)} だった。費目別精査法で、材料費と外注加工賃は変動費、減価償却費と固定資産税は固定費と判断した。翌月の生産量を ${next.toLocaleString()}個とすると、製造原価はいくらと予測されるか。`,
        answer: ans.value,
        calc: [v1, v, f, rate, vNext, ans],
        explanation: `変動費 ${yen(v.value)} ÷ ${base.toLocaleString()}個 = 1個 ¥${rate.value}。翌月は ¥${rate.value} × ${next.toLocaleString()}個 = ${yen(vNext.value)} に、固定費 ${yen(f.value)} を足して ${yen(ans.value)}。`,
        mistakes: [{ value: wrong.value, calc: [v1, v, f, tot, wm, wrong], why: '固定費は生産量が増えても変わらない。生産量に比例させるのは変動費だけ。' }],
        ref: { topic: T, anchor: 'estimate' },
      }),
    );
  }

  // 10. 正しいもの(複数選択)
  questions.push(
    multiQ({
      id: 'K11-010',
      topic: T,
      difficulty: 2,
      prompt: '直接原価計算と原価の予測について、正しいものをすべて選びなさい。',
      options: [
        '貢献利益は、売上高から変動売上原価と変動販売費を引いた額である',
        '直接原価計算では、固定製造原価のうち売れた製品の分だけをその期の費用にする',
        '固定費調整では、直接原価計算の営業利益に、期末在庫の固定製造原価を足し、期首在庫の固定製造原価を引く',
        '高低点法では、原価が最も高い月と最も低い月を使う',
        '高低点法では、正常操業圏の外のデータは使わない',
      ],
      answer: [0, 2, 4],
      explanation: '直接原価計算では固定製造原価は全額その期の費用。高低点法は、操業度が最高・最低の月を使う。',
      mistakes: [
        { options: [0, 1, 2, 4], why: '直接原価計算では、固定製造原価は全額をその期の費用にする。' },
        { options: [0, 2, 3, 4], why: '高低点法で選ぶのは、原価ではなく操業度が最高・最低の月。' },
        { options: [0, 4], why: '固定費調整は、期末在庫の分を足し、期首在庫の分を引く。これも正しい。' },
      ],
      ref: { topic: T, anchor: 'estimate' },
    }),
  );

  return { topic: T, questions };
}
