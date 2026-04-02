# Identity - Database Spec

## 1. 概要

ユーザー管理を担当するドメイン。Supabase Auth と連携する。Auth アカウントの下に学習者プロフィールがぶら下がる構造（Netflix 方式）。プロトタイプでは親がアカウントを作成し、子供のプロフィールを作って練習させる。

**関連ドキュメント**:
- [Practice Domain](../practice/database.md)
- [Product Spec](../../product.md)

## 2. テーブル一覧

| テーブル | 説明 |
|---------|------|
| accounts | アカウント（Supabase Auth に紐づく） |
| learners | 学習者プロフィール（練習する人） |

## 3. 共通関数

internal スキーマおよび共通関数は `supabase/schemas/00_common.sql` で定義。全ドメインで共有する。

### internal.handle_updated_at()

updated_at を自動更新するトリガー関数。

- スキーマ: internal
- 権限: SECURITY INVOKER
- 動作: `NEW.updated_at = clock_timestamp()` を設定して RETURN NEW
- 使用: 全テーブルの BEFORE UPDATE トリガー

## 4. accounts

### ビジネスルール

- Supabase Auth でユーザーが作成されると、accounts レコードが自動作成される
- アカウントは誰でも作成できる（親、中高生、講師など）
- display_name は必須

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | - | PK, FK → auth.users.id |
| display_name | text | NO | - | 表示名 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### 制約

- PK: `id`
- FK: `id` → `auth.users.id` (ON DELETE CASCADE)

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 本人 | `id = auth.uid()` |
| UPDATE | 本人 | `id = auth.uid()`（display_name のみ） |
| INSERT | - | トリガー経由で自動作成 |
| DELETE | - | 許可しない |

### トリガー

#### on_auth_user_created

Supabase Auth のユーザー作成時に accounts レコードを自動作成する。

- 関数: `internal.handle_new_user()`
  - 権限: SECURITY DEFINER
- タイミング: AFTER INSERT ON auth.users
- 動作:
  1. accounts に INSERT（id = NEW.id, display_name は Auth メタデータから取得）

#### on_accounts_update

- 関数: `internal.handle_updated_at()`

### 設計判断

- accounts.id は auth.users.id と同一：Supabase Auth との 1:1 対応を保証
- role カラムを持たない理由：プロトタイプではアカウントの種別を区別する必要がない。将来クラス機能を追加する際に role を導入する

## 5. learners

### ビジネスルール

- 学習者はアカウント内のプロフィールとして存在する（Netflix 方式）
- アプリ起動時に「だれが練習する？」で学習者を選択する
- 1 つのアカウントに複数の学習者を作成できる（兄弟対応）
- 学習者ごとに練習履歴・苦手音素が分離される
- アカウント所有者は自分の学習者プロフィールのみ参照・作成・更新できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| account_id | uuid | NO | - | FK → accounts.id |
| display_name | text | NO | - | 学習者の表示名 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### 制約

- PK: `id`
- FK: `account_id` → `accounts.id` (ON DELETE CASCADE)
- UNIQUE: `(account_id, display_name)`

### インデックス

| 目的 | 対象 | 条件 |
|------|------|------|
| アカウントの学習者一覧取得 | account_id | - |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 本人 | `account_id = auth.uid()` |
| INSERT | 本人 | `account_id = auth.uid()` |
| UPDATE | 本人 | `account_id = auth.uid()`（display_name のみ） |
| DELETE | - | 許可しない |

### トリガー

#### on_learners_update

- 関数: `internal.handle_updated_at()`

### 設計判断

- Auth ユーザーにしない理由：小 5-6 はメールアドレスを持たないことが多い。親のアカウント内で完結させる
- 「children」ではなく「learners」にした理由：Auth アカウントは親に限定されない。中高生が自分のアカウントで自分のプロフィールを作ることも想定する
- UNIQUE (account_id, display_name)：同じアカウント内で名前の重複を防ぐ
- 将来クラス機能を追加する際は、learner が講師のクラスに参加する形で拡張可能
