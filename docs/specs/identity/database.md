# Identity - Database Spec

## 1. 概要

ユーザー管理と親子紐付けを担当するドメイン。Supabase Auth と連携し、student / parent の 2 ロールをプロトタイプで使用する。

**関連ドキュメント**:
- [Practice Domain](../practice/database.md)
- [Product Spec](../../product.md)

## 2. テーブル一覧

| テーブル | 説明 |
|---------|------|
| profiles | ユーザープロフィール（Supabase Auth に紐づく） |
| parent_children | 親子紐付け |

## 3. 共通関数

### internal.handle_updated_at()

updated_at を自動更新するトリガー関数。

- スキーマ: internal
- 権限: SECURITY DEFINER
- 動作: `NEW.updated_at = now()` を設定して RETURN NEW
- 使用: 全テーブルの BEFORE UPDATE トリガー

## 4. profiles

### ビジネスルール

- Supabase Auth でユーザーが作成されると、profiles レコードが自動作成される
- ロールは `student` または `parent`（プロトタイプ。将来 `instructor` を追加）
- parent ロールのユーザーは子供（student）のアカウントを作成できる
- display_name は必須

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | - | PK, FK → auth.users.id |
| role | text | NO | 'student' | ロール（'student' / 'parent'） |
| display_name | text | NO | - | 表示名 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### 制約

- PK: `id`
- FK: `id` → `auth.users.id` (ON DELETE CASCADE)
- CHECK: `role IN ('student', 'parent')`

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 本人 | `id = auth.uid()` |
| SELECT | 親 | parent_children 経由で紐づく子供のプロフィール |
| UPDATE | 本人 | `id = auth.uid()`（display_name のみ） |
| INSERT | - | トリガー経由で自動作成 |
| DELETE | - | 許可しない |

### トリガー

#### on_auth_user_created

Supabase Auth のユーザー作成時に profiles レコードを自動作成する。

- 関数: `internal.handle_new_user()`
  - 権限: SECURITY DEFINER
- タイミング: AFTER INSERT ON auth.users
- 動作:
  1. profiles に INSERT（id = NEW.id, role と display_name は Auth メタデータから取得）

#### on_profiles_update

- 関数: `internal.handle_updated_at()`

### RPC関数

#### create_child_account

親が子供のアカウントを作成する。

- スキーマ: public
- 権限: SECURITY DEFINER
- 引数: `p_display_name` (text), `p_email` (text), `p_password` (text)
- 戻り値: `child_id` (uuid)
- 動作:
  1. 呼び出し元が parent ロールであることを確認
  2. Supabase Auth Admin API で子供のユーザーを作成（role = 'student' をメタデータに設定）
  3. parent_children に紐付けレコードを作成
- エラー条件:
  - 呼び出し元が parent ロールでない
  - display_name が空
  - メールアドレスが既に使用されている

### 設計判断

- profiles.id は auth.users.id と同一：Supabase Auth との 1:1 対応を保証
- role を profiles に持つ理由：RLS ポリシーで参照しやすくするため（Auth メタデータは RLS 内で参照しにくい）
- プロトタイプでは instructor ロールは未使用だが、CHECK 制約の変更のみで追加可能
- 子供のアカウント作成は RPC 経由：Auth Admin API の呼び出しとparent_children の作成をアトミックに実行するため

## 5. parent_children

### ビジネスルール

- 1 人の親が複数の子供を持てる（兄弟対応）
- 紐付けは子供のアカウント作成時に自動で行われる
- 親は紐づいた子供のデータのみ閲覧できる

### カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|--------|-----|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | PK |
| parent_id | uuid | NO | - | FK → profiles.id（parent） |
| child_id | uuid | NO | - | FK → profiles.id（student） |
| created_at | timestamptz | NO | now() | 作成日時 |

### 制約

- PK: `id`
- FK: `parent_id` → `profiles.id` (ON DELETE CASCADE)
- FK: `child_id` → `profiles.id` (ON DELETE CASCADE)
- UNIQUE: `(parent_id, child_id)`

### インデックス

| 目的 | 対象 | 条件 |
|------|------|------|
| 親の子供一覧取得 | parent_id | - |
| 子供の親取得 | child_id | - |

### RLS方針

| 操作 | 対象 | 条件 |
|------|------|------|
| SELECT | 親 | `parent_id = auth.uid()` |
| INSERT | - | RPC経由で作成（create_child_account） |
| UPDATE | - | 許可しない |
| DELETE | - | 許可しない |

### 設計判断

- updated_at を持たない理由：紐付けは作成後に変更されないため
- 1 人の子供に複数の親を紐付けることも構造上は可能だが、プロトタイプでは想定しない
