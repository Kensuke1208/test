# Practice - Edge Function Spec

## 1. 概要

発音練習の評価を担当する Edge Function。音声ファイルを受け取り、Speechace API で評価し、結果を DB に保存してフロントにフィードバックを返す。

**関連ドキュメント**:
- [Database Spec](./database.md)
- [Speechace API](../../speechace-api.md)
- [Product Spec](../../product.md)

**共通事項**:
- 認証: Supabase Auth（JWT 検証）
- 外部 API: Speechace Score Text API v9

## 2. Edge Function 一覧

| 関数名 | 用途 | 実行方式 |
|--------|------|----------|
| [score-pronunciation](#3-score-pronunciation) | 発音の評価・記録 | フロントエンドからの POST |

## 3. score-pronunciation

音声ファイルとテキストを受け取り、Speechace API で評価し、結果を DB に保存してフロントに返す。

### リクエスト

```
POST /functions/v1/score-pronunciation
Authorization: Bearer <user_jwt>
Content-Type: multipart/form-data
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| audio | File | Yes | 音声ファイル（wav, mp3, m4a, webm, ogg, aiff） |
| learner_id | uuid | Yes | 練習する学習者の ID |
| word_id | uuid | Yes | 対象の単語 ID |
| sentence_id | uuid | No | 例文 ID（例文練習時のみ） |

### Supabase クライアント

2 つのクライアントを使い分ける:

- **ユーザー JWT クライアント**: リクエストの JWT で生成。RLS が効くため、learner/word/sentence の読み取りと権限チェックに使用
- **service_role クライアント**: 環境変数の service_role キーで生成。RLS をバイパスし、attempts の INSERT に使用（attempts には authenticated 向けの INSERT ポリシーがないため）

### ロジック

1. JWT からユーザー ID を取得、認証確認
2. **ユーザー JWT クライアント**で learner_id の learners を取得（RLS で `account_id = auth.uid()` が自動チェックされる。見つからなければ 403）
3. **ユーザー JWT クライアント**で word_id の words を取得（存在確認）
4. sentence_id がある場合は **ユーザー JWT クライアント**で sentences を取得（存在確認、word_id との整合性確認）
5. 評価対象テキストを決定:
   - 単語練習: `words.text`（例: "apple"）
   - 例文練習: `sentences.text`（例: "I eat an apple every morning."）
6. Speechace API を呼び出し:
   - エンドポイント: `POST https://api2.speechace.com/api/scoring/text/v9/json`（AP SouthEast / Singapore）
   - パラメータ: `key`, `dialect=en-us`, `text`, `user_audio_file=audio`, `user_id=learner_id`
   - `include_fluency`, `include_intonation` は送らない
7. レスポンスを処理:
   - `speechace_score.pronunciation` → score
   - 例文練習時: `word_score_list` から対象単語の `quality_score` → target_word_score
   - `word_score_list[].phone_score_list` を全単語分展開・結合し、各音素に `word` フィールドと `is_correct` フィールドを付与して phonemes JSONB を構築（例文練習時も全単語の音素を含む）
   - `is_correct` の算出: `phone === sound_most_like`（質問された音素と実際に発した音素が一致するか）。quality_score ベースではない
8. 合格判定:
   - 単語練習: `score >= 閾値`
   - 例文練習: `score >= 閾値 AND target_word_score >= 閾値`
9. **service_role クライアント**で DB に保存:
   - attempts に 1 レコード INSERT（phonemes JSONB を含む）
10. フロントにレスポンスを返す

### 例文中の対象単語の特定

Speechace API の `word_score_list` から対象単語を特定する方法:

- `word_score_list[].word` と `words.text` を照合する
- 例文中に同じ単語が複数回出現する場合は、最初の出現を使用する
- 大文字小文字は区別しない

### レスポンス

```json
{
  "attempt_id": "uuid",
  "score": 85,
  "target_word_score": 75,
  "is_passed": true,
  "phonemes": [
    {
      "word": "river",
      "phone": "r",
      "quality_score": 70,
      "sound_most_like": "l",
      "is_correct": false
    },
    {
      "word": "river",
      "phone": "ih",
      "quality_score": 90,
      "sound_most_like": "ih",
      "is_correct": true
    }
  ]
}
```

### エラーハンドリング

| HTTP | エラー | 対応 |
|------|--------|------|
| 401 | JWT 不正・未認証 | `{ "error": "unauthorized" }` |
| 400 | word_id 未指定 / 音声ファイル未添付 | `{ "error": "bad_request", "message": "..." }` |
| 404 | word_id / sentence_id が存在しない | `{ "error": "not_found", "message": "..." }` |
| 400 | sentence_id の word_id 不整合 | `{ "error": "bad_request", "message": "sentence does not belong to word" }` |
| 502 | Speechace API エラー | `{ "error": "upstream_error", "message": "..." }` |
| 504 | Speechace API タイムアウト | `{ "error": "upstream_timeout" }` |
| 500 | DB 書き込みエラー | `{ "error": "internal_error" }` |

### 環境変数

| 変数 | 説明 |
|------|------|
| SPEECHACE_API_KEY | Speechace API キー |
| SPEECHACE_API_URL | Speechace API エンドポイント URL |
| PASS_THRESHOLD | 合格閾値（デフォルト: 80） |

### 設計判断

- 合格閾値を環境変数にする理由: 実ユーザーテストで調整する前提。コード変更なしで閾値を変更可能
- `include_fluency`, `include_intonation` を送らない理由: プロトタイプでは音素の正確さのみで評価する（product.md の評価設計に基づく）
- 2 クライアント方式の理由: 読み取りはユーザー JWT クライアントで RLS による権限チェックを活用し、書き込みは service_role クライアントで RLS をバイパスする。attempts に authenticated 向け INSERT ポリシーを作ると、ユーザーが任意のスコアを書き込めるリスクがある
- attempts のみ INSERT する理由: 音素の集計は v_learner_phoneme_stats ビューで行うため、Edge Function での同期更新が不要
- Edge Function で合格判定を行う理由: フロント側で判定すると閾値の改ざんが可能。サーバー側で判定し is_passed を記録する
- 音素データを JSONB で保持する理由: 1回の発音で10-50件の音素を正規化テーブルに書くのはオーバーヘッドが大きい。即時フィードバックは JSONB から直接読み、集計は v_learner_phoneme_stats ビューで行う
- 例文練習時も全単語の音素を JSONB に含める理由: 対象単語以外でも苦手音素は検出される（例: "morning" の /r/）。集計精度を高めるため
- `user_id` に learner_id を送る理由: Speechace 側で学習者単位の進捗を追跡可能にするため。auth user ID ではなく learner_id を使うことで、アカウント内の学習者を区別できる
