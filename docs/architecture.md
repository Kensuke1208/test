# Eigo アーキテクチャ仕様

プロトタイプの技術構成。プロダクトの全体像と方針は [product.md](product.md) に記載。

## 技術スタック

| 領域 | 技術 |
|---|---|
| Frontend | React + TypeScript（Vite） |
| Routing | React Router |
| Server State | TanStack Query |
| Client State | Zustand |
| UI Primitives | Radix UI（unstyled） |
| Styling | Tailwind CSS |
| Hosting | Cloudflare Pages |
| Backend | Supabase（Auth / PostgreSQL / Edge Functions） |
| 発音評価 | Speechace Score Text API v9 |
| 音声録音 | MediaRecorder API（ブラウザ標準） |

### 選定理由

**React + Vite（SPA）** — SSR 不要（認証の裏側、SEO 不要）。Cloudflare Pages に静的デプロイで最もシンプル。Next.js / Remix は過剰。

**TanStack Query** — Supabase からのデータ取得・キャッシュ・ミューテーションに最適。ダッシュボードのビュー参照もこれで扱う。

**Zustand** — 学習者選択やアプリ全体の設定など、コンポーネントツリーを跨ぐ状態管理。軽量で導入コストが低い。

**Radix UI** — モーダル、ドロップダウン等のアクセシビリティを自前で実装する必要がなくなる。unstyled なので Tailwind で自由にデザインできる。

**Supabase Edge Functions** — Speechace API はデフォルトで CORS 無効。フロントエンドから直接呼べないため、バックエンドプロキシが必須。

**Supabase Auth** — Auth アカウントの下に学習者プロフィールがぶら下がる構造（Netflix 方式）。RLS で「アカウント所有者は自分の学習者のデータのみ閲覧可」を DB 層で強制する。

**MediaRecorder API** — ブラウザ標準の音声録音 API。追加ライブラリ不要。WebM 形式で取得し、Edge Function 経由で Speechace API に送信する。Safari の対応状況は要検証。

## システム構成図

```
┌────────────┐       ┌─────────────────┐       ┌──────────────┐
│            │ voice │                 │       │              │
│  Browser   │──────>│  Edge Function  │──────>│  Speechace   │
│  (React)   │       │                 │       │  API v9      │
│            │       │                 │<──────│              │
└────────────┘       └─────────────────┘ score └──────────────┘
      │                      │
      │ auth                 │ save
      │ read/write           │
      ▼                      ▼
┌───────────────────────────────────────────┐
│  Supabase                                 │
│  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Auth     │  │    PostgreSQL       │ │
│  │    (RLS)    │  │    profiles         │ │
│  │             │  │    learners         │ │
│  └─────────────┘  │    modules / words  │ │
│                   │    sentences        │ │
│                   │    attempts (JSONB) │ │
│                   └─────────────────────┘ │
└───────────────────────────────────────────┘
```

### リクエストフロー（発音評価）

1. 学習者がマイクで発音
2. MediaRecorder で音声を取得（WebM / WAV）
3. Edge Function に POST（音声 + learner_id + word_id）
4. Edge Function が Speechace API を呼び出し
5. Speechace がスコア（音素・音節・単語レベル）を返却
6. Edge Function が合格判定し、attempt + phonemes（JSONB）を DB に保存
7. フロントにフィードバックを返却（色分け + 改善ポイント）

## データモデル

5 テーブル + 3 ビュー（プロトタイプ）。詳細は specs/ 配下を参照。

- [specs/identity/](specs/identity/database.md) - profiles, learners
- [specs/practice/](specs/practice/database.md) - modules, words, sentences, attempts + 3 ビュー
- [specs/classroom/](specs/classroom/database.md) - スコープ外

Auth アカウントの下に学習者プロフィール（learners）がぶら下がる構造。RLS で「アカウント所有者は自分の学習者のデータのみ」を強制する。

## Edge Functions

Edge Function は 1 本（score-pronunciation）。音声ファイルを受け取り、Speechace API で評価し、結果を DB に保存してフロントにフィードバックを返す。

## 関連ドキュメント

- [product.md](product.md) - プロダクト仕様
- [speechace-api.md](speechace-api.md) - Speechace API 調査メモ
