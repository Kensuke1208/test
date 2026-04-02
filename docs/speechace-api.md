# Speechace API 調査メモ

Eigo の発音評価基盤として使用する Speechace Score Text API v9 の仕様整理。プロダクト設計に関係する点を抜粋。

## エンドポイント

`POST https://api.speechace.co/api/scoring/text/v9/json`

単語・例文ともに同一エンドポイントで評価できる。

## 入力パラメータ

| パラメータ | 必須 | 内容 |
|-----------|------|------|
| `text` | Yes | 評価対象のテキスト（単語・フレーズ・文） |
| `user_audio_file` | Yes | 音声ファイル（wav, mp3, m4a, webm, ogg, aiff） |
| `key` | Yes | API キー |
| `dialect` | Yes | 言語方言（`en-us`, `en-gb` 等） |
| `include_fluency` | No | `1` で流暢さ指標を追加 |
| `include_intonation` | No | `1` でストレス・イントネーション指標を追加 |
| `markup_language` | No | `arpa_mark` で ARPABET 記法による発音指定を有効化 |

## レスポンス構造

```
text_score
├── speechace_score: { pronunciation: 0-100 }
├── ielts_score / pte_score / toeic_score / cefr_score
├── word_score_list[]
│   ├── word: "river"
│   ├── quality_score: 85
│   ├── phone_score_list[]
│   │   ├── phone: "r"
│   │   ├── quality_score: 70
│   │   ├── sound_most_like: "l"       ← 実際に発音した音素
│   │   ├── stress_level: 1|0|null
│   │   └── extent: [start, end]
│   └── syllable_score_list[]
│       ├── letters: "riv"
│       ├── quality_score: 80
│       ├── stress_level: 1
│       ├── stress_score: 90
│       └── predicted_stress_level: 1
├── word_intonation_list[]              ← include_intonation=1 時
│   ├── intonation: ["RISE", "FALL"]
│   └── pitch_range: [Hz]
└── fluency_score                       ← include_fluency=1 時
    ├── speech_rate
    ├── articulation_rate
    ├── pause_count
    ├── pause_duration
    ├── mean_length_run
    └── syllable_correct_per_minute
```

## プロダクト設計への影響

### 評価方針（プロトタイプ）

単語・例文ともに音素の正確さで評価する。ターゲットが小 5-6 のため、流暢さ・イントネーションは過剰。`include_fluency`, `include_intonation` は使わない。

| フィールド | 用途 |
|-----------|------|
| `phone_score_list[].quality_score` | 各音素の正確さ |
| `phone_score_list[].sound_most_like` | 混同パターンの特定（/r/ → /l/ 等） |
| `syllable_score_list[].stress_score` | 多音節語のアクセント位置 |

流暢さ（`include_fluency=1`）、イントネーション（`include_intonation=1`）は将来の拡張とする。

### 連結音声（リダクション・リンキング）

API が自動的に対応する。音声を分析し、音素リストを動的に調整するため、自然な連結音声はペナルティにならない。

- T/D 削除：「Hot Dog」で /t/ がドロップ → `phone_score_list` から /t/ が除外される
- リダクション：「and」→ /n/ に縮約 → 縮約形として認識される
- 不適切な連結音声は検出される：「the apple」で母音前に /DH AH/ を使うと不適切と判定

フラッピング（/t/ → [ɾ]）への対応は未文書化。実機検証が必要。

### `sound_most_like` の活用

話者が実際に発した音素を返す。これにより：

- 生徒の苦手音素の特定（`phone` と `sound_most_like` の不一致を集計）
- 混同パターンの可視化（/r/ → /l/ が多い、/θ/ → /s/ が多い、等）
- 講師向けの詳細データ、親向けの「"th" の音が苦手です」サマリーの両方に活用可能

### CORS

デフォルトで無効。フロントエンドからの直接呼び出しは不可。Supabase Edge Function 経由のプロキシが必須（architecture.md の方針通り）。

### 料金

月額制 + 従量課金。Pro プランは $80/月、1 リクエスト 15 秒あたり $0.008。

### `markup_language` による発音指定

`arpa_mark` を指定すると、ARPABET 記法でカスタム発音を指定できる。主な用途：

- 異音同綴語の区別（read: /riːd/ vs /rɛd/）
- 頭字語の発音指定
- 数字の読み方指定

例文に異音同綴語が含まれる場合に活用できる。

## ソース

- [Score Text/Pronunciation](https://api-docs.speechace.com/api-reference/score-text-pronunciation)
- [Score Text/Stress & Intonation](https://api-docs.speechace.com/api-reference/score-text-stress-and-intonation)
- [Score Text/Phoneme List](https://api-docs.speechace.com/api-reference/score-text-phoneme-list)
- [API Features](https://api-docs.speechace.com/getting-started/pre-requisites/api-features)
- [FAQs](https://api-docs.speechace.com/other-resources/faqs)
- [Implementing Connected Speech Activities with Speechace API](https://www.speechace.com/implementing-connected-speech-activities-with-speechace-api/)
