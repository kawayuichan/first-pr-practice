// 間違えた問題の再出題(復習)スケジュール。DOM を使わない。
//
// ルール
// - 間違えた日を「起点」にして、1日後・3日後・7日後に再出題する。
// - 再出題で正解したら次の段階へ。7日後の再出題で正解したら復習リストから外れる。
// - 再出題で間違えたら、その日を新しい起点にして 1日後からやり直す。
// - 期日より前に正解しても、予定は変えない(翌日以降の再出題で定着を確かめる)。
// - 期日を過ぎてから解いた場合、次の期日が今日以前になるときは翌日にする。

export const INTERVALS = [1, 3, 7];

const pad = (n) => String(n).padStart(2, '0');

/** 端末の日付(ローカル時刻)を YYYY-MM-DD で */
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return todayStr(dt);
}

/**
 * 解答結果を反映した新しい復習状態を返す(元のオブジェクトは変えない)。
 * review: { [問題ID]: { anchor, stage, due } }
 */
export function applyAnswer(review, qid, correct, today) {
  const next = { ...review };
  const cur = review[qid];
  if (!correct) {
    next[qid] = { anchor: today, stage: 0, due: addDays(today, INTERVALS[0]) };
    return next;
  }
  if (!cur || cur.due > today) return next;
  const stage = cur.stage + 1;
  if (stage >= INTERVALS.length) {
    delete next[qid];
    return next;
  }
  let due = addDays(cur.anchor, INTERVALS[stage]);
  if (due <= today) due = addDays(today, 1);
  next[qid] = { ...cur, stage, due };
  return next;
}

/** 今日までに期日が来ている問題ID(期日の古い順) */
export function dueQids(review, today) {
  return Object.entries(review)
    .filter(([, r]) => r.due <= today)
    .sort((a, b) => (a[1].due < b[1].due ? -1 : a[1].due > b[1].due ? 1 : a[0] < b[0] ? -1 : 1))
    .map(([id]) => id);
}

/** 次に期日が来る日と、その日の問題数(今日より後) */
export function nextDue(review, today) {
  const future = Object.values(review)
    .map((r) => r.due)
    .filter((d) => d > today)
    .sort();
  if (!future.length) return null;
  const date = future[0];
  return { date, count: future.filter((d) => d === date).length };
}
