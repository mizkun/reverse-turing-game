# Specification Document — Reverse Turing

## 機能要件

### コア機能（MVP / Phase 0）

1. **逆reCAPTCHA（エントリー）**
   - 「私はAIです ✓」チェックボックスでゲームに参加
   - スパイトークンURL（`?spy=token`）→ スパイとして参加
   - トークンなし → 探偵として参加
   - 探偵参加のたびにAIペルソナを1体追加（上限10体）

2. **ルーム制ゲーム管理**
   - ホストがルームを作成（スパイ枠数・ラウンド時間を設定）
   - ホスト管理画面でラウンド開始/終了を制御
   - 探偵URL + QRコード表示
   - ルーム状態: `waiting` → `playing` → `revealed`

3. **掲示板（5ch風匿名掲示板）**
   - 複数スレッド（3スレッド: 雑談・飯・最近見たもの）
   - >>1 は管理AI（ID:SYSTEM）がスレッド立て。通報対象外
   - >>2以降がAIペルソナ or スパイの書き込み
   - 投稿はリアルタイム同期（Firestore onSnapshot）
   - 8桁英数字のランダムID

4. **AIペルソナエンジン**
   - ビッグ5性格パラメータをランダム生成
   - Gemini 2.5 Flash でペルソナ（口調・性格・system prompt）を動的生成
   - 外向性に基づく投稿頻度制御（高→40秒間隔、低→200秒間隔）
   - Gemini API障害時のフォールバック（固定ペルソナ3体 + 汎用レスプール20件）
   - 各ペルソナは独立したAPI呼び出し（コンテキスト分離）

5. **スパイシステム**
   - スパイトークンURLでスパイ認証
   - Cookie保存（spy_token, spy_author_id, spy_room_id）でリロード対応
   - 書き込みフォーム表示（探偵には非表示）
   - 排除されたスパイは書き込み不可

6. **通報（投票）システム**
   - 探偵が投稿者IDを「通報」（1人1回）
   - 通報 → 対象IDを即座に排除（activeIds → eliminatedIds）
   - 排除されたAIペルソナは投稿停止
   - 凍結通知: 「⚠ ID:xxx のアカウントは不正利用の疑いにより凍結されました。」
   - 全スパイ排除 → 自動的にゲーム終了（status: revealed）

7. **結果発表**
   - 勝利チーム表示（スパイ or 探偵）
   - 各通報の正解/不正解表示
   - チューリングスコア（0-100: 人間検出率が低いほど高い）

8. **StatusBar**
   - 生存ID数 / 排除済み数 / 残り弾数 / 残り時間カウントダウン

### Phase 1 以降の機能（MVP外）
- ゲームサイクル完全自動化
- アカウント制（ログイン）
- OGP / シェアカード
- スパイ実績・探偵実績・ランキング
- 称号システム
- 配信者向けスパイ枠管理
- スパイ枠チケット販売
- レトロバナー広告
- 複数ステージ（Reddit風、X風）

## 非機能要件

### パフォーマンス
- Firebase Hosting CDN配信による高速表示
- 静的アセットのキャッシュ
- Firestore onSnapshot によるリアルタイム同期（ポーリング不要）

### セキュリティ
- **全書き込みはCloud Functions (Admin SDK) 経由** — クライアントからの直接書き込み禁止
- isHuman フラグ: `posts/{id}/secret/metadata` に格納、クライアントから読み取り不可
- spyAuthorIds: `rooms/{id}/secret/gameState` に格納、クライアントから読み取り不可
- hostToken: `rooms/{id}/hostSecret/config` に格納、クライアントから読み取り不可
- ペルソナ情報: `rooms/{id}/personas/` 全体がクライアントから読み取り不可
- 通報結果: ゲーム終了前は非公開、revealed後のみ読み取り可

### 可用性
- Firebase のマネージドサービスに依存
- Gemini API障害時はフォールバック投稿で継続動作

## 技術スタック

| レイヤー | 技術 | 選定理由 |
|---------|------|---------|
| Frontend | React + TypeScript (Vite) | 軽量、スマホ対応 |
| CSS | カスタムCSS（5ch風ダーク） | ARG的没入感 |
| Backend | Firebase Cloud Functions v2 (TypeScript) | サーバーレス、スケジュール実行 |
| Database | Firestore | リアルタイム同期（onSnapshot） |
| AI | Gemini 2.5 Flash API (`@google/generative-ai`) | ハッカソン必須要件 |
| Hosting | Firebase Hosting | CDN配信 |
| 認証 | Firebase Anonymous Auth | ノーログイン参加 |
| パッケージ (client) | `firebase`, `react-router-dom`, `qrcode.react` | |
| パッケージ (functions) | `firebase-admin`, `firebase-functions`, `@google/generative-ai` | |

## アーキテクチャ

```
Clients (React SPA)
    │ HTTPS
    ▼
Firebase
 ├── Hosting (CDN) — 静的ファイル配信
 ├── Firestore — リアルタイムDB
 │   └── セキュリティルールで秘密情報を保護
 └── Cloud Functions v2
     ├── Callable Functions — ルーム作成/参加/投稿/通報/結果
     ├── Scheduled Functions — AI投稿スケジューラー（毎分）
     └── Gemini API呼び出し（ペルソナ生成 + 投稿生成）
```

## Firestore データモデル

```
rooms/{roomId}
  ├── status: "waiting" | "playing" | "revealed"
  ├── settings: { spySlots, roundMinutes }
  ├── detectiveCount: number
  ├── activeIds: string[]
  ├── eliminatedIds: string[]
  ├── createdAt, roundStartedAt, roundEndsAt
  └── result: { winner, turingScore } | null

rooms/{roomId}/secret/gameState              ★ read: false
  └── spyAuthorIds: string[]

rooms/{roomId}/hostSecret/config             ★ read: false
  └── hostToken: string

rooms/{roomId}/threads/{threadId}
  ├── title, topic, openingPost
  ├── createdBy: "SYSTEM"
  └── postCount, createdAt

rooms/{roomId}/posts/{postId}
  ├── threadId, postNumber, authorId, authorName
  ├── content, createdAt
  └── /secret/metadata                       ★ read: false
      ├── isHuman: boolean
      └── personaId: string | null

rooms/{roomId}/spyTokens/{tokenId}           ★ read: false
  ├── token, assignedAuthorId, used

rooms/{roomId}/reports/{reporterUid}
  ├── targetId, reportedAt, isCorrect

rooms/{roomId}/personas/{personaId}          ★ read: false
  ├── bigFive, name, systemPrompt
  ├── postFrequency, assignedAuthorId, eliminated
```

## ルーティング

| パス | ページ | 説明 |
|------|--------|------|
| `/` | TeaserPage | ティザー |
| `/room/:roomId` | EntryPage | 逆reCAPTCHA |
| `/room/:roomId/board` | BoardPage | スレッド一覧 |
| `/room/:roomId/board/:threadId` | ThreadPage | スレッド詳細 |
| `/room/:roomId/result` | ResultPage | 結果発表 |
| `/host/:hostToken` | HostPage | ホスト管理 |

## Cloud Functions API

| 関数名 | トリガー | 説明 |
|--------|---------|------|
| `createRoom` | onCall | ルーム作成（スレッド・スパイトークン同時生成） |
| `verifyHost` | onCall | ホストトークン検証 |
| `startRound` | onCall | ラウンド開始（waiting→playing） |
| `joinAsDetective` | onCall | 探偵参加 + AIペルソナ追加 |
| `verifySpyToken` | onCall | スパイトークン検証・authorId割当 |
| `submitPost` | onCall | スパイの書き込み |
| `reportId` | onCall | 探偵の通報（トランザクション） |
| `revealResults` | onCall | 結果集計・公開 |
| `aiPostScheduler` | onSchedule(1min) | AI自動投稿 |

## 制約事項

### 技術的制約
- ハッカソン当日（2/21）、ソロ開発、4時間45分で完成
- Firebase無料枠の範囲で運用（Cloud Functions は Blaze プラン必要）
- Gemini API $20クレジット以内

### MVP での許容事項
- 投票制限: Cookie-based（厳密な重複防止ではない）
- postNumber の採番: レースコンディションあり（同一スレッド同時投稿は低確率のため許容）
- ホストトークン検証: 全rooms線形探索（MVP規模では問題なし）
- チート対策: MVP段階では最小限
