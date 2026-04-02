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

### ロジック

1. JWT からユーザー ID を取得、認証確認
2. learner_id で learners テーブルから学習者を取得（存在確認、`account_id = auth.uid()` で権限確認）
3. word_id で words テーブルから単語を取得（存在確認）
4. sentence_id がある場合は sentences テーブルから例文を取得（存在確認、word_id との整合性確認）
5. 評価対象テキストを決定:
   - 単語練習: `words.text`（例: "apple"）
   - 例文練習: `sentences.text`（例: "I eat an apple every morning."）
6. Speechace API を呼び出し:
   - エンドポイント: `POST https://api.speechace.co/api/scoring/text/v9/json`
   - パラメータ: `key`, `dialect=en-us`, `text`, `user_audio_file=audio`, `user_id`
   - `include_fluency`, `include_intonation` は送らない
7. レスポンスを処理:
   - `speechace_score.pronunciation` → score
   - 例文練習時: `word_score_list` から対象単語の `quality_score` → target_word_score
   - `phone_score_list` → phoneme_scores レコード群（例文練習時も全単語の音素を保存する）
8. 合格判定:
   - 単語練習: `score >= 閾値`
   - 例文練習: `score >= 閾値 AND target_word_score >= 閾値`
9. DB に保存（トランザクション）:
   - attempts に 1 レコード INSERT
   - phoneme_scores に音素スコアを全件 INSERT
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
      "phone": "r",
      "quality_score": 70,
      "sound_most_like": "l",
      "is_correct": false
    },
    {
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
- attempts と phoneme_scores を同時に保存する理由: 1 回の発音に対する評価結果を一貫して記録するため
- Edge Function で合格判定を行う理由: フロント側で判定すると閾値の改ざんが可能。サーバー側で判定し is_passed を記録する
- phoneme_scores を全件保存する理由: 苦手音素の集計（生徒ダッシュボード、親向けサマリー）に使用するため
- 例文練習時も全単語の音素を保存する理由: 対象単語以外でも苦手音素は検出される（例: "morning" の /r/）。集計精度を高めるため
- `user_id` を Speechace API に送る理由: Speechace 側でユーザーごとの学習進捗を追跡可能にするため（将来的な活用を想定）
