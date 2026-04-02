# Eigo

発音練習を通じてリスニング力を伸ばす英語学習 Web アプリ。

英検 3 級レベルの語彙を対象に、AI が音素レベルでフィードバックを返す。個人でも使え、塾・英会話スクールではクラス単位で生徒の進捗を管理できる。

## 技術スタック

- Frontend: React + TypeScript（Vite）
- Backend: Supabase（PostgreSQL, Auth, Edge Functions）
- 発音評価: Speechace API

## セットアップ

```bash
npm install
npm run dev
```

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/product.md](docs/product.md) | プロダクト仕様 |
| [docs/architecture.md](docs/architecture.md) | アーキテクチャ仕様 |
| [docs/specs/identity/](docs/specs/identity/database.md) | ユーザーとロール |
| [docs/specs/classroom/](docs/specs/classroom/database.md) | クラス運営と割り当て |
| [docs/specs/practice/](docs/specs/practice/database.md) | 発音練習と評価 |
