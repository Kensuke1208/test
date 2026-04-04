# App Spec

## 1. Overview

アプリ全体で共通する設計方針。各ページスペックはこのドキュメントを前提とする。

**Related Documents**:
- [Product Spec](../../product.md)
- [Architecture](../../architecture.md)

## 2. Layout

```
App
├── AuthGuard
│   ├── PublicLayout（/login, /signup）
│   │   └── PageContent
│   └── AppLayout（認証済みページ）
│       ├── TopBar
│       │   ├── AppLogo
│       │   ├── LearnerIndicator（選択中の学習者名。タップで /learners へ）
│       │   └── AccountMenu（ダッシュボード、ログアウト）
│       └── PageContent
```

- PublicLayout: ロゴのみ。ナビゲーションなし
- AppLayout: TopBar + PageContent。サイドバーなし（小学生向けにシンプルに）
- LearnerIndicator: 学習者選択済みの場合のみ表示。未選択なら非表示

## 3. Auth Guard

| パス | 認証要件 | 学習者選択 | 未達時のリダイレクト |
|------|---------|-----------|---------------------|
| /login, /signup | 不要（認証済みなら /learners へ） | - | - |
| /learners, /learners/* | 必要 | 不要 | /login |
| /dashboard | 必要 | 不要 | /login |
| /modules, /modules/* | 必要 | 必要 | /learners |

## 4. Selected Learner

`selectedLearnerId` は Zustand で管理し、localStorage に永続化する。

- ページリロードで復元される
- ログアウト時にクリアする
- 復元時に learners テーブルで存在確認し、存在しなければクリアして /learners へリダイレクト

## 5. Loading Pattern

データ取得中はスケルトンを表示する。ページ全体のデータが未取得の場合はページレベルスケルトン、部分的なデータの場合はコンポーネントレベルスケルトン。

スピナーは使わない（画面がチラつき、小学生に不安を与える）。

## 6. Error Pattern

| 種類 | 表示方法 | 例 |
|------|---------|-----|
| データ取得失敗 | インラインメッセージ（該当セクションに表示） | 「データを読み込めませんでした。もう一度試してね」 |
| 操作失敗 | トースト（画面下部、3秒で自動消去） | 「保存できませんでした」 |
| フォームバリデーション | フィールド直下にメッセージ | 「名前を入力してください」 |
| 権限エラー / 不正アクセス | リダイレクト | /learners または /login へ |

## 7. UI Language

日本語固定。国際化（i18n）はプロトタイプのスコープ外。

小学校で習う漢字（教育漢字）は使用して構わない。ターゲットが小学校高学年以上のため。中学以上で習う漢字は避けるか、ひらがなにする。

## 8. Phoneme Display Mapping

親ダッシュボードの苦手サマリーや、練習画面のヒント表示で使用する。音素記号を小学生・保護者が理解できる文字表記に変換する。

Speechace API は ARPABET 表記で音素を返す。以下は ARPABET → 文字表記のマッピング。

| ARPABET | 文字表記 | 混同例 |
|---------|---------|--------|
| r | "r" | "l" と間違えやすい |
| l | "l" | "r" と間違えやすい |
| th | "th"（think の th） | "s" と間違えやすい |
| dh | "th"（this の th） | "z" と間違えやすい |
| v | "v" | "b" と間違えやすい |
| f | "f" | "h" と間違えやすい |
| ae | "a"（apple の a） | - |
| ah | "u"（cup の u） | - |
| aa | "o"（hot の o） | - |
| ih | "i"（sit の i） | - |
| uh | "oo"（book の oo） | - |
| ax | "a"（about の a） | - |

上記は代表的な音素のみ。完全なマッピングは実装時に Speechace API のレスポンスに基づいて拡充する。

## 9. Pronunciation Tips

日本語話者の典型的な混同パターンに対して、子供向けの発音のコツを提示する。

| 期待 → 実際 | ヒント |
|-------------|--------|
| r → l | 舌の先を上に曲げて、どこにもつけないでね |
| l → r | 舌の先を上の歯のうらにつけてみよう |
| th → s | 舌を歯の間にはさんでみよう |
| dh → z | 舌を歯の間にはさんで声を出してみよう |
| v → b | 上の歯で下のくちびるに軽くふれてみよう |
| f → h | 上の歯で下のくちびるにふれて息を出してみよう |

上記は代表的なパターンのみ。実装は `src/lib/pronunciation-tips.ts`。
