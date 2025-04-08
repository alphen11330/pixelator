"use client";
import React, { useEffect, useRef } from "react";
import Dither from "ditherjs";

type Props = {
  smoothImageSrc: string | null;
  dotsImageSrc: string | null;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
  colorReduction: boolean;
  colorPalette: string[];
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
}) => {
  // 元の画像ピクセルデータを保持するためのRef
  const originalPixelsRef = useRef<ImageData | null>(null);
  // 前回のパレットを保持するためのRef
  const prevPaletteRef = useRef<string[]>([]);
  // キャンバスを参照するためのRef
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
  }, [smoothImageSrc, pixelLength, colorReduction, colorPalette]);

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
          setDotsImageSrc(canvas.toDataURL());
        }
      }

      src.delete();
      dst.delete();
    };
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

    const data = imageData.data;
    const paletteRGB = colorPalette.map(parseRgb);

    // 色置換処理
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

    ctx.putImageData(imageData, 0, 0);
    setDotsImageSrc(canvas.toDataURL());
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    imageRendering: "pixelated",
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
