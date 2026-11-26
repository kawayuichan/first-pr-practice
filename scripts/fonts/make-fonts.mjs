// 日本語フォントを作り直す: npm run fonts
//
// 1. scripts/fonts/charset.mjs でアプリに必要な文字を集める
// 2. 元フォント Noto Sans JP(SIL Open Font License 1.1)を npm から取ってくる
//    (環境変数 BOKI_FONT_DIR に、NotoSansJP_500Medium.ttf と NotoSansJP_700Bold.ttf のある
//     フォルダを指定すれば、ダウンロードせずにそれを使う)
// 3. scripts/fonts/subset.py で必要な文字だけの WOFF2 を app/fonts/ に作る
//
// 必要なもの: Python 3 と fonttools・brotli(pip install fonttools brotli)
//   使う Python は環境変数 BOKI_PYTHON で変えられる(既定は python3)

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requiredChars } from './charset.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PKG = '@expo-google-fonts/noto-sans-jp@0.4.3';

function findFile(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const r = findFile(p, name);
      if (r) return r;
    } else if (e.name === name) return p;
  }
  return null;
}

function sourceFonts(tmp) {
  let dir = process.env.BOKI_FONT_DIR;
  if (!dir) {
    console.log(`元フォントを取得しています: ${PKG}`);
    execFileSync('npm', ['pack', PKG, '--silent', '--pack-destination', tmp], { stdio: 'inherit' });
    const tgz = fs.readdirSync(tmp).find((f) => f.endsWith('.tgz'));
    execFileSync('tar', ['-xzf', path.join(tmp, tgz), '-C', tmp]);
    dir = tmp;
  }
  const m = findFile(dir, 'NotoSansJP_500Medium.ttf');
  const b = findFile(dir, 'NotoSansJP_700Bold.ttf');
  const lic = findFile(dir, 'LICENSE_FONT');
  if (!m || !b) throw new Error(`${dir} に NotoSansJP_500Medium.ttf と NotoSansJP_700Bold.ttf がありません`);
  return { m, b, lic };
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'boki-fonts-'));
try {
  const chars = [...requiredChars()].sort().join('');
  const charsFile = path.join(tmp, 'chars.txt');
  fs.writeFileSync(charsFile, chars);
  const src = sourceFonts(tmp);
  const out = path.join(ROOT, 'app/fonts');
  const py = process.env.BOKI_PYTHON ?? 'python3';
  execFileSync(py, [path.join(ROOT, 'scripts/fonts/subset.py'), charsFile, out, src.m, src.b], { stdio: 'inherit' });
  if (src.lic) fs.copyFileSync(src.lic, path.join(out, 'OFL.txt'));
  console.log('app/fonts/ を更新しました。続けて npm run build を実行してください');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
