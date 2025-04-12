"use client";
import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";

type Props = {
  smoothImageSrc: string | null;
  dotsImageSrc: string | null;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
  colorReduction: boolean;
  colorPalette: string[];
  colorLevels: number;
  ditherType: string;
  ditherStrength?: number; // 0.0～2.0の範囲で強度を指定 (デフォルト: 1.0)
};

// rgb() 形式と hex(#rrggbb) 形式の両方に対応
const parseRgb = (colorStr: string): [number, number, number] => {
  const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3]),
    ];
  }

  const hexMatch = colorStr.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      parseInt(hexMatch[1], 16),
      parseInt(hexMatch[2], 16),
      parseInt(hexMatch[3], 16),
    ];
  }

  return [0, 0, 0];
};

const PixelArtProcessor: React.FC<Props> = ({
  smoothImageSrc,
  dotsImageSrc,
  setDotsImageSrc,
  pixelLength,
  colorReduction,
  colorPalette,
  colorLevels,
  ditherType = "orderedClassic",

  ditherStrength, // デフォルト値は1.0（通常の強度）
}) => {
  // 元の画像ピクセルデータを保持するためのRef
  const originalPixelsRef = useRef<ImageData | null>(null);
  // 前回のパレットを保持するためのRef
  const prevPaletteRef = useRef<string[]>([]);
  // キャンバスを参照するためのRef
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // デバウンス処理変数（カラーパレット）
  const [initDebouncedColorPalette, setInitDebouncedColorPalette] =
    useState(10);
  const [debouncedColorPalette] = useDebounce(
    colorPalette,
    initDebouncedColorPalette
  );
  // デバウンス処理変数（ディザリング強度）
  const [initDebouncedDitherStrength, setInitDebouncedDitherStrength] =
    useState(5);
  const [debouncedDitherStrength] = useDebounce(
    ditherStrength,
    initDebouncedDitherStrength
  );
  // デバウンス処理変数（ドット長）
  const [initDebouncedpixelLength, setInitDebouncedpixelLength] = useState(0);
  const [debouncedpixelLength] = useDebounce(
    pixelLength,
    initDebouncedpixelLength
  );

  // 前のURLを記録
  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // 配色数とドット長でデバウンス値をセット
    if (colorLevels <= 5 || pixelLength <= 512) {
      setInitDebouncedColorPalette(5);
      setInitDebouncedDitherStrength(0);
      setInitDebouncedpixelLength(0);
    } else if (7 <= colorLevels && pixelLength <= 768) {
      setInitDebouncedColorPalette(100);
      setInitDebouncedDitherStrength(100);
      setInitDebouncedpixelLength(100);
    } else {
      setInitDebouncedColorPalette(15);
      setInitDebouncedDitherStrength(30);
      setInitDebouncedpixelLength(50);
    }
  }, [colorLevels, pixelLength]);

  useEffect(() => {
    // パレットが変更されたかどうかをチェック
    const isPaletteChanged =
      JSON.stringify(prevPaletteRef.current) !== JSON.stringify(colorPalette);
    const isInitialRender = !dotsImageSrc || !originalPixelsRef.current;

    // 元の画像を処理する必要がある場合
    if (isInitialRender || !isPaletteChanged) {
      processOriginalImage();
    } else {
      // パレットのみ変更された場合、色置換のみを再適用
      applyColorPalette();
    }

    // 現在のパレットを保存
    prevPaletteRef.current = [...colorPalette];
  }, [
    smoothImageSrc,
    debouncedpixelLength,
    colorReduction,
    debouncedColorPalette,
    ditherType,
    debouncedDitherStrength,
  ]);

  // 元の画像からピクセルアートを生成
  const processOriginalImage = () => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    const cv = window.cv;

    if (!smoothImageSrc) return;

    const imgElement = document.createElement("img");
    imgElement.src = smoothImageSrc;

    imgElement.onload = async () => {
      const src = cv.imread(imgElement);
      let width = src.cols;
      let height = src.rows;

      let newWidth, newHeight;
      if (width > height) {
        newWidth = pixelLength;
        newHeight = Math.round((height / width) * pixelLength);
      } else {
        newHeight = pixelLength;
        newWidth = Math.round((width / height) * pixelLength);
      }

      const dst = new cv.Mat();
      const size = new cv.Size(newWidth, newHeight);
      cv.resize(src, dst, size, 0, 0, cv.INTER_NEAREST);

      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;
      canvasRef.current = canvas;
      const ctx = canvas.getContext("2d");

      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      cv.imshow(canvas, dst);

      // 元のピクセルデータを保存
      if (ctx) {
        originalPixelsRef.current = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // 色置換処理を適用
        if (colorReduction && colorPalette.length > 0) {
          applyColorPalette();
        } else {
          canvas.toBlob((blob) => {
            if (previousUrlRef.current) {
              URL.revokeObjectURL(previousUrlRef.current);
            }
            if (blob) {
              const url = URL.createObjectURL(blob);
              previousUrlRef.current = url;
              setDotsImageSrc(url);
            }
          }, "image/png");
        }
      }

      src.delete();
      dst.delete();
    };
  };

  // RGBの距離を計算
  const colorDistance = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
  ) => {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  };

  // パレットの中から一番近い色を返す
  const findNearestColor = (
    r: number,
    g: number,
    b: number,
    palette: [number, number, number][]
  ) => {
    let minDist = Infinity;
    let nearestColor: [number, number, number] = palette[0];

    for (const [pr, pg, pb] of palette) {
      const dist = colorDistance(r, g, b, pr, pg, pb);
      if (dist < minDist) {
        minDist = dist;
        nearestColor = [pr, pg, pb];
      }
    }

    return nearestColor;
  };

  // 自前のフロイド-スタインバーグ・ディザリング実装（強度パラメータ付き）
  const applyFloydSteinbergDithering = (
    imageData: ImageData,
    paletteRGB: [number, number, number][],
    strength: number = 1.0
  ) => {
    const { width, height } = imageData;
    const data = imageData.data;

    // バッファを作成して元の画像データをコピー
    const buffer = new Float32Array(width * height * 3);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const j = (y * width + x) * 3;

        buffer[j] = data[i]; // R
        buffer[j + 1] = data[i + 1]; // G
        buffer[j + 2] = data[i + 2]; // B
      }
    }

    // ディザリング処理
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const j = (y * width + x) * 3;
        const i = (y * width + x) * 4;

        if (data[i + 3] < 10) continue; // 透明部分はスキップ

        // 現在のピクセルの色
        const oldR = Math.max(0, Math.min(255, buffer[j]));
        const oldG = Math.max(0, Math.min(255, buffer[j + 1]));
        const oldB = Math.max(0, Math.min(255, buffer[j + 2]));

        // 最も近い色を見つける
        const [newR, newG, newB] = findNearestColor(
          oldR,
          oldG,
          oldB,
          paletteRGB
        );

        // イメージデータに新しい色を設定
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;

        // 量子化誤差を計算し、強度を適用
        const errR = (oldR - newR) * strength;
        const errG = (oldG - newG) * strength;
        const errB = (oldB - newB) * strength;

        // 誤差を拡散 (Floyd-Steinberg)
        if (x + 1 < width) {
          const idx = j + 3;
          buffer[idx] += (errR * 7) / 16;
          buffer[idx + 1] += (errG * 7) / 16;
          buffer[idx + 2] += (errB * 7) / 16;
        }

        if (y + 1 < height) {
          if (x > 0) {
            const idx = j + width * 3 - 3;
            buffer[idx] += (errR * 3) / 16;
            buffer[idx + 1] += (errG * 3) / 16;
            buffer[idx + 2] += (errB * 3) / 16;
          }

          const idx = j + width * 3;
          buffer[idx] += (errR * 5) / 16;
          buffer[idx + 1] += (errG * 5) / 16;
          buffer[idx + 2] += (errB * 5) / 16;

          if (x + 1 < width) {
            const idx = j + width * 3 + 3;
            buffer[idx] += (errR * 1) / 16;
            buffer[idx + 1] += (errG * 1) / 16;
            buffer[idx + 2] += (errB * 1) / 16;
          }
        }
      }
    }

    return imageData;
  };

  // 自前のアトキンソン・ディザリング実装（強度パラメータ付き）
  const applyAtkinsonDithering = (
    imageData: ImageData,
    paletteRGB: [number, number, number][],
    strength: number = 1.0
  ) => {
    const { width, height } = imageData;
    const data = imageData.data;

    // バッファを作成して元の画像データをコピー
    const buffer = new Float32Array(width * height * 3);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const j = (y * width + x) * 3;

        buffer[j] = data[i]; // R
        buffer[j + 1] = data[i + 1]; // G
        buffer[j + 2] = data[i + 2]; // B
      }
    }

    // アトキンソン・ディザリング処理
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const j = (y * width + x) * 3;
        const i = (y * width + x) * 4;

        if (data[i + 3] < 10) continue; // 透明部分はスキップ

        // 現在のピクセルの色
        const oldR = Math.max(0, Math.min(255, buffer[j]));
        const oldG = Math.max(0, Math.min(255, buffer[j + 1]));
        const oldB = Math.max(0, Math.min(255, buffer[j + 2]));

        // 最も近い色を見つける
        const [newR, newG, newB] = findNearestColor(
          oldR,
          oldG,
          oldB,
          paletteRGB
        );

        // イメージデータに新しい色を設定
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;

        // 量子化誤差を計算（アトキンソン・ディザリングでは誤差の1/8を分散）
        // 強度パラメータを適用
        const errR = ((oldR - newR) / 8) * strength;
        const errG = ((oldG - newG) / 8) * strength;
        const errB = ((oldB - newB) / 8) * strength;

        // 誤差拡散パターン（アトキンソン）
        const diffuseError = (x: number, y: number) => {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = (y * width + x) * 3;
            buffer[idx] += errR;
            buffer[idx + 1] += errG;
            buffer[idx + 2] += errB;
          }
        };

        // 隣接ピクセルに誤差を拡散
        diffuseError(x + 1, y);
        diffuseError(x + 2, y);
        diffuseError(x - 1, y + 1);
        diffuseError(x, y + 1);
        diffuseError(x + 1, y + 1);
        diffuseError(x, y + 2);
      }
    }

    return imageData;
  };

  // 8x8の行列を使った組織的ディザリング
  const applyOrderedDithering = (
    imageData: ImageData,
    paletteRGB: [number, number, number][],
    strength: number = 1.0,
    // ベイヤー行列 8x8
    bayerMatrix: number[][]
  ) => {
    const { width, height } = imageData;
    const data = imageData.data;

    // 組織的ディザリング処理
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        if (data[i + 3] < 10) continue; // 透明部分はスキップ

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // ベイヤー行列の値を取得（0-63を-32から+32の範囲にマッピング）
        // 強度パラメータを適用
        const threshold = (bayerMatrix[y % 8][x % 8] - 32) * 2 * strength;

        // しきい値を適用した色調整
        const adjustedR = Math.max(0, Math.min(255, r + threshold));
        const adjustedG = Math.max(0, Math.min(255, g + threshold));
        const adjustedB = Math.max(0, Math.min(255, b + threshold));

        // 最も近い色を見つける
        const [newR, newG, newB] = findNearestColor(
          adjustedR,
          adjustedG,
          adjustedB,
          paletteRGB
        );

        // 新しい色をセット
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
      }
    }

    return imageData;
  };

  // シンプルな色変換（ディザリングなし）
  const applySimpleColorReduction = (
    imageData: ImageData,
    paletteRGB: [number, number, number][]
  ) => {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 10) continue;

      const [nr, ng, nb] = findNearestColor(r, g, b, paletteRGB);
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }

    return imageData;
  };

  // 色置換処理のみを適用
  const applyColorPalette = () => {
    if (
      !canvasRef.current ||
      !originalPixelsRef.current ||
      colorPalette.length === 0
    )
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 元のピクセルデータをコピー
    const imageData = new ImageData(
      new Uint8ClampedArray(originalPixelsRef.current.data),
      originalPixelsRef.current.width,
      originalPixelsRef.current.height
    );

    const paletteRGB = colorPalette.map(parseRgb);

    // 各ディザリングアルゴリズムに応じた処理
    if (colorReduction) {
      try {
        let processedImageData;

        // 強度パラメータを各ディザリング関数に渡す
        switch (ditherType) {
          case "bayerMatrixBasic":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixBasic
            );
            break;

          case "bayerMatrixNoise":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixNoise
            );
            break;

          case "bayerMatrixPlaid":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixPlaid
            );
            break;

          case "bayerMatrixCheckered":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixCheckered
            );
            break;

          case "bayerMatrixCRT_Vertical":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixCRT_Vertical
            );
            break;

          case "bayerMatrixCRT_Horizontal":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixCRT_Horizontal
            );
            break;

          case "bayerMatrixDiagonal":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixDiagonal
            );
            break;

          case "bayerMatrixMeshLight":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixMeshLight
            );
            break;

          case "bayerMatrixMeshDark":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixMeshDark
            );
            break;

          case "bayerMatrixPolkadotLight":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixPolkadotLight
            );
            break;

          case "bayerMatrixPolkadotDark":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixPolkadotDark
            );
            break;

          case "bayerMatrixLeadGlass":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength,
              bayerMatrixLeadGlass
            );
            break;

          default:
            processedImageData = applySimpleColorReduction(
              imageData,
              paletteRGB
            );
            break;
        }

        ctx.putImageData(processedImageData, 0, 0);
      } catch (error) {
        console.error("Dithering failed:", error);
        // エラー時は通常の色変換を適用
        applySimpleColorReduction(imageData, paletteRGB);
        ctx.putImageData(imageData, 0, 0);
      }
    } else {
      ctx.putImageData(imageData, 0, 0);
    }

    canvas.toBlob((blob) => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
      if (blob) {
        const url = URL.createObjectURL(blob);
        previousUrlRef.current = url;
        setDotsImageSrc(url);
      }
    }, "image/png");
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    imageRendering: "pixelated",
    pointerEvents: "none",
  };

  return (
    <>
      {dotsImageSrc && (
        <img
          src={dotsImageSrc}
          alt="Pixel Art"
          style={imgStyle}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </>
  );
};

export default PixelArtProcessor;

const bayerMatrixBasic = [
  // ベーシック
  [0, 48, 12, 60, 3, 51, 15, 63],
  [32, 16, 44, 28, 35, 19, 47, 31],
  [8, 56, 4, 52, 11, 59, 7, 55],
  [40, 24, 36, 20, 43, 27, 39, 23],
  [2, 50, 14, 62, 1, 49, 13, 61],
  [34, 18, 46, 30, 33, 17, 45, 29],
  [10, 58, 6, 54, 9, 57, 5, 53],
  [42, 26, 38, 22, 41, 25, 37, 21],
];

const bayerMatrixNoise = [
  // ノイズ
  [35, 5, 48, 14, 22, 59, 2, 40],
  [11, 26, 33, 63, 7, 54, 19, 0],
  [44, 16, 28, 9, 58, 13, 36, 23],
  [30, 46, 1, 32, 20, 41, 52, 10],
  [27, 6, 57, 15, 47, 21, 31, 50],
  [3, 61, 12, 38, 18, 43, 60, 24],
  [56, 39, 4, 25, 29, 55, 49, 8],
  [42, 37, 62, 34, 17, 53, 6, 51],
];

const bayerMatrixPlaid = [
  // チェック柄
  [0, 32, 0, 32, 0, 32, 0, 32],
  [32, 63, 32, 63, 32, 63, 32, 63],
  [0, 32, 0, 32, 0, 32, 0, 32],
  [32, 63, 32, 63, 32, 63, 32, 63],
  [0, 32, 0, 32, 0, 32, 0, 32],
  [32, 63, 32, 63, 32, 63, 32, 63],
  [0, 32, 0, 32, 0, 32, 0, 32],
  [32, 63, 32, 63, 32, 63, 32, 63],
];
const bayerMatrixCheckered = [
  // 市松模様
  [0, 63, 0, 63, 0, 63, 0, 63],
  [63, 0, 63, 0, 63, 0, 63, 0],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [63, 0, 63, 0, 63, 0, 63, 0],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [63, 0, 63, 0, 63, 0, 63, 0],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [63, 0, 63, 0, 63, 0, 63, 0],
];

const bayerMatrixCRT_Vertical = [
  // しましま（縦）
  [0, 63, 0, 63, 0, 63, 0, 63],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [0, 63, 0, 63, 0, 63, 0, 63],
  [0, 63, 0, 63, 0, 63, 0, 63],
];
const bayerMatrixCRT_Horizontal = [
  // しましま（横）
  [0, 0, 0, 0, 0, 0, 0, 0],
  [63, 63, 63, 63, 63, 63, 63, 63],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [63, 63, 63, 63, 63, 63, 63, 63],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [63, 63, 63, 63, 63, 63, 63, 63],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [63, 63, 63, 63, 63, 63, 63, 63],
];

const bayerMatrixDiagonal = [
  // 斜めストライプ
  [0, 32, 63, 32, 0, 32, 63, 32],
  [32, 0, 32, 63, 32, 0, 32, 63],
  [63, 32, 0, 32, 63, 32, 0, 32],
  [32, 63, 32, 0, 32, 63, 32, 0],
  [0, 32, 63, 32, 0, 32, 63, 32],
  [32, 0, 32, 63, 32, 0, 32, 63],
  [63, 32, 0, 32, 63, 32, 0, 32],
  [32, 63, 32, 0, 32, 63, 32, 0],
];

const bayerMatrixMeshLight = [
  // メッシュ（明）
  [0, 64, 64, 64, 64, 64, 64, 0],
  [64, 0, 64, 64, 64, 64, 0, 64],
  [64, 64, 0, 64, 64, 0, 64, 64],
  [64, 64, 64, 0, 0, 64, 64, 64],
  [64, 64, 64, 0, 0, 64, 64, 64],
  [64, 64, 0, 64, 64, 0, 64, 64],
  [64, 0, 64, 64, 64, 64, 0, 64],
  [0, 64, 64, 64, 64, 64, 64, 0],
];

const bayerMatrixMeshDark = [
  // メッシュ（暗）
  [64, 0, 0, 0, 0, 0, 0, 64],
  [0, 64, 0, 0, 0, 0, 64, 0],
  [0, 0, 64, 0, 0, 64, 0, 0],
  [0, 0, 0, 64, 64, 0, 0, 0],
  [0, 0, 0, 64, 64, 0, 0, 0],
  [0, 0, 64, 0, 0, 64, 0, 0],
  [0, 64, 0, 0, 0, 0, 64, 0],
  [64, 0, 0, 0, 0, 0, 0, 64],
];

const bayerMatrixPolkadotLight = [
  // 水玉（明）
  [63, 63, 0, 0, 0, 0, 63, 63],
  [63, 0, 0, 0, 0, 0, 0, 63],
  [0, 0, 0, 63, 63, 0, 0, 0],
  [0, 0, 63, 63, 63, 63, 0, 0],
  [0, 0, 63, 63, 63, 63, 0, 0],
  [0, 0, 0, 63, 63, 0, 0, 0],
  [63, 0, 0, 0, 0, 0, 0, 63],
  [63, 63, 0, 0, 0, 0, 63, 63],
];

const bayerMatrixPolkadotDark = [
  // 水玉（暗）
  [63, 63, 0, 0, 0, 0, 63, 63],
  [63, 0, 0, 0, 0, 0, 0, 63],
  [0, 0, 0, 63, 63, 0, 0, 0],
  [0, 0, 63, 63, 63, 63, 0, 0],
  [0, 0, 63, 63, 63, 63, 0, 0],
  [0, 0, 0, 63, 63, 0, 0, 0],
  [63, 0, 0, 0, 0, 0, 0, 63],
  [63, 63, 0, 0, 0, 0, 63, 63],
];

const bayerMatrixLeadGlass = [
  // ガラス
  [0, 9, 18, 27, 36, 45, 54, 63],
  [9, 18, 27, 36, 45, 54, 63, 63],
  [18, 27, 36, 45, 54, 63, 63, 63],
  [27, 36, 45, 54, 63, 63, 63, 63],
  [36, 45, 54, 63, 63, 63, 63, 63],
  [45, 54, 63, 63, 63, 63, 63, 63],
  [54, 63, 63, 63, 63, 63, 63, 63],
  [63, 63, 63, 63, 63, 63, 63, 63],
];
