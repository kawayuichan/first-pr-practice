// 参考書の元ファイル(textbook/src/*.md)にある {{ 計算式 }} を、計算した数字に置き換える。
// 例: {{ 200,000 - 50,000 }} → 150,000
// 使える文字は 数字・カンマ・空白・+ - * / ( ) だけ(四則演算のみ)。

import { fmt } from '../../app/lib/format.js';

const ALLOWED = /^[\d\s+\-*/().,_]+$/;

export function evaluate(expr) {
  if (!ALLOWED.test(expr)) throw new Error(`計算式に使えない文字があります: {{ ${expr} }}`);
  const js = expr.replace(/[,_]/g, '');
  // 四則演算の文字だけに限定しているので Function で評価してよい
  const value = Function(`"use strict"; return (${js});`)();
  if (!Number.isFinite(value)) throw new Error(`計算できません: {{ ${expr} }}`);
  if (!Number.isInteger(value)) throw new Error(`結果が整数ではありません: {{ ${expr} }} = ${value}`);
  return value;
}

export function renderTemplate(src) {
  return src.replace(/\{\{([^}]*)\}\}/g, (_, expr) => fmt(evaluate(expr.trim())));
}
