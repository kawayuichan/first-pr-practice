// 計算ステップ。問題の金額は生成スクリプトでこの形にして計算し、
// テストで同じ計算をやり直して一致を確かめる(暗算した数字を入れないため)。
// ステップの形: { label, op, args, value }

export const OPS = {
  add: { symbol: '+', run: (a) => a.reduce((x, y) => x + y, 0) },
  sub: { symbol: '−', run: (a) => a.slice(1).reduce((x, y) => x - y, a[0]) },
  mul: { symbol: '×', run: (a) => a.reduce((x, y) => x * y, 1) },
  div: { symbol: '÷', run: (a) => a[0] / a[1] },
};

/** 計算ステップを作る。結果が整数にならないときはエラー(端数の出る問題を作らないため)。 */
export function makeStep(label, op, args) {
  const def = OPS[op];
  if (!def) throw new Error(`未知の演算: ${op}`);
  if (!Array.isArray(args) || args.length < 2) throw new Error(`${label}: 引数は2つ以上`);
  if (!args.every(Number.isFinite)) throw new Error(`${label}: 数でない引数があります`);
  const value = def.run(args);
  if (!Number.isInteger(value)) throw new Error(`${label}: 結果が整数ではありません (${value})`);
  return { label, op, args: [...args], value };
}

/** ステップを計算し直して、保存されている value と一致するか */
export function verifyStep(step) {
  const def = OPS[step.op];
  if (!def) return false;
  return def.run(step.args) === step.value;
}
