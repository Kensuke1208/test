# Auth - Page Spec

## 1. Overview

アカウントの作成とログイン。Supabase Auth を使用。

**Related Documents**:
- [Identity Database Spec](../database.md)
- [App Spec](../../app.md)

## 2. User Stories

As a parent,
- 子供に発音練習をさせるため、アカウントを作成したい
- 次回以降はメールアドレスとパスワードでログインしたい

## 3. Pages

| ページ | パス | 説明 |
|--------|------|------|
| ログイン | /login | メール + パスワードでログイン |
| サインアップ | /signup | アカウント作成 |

## 4. Login

### Route

- **Path**: `/login`
- **Auth**: 不要（認証済みなら /learners へリダイレクト）

### Components

```
LoginPage
├── AppLogo
├── LoginForm
│   ├── EmailInput
│   ├── PasswordInput
│   └── SubmitButton
├── ErrorMessage（認証失敗時）
└── SignupLink（「アカウントを作成する」）
```

### Interactions

- SubmitButton → `supabase.auth.signInWithPassword({ email, password })`
- 認証成功 → /learners へ遷移
- 認証失敗 → ErrorMessage を表示
- SignupLink → /signup へ遷移

### Edge Cases

| ケース | 動作 |
|--------|------|
| メール/パスワード不正 | 「メールアドレスまたはパスワードが正しくありません」 |
| 未確認メールアドレス | 「メールを確認してください」 |

> Note: パスワードリセット機能はプロトタイプのスコープ外。Supabase Auth の `resetPasswordForEmail` で将来対応可能。

## 5. Signup

### Route

- **Path**: `/signup`
- **Auth**: 不要（認証済みなら /learners へリダイレクト）

### Components

```
SignupPage
├── AppLogo
├── SignupForm
│   ├── DisplayNameInput
│   ├── EmailInput
│   ├── PasswordInput
│   └── SubmitButton
├── ErrorMessage（作成失敗時）
└── LoginLink（「すでにアカウントをお持ちの方」）
```

### Business Logic

- `supabase.auth.signUp({ email, password, options: { data: { display_name } } })` で作成
- accounts レコードは on_auth_user_created トリガーで自動作成される
- プロトタイプではメール確認を無効にする（小 5-6 の親が離脱するリスクを避ける）。サインアップ後は即座に /learners へ遷移

**Validation**:

| フィールド | ルール | メッセージ |
|-----------|--------|-----------|
| display_name | 必須 | 「名前を入力してください」 |
| email | 必須、メール形式 | 「メールアドレスを入力してください」 |
| password | 必須、6文字以上 | 「パスワードは6文字以上にしてください」 |

### Interactions

- SubmitButton → バリデーション → signUp 呼び出し
- 作成失敗 → ErrorMessage を表示
- LoginLink → /login へ遷移

### Edge Cases

| ケース | 動作 |
|--------|------|
| メールアドレス既存 | 「このメールアドレスは既に登録されています」 |
