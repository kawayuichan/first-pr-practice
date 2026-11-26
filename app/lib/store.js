// 学習記録の保存(localStorage)。使えない環境(プライベートモードなど)ではメモリだけで動く。

const KEY = 'boki2.progress.v1';
const MAX_ATTEMPTS = 20000;

export function emptyProgress() {
  return { version: 1, attempts: [], review: {} };
}

/** 読み込んだデータの形を確かめる。おかしければ null */
export function validateProgress(p) {
  if (!p || typeof p !== 'object' || p.version !== 1) return null;
  if (!Array.isArray(p.attempts) || typeof p.review !== 'object' || p.review === null) return null;
  const attempts = p.attempts.filter(
    (a) => a && typeof a.q === 'string' && typeof a.t === 'string' && (a.c === 0 || a.c === 1),
  );
  const review = {};
  for (const [k, r] of Object.entries(p.review)) {
    if (r && typeof r.due === 'string' && typeof r.anchor === 'string' && Number.isInteger(r.stage)) review[k] = r;
  }
  return { version: 1, attempts, review };
}

let memory = null;
let storageOk = true;

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = validateProgress(JSON.parse(raw));
      if (p) return p;
    }
  } catch {
    storageOk = false;
  }
  return memory ?? emptyProgress();
}

export function saveProgress(p) {
  if (p.attempts.length > MAX_ATTEMPTS) p.attempts = p.attempts.slice(-MAX_ATTEMPTS);
  memory = p;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    storageOk = true;
  } catch {
    storageOk = false;
  }
  return storageOk;
}

export function storageAvailable() {
  return storageOk;
}

/** 論点ごとの成績: { [論点ID]: { answered, correct, rate, solved: Set(一度でも正解した問題) } } */
export function topicStats(progress) {
  const stats = {};
  for (const a of progress.attempts) {
    const s = (stats[a.t] ??= { answered: 0, correct: 0, rate: 0, solved: new Set() });
    s.answered++;
    if (a.c) {
      s.correct++;
      s.solved.add(a.q);
    }
  }
  for (const s of Object.values(stats)) s.rate = s.answered ? s.correct / s.answered : 0;
  return stats;
}
