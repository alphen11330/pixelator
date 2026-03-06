# Pixelator - ぴくせれーたー

リアルタイム処理でイラストや写真をドット絵風に変換するWebアプリです。

**URL:** https://pixelator.net/

## 機能

- 画像アップロード (ドラッグ&ドロップ対応)
- リアルタイムのドット絵変換
- 色調補正 (色相・彩度・輝度・コントラスト・明度)
- トーンカーブ編集
- 輪郭線強調 (エッジ強調)
- ディザリング (Bayer Matrix / Floyd-Steinberg など複数方式)
- カラーパレット生成・編集・プリセット選択
- ドット絵ペイント機能
- 動画のドット絵変換
- 変換結果のダウンロード (PNG)
- 日本語 / 英語 UI 切り替え

## 技術スタック

| カテゴリ | 使用技術 |
|---|---|
| フレームワーク | Next.js 15 + React 19 |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS 4 |
| 画像処理 | OpenCV.js (`/js/opencv.js` を静的ファイルとして配信) |
| 減色・ディザリング | RGBQuant, DitherJS |
| カラー操作 | Chroma.js, Color Thief |
| デプロイ | Cloudflare Pages (`@cloudflare/next-on-pages`) |

## 画像処理パイプライン

```
imageSrc (オリジナル)
  → ImageEditor (色調補正・エッジ強調)
    → smoothImageSrc
      → PixelArtProcessor (リサイズ・ディザリング・減色)
        → dotsImageSrc (完成ドット絵)
```

## ローカル開発

```bash
npm install
npm run dev
```

開発サーバーが `http://localhost:3000` で起動します。

> Turbopack は無効化されています (`NEXT_DISABLE_TURBOPACK=1`)。

## ビルド・デプロイ

```bash
# 通常ビルド
npm run build

# Cloudflare Pages 向けビルド
npx @cloudflare/next-on-pages
```

## ディレクトリ構成

```
src/app/
├── page.tsx                    # メインページ (状態管理の中心)
├── layout.tsx                  # ルートレイアウト・メタデータ
├── header.tsx                  # ヘッダー
├── components/
│   ├── ImageEditor.tsx         # 色調補正・エッジ強調
│   ├── PixelArtProcessor.tsx   # ドット絵変換処理
│   ├── PixelVideoProcessor.tsx # 動画変換処理
│   ├── ColorPalette.tsx        # パレット生成・編集 UI
│   ├── ToneCurveEditor.tsx     # トーンカーブ編集 UI
│   ├── Downloader.tsx          # ダウンロード
│   ├── Uploader.tsx            # 画像アップロード
│   ├── createPalette.ts        # メディアンカット法でパレット生成
│   ├── toneCurveUtils.ts       # トーンカーブ LUT 計算
│   └── workers/
│       ├── ditherWorker.ts     # Web Worker: ディザリング処理
│       └── paletteWorker.ts    # Web Worker: パレット生成処理
└── paletteList/
    └── index.ts                # プリセットパレット一覧
```

## 主要な処理の説明

### ディザリング手法
`DitherTypeDropdown` から選択可能。Bayer Matrix (Basic/Classic)、Floyd-Steinberg 系など複数方式に対応。

### カラーパレット生成
`createPalette.ts` でメディアンカット法を実装。色数 (bit 数) は `colorLevels` パラメータで制御。

### OpenCV.js の読み込み
`window.cv` として参照。`/js/opencv.js` を `public/js/` に配置して静的配信。
