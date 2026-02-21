# Development Plan — Reverse Turing

## マイルストーン

### M0: ティザーデプロイ (10:00-10:15)
- [x] プロジェクトセットアップ
- [x] VibeFlow環境構築

### M1: MVP完成・ローンチ (10:15-15:00)

#### Issue #1: 基盤セットアップ [15分] 10:15-10:30
- [ ] Firebase CLI でプロジェクト初期化（Hosting, Functions, Firestore）
- [ ] Vite + React + TypeScript セットアップ
- [ ] Firebase 初期化コード（Anonymous Auth）
- [ ] セキュリティルール + インデックスデプロイ
- [ ] 型定義（types.ts）
- [ ] ルーティング定義（App.tsx）

#### Issue #2: ルーム + 掲示板UI [90分] 10:30-12:00
- [ ] createRoom API（ルーム・スレッド・スパイトークン一括作成）
- [ ] verifyHost API（ホストトークン検証）
- [ ] startRound API（waiting→playing、AI下限チェック）
- [ ] joinAsDetective API（探偵参加 + AIペルソナ追加）
- [ ] EntryPage（逆reCAPTCHA）
- [ ] BoardPage（スレッド一覧 + StatusBar）
- [ ] ThreadPage（スレッド詳細 + 投稿表示）
- [ ] HostPage（ホスト管理 + QRコード）
- [ ] 5ch風CSS（ダークテーマ）
- [ ] useRoom hook（status監視 + revealed自動遷移）

#### Issue #3: AIペルソナエンジン [45分] 12:00-12:45
- [ ] ペルソナ動的生成（ビッグ5 → Gemini でプロフィール生成）
- [ ] フォールバックペルソナ（3体）
- [ ] AI投稿生成エンジン（aiEngine.ts）
- [ ] AI投稿スケジューラー（毎分実行、ペルソナ別頻度制御）
- [ ] フォールバック投稿プール（20件）
- [ ] 排除されたペルソナの投稿停止
- [ ] roundEndsAt超過時の自動終了

#### 昼食 (12:45-13:00)

#### Issue #4: スパイ + 通報システム [45分] 13:00-13:45
- [ ] verifySpyToken API（スパイ認証・authorId割当）
- [ ] submitPost API（スパイ書き込み）
- [ ] reportId API（通報・排除・全スパイ排除チェック — トランザクション）
- [ ] PostForm コンポーネント（スパイ用書き込みフォーム）
- [ ] ReportButton コンポーネント（探偵用通報ボタン）
- [ ] EliminationNotice コンポーネント（凍結通知）
- [ ] Cookie管理（spy_token, spy_author_id, spy_room_id）

#### Issue #5: 結果システム [20分] 13:45-14:05
- [ ] revealResults API（結果集計・勝利判定・チューリングスコア算出）
- [ ] ResultPage（勝利チーム・通報結果・スコア表示）

#### Issue #6: 統合 + ポリッシュ [45分] 14:05-14:50
- [ ] 通しテスト（ルーム作成→参加→ラウンド→AI投稿→スパイ→通報→結果）
- [ ] firebase deploy（Hosting + Functions + Rules）
- [ ] 本番URLでE2Eテスト
- [ ] UIバグ修正
- [ ] モバイル確認

#### Issue #7: ローンチ準備 [10分] 14:50-15:00
- [ ] デモ用ルーム作成（7分、スパイ枠2）
- [ ] 知人にスパイURL送信
- [ ] 探偵URL + QRコード準備
- [ ] AI投稿の最終確認

### M2: デモ動画撮影 + 提出 (16:30-16:50)
- [ ] 1分間デモ動画撮影
- [ ] YouTube限定公開アップロード
- [ ] 提出

### M3: ピッチ (17:15-18:45)
- [ ] ライブデモ（掲示板稼働中）
- [ ] 審査員にQRコードで参加させる
- [ ] 3分間トーク

## 時間不足時の削減プラン

| 優先度 | 削減対象 | 節約時間 |
|--------|---------|---------|
| 1 | CSS装飾を最小限に | -15分 |
| 2 | チューリングスコア算出省略（勝敗のみ） | -10分 |
| 3 | ReportDialogをwindow.confirm()で代用 | -10分 |
| 4 | StatusBarカウントダウンを静的表示に | -5分 |
| 5 | 逆reCAPTCHAアニメーション省略 | -5分 |
| 6 | モバイルテスト省略（PCで確認のみ） | -10分 |

## 最小デモライン

以下の3要素が動けばデモは成立する：
1. **掲示板UIが表示されている**
2. **AIが書き込んでいる**
3. **人間がスパイとして書き込める**

## Phase 1 以降のロードマップ

| フェーズ | 時期 | 内容 |
|---------|------|------|
| Phase 1 | 2/25-26 | 自動化 + 安定化（アカウント制、OGP） |
| Phase 2 | 公開後1-2週 | やり込み要素（実績・ランキング・称号） |
| Phase 3 | 公開後2-4週 | 配信者コラボ |
| Phase 4 | 公開後1-2ヶ月 | マネタイズ（広告・チケット販売） |
| Phase 5 | 公開後2-3ヶ月 | ステージ拡張（Reddit風・X風） |

## 完了項目
- [x] プロジェクトセットアップ
- [x] VibeFlow環境構築
- [x] ゲーム企画書作成
- [x] 実装プラン作成
- [x] vision.md / spec.md / plan.md 作成
