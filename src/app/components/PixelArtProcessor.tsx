"use client";
import React, { useEffect, useRef, useState } from "react";
import { useThrottle } from "./useThrottle";

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
  toneCurveLUT?: number[] | null;
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
  ditherStrength,
  toneCurveLUT,
}) => {
  // 元の画像ピクセルデータを保持するためのRef
  const originalPixelsRef = useRef<ImageData | null>(null);
  // 前回のパレットを保持するためのRef
  const prevPaletteRef = useRef<string[]>([]);
  // キャンバスを参照するためのRef
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Dithering Workerを参照するためのRef
  const ditherWorkerRef = useRef<Worker | null>(null);
  // デバウンス処理変数（カラーパレット）
  const [initThrottleColorPalette, setInitThrottleColorPalette] = useState(10);
  const throttleColorPalette = useThrottle(
    colorPalette,
    initThrottleColorPalette
  );
  // デバウンス処理変数（ディザリング強度）
  const [initThrottleDitherStrength, setInitThrottleDitherStrength] =
    useState(5);
  const throttleDitherStrength = useThrottle(
    ditherStrength,
    initThrottleDitherStrength
  );
  // デバウンス処理変数（トーンカーブLUT）
  const throttleToneCurveLUT = useThrottle(toneCurveLUT, 50);
  // デバウンス処理変数（ドット長）
  const [initThrottlePixelLength, setInitThrottlePixelLength] = useState(0);
  const throttlepixelLength = useThrottle(pixelLength, initThrottlePixelLength);

  // 前のURLを記録
  const previousUrlRef = useRef<string | null>(null);

  // アンマウント時にWorkerを終了
  useEffect(() => {
    return () => { ditherWorkerRef.current?.terminate(); };
  }, []);

  useEffect(() => {
    // 配色数とドット長でデバウンス値をセット
    if (colorLevels <= 5 || pixelLength <= 512) {
      setInitThrottleColorPalette(0);
      setInitThrottleDitherStrength(0);
      setInitThrottlePixelLength(0);
    } else if (7 <= colorLevels && pixelLength <= 768) {
      setInitThrottleColorPalette(100);
      setInitThrottleDitherStrength(100);
      setInitThrottlePixelLength(100);
    } else {
      setInitThrottleColorPalette(30);
      setInitThrottleDitherStrength(30);
      setInitThrottlePixelLength(50);
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
    throttlepixelLength,
    colorReduction,
    throttleColorPalette,
    ditherType,
    throttleDitherStrength,
    throttleToneCurveLUT,
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
      if (newHeight % 2 !== 0) newHeight += 1; // 奇数なら+1
      if (newWidth % 2 !== 0) newWidth += 1; // 奇数なら+1

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

  // 色置換処理のみを適用（Workerで非同期実行）
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

    const commitToUrl = () => {
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

    if (!colorReduction) {
      ctx.putImageData(imageData, 0, 0);
      commitToUrl();
      return;
    }

    const paletteRGB = colorPalette.map(parseRgb);
    const bayerMatrix = bayerMatrices[ditherType] ?? null;

    // 実行中のWorkerをキャンセルして新しいWorkerを起動
    ditherWorkerRef.current?.terminate();

    const worker = new Worker(new URL('./workers/ditherWorker.ts', import.meta.url));
    ditherWorkerRef.current = worker;

    // バッファをWorkerに転送（ゼロコピー）
    const buffer = imageData.data.buffer;

    worker.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer }>) => {
      if (ditherWorkerRef.current === worker) ditherWorkerRef.current = null;
      worker.terminate();
      const processed = new ImageData(
        new Uint8ClampedArray(e.data.buffer),
        canvas.width,
        canvas.height
      );
      ctx.putImageData(processed, 0, 0);
      commitToUrl();
    };

    worker.onerror = () => {
      if (ditherWorkerRef.current === worker) ditherWorkerRef.current = null;
      worker.terminate();
      // フォールバック: 元のデータをそのまま表示
      const fallback = new ImageData(
        new Uint8ClampedArray(originalPixelsRef.current!.data),
        originalPixelsRef.current!.width,
        originalPixelsRef.current!.height
      );
      ctx.putImageData(fallback, 0, 0);
      commitToUrl();
    };

    worker.postMessage(
      {
        buffer,
        width: imageData.width,
        height: imageData.height,
        paletteRGB,
        ditherType,
        ditherStrength: ditherStrength ?? 1.0,
        bayerMatrix,
        toneCurveLUT: toneCurveLUT ?? null,
      },
      [buffer]
    );
  };

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    imageRendering: "pixelated",
    pointerEvents: "none",
    zIndex: "0",
  };

  return (
    <>
      {dotsImageSrc && (
        <img src={dotsImageSrc} alt="Pixel Art" style={imgStyle} />
      )}
    </>
  );
};

export default PixelArtProcessor;

const bayerMatrices: Record<string, number[][]> = {
  bayerMatrixBasic: [
    // ベーシック
    [0, 48, 12, 60, 3, 51, 15, 63],
    [32, 16, 44, 28, 35, 19, 47, 31],
    [8, 56, 4, 52, 11, 59, 7, 55],
    [40, 24, 36, 20, 43, 27, 39, 23],
    [2, 50, 14, 62, 1, 49, 13, 61],
    [34, 18, 46, 30, 33, 17, 45, 29],
    [10, 58, 6, 54, 9, 57, 5, 53],
    [42, 26, 38, 22, 41, 25, 37, 21],
  ],
  bayerMatrixNoise: [
    // ノイズ
    [35, 5, 48, 14, 22, 59, 2, 40],
    [11, 26, 33, 63, 7, 54, 19, 0],
    [44, 16, 28, 9, 58, 13, 36, 23],
    [30, 46, 1, 32, 20, 41, 52, 10],
    [27, 6, 57, 15, 47, 21, 31, 50],
    [3, 61, 12, 38, 18, 43, 60, 24],
    [56, 39, 4, 25, 29, 55, 49, 8],
    [42, 37, 62, 34, 17, 53, 6, 51],
  ],
  bayerMatrixPlaid: [
    // チェック柄
    [0, 16, 0, 16, 0, 16, 0, 16],
    [16, 32, 16, 32, 16, 32, 16, 32],
    [0, 16, 0, 16, 0, 16, 0, 16],
    [16, 48, 16, 48, 16, 48, 16, 48],
    [0, 16, 0, 16, 0, 16, 0, 16],
    [16, 32, 16, 32, 16, 32, 16, 32],
    [0, 16, 0, 16, 0, 16, 0, 16],
    [16, 48, 16, 48, 16, 48, 16, 48],
  ],
  bayerMatrixCheckered: [
    // 市松模様
    [0, 32, 16, 48, 0, 32, 16, 48],
    [48, 16, 32, 0, 48, 16, 32, 0],
    [16, 48, 0, 32, 16, 48, 0, 32],
    [32, 0, 48, 16, 32, 0, 48, 16],
    [0, 32, 16, 48, 0, 32, 16, 48],
    [48, 16, 32, 0, 48, 16, 32, 0],
    [16, 48, 0, 32, 16, 48, 0, 32],
    [32, 0, 48, 16, 32, 0, 48, 16],
  ],
  bayerMatrixCRT_Vertical: [
    // しましま（縦）
    [0, 63, 0, 63, 0, 63, 0, 63],
    [0, 63, 0, 63, 0, 63, 0, 63],
    [0, 63, 0, 63, 0, 63, 0, 63],
    [0, 63, 0, 63, 0, 63, 0, 63],
    [0, 63, 0, 63, 0, 63, 0, 63],
    [0, 63, 0, 63, 0, 63, 0, 63],
    [0, 63, 0, 63, 0, 63, 0, 63],
    [0, 63, 0, 63, 0, 63, 0, 63],
  ],
  bayerMatrixCRT_Horizontal: [
    // しましま（横）
    [0, 0, 0, 0, 0, 0, 0, 0],
    [63, 63, 63, 63, 63, 63, 63, 63],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [63, 63, 63, 63, 63, 63, 63, 63],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [63, 63, 63, 63, 63, 63, 63, 63],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [63, 63, 63, 63, 63, 63, 63, 63],
  ],
  bayerMatrixDiagonal1: [
    // 逆斜めストライプ↗
    [32, 63, 32, 0, 32, 63, 32, 0],
    [63, 32, 0, 32, 63, 32, 0, 32],
    [32, 0, 32, 63, 32, 0, 32, 63],
    [0, 32, 63, 32, 0, 32, 63, 32],
    [32, 63, 32, 0, 32, 63, 32, 0],
    [63, 32, 0, 32, 63, 32, 0, 32],
    [32, 0, 32, 63, 32, 0, 32, 63],
    [0, 32, 63, 32, 0, 32, 63, 32],
  ],
  bayerMatrixDiagonal2: [
    // 斜めストライプ↘
    [0, 32, 63, 32, 0, 32, 63, 32],
    [32, 0, 32, 63, 32, 0, 32, 63],
    [63, 32, 0, 32, 63, 32, 0, 32],
    [32, 63, 32, 0, 32, 63, 32, 0],
    [0, 32, 63, 32, 0, 32, 63, 32],
    [32, 0, 32, 63, 32, 0, 32, 63],
    [63, 32, 0, 32, 63, 32, 0, 32],
    [32, 63, 32, 0, 32, 63, 32, 0],
  ],
  bayerMatrixMeshLight: [
    // メッシュ（明）
    [0, 32, 48, 56, 56, 48, 32, 0],
    [32, 0, 40, 48, 48, 40, 0, 32],
    [48, 40, 0, 32, 32, 0, 40, 48],
    [56, 48, 32, 0, 0, 32, 48, 56],
    [56, 48, 32, 0, 0, 32, 48, 56],
    [48, 40, 0, 32, 32, 0, 40, 48],
    [32, 0, 40, 48, 48, 40, 0, 32],
    [0, 32, 48, 56, 56, 48, 32, 0],
  ],
  bayerMatrixMeshDark: [
    // メッシュ（暗）
    [63, 32, 16, 8, 8, 16, 32, 63],
    [32, 63, 24, 16, 16, 24, 63, 32],
    [16, 24, 63, 32, 32, 63, 24, 16],
    [8, 16, 32, 63, 63, 32, 16, 8],
    [8, 16, 32, 63, 63, 32, 16, 8],
    [16, 24, 63, 32, 32, 63, 24, 16],
    [32, 63, 24, 16, 16, 24, 63, 32],
    [63, 32, 16, 8, 8, 16, 32, 63],
  ],
  bayerMatrixPolkadotLight: [
    // ハーフトーン（明）
    [0, 0, 63, 63, 63, 63, 0, 0],
    [0, 63, 63, 63, 63, 63, 63, 0],
    [63, 63, 63, 0, 0, 63, 63, 63],
    [63, 63, 0, 0, 0, 0, 63, 63],
    [63, 63, 0, 0, 0, 0, 63, 63],
    [63, 63, 63, 0, 0, 63, 63, 63],
    [0, 63, 63, 63, 63, 63, 63, 0],
    [0, 0, 63, 63, 63, 63, 0, 0],
  ],
  bayerMatrixPolkadotDark: [
    // ハーフトーン（暗）
    [63, 63, 0, 0, 0, 0, 63, 63],
    [63, 0, 0, 0, 0, 0, 0, 63],
    [0, 0, 0, 63, 63, 0, 0, 0],
    [0, 0, 63, 63, 63, 63, 0, 0],
    [0, 0, 63, 63, 63, 63, 0, 0],
    [0, 0, 0, 63, 63, 0, 0, 0],
    [63, 0, 0, 0, 0, 0, 0, 63],
    [63, 63, 0, 0, 0, 0, 63, 63],
  ],
  bayerMatrixLeadGlass: [
    // ガラス
    [0, 9, 18, 27, 36, 45, 54, 63],
    [9, 18, 27, 36, 45, 54, 63, 63],
    [18, 27, 36, 45, 54, 63, 63, 63],
    [27, 36, 45, 54, 63, 63, 63, 63],
    [36, 45, 54, 63, 63, 63, 63, 63],
    [45, 54, 63, 63, 63, 63, 63, 63],
    [54, 63, 63, 63, 63, 63, 63, 63],
    [63, 63, 63, 63, 63, 63, 63, 63],
  ],
  bayerMatrixTile: [
    // タイル
    [63, 63, 63, 63, 63, 63, 63, 0],
    [63, 40, 40, 32, 32, 32, 32, 0],
    [63, 40, 32, 32, 32, 32, 32, 0],
    [63, 32, 32, 32, 32, 32, 32, 0],
    [63, 32, 32, 32, 32, 32, 32, 0],
    [63, 32, 32, 32, 32, 32, 32, 0],
    [63, 32, 32, 32, 32, 32, 32, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
};
