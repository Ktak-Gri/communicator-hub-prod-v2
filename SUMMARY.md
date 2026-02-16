
# プロジェクト要約: コミュニケーター育成HUB (V6.33.02 - Release Gold)

## 1. 最終安定版の確定
本バージョンはUI、ロジック、プラン知識のすべてが検証済みの「黄金の安定版（Gold Build）」です。

- **Frontend Version:** `V6.33.02`
- **Backend Version Requirement:** `V6.22.20` 以上
- **最新プラン同期:** 
    - 新規受付中: ドコモ MAX, ドコモ ポイ活 MAX, ドコモ ポイ活 20, ドコモ mini, ahamo
    - ahamoは「オンライン手続き限定」としてAIに認識済み
    - 受付終了: eximo, irumo, ギガホ/ライト (既存変更相談としてのみ扱う)

## 2. サーバー公開に向けた準備
- `constants.ts`: GASのウェブアプリURLおよびスプレッドシートIDを正しく保持。
- `api.ts`: Gemini 3 シリーズ（Pro/Flash）による高度な解析と高速な応答を両立。
- `DeploymentGuide.tsx`: 万が一のトラブル時に即座にこの状態へ戻すためのロールバック手順を内蔵。

## 3. 次回作業（サーバーデプロイ）への引き継ぎ
作業中に通信エラーや設定の混乱が生じた場合は、`VERSION_MANIFEST.json` に記載された `stable_config` を `constants.ts` に上書きしてください。
