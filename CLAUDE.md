# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリについて

Claude Code と一緒に、はじめてのプルリクエスト(PR)を出す練習をするためのリポジトリです。
GitHub リモートは `kawayuichan/first-pr-practice`。アプリのコード、ビルド、テスト、lint はありません。
中身はドキュメント(`README.md`)と `.gitignore` だけです。

## 作業の流れ(README の PR の流れ)

1. `main` から作業用のブランチを作る(例: `docs/improve-readme` のように `種類/内容` の形)
2. ファイルを変更してコミットする
3. ブランチを GitHub にプッシュする
4. `gh` で PR を作成し、内容を確認してからマージする

`main` に直接コミットせず、変更はかならずブランチと PR を通す。

## 規約

- ドキュメントもコミットメッセージも日本語で書く(例: 「READMEにPRの流れと必要なものを追記し、.gitignoreを追加」)
- 必要なツール: Git と GitHub CLI(`gh auth login` でログイン済みであること)
- このリポジトリは練習用で、ユーザーは初心者。各手順で何をしているかを短く説明する
