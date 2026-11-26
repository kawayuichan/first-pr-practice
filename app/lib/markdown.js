// 参考書・問題文用の小さな Markdown 表示部品(外部ライブラリなし。オフラインで動かすため)。
// 対応: 見出し(# 〜 ####、末尾の {#id} でアンカー)、段落、箇条書き(- と 1.、1段の入れ子)、
//       表(| a | b |)、引用(>)、区切り線、コードブロック、<details>/<summary> の行、
//       行内の **太字**、`コード`、[リンク](URL)
// HTML はすべてエスケープする(<details> 系の決まった行だけ例外)。

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

const SAFE_HREF = /^(https?:\/\/|#|[\w./-]+\.md(#[\w-]+)?$)/;

export function renderInline(src, opts = {}) {
  const re = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g;
  let out = '';
  let last = 0;
  let m;
  while ((m = re.exec(src))) {
    out += escapeHtml(src.slice(last, m.index));
    if (m[1] !== undefined) {
      out += `<code>${escapeHtml(m[1])}</code>`;
    } else if (m[2] !== undefined) {
      const raw = m[3];
      if (!SAFE_HREF.test(raw)) {
        out += escapeHtml(m[0]);
      } else {
        const href = opts.rewriteLink ? opts.rewriteLink(raw) : raw;
        const ext = /^https?:/.test(href) ? ' target="_blank" rel="noopener"' : '';
        out += `<a href="${escapeHtml(href)}"${ext}>${renderInline(m[2], opts)}</a>`;
      }
    } else {
      out += `<strong>${renderInline(m[4], opts)}</strong>`;
    }
    last = re.lastIndex;
  }
  return out + escapeHtml(src.slice(last));
}

const isBlank = (l) => /^\s*$/.test(l);
const HEADING = /^(#{1,4})\s+(.*?)(?:\s+\{#([\w-]+)\})?\s*$/;
const LIST_ITEM = /^(\s*)([-*]|\d+\.)\s+(.*)$/;
const TABLE_SEP = /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function startsBlock(line, next) {
  return (
    HEADING.test(line) ||
    LIST_ITEM.test(line) ||
    /^>/.test(line) ||
    /^```/.test(line) ||
    /^(-{3,}|\*{3,})\s*$/.test(line) ||
    /^<\/?details>\s*$/.test(line) ||
    /^<summary>/.test(line) ||
    (/^\|/.test(line) && next !== undefined && TABLE_SEP.test(next))
  );
}

function parseList(lines, start, opts) {
  const first = LIST_ITEM.exec(lines[start]);
  const indent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const items = [];
  let i = start;
  while (i < lines.length) {
    const m = LIST_ITEM.exec(lines[i]);
    if (m && m[1].length === indent && /\d/.test(m[2]) === ordered) {
      items.push({ text: m[3], sub: '' });
      i++;
    } else if (m && m[1].length > indent && items.length) {
      const sub = parseList(lines, i, opts);
      items[items.length - 1].sub += sub.html;
      i = sub.next;
    } else if (!isBlank(lines[i]) && /^\s{2,}\S/.test(lines[i]) && items.length) {
      items[items.length - 1].text += ' ' + lines[i].trim();
      i++;
    } else {
      break;
    }
  }
  const tag = ordered ? 'ol' : 'ul';
  const startNum = ordered ? parseInt(first[2], 10) : 1;
  const startAttr = ordered && startNum !== 1 ? ` start="${startNum}"` : '';
  const body = items.map((it) => `<li>${renderInline(it.text, opts)}${it.sub}</li>`).join('');
  return { html: `<${tag}${startAttr}>${body}</${tag}>`, next: i };
}

function parseTable(lines, start, opts) {
  const head = splitRow(lines[start]);
  const aligns = splitRow(lines[start + 1]).map((c) =>
    c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : '',
  );
  let i = start + 2;
  const rows = [];
  while (i < lines.length && /^\|/.test(lines[i])) rows.push(splitRow(lines[i++]));
  const joined = head.join('|');
  const cls =
    joined === '借方科目|金額|貸方科目|金額'
      ? 'md-journal'
      : joined === '借方|貸方'
        ? 'md-taccount'
        : head[0].startsWith('入金伝票')
          ? 'md-slip slip-in'
          : head[0].startsWith('出金伝票')
            ? 'md-slip slip-out'
            : head[0].startsWith('振替伝票')
              ? 'md-slip slip-transfer'
              : 'md-table';
  const cell = (tag, text, k) =>
    `<${tag}${aligns[k] ? ` class="al-${aligns[k]}"` : ''}>${renderInline(text ?? '', opts)}</${tag}>`;
  const thead = `<tr>${head.map((h, k) => cell('th', h, k)).join('')}</tr>`;
  const tbody = rows.map((r) => `<tr>${head.map((_, k) => cell('td', r[k], k)).join('')}</tr>`).join('');
  return {
    html: `<div class="table-wrap"><table class="${cls}"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`,
    next: i,
  };
}

/**
 * Markdown を HTML にする。
 * opts.idPrefix: 見出しの id につける接頭辞
 * opts.rewriteLink(href): リンク先を書き換える関数
 * 戻り値: { html, headings: [{ level, text, id }] }
 */
export function renderMarkdown(md, opts = {}) {
  const lines = String(md)
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n');
  const prefix = opts.idPrefix ?? '';
  const html = [];
  const headings = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html.push(`<pre><code>${escapeHtml(buf.join('\n'))}</code></pre>`);
      continue;
    }
    let m = HEADING.exec(line);
    if (m) {
      const level = m[1].length;
      const id = m[3] ?? null;
      headings.push({ level, text: m[2], id });
      const idAttr = id ? ` id="${escapeHtml(prefix + id)}"` : '';
      html.push(`<h${level}${idAttr}>${renderInline(m[2], opts)}</h${level}>`);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      html.push('<hr>');
      i++;
      continue;
    }
    if (/^<details>\s*$/.test(line)) {
      html.push('<details>');
      i++;
      continue;
    }
    if (/^<\/details>\s*$/.test(line)) {
      html.push('</details>');
      i++;
      continue;
    }
    m = /^<summary>(.*)<\/summary>\s*$/.exec(line);
    if (m) {
      html.push(`<summary>${renderInline(m[1], opts)}</summary>`);
      i++;
      continue;
    }
    if (/^\|/.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const t = parseTable(lines, i, opts);
      html.push(t.html);
      i = t.next;
      continue;
    }
    if (/^>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      html.push(`<blockquote>${renderMarkdown(buf.join('\n'), opts).html}</blockquote>`);
      continue;
    }
    if (LIST_ITEM.test(line)) {
      const l = parseList(lines, i, opts);
      html.push(l.html);
      i = l.next;
      continue;
    }
    const buf = [];
    while (i < lines.length && !isBlank(lines[i]) && !(buf.length && startsBlock(lines[i], lines[i + 1]))) {
      buf.push(lines[i++].trim());
    }
    html.push(`<p>${buf.map((l) => renderInline(l, opts)).join('<br>')}</p>`);
  }
  return { html: html.join('\n'), headings };
}
