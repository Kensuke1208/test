# Dashboard - Page Spec

## 1. Overview

学習者と親のダッシュボード。学習者には練習推薦を、親には子供の学習状況を提供する。

**Related Documents**:
- [Practice Database Spec](../database.md)
- [Identity Database Spec](../../identity/database.md)
- [App Spec](../../app.md)

## 2. User Stories

As a learner,
- 次にどの単語を練習すればいいか知りたい
- 自分がどこまで進んだか確認したい

As a parent,
- 子供がちゃんと練習しているか確認したい
- 子供が伸びているか確認したい
- 子供が何を苦手としているか知りたい
- 兄弟がいる場合、子供を切り替えて確認したい

## 3. Pages

| ページ | パス | 説明 |
|--------|------|------|
| モジュール一覧（学習者向け拡張） | /modules | 習得進捗 + 練習推薦（モジュール一覧に統合） |
| 親ダッシュボード | /dashboard | 練習量・成長・苦手ポイント |

学習者ダッシュボードは独立ページにしない。子供は自発的にダッシュボードに遷移しないため、練習の導線上（モジュール一覧）に情報を統合する。

## 4. モジュール一覧の拡張（学習者向け）

### Route

- **Path**: `/modules`
- **Auth**: 必要
- **Learner**: 必要

モジュール一覧ページ（既存）の上部に以下を追加する。モジュールカードの表示は変更なし。

### Data

| Name | Source | Filter |
|------|--------|--------|
| modules | modules テーブル | - |
| moduleProgress | v_module_progress ビュー | learner_id = selectedLearnerId |
| wordMastery | v_word_mastery ビュー | learner_id = selectedLearnerId |
| phonemeStats | v_learner_phoneme_stats ビュー | learner_id = selectedLearnerId |
| words | words テーブル | - |

### Components

```
ModuleListPage
├── RecommendationCard（次に練習すべき単語1つ）
├── ProgressSummary（全体の進捗テキスト）
├── PhonemeHint（苦手な音のヒント、任意）
└── ModuleList（既存、変更なし）
```

### Business Logic

**おすすめ単語の選定**:

1つだけ提示する。5件のリストではなく、1つの明確なアクションを示す。

- 優先1: 挑戦済みだが未マスターの単語（スコアが合格に最も近いもの）
- 優先2: まだ挑戦していない最初の単語（表示順）
- 該当なし: 全マスター時は祝福メッセージ、練習履歴なし時は開始を促すメッセージ

**苦手な音ヒント**:

v_learner_phoneme_stats から正解率が最も低い音素を1つだけ表示。十分なデータ（5回以上）がない場合は非表示。

### Edge Cases

| ケース | 動作 |
|--------|------|
| 練習履歴なし | 「まずは練習をはじめよう！」メッセージ |
| 全単語合格済み | 「すべてマスターしました！」メッセージ |
| 音素データ不足 | ヒントセクション非表示 |

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
| recentAttempts | attempts テーブル | learner_id = dashboardLearnerId, ORDER BY created_at DESC, LIMIT 50 |
| moduleProgress | v_module_progress ビュー | learner_id = dashboardLearnerId |
| phonemeStats | v_learner_phoneme_stats ビュー | learner_id = dashboardLearnerId |
| words | words テーブル | - |
| modules | modules テーブル | - |

### Components

```
ParentDashboardPage
├── PageHeader（「学習状況」）
├── LearnerSwitcher（横並びピルタブ）
├── PracticeConsistencySection
│   ├── WeeklyDots（月〜日、練習した日を塗りつぶし）
│   ├── DaysCount（「今週 4日 練習した」）
│   └── LastPracticeDate（「最後の練習: 4/2」）
├── RecentActivitySection
│   └── ActivityList（日付 × モジュール単位の練習履歴）
├── AchievementSection
│   ├── MasteredWords（マスター単語数 + ProgressBar）
│   └── CompletedModules（モジュール完了数）
├── PronunciationSection
│   ├── StrongPhonemes（得意な音）
│   └── WeakPhonemes（苦手な音 + 混同パターン）
└── FooterLink（「学習者の選択にもどる」→ /learners）
```

### Business Logic

**練習の取り組み**:
- 曜日ドット（月〜日）で今週の練習リズムを一目で表示
- 「今週 N日 練習した」で継続性を数値化
- 最終練習日が3日以上前の場合は警告色で表示
- 「今週」の定義: JST 月曜 00:00 から

**最近の練習**:
- 直近の練習履歴を日付 × モジュール単位でグループ化して表示
- 各行: 日付 + モジュール名 + 練習単語数 + 合格単語数
- 最大5日分

**達成状況**:
- マスターした単語数 / 全単語数（ProgressBar）
- クリアしたモジュール数 / 全モジュール数

**発音の様子**:
- v_learner_phoneme_stats から得意な音（正解率 80% 以上）と苦手な音（80% 未満）を分けて表示
- 苦手な音には混同パターンを併記（「→ "s" とまちがえやすい」）
- 十分なデータ（5回以上）がある音素のみ対象
- 各最大3つ

**子供の切り替え**:
- 横並びピルタブで子供を選択。useState で管理（Zustand の selectedLearnerId とは別）
- 初期値: learners[0]
- 切り替え時にデータを refetch

### Edge Cases

| ケース | 動作 |
|--------|------|
| 学習者 0 人 | 「学習者を追加してね」+ /learners/new へのリンク |
| 練習履歴なし | 「まだ練習していません」+ 空の曜日ドット |
| 音素データなし | 「まだデータがありません」 |
