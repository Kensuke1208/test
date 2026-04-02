# Practice - Database Spec

## 1. 概要

発音練習のコンテンツ管理と練習結果の記録を担当するドメイン。モジュール → 単語 → 例文の階層構造を持ち、練習の試行と音素スコアを記録する。

**関連ドキュメント**:
- [Identity Domain](../identity/database.md)
- [Speechace API](../../speechace-api.md)
- [Product Spec](../../product.md)

## 2. テーブル一覧

| テーブル | 説明 |
|---------|------|
| modules | モジュール（10 単語の塊） |
| words | 単語（モジュールに所属） |
| sentences | 例文（単語に紐づく） |
| attempts | 練習の試行（1 回の発音） |
| phoneme_scores | 音素ごとのスコア（attempt に紐づく） |

## 3. modules

### ビジネスルール

- 1 モジュールは 10 単語で構成する
- モジュール内の全単語が合格するとモジュール合格
- 認証済みユーザーは全モジュールを参照できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| title | text | NO | - | モジュール名（例:「森のふしぎ」） |
| description | text | YES | - | モジュールの説明 |
| display_order | integer | NO | 0 | 表示順 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### 制約

- PK: `id`

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 認証済みユーザー | 全件参照可能 |
| INSERT | - | シード経由 |
| UPDATE | - | シード経由 |
| DELETE | - | 許可しない |

### トリガー

#### on_modules_update

- 関数: `internal.handle_updated_at()`

## 4. words

### ビジネスルール

- 単語はモジュールに所属する
- 各単語に 2〜3 の例文が紐づく
- 単語練習 → 例文練習の順で取り組み、すべてクリアでその単語が合格
- 認証済みユーザーは全単語を参照できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| module_id | uuid | NO | - | FK → modules.id |
| text | text | NO | - | 英単語（例: "apple"） |
| meaning_ja | text | NO | - | 日本語の意味（例: "りんご"） |
| image_url | text | YES | - | 絵のURL |
| audio_url | text | YES | - | ネイティブ音声のURL |
| display_order | integer | NO | 0 | モジュール内の表示順 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### 制約

- PK: `id`
- FK: `module_id` → `modules.id` (ON DELETE CASCADE)
- UNIQUE: `(module_id, text)`

### インデックス

| 目的 | 対象 | 条件 |
|------|------|------|
| モジュールの単語一覧取得 | module_id | - |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 認証済みユーザー | 全件参照可能 |
| INSERT | - | シード経由 |
| UPDATE | - | シード経由 |
| DELETE | - | 許可しない |

### トリガー

#### on_words_update

- 関数: `internal.handle_updated_at()`

## 5. sentences

### ビジネスルール

- 例文は単語に紐づく（1 単語あたり 2〜3 文）
- 例文は英検 3 級レベル
- 認証済みユーザーは全例文を参照できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| word_id | uuid | NO | - | FK → words.id |
| text | text | NO | - | 例文（例: "I eat an apple every morning."） |
| meaning_ja | text | NO | - | 日本語訳 |
| audio_url | text | YES | - | ネイティブ音声のURL |
| display_order | integer | NO | 0 | 単語内の表示順 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### 制約

- PK: `id`
- FK: `word_id` → `words.id` (ON DELETE CASCADE)

### インデックス

| 目的 | 対象 | 条件 |
|------|------|------|
| 単語の例文一覧取得 | word_id | - |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 認証済みユーザー | 全件参照可能 |
| INSERT | - | シード経由 |
| UPDATE | - | シード経由 |
| DELETE | - | 許可しない |

### トリガー

#### on_sentences_update

- 関数: `internal.handle_updated_at()`

## 6. attempts

### ビジネスルール

- 1 回の発音が 1 レコード
- 単語練習と例文練習の両方を記録する（target_type で区別）
- 例文練習の場合、テキスト全体のスコアと対象単語のスコアの両方を記録する
- スコアが閾値以上なら合格（is_passed = true）
- 生徒は自分の試行のみ参照できる
- 親は子供の試行を参照できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | - | FK → profiles.id（練習した生徒） |
| word_id | uuid | NO | - | FK → words.id（対象の単語） |
| sentence_id | uuid | YES | - | FK → sentences.id（例文練習時のみ） |
| target_type | text | NO | - | 'word' / 'sentence' |
| score | integer | NO | - | speechace_score.pronunciation（0-100） |
| target_word_score | integer | YES | - | 例文中の対象単語の quality_score（例文練習時のみ） |
| is_passed | boolean | NO | false | 合格判定 |
| created_at | timestamptz | NO | now() | 作成日時 |

### 制約

- PK: `id`
- FK: `user_id` → `profiles.id` (ON DELETE CASCADE)
- FK: `word_id` → `words.id` (ON DELETE CASCADE)
- FK: `sentence_id` → `sentences.id` (ON DELETE CASCADE)
- CHECK: `target_type IN ('word', 'sentence')`
- CHECK: `target_type = 'word' OR sentence_id IS NOT NULL`
- CHECK: `target_type = 'sentence' OR target_word_score IS NULL`

### インデックス

| 目的 | 対象 | 条件 |
|------|------|------|
| ユーザーの練習履歴取得 | user_id | - |
| 単語ごとの試行一覧 | (user_id, word_id) | - |
| 例文ごとの試行一覧 | (user_id, sentence_id) | sentence_id IS NOT NULL |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 本人 | `user_id = auth.uid()` |
| SELECT | 親 | parent_children 経由で紐づく子供の試行 |
| INSERT | - | Edge Function 経由で作成（score-pronunciation） |
| UPDATE | - | 許可しない |
| DELETE | - | 許可しない |

### 設計判断

- updated_at を持たない理由：試行は作成後に変更されないため
- word_id を必須にする理由：例文練習でも「どの単語の練習か」を常に追跡するため（合格判定、苦手音素の集計に必要）
- is_passed をアプリ側で計算して保存する理由：閾値が変わった場合でも過去の合格判定は保持される。集計クエリも単純になる

## 7. phoneme_scores

### ビジネスルール

- attempt ごとに、Speechace API が返した音素スコアを全件記録する
- `sound_most_like` の不一致を集計して苦手音素を特定する
- 生徒は自分の音素スコアのみ参照できる
- 親は子供の音素スコアを参照できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| attempt_id | uuid | NO | - | FK → attempts.id |
| phone | text | NO | - | 期待される音素（例: "r"） |
| quality_score | integer | NO | - | 音素スコア（0-100） |
| sound_most_like | text | NO | - | 実際に発した音素（例: "l"） |
| is_correct | boolean | NO | - | phone = sound_most_like |
| created_at | timestamptz | NO | now() | 作成日時 |

### 制約

- PK: `id`
- FK: `attempt_id` → `attempts.id` (ON DELETE CASCADE)

### インデックス

| 目的 | 対象 | 条件 |
|------|------|------|
| 試行の音素一覧取得 | attempt_id | - |
| 苦手音素の集計 | (phone, is_correct) | is_correct = false |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 本人 | attempts 経由で `user_id = auth.uid()` |
| SELECT | 親 | attempts → parent_children 経由 |
| INSERT | - | Edge Function 経由で作成（score-pronunciation） |
| UPDATE | - | 許可しない |
| DELETE | - | 許可しない |

### 設計判断

- is_correct を保存する理由：`phone != sound_most_like` の計算を毎回行わず、集計クエリを効率化するため
- stress_level / stress_score を保存しない理由：プロトタイプでは音素の正確さに集中する。将来的に追加可能
