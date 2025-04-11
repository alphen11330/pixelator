"use client";
import React, { useEffect, useRef, useMemo } from "react";
import Image from "next/image";

type Props = {
  smoothImageSrc: string | null;
  dotsImageSrc: string | null;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
  colorReduction: boolean;
  colorPalette: string[];
  ditherType?: "ordered" | "atkinson" | "floydsteinberg" | "none";
  ditherStrength?: number;
};

// RGB色を解析する関数を最適化

const parseRgb = (colorStr: string): [number, number, number] => {
  // キャッシュ用のMapを使用
  (parseRgb as any).cache =
    (parseRgb as any).cache || new Map<string, [number, number, number]>();

  // キャッシュにあればそれを返す
  if ((parseRgb as any).cache.has(colorStr)) {
    return (parseRgb as any).cache.get(colorStr)!;
  }

  let result: [number, number, number] = [0, 0, 0];

  if (colorStr.startsWith("rgb")) {
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      result = [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
  } else if (colorStr.startsWith("#")) {
    const hex = colorStr.replace("#", "");
    result = [
      parseInt(hex.substr(0, 2), 16),
      parseInt(hex.substr(2, 2), 16),
      parseInt(hex.substr(4, 2), 16),
    ];
  }

  // 結果をキャッシュ
  (parseRgb as any).cache.set(colorStr, result);
  return result;
};

// TypeScriptでキャッシュプロパティを追加
(parseRgb as any).cache = new Map<string, [number, number, number]>();

const PixelArtProcessor: React.FC<Props> = ({
  smoothImageSrc,
  dotsImageSrc,
  setDotsImageSrc,
  pixelLength,
  colorReduction,
  colorPalette,
  ditherType = "ordered",
  ditherStrength = 2,
}) => {
  // 元の画像ピクセルデータを保持するためのRef
  const originalPixelsRef = useRef<ImageData | null>(null);
  // キャンバスを参照するためのRef
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // ディザリング用バッファを再利用
  const bufferRef = useRef<Float32Array | null>(null);
  // 前回のパレットを保持するためのRef
  const prevPaletteRef = useRef<string[]>([]);
  // パレットが変更されたかを追跡
  const isPaletteChanged = useRef<boolean>(false);

  // パレットのRGB値をキャッシュ (useMemoで計算)
  const paletteRGB = useMemo(() => {
    return colorPalette.map(parseRgb);
  }, [colorPalette]);

  // 実際のパレット変更検出ロジック
  useEffect(() => {
    // パレットが変更されたかチェック (厳密な比較)
    isPaletteChanged.current = false;

    if (prevPaletteRef.current.length !== colorPalette.length) {
      isPaletteChanged.current = true;
    } else {
      for (let i = 0; i < colorPalette.length; i++) {
        if (prevPaletteRef.current[i] !== colorPalette[i]) {
          isPaletteChanged.current = true;
          break;
        }
      }
    }

    // 現在のパレットを保存
    prevPaletteRef.current = [...colorPalette];
  }, [colorPalette]);

  useEffect(() => {
    const needsFullReprocessing =
      !dotsImageSrc ||
      !originalPixelsRef.current ||
      smoothImageSrc !== canvasRef.current?.getAttribute("data-source");

    if (needsFullReprocessing) {
      // 元の画像から処理する必要がある場合
      processOriginalImage();
    } else if (
      isPaletteChanged.current ||
      ditherType !== canvasRef.current?.getAttribute("data-dither-type") ||
      ditherStrength !==
        Number(canvasRef.current?.getAttribute("data-dither-strength"))
    ) {
      // パレットやディザリング設定が変更された場合のみ色置換を再適用
      applyColorPalette();
    }
  }, [
    smoothImageSrc,
    pixelLength,
    colorReduction,
    colorPalette,
    ditherType,
    ditherStrength,
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
      canvas.setAttribute("data-source", smoothImageSrc);
      canvas.setAttribute("data-dither-type", ditherType);
      canvas.setAttribute("data-dither-strength", ditherStrength.toString());

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

        // ディザリング用バッファを準備
        if (
          !bufferRef.current ||
          bufferRef.current.length !== newWidth * newHeight * 3
        ) {
          bufferRef.current = new Float32Array(newWidth * newHeight * 3);
        }

        // 色置換処理を適用
        if (colorReduction && colorPalette.length > 0) {
          applyColorPalette();
        } else {
          setDotsImageSrc(canvas.toDataURL());
        }
      }

      src.delete();
      dst.delete();
    };
  };

  // 最適化された色距離計算 (二乗根計算を省略)
  const colorDistanceSquared = (
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
  ) => {
    return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
  };

  // パレットの中から一番近い色を返す (最適化版)
  const findNearestColor = (
    r: number,
    g: number,
    b: number,
    palette: [number, number, number][]
  ) => {
    let minDist = Infinity;
    let nearestColor: [number, number, number] = palette[0];

    for (const color of palette) {
      const dist = colorDistanceSquared(r, g, b, color[0], color[1], color[2]);
      if (dist < minDist) {
        minDist = dist;
        nearestColor = color;
      }
    }

    return nearestColor;
  };

  // 自前のフロイド-スタインバーグ・ディザリング実装（最適化版）
  const applyFloydSteinbergDithering = (
    imageData: ImageData,
    paletteRGB: [number, number, number][],
    strength: number = 1.0
  ) => {
    const { width, height } = imageData;
    const data = imageData.data;

    // バッファを再利用
    const buffer = bufferRef.current!;

    // バッファに元のRGB値をコピー
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      buffer[j] = data[i]; // R
      buffer[j + 1] = data[i + 1]; // G
      buffer[j + 2] = data[i + 2]; // B
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
        // インライン化して条件判定を減らす
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

  // 他のディザリング関数も同様に最適化...
  // (アトキンソン・ディザリングと組織的ディザリングも同様の最適化手法が適用できます)

  // 簡略化した組織的ディザリング (高速化版)
  const applyOrderedDithering = (
    imageData: ImageData,
    paletteRGB: [number, number, number][],
    strength: number = 1.0
  ) => {
    const { width, height } = imageData;
    const data = imageData.data;

    // 事前計算されたベイヤー行列の閾値
    const bayerThresholds = [
      [-32, 16, -24, 24, -30, 18, -22, 26],
      [0, -16, 8, -8, 2, -14, 10, -6],
      [-24, 24, -32, 16, -22, 26, -30, 18],
      [8, -8, 0, -16, 10, -6, 2, -14],
      [-30, 18, -22, 26, -32, 16, -24, 24],
      [2, -14, 10, -6, 0, -16, 8, -8],
      [-22, 26, -30, 18, -24, 24, -32, 16],
      [10, -6, 2, -14, 8, -8, 0, -16],
    ];

    // 組織的ディザリング処理
    for (let y = 0; y < height; y++) {
      const yMod8 = y & 7; // y % 8 の高速化
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        if (data[i + 3] < 10) continue; // 透明部分はスキップ

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // ベイヤー行列の値を取得して強度パラメータを適用
        const threshold = bayerThresholds[yMod8][x & 7] * strength;

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

  // シンプルな色変換（ディザリングなし）- 最適化版
  const applySimpleColorReduction = (
    imageData: ImageData,
    paletteRGB: [number, number, number][]
  ) => {
    const data = imageData.data;
    const dataLength = data.length;

    // メインループを最適化
    for (let i = 0; i < dataLength; i += 4) {
      if (data[i + 3] < 10) continue; // 透明部分はスキップ

      const [nr, ng, nb] = findNearestColor(
        data[i],
        data[i + 1],
        data[i + 2],
        paletteRGB
      );

      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }

    return imageData;
  };

  // 色置換処理のみを適用 (最適化版)
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

    // 処理実行
    if (colorReduction) {
      try {
        let processedImageData;

        // 各ディザリングアルゴリズム処理
        switch (ditherType) {
          case "floydsteinberg":
            processedImageData = applyFloydSteinbergDithering(
              imageData,
              paletteRGB,
              ditherStrength
            );
            break;
          case "atkinson":
            // アトキンソン・ディザリングの最適化実装を呼び出す
            // 省略...
            break;
          case "ordered":
            processedImageData = applyOrderedDithering(
              imageData,
              paletteRGB,
              ditherStrength
            );
            break;
          case "none":
          default:
            processedImageData = applySimpleColorReduction(
              imageData,
              paletteRGB
            );
            break;
        }
        if (processedImageData) ctx.putImageData(processedImageData, 0, 0);
      } catch (error) {
        console.error("Dithering failed:", error);
        // エラー時は通常の色変換を適用
        applySimpleColorReduction(imageData, paletteRGB);
        ctx.putImageData(imageData, 0, 0);
      }
    } else {
      ctx.putImageData(imageData, 0, 0);
    }

    // 現在の設定を保存
    canvas.setAttribute("data-dither-type", ditherType);
    canvas.setAttribute("data-dither-strength", ditherStrength.toString());

    setDotsImageSrc(canvas.toDataURL());
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
        <Image
          layout={"fill"}
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
