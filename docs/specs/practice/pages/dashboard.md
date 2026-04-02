# Dashboard - Page Spec

## 1. Overview

学習者と親のダッシュボード。学習者には練習推薦を、親には子供の学習状況を提供する。

**Related Documents**:
- [Practice Database Spec](../database.md)
- [Identity Database Spec](../../identity/database.md)
- [App Spec](../../app.md)

## 2. User Stories

As a learner,
- 自分がどこまで進んだか、プログレスバーで確認したい
- 次にどの音を練習すればいいか教えてほしい

As a parent,
- 子供がちゃんと練習しているか確認したい
- 子供が伸びているか確認したい
- 子供が何を苦手としているか知りたい
- 兄弟がいる場合、子供を切り替えて確認したい

## 3. Pages

| ページ | パス | 説明 |
|--------|------|------|
| 学習者ダッシュボード | /learner-dashboard | 習得進捗 + 練習推薦 |
| 親ダッシュボード | /dashboard | 練習量・成長・苦手ポイント |

## 4. Learner Dashboard

### Route

- **Path**: `/learner-dashboard`
- **Auth**: 必要
- **Learner**: 必要

### Data

| Name | Source | Filter |
|------|--------|--------|
| moduleProgress | v_module_progress ビュー | learner_id = selectedLearnerId |
| wordMastery | v_word_mastery ビュー | learner_id = selectedLearnerId, is_mastered = false, LIMIT 5 |
| phonemeStats | v_learner_phoneme_stats ビュー | learner_id = selectedLearnerId |

### Components

```
LearnerDashboardPage
├── PageHeader（学習者名 + 戻るボタン）
├── ProgressSection
│   ├── ProgressBar（合格単語数 / 全単語数）
│   └── ModuleProgressList（モジュールごとの進捗サマリー）
├── RecommendationSection
│   ├── SectionTitle（「このおとをもうすこしれんしゅうしよう」）
│   └── RecommendedWordList
│       └── WordCard（繰り返し、最大 5 件）
└── StartPracticeButton（「れんしゅうする」→ /modules）
```

### Business Logic

**練習推薦のロジック**:

1. phonemeStats から accuracy が低い音素を上位 3 つ取得し、苦手音素として表示（「"r" のおとをもうすこしれんしゅうしよう」）
2. wordMastery で is_mastered = false の単語を、moduleProgress の display_order 順で最大 5 件取得し、「つぎにれんしゅうするたんご」として表示

> Note: 苦手音素を含む未習得単語の推薦は、words テーブルに音素情報がないため実装できない。プロトタイプでは苦手音素の提示と次の未習得単語の提示を分離する。

### Interactions

- WordCard → /modules/:moduleId/words/:wordId へ遷移
- StartPracticeButton → /modules へ遷移
- 戻るボタン → /modules へ遷移

### Edge Cases

| ケース | 動作 |
|--------|------|
| 練習履歴なし | プログレス 0、「まずはれんしゅうをはじめよう！」メッセージ |
| 全単語合格済み | 「すべてマスターしました！」メッセージ |

## 5. Parent Dashboard

### Route

- **Path**: `/dashboard`
- **Auth**: 必要
- **Learner**: 不要（親が子供を切り替えて閲覧）

### Data

| Name | Source | Filter |
|------|--------|--------|
| learners | learners テーブル | account_id = auth.uid() |
| weeklyAttempts | attempts テーブル | learner_id = dashboardLearnerId, created_at >= 今週月曜（JST） |
| lastAttempt | attempts テーブル | learner_id = dashboardLearnerId, ORDER BY created_at DESC, LIMIT 1 |
| moduleProgress | v_module_progress ビュー | learner_id = dashboardLearnerId |
| phonemeStats | v_learner_phoneme_stats ビュー | learner_id = dashboardLearnerId |

### Components

```
ParentDashboardPage
├── PageHeader（「学習状況」）
├── LearnerSwitcher（子供の切り替えタブ）
├── PracticeAmountSection
│   ├── WeeklyCount（「今週の練習回数: 24 回」）
│   └── LastPracticeDate（「最後に練習した日: 4/2」）
├── GrowthSection
│   ├── SectionTitle（「成長」）
│   └── ModuleProgressTimeline（月ごとのモジュール合格数）
├── WeakPointSection
│   ├── SectionTitle（「苦手ポイント」）
│   └── WeakPhonemeList
└── BackToLearnersLink（「学習者選択に戻る」）
```

### Business Logic

**練習量の計算**:
- 今週の練習回数: weeklyAttempts の件数
- 最後に練習した日: lastAttempt.created_at を JST で日付表示
- 「今週」の定義: JST 月曜 00:00 から

**成長の表示**:
- moduleProgress の completed_at を月ごとに集計
- 表示: 「2月: 1 モジュール、3月: 3 モジュール、4月: 0 モジュール」
- completed_at が NULL（未完了）のモジュールはカウントしない

**苦手ポイントの表示**:
- phonemeStats から accuracy が低い音素を上位 3 つ取得
- 音素→文字表記マッピング（[App Spec](../../app.md#8-phoneme-display-mapping) 参照）で変換
- 表示: 「"th" の音が苦手です」「"r" と "l" を間違えやすいです」
- most_common_mistake がある場合は混同パターンも表示

**子供の切り替え**:
- LearnerSwitcher で子供を選択すると dashboardLearnerId を更新
- dashboardLearnerId は useState で管理（ページローカル。Zustand の selectedLearnerId とは別）
- 初期値: learners[0].id
- 切り替え時に Data を refetch

### Interactions

- LearnerSwitcher (On change) → dashboardLearnerId 更新、Data refetch
- BackToLearnersLink → /learners へ遷移

### Edge Cases

| ケース | 動作 |
|--------|------|
| 学習者 0 人 | 「学習者を追加してください」+ /learners へのリンク |
| 練習履歴なし | 各セクション「まだ練習していません」 |
| phonemeStats が空 | 苦手ポイントセクション「まだデータがありません」 |
| 全モジュール未完了 | 成長セクション「まだモジュールをクリアしていません」 |
