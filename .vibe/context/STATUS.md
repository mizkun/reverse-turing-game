# Project Status

## Last Updated
2026-02-21 (Iris)

## Current Focus
ハッカソン当日（2/21）。15:00パブリックβローンチに向けてMVP開発中。

## Active Issues
### Development (type:dev)
- #1 基盤セットアップ [15分]
- #2 ルーム + 掲示板UI [90分]
- #3 AIペルソナエンジン [45分]
- #4 スパイ + 通報システム [45分]
- #5 結果システム [20分]
- #6 統合 + ポリッシュ [45分]
- #7 ローンチ準備 [10分]

### Human Action Required (type:human)
- Firebase Console でプロジェクト作成
- Gemini API キー設定
- 知人へのスパイURL送信

### Pending Discussion (type:discussion)
なし

## Recent Decisions
- ルーム制採用（グローバルタイムスロットではなくホスト管理のルーム単位）
- ペルソナはビッグ5 → Gemini動的生成（ハードコード廃止）
- 全書き込みはCloud Functions経由（クライアント直接書き込み禁止）
- 通報は1人1回、即排除方式

## Blockers
なし（開発開始可能）

## Upcoming
Issue #1 から順に着手。15:00ローンチ目標。
