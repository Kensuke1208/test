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
| v_word_mastery | 学習者ごとの単語合格状態ビュー |
| v_module_progress | 学習者ごとのモジュール進捗ビュー |

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
| learner_id | uuid | NO | - | FK → learners.id（練習した学習者） |
| word_id | uuid | NO | - | FK → words.id（対象の単語） |
| sentence_id | uuid | YES | - | FK → sentences.id（例文練習時のみ） |
| target_type | text | NO | - | 'word' / 'sentence' |
| score | integer | NO | - | speechace_score.pronunciation（0-100） |
| target_word_score | integer | YES | - | 例文中の対象単語の quality_score（例文練習時のみ） |
| is_passed | boolean | NO | false | 合格判定 |
| created_at | timestamptz | NO | now() | 作成日時 |

### 制約

- PK: `id`
- FK: `learner_id` → `learners.id` (ON DELETE CASCADE)
- FK: `word_id` → `words.id` (ON DELETE CASCADE)
- FK: `sentence_id` → `sentences.id` (ON DELETE CASCADE)
- CHECK: `target_type IN ('word', 'sentence')`
- CHECK: `target_type = 'word' OR sentence_id IS NOT NULL`
- CHECK: `target_type = 'sentence' OR target_word_score IS NULL`

### インデックス

| 目的 | 対象 | 条件 |
|------|------|------|
| 学習者の練習履歴取得 | learner_id | - |
| 単語ごとの試行一覧 | (learner_id, word_id) | - |
| 例文ごとの試行一覧 | (learner_id, sentence_id) | sentence_id IS NOT NULL |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | アカウント所有者 | learners 経由で `learners.account_id = auth.uid()` |
| INSERT | - | Edge Function 経由で作成（score-pronunciation） |
| UPDATE | - | 許可しない |
| DELETE | - | 許可しない |

### 設計判断

- updated_at を持たない理由：試行は作成後に変更されないため
- learner_id で紐付ける理由：練習履歴は学習者プロフィール単位で分離するため
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
| SELECT | アカウント所有者 | attempts → learners 経由で `learners.account_id = auth.uid()` |
| INSERT | - | Edge Function 経由で作成（score-pronunciation） |
| UPDATE | - | 許可しない |
| DELETE | - | 許可しない |

### 設計判断

- is_correct を保存する理由：`phone != sound_most_like` の計算を毎回行わず、集計クエリを効率化するため
- stress_level / stress_score を保存しない理由：プロトタイプでは音素の正確さに集中する。将来的に追加可能

## 8. v_word_mastery

学習者ごとの単語合格状態を返すビュー。単語練習の合格と全例文の合格を集計し、単語全体の合格判定を提供する。

### カラム定義

| カラム | 型 | 説明 |
|--------|-----|------|
| learner_id | uuid | 学習者 ID |
| word_id | uuid | 単語 ID |
| module_id | uuid | モジュール ID |
| word_passed | boolean | 単語練習が 1 回以上合格しているか |
| all_sentences_passed | boolean | 全例文が各 1 回以上合格しているか |
| is_mastered | boolean | 単語の合格（word_passed AND all_sentences_passed） |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | アカウント所有者 | learners 経由で `learners.account_id = auth.uid()` |

### 設計判断

- attempts の is_passed は個々の試行の合否。「単語の合格」は単語練習 + 全例文の合格が必要で、ビューで集計する
- module_id を含める理由：モジュール合格（全 10 単語の is_mastered = true）の判定に使用する
- 生徒ダッシュボードのプログレスバー、親向けのモジュール進捗表示の両方がこのビューを参照する

## 9. v_module_progress

学習者ごとのモジュール進捗を返すビュー。v_word_mastery を集計し、モジュール内の合格単語数と合格状態を提供する。

### カラム定義

| カラム | 型 | 説明 |
|--------|-----|------|
| learner_id | uuid | 学習者 ID |
| module_id | uuid | モジュール ID |
| total_words | integer | モジュール内の総単語数 |
| mastered_words | integer | 合格済み単語数 |
| is_completed | boolean | モジュール合格（mastered_words = total_words） |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | アカウント所有者 | learners 経由で `learners.account_id = auth.uid()` |

### 設計判断

- v_word_mastery を集計するビュー：単語合格の定義を v_word_mastery に集約し、モジュール進捗はその上に乗せる
- 親向けダッシュボードの「成長」指標（月ごとのモジュール進捗）の基礎データとなる
