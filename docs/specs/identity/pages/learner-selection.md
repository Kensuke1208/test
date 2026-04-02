# Learner Selection - Page Spec

## 1. Overview

学習者プロフィールの選択と管理。ログイン後の最初の画面。

**Related Documents**:
- [Identity Database Spec](../database.md)
- [App Spec](../../app.md)

## 2. User Stories

As a parent,
- 子供ごとにプロフィールを作成し、練習履歴を分けたい
- 練習の前に、どの子供が使うか選びたい
- 子供の名前を変更したい

## 3. Pages

| ページ | パス | 説明 |
|--------|------|------|
| 学習者選択 | /learners | 「だれが練習する？」 |
| 学習者作成 | /learners/new | 新しい学習者プロフィールの追加 |
| 学習者編集 | /learners/:learnerId/edit | 表示名の変更 |

## 4. Learner Selection

### Route

- **Path**: `/learners`
- **Auth**: 必要
- **Learner**: 不要

### Data

| Name | Source | Filter |
|------|--------|--------|
| learners | learners テーブル | account_id = auth.uid() |

### Components

```
LearnerSelectionPage
├── PageHeader（「だれが練習する？」）
├── LearnerGrid
│   └── LearnerCard（繰り返し）
│       ├── LearnerName
│       └── EditButton
├── AddLearnerButton（「＋ 追加する」）
└── ParentDashboardLink（「学習状況を見る」）
```

### Interactions

- LearnerCard → selectedLearnerId を設定（Zustand + localStorage）→ /modules へ遷移
- EditButton → /learners/:learnerId/edit へ遷移
- AddLearnerButton → /learners/new へ遷移
- ParentDashboardLink → /dashboard へ遷移

### Edge Cases

| ケース | 動作 |
|--------|------|
| 学習者 0 人 | 「学習者を追加してください」+ AddLearnerButton を目立たせる |

## 5. Learner Create

### Route

- **Path**: `/learners/new`
- **Auth**: 必要
- **Learner**: 不要

### Components

```
LearnerCreatePage
├── PageHeader（「学習者を追加」+ 戻るボタン）
└── LearnerForm
    ├── DisplayNameInput
    └── SubmitButton
```

### Business Logic

- learners テーブルに INSERT（account_id = auth.uid(), display_name）
- 作成成功 → /learners へ遷移

**Validation**:

| フィールド | ルール | メッセージ |
|-----------|--------|-----------|
| display_name | 必須 | 「名前を入力してください」 |
| display_name | 同一アカウント内で重複不可（UNIQUE 制約） | 「この名前は既に使われています」 |

### Interactions

- SubmitButton → バリデーション → INSERT → /learners へ遷移
- 戻るボタン → /learners へ遷移

## 6. Learner Edit

### Route

- **Path**: `/learners/:learnerId/edit`
- **Auth**: 必要
- **Learner**: 不要

### Data

| Name | Source | Filter |
|------|--------|--------|
| learner | learners テーブル | id = learnerId, account_id = auth.uid() |

### Components

```
LearnerEditPage
├── PageHeader（「学習者を編集」+ 戻るボタン）
└── LearnerForm
    ├── DisplayNameInput（現在の名前をプリフィル）
    └── SubmitButton
```

### Business Logic

- learners テーブルを UPDATE（display_name のみ）
- 更新成功 → /learners へ遷移
- 学習者の削除はプロトタイプでは対応しない

**Validation**: Learner Create と同じ

### Interactions

- SubmitButton → バリデーション → UPDATE → /learners へ遷移
- 戻るボタン → /learners へ遷移

### Edge Cases

| ケース | 動作 |
|--------|------|
| learnerId が存在しない / 他アカウント | /learners へリダイレクト |
