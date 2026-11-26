# 湯浅AI

Claude Codeと一緒に、はじめてのプルリクエスト(PR)を出すための練習用リポジトリです。

このリポジトリで、**日商簿記2級(2027年4月以降のネット試験)の自分専用「参考書+問題集」Webアプリ** を作っています。

## 簿記2級アプリ

- スマホで使う前提の、オフラインでも動く静的サイトです(GitHub Pages で公開できます)
- 出題範囲は日本商工会議所の **2027年度適用の出題区分表** に合わせています → [docs/scope.md](docs/scope.md)
- 学習の順番 → [docs/study-plan.md](docs/study-plan.md)

### できること(見本版: B01 簿記の基本)

- 参考書: 1論点1ファイル。「要点3行 → 仕訳パターン → T勘定・ボックス図 → 引っかけポイント → 決算書ではここに出る → 確認問題」
- 仕訳入力: 勘定科目は公式の標準・許容勘定科目表からプルダウンで選ぶ。すぐに採点
- 採点のあと: 正解・解説・計算の過程・よくある誤答とその理由、参考書の該当箇所
- 復習: 間違えた問題を、間違えた日から1日後・3日後・7日後に「今日の復習」で再出題
- 記録: 論点別の正答率。記録はブラウザ(localStorage)に保存し、ファイルへのバックアップもできる

### スマホで使う(GitHub Pages で公開)

1. このリポジトリの変更を `main` にマージする
2. GitHub のリポジトリ画面で **Settings → Pages** を開く
3. **Source** を「Deploy from a branch」、**Branch** を `main`、フォルダを `/ (root)` にして **Save**
4. 数分後に表示される URL(`https://<ユーザー名>.github.io/first-pr-practice/`)をスマホで開く
5. Safari なら「共有 → ホーム画面に追加」、Chrome なら「ホーム画面に追加」で、アプリのように使える

GitHub Pages を無料で使うには、リポジトリが公開(Public)である必要があります。

### パソコンで動かして確かめる

```sh
npm run serve        # このフォルダで小さなWebサーバーを起動(python3 が必要)
```

ブラウザで http://localhost:8000/ を開きます。`index.html` をダブルクリックで直接開くと、データを読み込めません。

### 開発のしかた

必要なもの: Node.js 20 以上(追加のインストールは不要)

```sh
npm run build   # 問題データ・参考書・目次を生成する
npm test        # 生成物が最新か + 全問題の自動テスト
```

論点を1つ追加する流れ:

1. `textbook/src/<論点ID>.md` に参考書を書く(計算した数字は `{{ 200,000 - 50,000 }}` のように式で書く)
2. `scripts/questions/<論点ID>.mjs` に問題を書く(金額は `step()` で計算する)
3. `npm run build` → `npm test` がすべて通ったらコミット
4. テストが「フォントにない文字」と言ったら、`npm run fonts` → `npm run build` を実行する

日本語フォントについて: どの端末でも日本の字体で表示するため、Noto Sans JP(SIL Open Font License 1.1)から、アプリで使う文字だけを取り出したフォントを `app/fonts/` に入れています。本文は Medium、見出し・太字は Bold。作り直す `npm run fonts` には Python 3 と `pip install fonttools brotli` が必要です(元のフォントは npm から自動で取得します)。

自動テストで確かめていること: 仕訳の貸借一致、計算の検算(合計・差額)、論点IDが範囲内か、勘定科目が公式表にあるか、旧基準(手形・小切手・旧リース)や1級の用語が入っていないか、解説の金額に根拠があるか、よくある誤答が正しく見分けられるか。

### フォルダの中身

| 場所 | 中身 |
|---|---|
| `index.html`, `app/` | アプリ本体 |
| `sw.js`, `manifest.webmanifest` | オフライン対応・ホーム画面に追加 |
| `textbook/src/` | 参考書の元ファイル(ここを編集する) |
| `textbook/` | 生成された参考書(自動生成) |
| `scripts/questions/` | 問題を作るスクリプト(ここを編集する) |
| `data/questions/` | 生成された問題データ(自動生成) |
| `data/official/` | 公式の勘定科目表(2027年度適用) |
| `data/topics.json`, `data/rules.json` | 論点の一覧、禁止語 |
| `tests/` | 自動テスト |
| `docs/` | 出題範囲(scope.md)と学習順(study-plan.md) |

## PRの流れ

1. `main` から作業用のブランチを作る
2. ファイルを変更してコミットする
3. ブランチをGitHubにプッシュする
4. プルリクエストを作成し、内容を確認してマージする

## 必要なもの

- [Git](https://git-scm.com/)
- [GitHub CLI](https://cli.github.com/)(`gh auth login` でログイン済みであること)
- [Node.js](https://nodejs.org/) 20 以上(アプリの生成とテスト)
