# Eigo 開発計画

プロトタイプの実装ロードマップ。

## フェーズ概要

| Phase | 内容 | 目的 |
|-------|------|------|
| 0 | 設計 + 基盤構築 | **完了** |
| 1 | コアフロー | **完了** |
| 2 | 認証 + DB 連携 | **完了** |
| 3 | ダッシュボード + デザイン | テスト未完了 |
| 4 | 仕上げ | コンテンツ、デザイン改善、本番デプロイ |

## Phase 0: 設計 + 基盤構築（完了）

- [x] プロダクト仕様（product.md）
- [x] アーキテクチャ設計（architecture.md）
- [x] Speechace API 調査（speechace-api.md）
- [x] DB スペック（identity, practice）
- [x] Edge Function スペック（score-pronunciation）
- [x] Page スペック（app.md, auth, learner-selection, practice, dashboard）
- [x] Supabase Declarative Schema + マイグレーション
- [x] pgTAP テスト（56 tests pass）
- [x] フロントエンドプロジェクト初期化（Vite + React + TypeScript + Tailwind）
- [x] Speechace API 動作確認

## Phase 1: コアフロー（完了）

認証なしで、練習の一連のフローが動くことを検証する。

- [x] TTS で仮音声を生成 — ブラウザ SpeechSynthesis で audio_url が null のときフォールバック再生
- [x] モジュール一覧ページ — Supabase からモジュール + 進捗（v_module_progress）を取得して表示
- [x] モジュール詳細ページ — 10 単語のスコア帯表示（v_word_mastery: score, steps_cleared/steps_total）
- [x] 練習ページ
  - [x] 全ステップ表示（アンロック、どのステップからでも挑戦可能）
  - [x] 聞いてから話す（初回はお手本再生必須）
  - [x] スコア帯別フィードバック（メッセージ、正解数、前回比較、発音のコツ）
  - [x] ネイティブ音声再生（audio_url、TTS 仮音声）
- [x] Edge Function 拡張 — word_id / sentence_id で DB からテキストを取得

## Phase 2: 認証 + DB 連携（完了）

- [x] ログインページ — Supabase Auth signInWithPassword
- [x] サインアップページ — Supabase Auth signUp
- [x] Auth Guard の有効化 — verify_jwt = true、learner 存在確認
- [x] 学習者選択ページ — learners 一覧、選択 → Zustand → /modules
- [x] 学習者作成ページ — learners INSERT + UNIQUE 制約ハンドリング
- [x] 学習者編集ページ — learners UPDATE
- [x] Edge Function — JWT 認証 + 2 クライアント方式（anon key + JWT / service_role）+ attempts INSERT
- [x] supabase.functions.invoke() — SDK が JWT を自動付与
- [x] ステップごとの best_score（attempts から算出、再開位置に使用）
- [x] TopBar — 学習者名表示 + 日本語ラベル
- [x] PublicLayout — 認証済みリダイレクト

## Phase 3: ダッシュボード + デザイン

### デザイン

- [x] デザインシステム — mint カラーパレット、Zen Maru Gothic + Quicksand、アニメーション、グラデーション背景
- [x] 全ページのリデザイン — 練習、モジュール、認証、学習者選択、TopBar

### 親ダッシュボード（/dashboard）

- [x] 学習者切り替え（ピルタブ）
- [x] 練習の取り組み — 曜日ドット（月〜日）+ 日数 + 最終練習日
- [x] 最近の練習 — モジュール単位の活動履歴
- [x] 達成状況 — マスター単語数 + モジュール完了数
- [x] 発音の様子 — 得意・苦手の両方を表示

### モジュール一覧の拡張（学習者向け）

- [x] おすすめカード — 次に練習すべき単語1つを提示
- [x] 全体進捗サマリー
- [x] 苦手な音ヒント

### デプロイ

- [x] Supabase Dev プロジェクト（eigo-dev）+ マイグレーション push
- [x] Edge Function デプロイ + Speechace API キー設定
- [x] Cloudflare Pages デプロイ（eigo-dev.pages.dev）

### テスト

- [ ] フロントエンドテスト — vitest でコンポーネント・hooks のテスト追加

## Phase 4: 仕上げ
- [ ] コンテンツ投入 — 英検 3 級レベルの全モジュール
- [ ] 音声データ — SpeechSynthesis 仮音声を本番音声に差し替え
- [ ] 画像データ — 各単語のイラスト
- [ ] UI デザイン改善 — ユーザーテストを踏まえた調整
- [ ] 本番デプロイ — Supabase Prod + Cloudflare Pages 本番
- [ ] メール確認の有効化判断

## Open Issues

- 活動履歴の将来拡張 — リスニングテスト等が追加された場合、同じ履歴セクションに統合
- 週次の発音成長メッセージ — 十分なデータ蓄積後に実装
- 合格閾値の調整 — 実ユーザーテストで検証
- フラッピング評価の検証
- Safari MediaRecorder の検証
- 大人向け展開の検討

## 原則

- **コア → 周辺の順**で実装する
- **各 Phase の終わりにレビュー**を行い、整合性を確認する
- **DB テスト**は pgTAP で完了済み。フロントのテストは未着手
