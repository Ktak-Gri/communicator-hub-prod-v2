# プロジェクト要約: コミュニケーター育成HUB (Production Build)

## 1. 接続リポジトリ (Target Environment)
- **URL:** https://github.com/Ktak-Gri/communicator-hub-prod
- **Branch:** `stable-v1`
- **Environment Note:** 本リポジトリの `stable-v1` が唯一の正解ブランチです。

## 2. システム状態
- **Frontend Version:** `V8.3.0`
- **Backend Requirement:** `V6.40.55` (Match with gas/main.js)
- **UI Status:** Frozen / Production Stable (再凍結済み)

## 3. 構成の最適化
- **UI Design:** 13.3インチ以上のビジネスPCでの利用に最適化された Sharp R デザイン。
- **File Structure:** `ui/` フォルダ内のコンポーネントを正解とし、`App.tsx` からのインポートパスを固定。
- **Logic:** Gemini 3 Pro/Flash および Live API 2.5 を基盤とした超低遅延対話環境。

## 4. 運用ルール
- UIの破壊的変更を禁止し、機能追加時も既存の「Gold Build」デザインガイドラインを遵守すること。
- GASバックエンドの更新時は `REQUIRED_BACKEND_VERSION` の整合性を常に確認すること。