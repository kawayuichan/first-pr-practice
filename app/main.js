// 簿記2級 参考書+問題集 アプリ本体。
// 画面: ホーム(#/)、参考書(#/topic/ID)、問題(#/quiz/ID)、復習(#/review)、記録(#/settings)

import { OPS } from './lib/calc.js';
import { fmt, parseAmount, yen } from './lib/format.js';
import { buildAccountIndex, gradeQuestion } from './lib/grading.js';
import { escapeHtml as esc, renderInline, renderMarkdown } from './lib/markdown.js';
import { applyAnswer, dueQids, INTERVALS, nextDue, todayStr } from './lib/srs.js';
import {
  emptyProgress,
  loadProgress,
  saveProgress,
  storageAvailable,
  topicStats,
  validateProgress,
} from './lib/store.js';

const $app = document.getElementById('app');
const MAX_ROWS = 6;

const S = {
  manifest: null,
  index: null,
  topics: new Map(), // 論点ID → manifest の論点
  questions: new Map(), // 問題ID → 問題
  loaded: new Map(), // 論点ID → 問題の配列
  textbooks: new Map(), // 論点ID → { html }
  progress: loadProgress(),
  session: null,
};

// ---------- 読み込み ----------

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} を読み込めませんでした(${r.status})`);
  return r.json();
}

async function getText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} を読み込めませんでした(${r.status})`);
  return r.text();
}

async function loadQuestions(topicId) {
  if (S.loaded.has(topicId)) return S.loaded.get(topicId);
  const t = S.topics.get(topicId);
  if (!t?.questions) return [];
  const data = await getJSON(t.questions);
  for (const q of data.questions) S.questions.set(q.id, q);
  S.loaded.set(topicId, data.questions);
  return data.questions;
}

function linkRewriter(topicId) {
  return (href) => {
    let m = /^#([\w-]+)$/.exec(href);
    if (m) return `#/topic/${topicId}?a=${m[1]}`;
    m = /^(?:\.\/)?([BCK]\d\d)\.md(?:#([\w-]+))?$/.exec(href);
    if (m) return `#/topic/${m[1]}${m[2] ? `?a=${m[2]}` : ''}`;
    return href;
  };
}

async function loadTextbook(topicId) {
  if (S.textbooks.has(topicId)) return S.textbooks.get(topicId);
  const t = S.topics.get(topicId);
  if (!t?.textbook) return null;
  const md = await getText(t.textbook);
  const tb = renderMarkdown(md, { idPrefix: 'tb-', rewriteLink: linkRewriter(topicId) });
  S.textbooks.set(topicId, tb);
  return tb;
}

/** 参考書の中の、ある見出しから次の同じ階層の見出しまでを取り出す */
function textbookSection(tb, anchor) {
  const box = document.createElement('div');
  box.innerHTML = tb.html;
  const h = box.querySelector(`#tb-${CSS.escape(anchor)}`);
  if (!h) return null;
  const level = Number(h.tagName.slice(1));
  const out = document.createElement('div');
  const title = h.textContent;
  let el = h.nextElementSibling;
  while (el && !(/^H[1-6]$/.test(el.tagName) && Number(el.tagName.slice(1)) <= level)) {
    out.appendChild(el.cloneNode(true));
    el = el.nextElementSibling;
  }
  out.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
  return { title, html: out.innerHTML };
}

// ---------- 共通の部品 ----------

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
function md(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${m}/${d}(${WEEK[new Date(y, m - 1, d).getDay()]})`;
}

const pct = (r) => `${Math.round(r * 100)}%`;

function page({ title, back, body }) {
  $app.innerHTML = `
    <header class="bar">
      ${back ? `<a class="back" href="${back}" aria-label="戻る">‹</a>` : '<span class="back-sp"></span>'}
      <h1>${esc(title)}</h1>
      <a class="bar-link" href="#/settings">記録</a>
    </header>
    <main class="wrap">${body}</main>`;
}

function renderError(e) {
  const fileHint =
    location.protocol === 'file:'
      ? '<p>ファイルを直接開くと読み込めません。リポジトリのフォルダで <code>python3 -m http.server</code> を実行し、ブラウザで <code>http://localhost:8000/</code> を開いてください。</p>'
      : '';
  page({
    title: 'エラー',
    back: '#/',
    body: `<section class="card"><p>${esc(e.message ?? String(e))}</p>${fileHint}</section>`,
  });
}

function stepHtml(s) {
  const sym = ` ${OPS[s.op].symbol} `;
  return `<li><span class="calc-label">${esc(s.label)}</span><span class="calc-expr">${s.args.map(fmt).join(sym)} = <strong>${fmt(s.value)}</strong></span></li>`;
}

function entryTable(entry, marks) {
  const n = Math.max(entry.debit.length, entry.credit.length, 1);
  const cell = (side, k) => {
    const l = entry[side][k];
    if (!l) return '<td></td><td></td>';
    const mk = marks ? (marks[side][k]?.ok ? '<span class="mk ok">✓</span>' : '<span class="mk ng">×</span>') : '';
    return `<td>${mk}${esc(l.account)}</td><td class="al-right">${fmt(l.amount)}</td>`;
  };
  let rows = '';
  for (let k = 0; k < n; k++) rows += `<tr>${cell('debit', k)}${cell('credit', k)}</tr>`;
  return `<div class="table-wrap"><table class="md-journal"><thead><tr><th>借方科目</th><th class="al-right">金額</th><th>貸方科目</th><th class="al-right">金額</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function entryInline(e) {
  const side = (ls) => ls.map((l) => `${esc(l.account)} ${fmt(l.amount)}`).join('・');
  return `(借)${side(e.debit)} /(貸)${side(e.credit)}`;
}

// ---------- ホーム ----------

function topicStatusText(t, st) {
  if (!t.questions && !t.textbook) return '<span class="tstat off">準備中</span>';
  if (!st) return `<span class="tstat">${t.count}問 未着手</span>`;
  return `<span class="tstat">正解 ${st.solved.size}/${t.count}・正答率 ${pct(st.rate)}</span>`;
}

function renderHome() {
  const today = todayStr();
  const due = dueQids(S.progress.review, today);
  const nd = nextDue(S.progress.review, today);
  const stats = topicStats(S.progress);
  const topics = S.manifest.topics;
  const available = topics.filter((t) => t.questions || t.textbook);
  const next =
    available.find((t) => (stats[t.id]?.solved.size ?? 0) < t.count) ?? available[0] ?? null;

  const reviewCard = `
    <section class="card review-card">
      <h2>今日の復習</h2>
      <p class="big-num">${due.length}<span>問</span></p>
      ${
        due.length
          ? '<a class="btn primary" href="#/review">復習を始める</a>'
          : `<p class="muted">今日の復習はありません。${nd ? `次は ${md(nd.date)} に ${nd.count}問。` : '間違えた問題は1日後・3日後・7日後に出題されます。'}</p>`
      }
    </section>`;

  const nextCard = next
    ? `<section class="card">
        <h2>次に学ぶ論点</h2>
        <a class="next-topic" href="#/topic/${next.id}"><span class="tid">${next.id}</span><span>${esc(next.name)}</span><span class="chev">›</span></a>
      </section>`
    : '';

  const phases = [...new Set(topics.map((t) => t.phase))];
  const phaseNames = ['Phase 0 3級の土台', 'Phase 1 2級商業簿記の個別論点', 'Phase 2 工業簿記', 'Phase 3 2級商業簿記の総合問題'];
  const lists = phases
    .map((ph) => {
      const ts = topics.filter((t) => t.phase === ph);
      const ready = ts.filter((t) => t.questions || t.textbook).length;
      const rows = ts
        .map((t) => {
          const inner = `<span class="tid">${t.id}</span><span class="tname">${esc(t.name)}</span>${topicStatusText(t, stats[t.id])}`;
          return t.questions || t.textbook
            ? `<a class="trow" href="#/topic/${t.id}">${inner}</a>`
            : `<div class="trow off">${inner}</div>`;
        })
        .join('');
      const open = next ? next.phase === ph : ph === 0;
      return `<details class="phase"${open ? ' open' : ''}><summary>${esc(phaseNames[ph] ?? `Phase ${ph}`)}<span class="muted small">${ready}/${ts.length}論点</span></summary><div class="tlist">${rows}</div></details>`;
    })
    .join('');

  page({
    title: '簿記2級',
    back: null,
    body: `${reviewCard}${nextCard}<section><h2 class="sec-title">論点一覧</h2>${lists}</section>
      <p class="muted small">出題範囲: 2027年4月以降の日商簿記2級(公式の出題区分表にもとづく)</p>`,
  });
}

// ---------- 参考書 ----------

async function renderTopic(id, anchor) {
  const t = S.topics.get(id);
  if (!t) throw new Error(`論点 ${id} はありません`);
  const tb = await loadTextbook(id);
  const st = topicStats(S.progress)[id];
  const quizBtn = t.questions ? `<a class="btn primary" href="#/quiz/${id}">問題を解く(${t.count}問)</a>` : '';
  page({
    title: `${id} ${t.name}`,
    back: '#/',
    body: `
      <div class="topic-head">${topicStatusText(t, st)}${t.needs_review ? `<span class="tag warn">要確認 ${t.needs_review}問</span>` : ''}</div>
      ${quizBtn}
      <article class="textbook">${tb ? tb.html : '<p>この論点の参考書は準備中です。</p>'}</article>
      ${quizBtn ? `<div class="bottom-actions">${quizBtn}</div>` : ''}`,
  });
  if (anchor) {
    const el = document.getElementById(`tb-${anchor}`);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('flash');
    }
  } else {
    window.scrollTo(0, 0);
  }
}

// ---------- 問題 ----------

async function startQuiz(id, only) {
  const hash = location.hash;
  if (S.session && S.session.hash === hash && S.session.i < S.session.ids.length) {
    renderQuestion();
    return;
  }
  const t = S.topics.get(id);
  if (!t) throw new Error(`論点 ${id} はありません`);
  const qs = await loadQuestions(id);
  let ids = qs.map((q) => q.id);
  if (only) {
    const set = new Set(only.split(','));
    ids = ids.filter((x) => set.has(x));
  }
  if (!ids.length) throw new Error('この論点の問題はまだありません');
  S.session = { kind: 'learn', topic: id, ids, i: 0, results: [], title: `${id} ${t.name}`, back: `#/topic/${id}`, hash };
  renderQuestion();
}

async function startReview() {
  const hash = location.hash;
  if (S.session && S.session.hash === hash && S.session.i < S.session.ids.length) {
    renderQuestion();
    return;
  }
  const ids = dueQids(S.progress.review, todayStr());
  for (const topic of new Set(ids.map((x) => x.split('-')[0]))) {
    if (S.topics.has(topic)) await loadQuestions(topic);
  }
  const valid = ids.filter((x) => S.questions.has(x));
  if (!valid.length) {
    S.session = null;
    location.hash = '#/';
    return;
  }
  S.session = { kind: 'review', ids: valid, i: 0, results: [], title: '今日の復習', back: '#/', hash };
  renderQuestion();
}

function rowHtml(side, k, choices) {
  const label = side === 'debit' ? '借方' : '貸方';
  return `<div class="jrow">
    <select class="acc" aria-label="${label}の科目 ${k + 1}行目"><option value="">科目を選ぶ</option>${choices
      .map((c) => `<option>${esc(c)}</option>`)
      .join('')}</select>
    <input class="amt" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" placeholder="金額" aria-label="${label}の金額 ${k + 1}行目">
  </div>`;
}

function journalForm(q) {
  const side = (s, label) => `
    <fieldset class="side ${s}">
      <legend>${label}</legend>
      <div class="rows" data-side="${s}">${rowHtml(s, 0, q.choices)}${rowHtml(s, 1, q.choices)}</div>
      <button type="button" class="addrow" data-side="${s}">+ 行を追加</button>
    </fieldset>`;
  return `<div class="jform">${side('debit', '借方')}${side('credit', '貸方')}</div>
    <p class="muted small">科目は公式の勘定科目表から、この問題の選択肢の中で選びます。同じ科目は借方・貸方それぞれ1回まで。</p>`;
}

function choiceForm(q) {
  return `<div class="choices" role="radiogroup">${q.options
    .map(
      (o, k) =>
        `<label class="opt" data-k="${k}"><input type="radio" name="opt" value="${k}"><span>${renderInline(o)}</span></label>`,
    )
    .join('')}</div>`;
}

function numericForm(q) {
  return `<label class="numin"><input id="num" type="text" inputmode="numeric" autocomplete="off" enterkeyhint="done" placeholder="答え" aria-label="答え"><span>${esc(q.unit)}</span></label>`;
}

function collectAnswer(q) {
  if (q.type === 'journal') {
    const out = { debit: [], credit: [] };
    for (const side of ['debit', 'credit']) {
      for (const row of $app.querySelectorAll(`.rows[data-side="${side}"] .jrow`)) {
        out[side].push({ account: row.querySelector('select').value, amount: row.querySelector('input').value });
      }
    }
    return out;
  }
  if (q.type === 'choice') {
    const el = $app.querySelector('input[name="opt"]:checked');
    return el ? Number(el.value) : null;
  }
  return $app.querySelector('#num').value;
}

function isEmptyAnswer(q, a) {
  if (q.type === 'journal') return [...a.debit, ...a.credit].every((l) => !l.account && !String(l.amount).trim());
  if (q.type === 'choice') return a == null;
  return parseAmount(a) == null;
}

function renderQuestion() {
  const s = S.session;
  const q = S.questions.get(s.ids[s.i]);
  const t = S.topics.get(q.topic);
  const progress = Math.round((s.i / s.ids.length) * 100);
  const form = q.type === 'journal' ? journalForm(q) : q.type === 'choice' ? choiceForm(q) : numericForm(q);
  page({
    title: s.title,
    back: s.back,
    body: `
      <div class="qmeta">
        <span>${s.i + 1} / ${s.ids.length}</span>
        <span class="tag">${q.topic} ${esc(t?.name ?? '')}</span>
        <span class="stars" aria-label="難易度 ${q.difficulty}">${'★'.repeat(q.difficulty)}${'☆'.repeat(3 - q.difficulty)}</span>
        ${q.needs_review ? '<span class="tag warn">要確認</span>' : ''}
      </div>
      <div class="pbar"><div style="width:${progress}%"></div></div>
      <section class="card qcard">
        <div class="prompt">${renderMarkdown(q.prompt).html}</div>
        ${form}
        <p class="form-msg" id="form-msg" role="alert"></p>
        <button class="btn primary" id="submit" type="button">採点する</button>
      </section>
      <div id="result"></div>`,
  });
  window.scrollTo(0, 0);

  $app.querySelectorAll('.addrow').forEach((b) =>
    b.addEventListener('click', () => {
      const rows = $app.querySelector(`.rows[data-side="${b.dataset.side}"]`);
      const n = rows.querySelectorAll('.jrow').length;
      if (n >= MAX_ROWS) return;
      rows.insertAdjacentHTML('beforeend', rowHtml(b.dataset.side, n, q.choices));
      if (n + 1 >= MAX_ROWS) b.disabled = true;
    }),
  );
  $app.querySelector('#submit').addEventListener('click', () => submit(q));
}

function formatAmountOnBlur(ev) {
  const el = ev.target;
  if (!(el instanceof HTMLInputElement) || !(el.classList.contains('amt') || el.id === 'num')) return;
  const n = parseAmount(el.value);
  if (n != null) el.value = fmt(n);
}

async function submit(q) {
  const answer = collectAnswer(q);
  const msg = $app.querySelector('#form-msg');
  if (isEmptyAnswer(q, answer)) {
    msg.textContent = q.type === 'choice' ? '選択肢を選んでください。' : '解答を入力してください。';
    return;
  }
  msg.textContent = '';
  const res = gradeQuestion(q, answer, S.index);
  record(q, res.correct);
  $app.querySelectorAll('.qcard select, .qcard input, .qcard .addrow').forEach((el) => (el.disabled = true));
  $app.querySelector('#submit').remove();
  if (q.type === 'choice') {
    $app.querySelectorAll('.opt').forEach((el) => {
      const k = Number(el.dataset.k);
      if (k === q.answer) el.classList.add('is-answer');
      else if (k === answer) el.classList.add('is-wrong');
    });
  }
  const box = $app.querySelector('#result');
  box.innerHTML = await resultHtml(q, res, answer);
  box.querySelector('#next').addEventListener('click', nextQuestion);
  const refBtn = box.querySelector('#ref-open');
  if (refBtn) refBtn.addEventListener('click', () => toggleRef(q, box));
  box.querySelector('.verdict').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function record(q, correct) {
  const today = todayStr();
  S.progress.attempts.push({ q: q.id, t: q.topic, c: correct ? 1 : 0, d: new Date().toISOString(), m: S.session.kind });
  S.progress.review = applyAnswer(S.progress.review, q.id, correct, today);
  saveProgress(S.progress);
  S.session.results.push({ id: q.id, correct });
}

async function resultHtml(q, res, answer) {
  const parts = [];
  parts.push(
    res.correct
      ? '<div class="verdict ok"><span>○</span>正解</div>'
      : '<div class="verdict ng"><span>×</span>不正解</div>',
  );
  if (res.issues?.length) parts.push(`<ul class="issues">${res.issues.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
  if (res.mistake) {
    parts.push(`<div class="mistake-hit"><h3>よくある間違いです</h3><p>${renderInline(res.mistake.why)}</p></div>`);
  }

  if (q.type === 'journal') {
    if (!res.correct) {
      const marks = { debit: res.sides.debit.marks, credit: res.sides.credit.marks };
      parts.push(`<h3>あなたの解答</h3>${entryTable(res.entry, marks)}`);
    }
    parts.push(`<h3>正解</h3>${entryTable(q.answer)}`);
  } else if (q.type === 'numeric') {
    parts.push(
      `<div class="numres">${res.correct ? '' : `<p>あなたの答え: ${res.value == null ? '―' : yen(res.value)}</p>`}<p>正解: <strong>${yen(q.answer)}</strong></p></div>`,
    );
  } else if (!res.correct && q.type === 'choice') {
    parts.push(`<p>正解: <strong>${renderInline(q.options[q.answer])}</strong></p>`);
  }

  parts.push(`<div class="explain"><h3>解説</h3>${renderMarkdown(q.explanation).html}</div>`);
  if (q.calc?.length) parts.push(`<div class="calc"><h3>計算</h3><ul>${q.calc.map(stepHtml).join('')}</ul></div>`);

  const others = (q.mistakes ?? []).filter((m) => m !== res.mistake);
  if (others.length) {
    const item = (m) => {
      const what =
        m.entry !== undefined
          ? entryInline(m.entry)
          : m.option !== undefined
            ? renderInline(q.options[m.option])
            : m.value !== undefined
              ? yen(m.value)
              : '';
      return `<li><div class="m-what">${what}</div><div class="m-why">${renderInline(m.why)}</div></li>`;
    };
    parts.push(
      `<details class="mistakes"><summary>よくある誤答とその理由(${others.length})</summary><ul>${others.map(item).join('')}</ul></details>`,
    );
  }

  if (q.ref) {
    const t = S.topics.get(q.ref.topic);
    let label = `${q.ref.topic} ${t?.name ?? ''}`;
    try {
      const tb = await loadTextbook(q.ref.topic);
      const sec = tb && textbookSection(tb, q.ref.anchor);
      if (sec) label += `「${sec.title}」`;
    } catch {
      /* 参考書が読めなくても結果は表示する */
    }
    parts.push(`<div class="ref">
      <button type="button" class="btn ghost" id="ref-open" aria-expanded="false">参考書を見る: ${esc(label)}</button>
      <div class="ref-body" hidden></div>
      <a class="small" href="#/topic/${q.ref.topic}?a=${q.ref.anchor}">参考書のページを開く ›</a>
    </div>`);
  }

  if (!res.correct) {
    const r = S.progress.review[q.id];
    if (r) {
      parts.push(
        `<p class="muted small">この問題は ${md(r.due)} にもう一度出題されます(間違えた日から ${INTERVALS.join('・')}日後)。</p>`,
      );
    }
  }
  const last = S.session.i + 1 >= S.session.ids.length;
  parts.push(`<button class="btn primary" id="next" type="button">${last ? '結果を見る' : '次の問題へ'}</button>`);
  return `<section class="card result">${parts.join('')}</section>`;
}

async function toggleRef(q, box) {
  const btn = box.querySelector('#ref-open');
  const body = box.querySelector('.ref-body');
  if (!body.hidden) {
    body.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    return;
  }
  if (!body.innerHTML) {
    const tb = await loadTextbook(q.ref.topic);
    const sec = tb && textbookSection(tb, q.ref.anchor);
    body.innerHTML = sec ? `<div class="textbook">${sec.html}</div>` : '<p class="muted">該当箇所が見つかりません。</p>';
  }
  body.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
}

function nextQuestion() {
  const s = S.session;
  s.i++;
  if (s.i >= s.ids.length) renderSummary();
  else renderQuestion();
}

function renderSummary() {
  const s = S.session;
  const n = s.results.length;
  const ok = s.results.filter((r) => r.correct).length;
  const wrong = s.results.filter((r) => !r.correct).map((r) => r.id);
  const list = s.results
    .map((r) => {
      const q = S.questions.get(r.id);
      const head = q.prompt.split('\n')[0];
      return `<li class="${r.correct ? 'ok' : 'ng'}"><span class="mk ${r.correct ? 'ok' : 'ng'}">${r.correct ? '○' : '×'}</span><span>${renderInline(head.length > 40 ? `${head.slice(0, 40)}…` : head)}</span></li>`;
    })
    .join('');
  const retryWrong =
    s.kind === 'learn' && wrong.length
      ? `<button class="btn primary" id="retry-wrong" type="button">間違えた ${wrong.length}問をもう一度</button>`
      : '';
  const retryAll = s.kind === 'learn' ? '<button class="btn ghost" id="retry-all" type="button">全問もう一度</button>' : '';
  page({
    title: s.title,
    back: s.back,
    body: `<section class="card summary">
        <h2>結果</h2>
        <p class="big-num">${ok}<span>/ ${n}問 正解</span></p>
        ${wrong.length ? '<p class="muted">間違えた問題は1日後・3日後・7日後に「今日の復習」で出題されます。</p>' : '<p>全問正解です。</p>'}
        <ul class="sum-list">${list}</ul>
        <div class="stack">${retryWrong}${retryAll}<a class="btn ghost" href="${s.back}">${s.kind === 'learn' ? '参考書に戻る' : 'ホームへ'}</a></div>
      </section>`,
  });
  window.scrollTo(0, 0);
  const restart = (only) => {
    S.session = null;
    const target = `#/quiz/${s.topic}${only ? `?only=${only.join(',')}` : ''}`;
    if (location.hash !== target) location.hash = target;
    else startQuiz(s.topic, only ? only.join(',') : null).catch(renderError);
  };
  $app.querySelector('#retry-all')?.addEventListener('click', () => restart(null));
  $app.querySelector('#retry-wrong')?.addEventListener('click', () => restart(wrong));
}

// ---------- 記録とバックアップ ----------

function renderSettings() {
  const stats = topicStats(S.progress);
  const total = S.progress.attempts.length;
  const correct = S.progress.attempts.filter((a) => a.c).length;
  const waiting = Object.keys(S.progress.review).length;
  const rows = S.manifest.topics
    .filter((t) => stats[t.id])
    .map((t) => {
      const st = stats[t.id];
      return `<tr><td>${t.id} ${esc(t.name)}</td><td class="al-right">${st.answered}</td><td class="al-right">${pct(st.rate)}</td></tr>`;
    })
    .join('');
  page({
    title: '記録とバックアップ',
    back: '#/',
    body: `
      <section class="card">
        <h2>学習の記録</h2>
        <p>解答 ${total}回・正答率 ${total ? pct(correct / total) : '―'}・復習待ち ${waiting}問</p>
        ${rows ? `<div class="table-wrap"><table class="md-table"><thead><tr><th>論点</th><th class="al-right">解答</th><th class="al-right">正答率</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">まだ記録はありません。</p>'}
        <p class="muted small">${storageAvailable() ? '記録はこの端末のブラウザに保存しています。' : '今はブラウザに保存できません(プライベートモードなど)。アプリを閉じると記録が消えます。'}</p>
      </section>
      <section class="card">
        <h2>バックアップ</h2>
        <p class="muted small">ブラウザのデータを消すと記録も消えます。ときどきファイルに保存しておくと安心です。</p>
        <div class="stack">
          <button class="btn ghost" id="export" type="button">記録をファイルに保存</button>
          <label class="btn ghost file-btn">ファイルから記録を戻す<input type="file" id="import" accept="application/json,.json" hidden></label>
          <button class="btn danger" id="reset" type="button">記録をすべて消す</button>
        </div>
        <p class="form-msg" id="io-msg" role="status"></p>
      </section>
      <section class="card">
        <h2>復習のしくみ</h2>
        <p>間違えた問題は、間違えた日から ${INTERVALS.join('日後・')}日後に「今日の復習」に出ます。復習で正解すると次の回へ進み、${INTERVALS[INTERVALS.length - 1]}日後の回で正解すると卒業です。復習で間違えたら、その日から数え直します。</p>
      </section>
      <section class="card">
        <h2>このアプリについて</h2>
        <p class="small">出題範囲は 2027年4月以降の日商簿記2級(日本商工会議所の出題区分表 2027年度適用版)。勘定科目は公式の商業簿記標準・許容勘定科目表から選びます。問題と参考書はすべてオリジナルです。</p>
        <p class="muted small">データ版: ${esc(S.manifest.version)}</p>
      </section>`,
  });
  window.scrollTo(0, 0);
  const msg = $app.querySelector('#io-msg');
  $app.querySelector('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(S.progress)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `boki2-kiroku-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    msg.textContent = 'ファイルに保存しました。';
  });
  $app.querySelector('#import').addEventListener('change', async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    try {
      const p = validateProgress(JSON.parse(await file.text()));
      if (!p) throw new Error('形式が違います');
      if (!confirm(`解答 ${p.attempts.length}回分の記録で、今の記録を置き換えます。よろしいですか?`)) return;
      S.progress = p;
      saveProgress(p);
      renderSettings();
    } catch (e) {
      msg.textContent = `読み込めませんでした: ${e.message}`;
    }
  });
  $app.querySelector('#reset').addEventListener('click', () => {
    if (!confirm('学習の記録と復習の予定をすべて消します。元に戻せません。よろしいですか?')) return;
    S.progress = emptyProgress();
    saveProgress(S.progress);
    renderSettings();
  });
}

// ---------- 画面の切り替え ----------

function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/';
  const [p, qs] = h.split('?');
  return { parts: p.split('/').filter(Boolean), params: new URLSearchParams(qs ?? '') };
}

async function route() {
  const { parts, params } = parseHash();
  try {
    if (parts[0] === 'topic' && parts[1]) return await renderTopic(parts[1], params.get('a'));
    if (parts[0] === 'quiz' && parts[1]) return await startQuiz(parts[1], params.get('only'));
    if (parts[0] === 'review') return await startReview();
    if (parts[0] === 'settings') return renderSettings();
    renderHome();
    window.scrollTo(0, 0);
  } catch (e) {
    renderError(e);
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker
    .register('sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then((reg) => reg.active?.postMessage({ type: 'precache' }))
    .catch(() => {
      /* オフライン対応が使えない環境でもアプリは動く */
    });
}

async function boot() {
  try {
    S.manifest = await getJSON('data/manifest.json');
    for (const t of S.manifest.topics) S.topics.set(t.id, t);
    const [official, supplement] = await Promise.all([
      getJSON('data/official/accounts_2027.json'),
      getJSON('data/accounts_supplement.json').catch(() => null),
    ]);
    S.index = buildAccountIndex(official, supplement);
  } catch (e) {
    renderError(e);
    return;
  }
  navigator.storage?.persist?.().catch(() => {});
  $app.addEventListener('focusout', formatAmountOnBlur);
  window.addEventListener('hashchange', route);
  await route();
  registerServiceWorker();
}

boot();
