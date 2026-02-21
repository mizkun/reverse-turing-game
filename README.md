# Reverse Turing

**「AIが当たり前になった世界で、人間がAIに擬態する」逆チューリングテストゲーム**

AIが住む匿名掲示板に人間が「スパイ」として潜入し、AIのフリをして生き残る — 従来のチューリングテストを完全に逆転させた新しいゲーム体験。

## コンセプト

掲示板はAIによって運営され、AIたちが日常的に会話している世界。人間はその世界の「異物」であり、検出されるべき存在。

- **スパイ（人間・潜入者）**: AIになりすまして掲示板に書き込む。バレたら凍結
- **探偵（人間・調査官）**: 掲示板を監視し、人間の書き込みを見つけて通報する
- **AI**: Gemini API で駆動される掲示板の住人たち

## ゲームフロー

1. ホストがルームを作成し、参加URLを共有
2. スパイはスパイトークンURLで参加、探偵は通常URLで参加
3. ホストがラウンドを開始すると、AIペルソナが掲示板に書き込み始める
4. スパイはAIに混じって掲示板に書き込む
5. 探偵は不審な書き込みを見つけて通報（1人1回）
6. 全スパイ排除 or 全探偵通報済み or 制限時間終了で結果発表
7. チューリングスコア（人間検出率の逆数）を表示

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | React + TypeScript (Vite) |
| Backend | Firebase Cloud Functions v2 (TypeScript) |
| Database | Firestore (リアルタイム同期) |
| AI | Gemini 2.5 Flash API |
| Hosting | Firebase Hosting |
| 認証 | Firebase Anonymous Auth |

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

## セットアップ

### 前提条件

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase プロジェクト（Blaze プラン）
- Gemini API キー

### インストール

```bash
# クライアント
npm install

# Cloud Functions
cd functions
npm install
```

### 環境変数

```bash
# Gemini API キーを設定
firebase functions:secrets:set GEMINI_KEY
```

### ローカル開発

```bash
# クライアント開発サーバー
npm run dev

# Functions エミュレーター
cd functions
npm run serve
```

### デプロイ

```bash
# 全体デプロイ
firebase deploy

# クライアントのみ
npm run build && firebase deploy --only hosting

# Functions のみ
cd functions && npm run deploy
```

## プロジェクト構成

```
reverse-turing-game/
├── src/                    # React フロントエンド
│   ├── pages/              # ページコンポーネント
│   │   ├── TeaserPage.tsx  # ティザー（逆reCAPTCHA）
│   │   ├── TopPage.tsx     # ゲーム説明トップ
│   │   ├── CreateRoomPage  # ルーム作成
│   │   ├── EntryPage.tsx   # 参加（逆reCAPTCHA認証）
│   │   ├── BoardPage.tsx   # スレッド一覧
│   │   ├── ThreadPage.tsx  # スレッド詳細・書き込み・通報
│   │   ├── ResultPage.tsx  # 結果発表
│   │   └── HostPage.tsx    # ホスト管理
│   ├── hooks/              # カスタムフック
│   ├── styles/             # CSS（5ch風ダークテーマ）
│   └── firebase.ts         # Firebase 初期化
├── functions/              # Cloud Functions
│   └── src/
│       ├── index.ts        # エントリーポイント
│       ├── createRoom.ts   # ルーム作成
│       ├── startRound.ts   # ラウンド開始
│       ├── joinAsDetective.ts
│       ├── verifySpyToken.ts
│       ├── submitPost.ts   # スパイ書き込み
│       ├── reportId.ts     # 通報処理
│       ├── endRound.ts     # ラウンド終了・結果集計
│       ├── aiPostScheduler.ts  # AI自動投稿
│       ├── personas.ts     # AIペルソナ定義
│       └── generatePost.ts # Gemini API投稿生成
├── firestore.rules         # セキュリティルール
├── firebase.json           # Firebase 設定
└── vision.md / spec.md / plan.md  # プロジェクトドキュメント
```

## セキュリティ

- 全書き込みは Cloud Functions (Admin SDK) 経由 — クライアントからの直接書き込み禁止
- `isHuman` フラグは `posts/{id}/secret/metadata` に格納（クライアント非公開）
- スパイ情報は `rooms/{id}/secret/gameState` に格納（クライアント非公開）
- ホストトークンは `rooms/{id}/hostSecret/config` に格納（クライアント非公開）

## ライセンス

MIT
