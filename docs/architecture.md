# Echora アーキテクチャ仕様

プロトタイプの技術構成。プロダクトの全体像と方針は [product.md](product.md) に記載。

## 技術スタック

| 領域 | 技術 |
|---|---|
| Frontend | React + TypeScript（Vite） |
| Hosting | Supabase（Static Hosting or Vercel） |
| API Proxy | Supabase Edge Functions（Deno） |
| DB | Supabase PostgreSQL |
| Auth | Supabase Auth |
| 発音評価 | Speechace Score Text API v9 |
| 音声録音 | MediaRecorder API（ブラウザ標準） |
| Styling | Tailwind CSS |

### 選定理由

**Supabase Edge Functions** — Speechace API はデフォルトで CORS 無効。フロントエンドから直接呼べないため、バックエンドプロキシが必須。Edge Function に音声ファイルを POST し、そこから Speechace API を叩いて結果を返す。

**Supabase Auth** — 生徒と講師の 2 ロールが必要。Supabase Auth の Row Level Security（RLS）と組み合わせることで、「生徒は自分のデータのみ閲覧可」「講師は担当生徒全員のデータを閲覧可」を DB 層で強制できる。

**Supabase PostgreSQL** — 管理画面で必要な集計クエリ（生徒ごとの正答率推移、苦手音素のランキング）は SQL の標準機能で対応可能。RLS によるアクセス制御との相性が良い。

**MediaRecorder API** — ブラウザ標準の音声録音 API。追加ライブラリ不要。WebM または WAV 形式で取得し、Edge Function 経由で Speechace API に送信する。

**Vite + React** — セットアップが軽量で、TypeScript と Tailwind の統合が容易。

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
│  │             │  │    classrooms       │ │
│  └─────────────┘  │    attempts         │ │
│                   │    phoneme_scores   │ │
│                   └─────────────────────┘ │
└───────────────────────────────────────────┘
```

### リクエストフロー（発音評価）

1. 生徒がマイクで発音
2. MediaRecorder で音声を取得（WebM / WAV）
3. Edge Function に POST（音声 + 対象テキスト）
4. Edge Function が Speechace API を呼び出し
5. Speechace がスコア（音素・音節・単語レベル）を返却
6. Edge Function がスコアを整形してフロントに返却
7. フロントがフィードバックを表示（色分け + 改善ポイント）
8. 練習結果を Supabase DB に保存

## データモデル

8 テーブル + 3 ビュー。詳細は specs/ 配下を参照。

- [specs/identity/](specs/identity/database.md) - profiles
- [specs/classroom/](specs/classroom/database.md) - classrooms, enrollments, assignments, assignment_words
- [specs/practice/](specs/practice/database.md) - words, attempts, phoneme_scores

ロールは student / instructor の 2 種類。RLS で「生徒は自分のデータのみ」「講師は担当クラスの生徒のデータ」を強制する。

## Edge Functions

Edge Function は 1 本（score-pronunciation）。音声ファイルを受け取り、Speechace API で評価し、結果を DB に保存してフロントにフィードバックを返す。

## 関連ドキュメント

- [product.md](product.md) - プロダクト仕様
