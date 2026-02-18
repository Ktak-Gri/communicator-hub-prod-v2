# プロジェクト要約: コミュニケーター育成HUB (Active Build)

## 1. 接続リポジトリ (Target Environment)
- **URL:** https://github.com/Ktak-Gri/communicator-hub-prod
- **Primary Branch:** `stable-v1`
- **Environment Note:** AIS UIが `on main` と表示されている場合、GitHubからの自動プルが機能していない可能性があります。コード上の正解は常に `stable-v1` です。

## 2. システム状態
- **Frontend Version:** `V8.3.0`
- **Backend Requirement:** `V6.40.55` (Match with gas/main.js)
- **UI Status:** Frozen / Stability Focus

## 3. 構成の最適化
- UI部品の四隅のRを縮小（Sharp R）し、プロフェッショナルな外観を確定済み。
- `components/` 内の冗長な旧ファイル群は廃止され、`ui/` および `hooks/` に完全集約。
- プロジェクト構造はルート直下のフォルダ構成に最適化されています。