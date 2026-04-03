# Eigo 開発計画

プロトタイプの実装ロードマップ。コア機能を先に動かし、認証とダッシュボードは後から繋ぐ。

## フェーズ概要

| Phase | 内容 | 目的 |
|-------|------|------|
| 0 | 設計 + 基盤構築 | **完了** |
| 1 | コアフロー | **完了** |
| 2 | 認証 + DB 連携 | **完了** |
| 3 | ダッシュボード | 生徒・親向けの情報表示 |
| 4 | 仕上げ | デザイン、コンテンツ、デプロイ |

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
- [x] Speechace API 動作確認（DevPracticePage）

## Phase 1: コアフロー

認証なしで、練習の一連のフローが動くことを検証する。

- [x] TTS で仮音声を生成 — ブラウザ SpeechSynthesis で audio_url が null のときフォールバック再生
- [x] モジュール一覧ページ — Supabase からモジュール + 進捗（v_module_progress）を取得して表示
- [x] モジュール詳細ページ — 10 単語のスコア帯表示（v_word_mastery: score, steps_cleared/steps_total）
- [x] 練習ページ（本番版） — DevPracticePage の部品を再利用
  - [x] 全ステップ表示（アンロック、どのステップからでも挑戦可能）
  - [x] 聞いてから話す（初回はお手本再生必須）
  - [x] スコア帯別フィードバック（メッセージ、正解数、前回比較、発音のコツ）
  - [x] ネイティブ音声再生（audio_url、TTS 仮音声）
- [x] Edge Function 拡張 — word_id / sentence_id で DB からテキストを取得

この Phase では Auth Guard をバイパスし、学習者 ID は固定値を使う。Speechace は評価専用で音声データを提供しないため、TTS で仮音声を用意する。

## Phase 2: 認証 + DB 連携

認証フロー + attempts 保存を統合実装。Edge Function の JWT 認証と attempts INSERT を1回の改修で行う。

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

## Phase 3: ダッシュボード

- [ ] 学習者ダッシュボード
  - [ ] プログレスバー（steps_cleared / steps_total）
  - [ ] 練習推薦（スコアが低い単語を優先表示）
- [ ] 親ダッシュボード
  - [ ] 練習量（今週の回数、最終練習日）
  - [ ] 成長（モジュール合格数）
  - [ ] 苦手ポイント（音素→文字表記マッピング）
  - [ ] 学習者切り替え

## Phase 4: 仕上げ

- [ ] UI デザイン — 小学生向けのビジュアル（色、サイズ、ひらがな）
- [ ] コンテンツ投入 — 英検 3 級レベルの全モジュール（約 130 モジュール）
- [ ] 音声データ — SpeechSynthesis 仮音声を本番音声に差し替え（ネイティブ録音、プロ TTS、または音声データベース）
- [ ] 画像データ — 各単語のイラスト
- [ ] Cloudflare Pages デプロイ
- [ ] Supabase プロジェクト（本番）セットアップ
- [ ] メール確認の有効化判断
- [ ] Open Issues の解決
  - [ ] 合格閾値の調整（実ユーザーテスト）
  - [ ] フラッピング評価の検証
  - [ ] Safari MediaRecorder の検証
  - [ ] 大人向け展開の検討

## 原則

- **コア → 周辺の順**で実装する。認証やダッシュボードはコアフローが動いてから
- **各 Phase の終わりにレビュー**を行い、スペックとの整合性を確認する
- **dev ルート（/dev/*）** はコアフロー検証用。Phase 1 完了時に削除済み
- **テストは各 Phase で追加**する。DB テストは完了済み。フロントのテストは Phase 1 から追加
