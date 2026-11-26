// 金額の表示形式。アプリと生成スクリプト・テストで共通に使う。

/** 3桁ごとにカンマを入れる(整数のみ)。例: 1234567 → "1,234,567" */
export function fmt(n) {
  if (!Number.isInteger(n)) throw new Error(`整数ではありません: ${n}`);
  const sign = n < 0 ? '-' : '';
  return sign + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 円記号つき。例: 250000 → "¥250,000" */
export function yen(n) {
  return `¥${fmt(n)}`;
}

/**
 * 入力された金額の文字列を整数にする。全角数字・カンマ・円記号・空白を許す。
 * 数として読めないときは null。
 */
export function parseAmount(text) {
  if (text == null) return null;
  const s = String(text)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，、\s¥￥円]/g, '');
  if (s === '') return null;
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}
