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
| attempts | 練習の試行（1 回の発音、音素データを JSONB で保持） |
| v_learner_phoneme_stats | 学習者ごとの音素集計ビュー |
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
- スコア（0-100）が事実源。合格判定はビューで動的に算出する（is_passed カラムは持たない）
- アカウント所有者は自分の学習者の試行を参照できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| account_id | uuid | NO | - | FK → accounts.id（RLS 用。learners.account_id の非正規化） |
| learner_id | uuid | NO | - | FK → learners.id（練習した学習者） |
| word_id | uuid | NO | - | FK → words.id（対象の単語） |
| sentence_id | uuid | YES | - | FK → sentences.id（例文練習時のみ） |
| target_type | text | NO | - | 'word' / 'sentence' |
| score | integer | NO | - | speechace_score.pronunciation（0-100） |
| target_word_score | integer | YES | - | 例文中の対象単語の quality_score（例文練習時のみ） |
| phonemes | jsonb | NO | - | Speechace API の音素スコア全件（下記参照） |
| created_at | timestamptz | NO | now() | 作成日時 |

### 制約

- PK: `id`
- FK: `account_id` → `accounts.id` (ON DELETE CASCADE)
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
| SELECT | アカウント所有者 | `account_id = auth.uid()`（非正規化カラムで JOIN 不要） |
| INSERT | - | Edge Function 経由で作成（score-pronunciation） |
| UPDATE | - | 許可しない |
| DELETE | - | 許可しない |

### phonemes の構造

```json
[
  {"word": "apple", "phone": "ae", "quality_score": 90, "sound_most_like": "ae", "is_correct": true},
  {"word": "apple", "phone": "p", "quality_score": 95, "sound_most_like": "p", "is_correct": true},
  {"word": "every", "phone": "v", "quality_score": 35, "sound_most_like": "b", "is_correct": false},
  {"word": "morning", "phone": "r", "quality_score": 30, "sound_most_like": "l", "is_correct": false}
]
```

`word` フィールドを含める理由：即時フィードバックで単語ごとの色分けを表示する際、および BQ での単語別分析に必要。

即時フィードバック（色分け・指摘）はこの JSONB から直接読む。苦手音素の集計は v_learner_phoneme_stats ビューで行う。

### 設計判断

- updated_at を持たない理由：試行は作成後に変更されないため
- account_id を非正規化する理由：RLS ポリシーで learners テーブルへの JOIN を避け、`account_id = auth.uid()` の単純な比較でインデックスが効くようにする。Supabase 公式推奨パターン
- learner_id で紐付ける理由：練習履歴は学習者プロフィール単位で分離するため
- word_id を必須にする理由：例文練習でも「どの単語の練習か」を常に追跡するため（合格判定、苦手音素の集計に必要）
- is_passed を持たない理由：score が事実源。合格判定はビュー（v_word_mastery）で `score >= 閾値` から動的に算出する。閾値変更時に過去の判定も自動更新される
- 音素データを JSONB で保持する理由：1回の発音で10-50件の音素を正規化テーブルに書くのはオーバーヘッドが大きい。即時フィードバックは JSONB から直接読み、集計は v_learner_phoneme_stats ビューで行う。BQ には JSONB をそのまま export して詳細分析が可能

## 7. v_learner_phoneme_stats

学習者ごとの音素集計を返すビュー。attempts.phonemes（JSONB）を展開・集計し、全音素の正解率と混同パターンを提供する。

### カラム定義

| カラム | 型 | 説明 |
|--------|-----|------|
| learner_id | uuid | 学習者 ID |
| phone | text | 音素 |
| total_count | integer | 出現回数 |
| correct_count | integer | 正解回数 |
| error_count | integer | 不正解回数 |
| accuracy | numeric | 正解率（correct_count / total_count） |
| most_common_mistake | text | 最も多い混同先（正解の場合は NULL） |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | アカウント所有者 | learners 経由で `learners.account_id = auth.uid()` |

### 設計判断

- サマリーテーブルではなくビューにする理由：プロトタイプの規模なら JSONB 展開の集計で十分な速度が出る。書き込み時の同期ロジックが不要になり、Edge Function がシンプルになる
- データ量の前提：学習者あたり attempts 数千件（〜全コンテンツ完了で約 1,000 件）。学習者数百人規模まではビューで対応可能。それを超える場合はマテリアライズドビューまたはサマリーテーブルへの移行を検討する
- 全音素を返す理由：苦手音素だけでなく得意な音素も把握でき、正解率による相対的な評価が可能。ダッシュボード側で用途に応じてフィルタする
- スケール時の移行：遅くなったらこのビューの定義をマテリアライズドビューやサマリーテーブルに置き換えればよい。参照元の変更は不要

## 8. v_word_mastery

学習者ごとの単語マスター状態を返すビュー。全ステップ（単語練習 + 各例文）の best_score の最小値で単語の総合スコアを算出する。

### カラム定義

| カラム | 型 | 説明 |
|--------|-----|------|
| learner_id | uuid | 学習者 ID |
| word_id | uuid | 単語 ID |
| module_id | uuid | モジュール ID |
| score | integer | 単語の総合スコア（全ステップの best_score の最小値、未挑戦は 0） |
| steps_total | integer | 全ステップ数（1 + sentence 数） |
| steps_cleared | integer | best_score >= 80 のステップ数 |
| mastered | boolean | steps_cleared = steps_total |

### score の算出

各ステップの best_score（MAX(score)）を算出し、その最小値を単語の score とする。未挑戦のステップは best_score = 0 として扱う。

- 進行はアンロック: 単語練習なしで例文だけ挑戦するケースもある
- ビューは attempts の全 target_type から DISTINCT(learner_id, word_id) で対象を取得
- sentences テーブルと LEFT JOIN して未挑戦の例文を 0 として反映

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | アカウント所有者 | learners 経由で `learners.account_id = auth.uid()` |

### 設計判断

- score は全ステップの最弱値: 1ステップでも低ければ単語全体のスコアが下がる。弱点を見逃さない設計
- mastered は steps_cleared = steps_total から算出: ビューのカラムとして含めることで v_module_progress が直接参照できる
- 閾値 80 はビュー内にハードコード（プロトタイプ）。変更時はビューの再作成が必要

## 9. v_module_progress

学習者ごとのモジュール進捗を返すビュー。v_word_mastery の mastered を集計する。

### カラム定義

| カラム | 型 | 説明 |
|--------|-----|------|
| learner_id | uuid | 学習者 ID |
| module_id | uuid | モジュール ID |
| total_words | integer | モジュール内の総単語数 |
| mastered_words | integer | マスター済み単語数 |
| completed | boolean | mastered_words = total_words |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | アカウント所有者 | learners 経由で `learners.account_id = auth.uid()` |

### 設計判断

- v_word_mastery を集計するビュー：単語マスターの定義を v_word_mastery に集約し、モジュール進捗はその上に乗せる
