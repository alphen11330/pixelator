"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import colorCollectionProcessor from "./colorCollectionProcessor";
import erodeDilateProcessor from "./erodeDilateProcessors";

type Props = {
  imageSrc: string; // オリジナル画像
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>; // 加工用画像のセッター

  //色調補正
  colorCollection: boolean;
  isHue: boolean;
  hue: number;
  isLuminance: boolean;
  luminance: number;
  isSaturation: boolean;
  saturation: number;

  //コントラストと明度調整
  contrast: boolean;
  contrastLevel: number;
  brightness: boolean;
  brightnessLevel: number;

  //輪郭線強調（更新）
  edgeEnhancement: boolean;
  whiteSize: number; // 白画素処理サイズ（正:縮小、負:拡大）

  refreshColorPalette: boolean;
  setRefreshColorPalette: React.Dispatch<React.SetStateAction<boolean>>;
};

const ImageEditor: React.FC<Props> = ({
  imageSrc,
  setSmoothImageSrc,
  colorCollection,
  isHue,
  hue,
  isLuminance,
  luminance,
  isSaturation,
  saturation,
  contrast,
  contrastLevel,
  brightness,
  brightnessLevel,
  edgeEnhancement,
  whiteSize,
  refreshColorPalette,
  setRefreshColorPalette,
}) => {
  const previousUrlRef = useRef<string | null>(null); // 前のURLを記録
  useLayoutEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;
    const cv = window.cv;
    if (typeof cv.imread !== "function") {
      console.warn("cv.imread is not ready yet");
      return;
    }
    // 元の画像から処理を開始
    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;

    imgElement.onload = () => {
      // 元の画像からソースMat作成

      let src = cv.imread(imgElement);
      let dst = new cv.Mat();
      dst = src.clone();

      // 白黒画素処理による輪郭線処理（更新）
      if (edgeEnhancement) {
        const enhanced = erodeDilateProcessor(
          cv,
          dst,
          whiteSize // 変数名変更
        );
        dst.delete();
        dst = enhanced;
      }

      // 色相・コントラスト・明度調整
      if (colorCollection) {
        const processed = colorCollectionProcessor(
          cv,
          dst,
          isHue,
          hue,
          isLuminance,
          luminance,
          isSaturation,
          saturation,
          contrast,
          contrastLevel,
          brightness,
          brightnessLevel
        );
        dst.delete();
        dst = processed;
      }

      // キャンバスに描画
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      cv.imshow(canvas, dst);

      // 変換後の画像をセット
      canvas.toBlob((blob) => {
        if (previousUrlRef.current) {
          URL.revokeObjectURL(previousUrlRef.current);
        }
        if (blob) {
          const url = URL.createObjectURL(blob);
          previousUrlRef.current = url;
          setSmoothImageSrc(url);
        }
      }, "image/png");

      // メモリ解放
      src.delete();
      dst.delete();
    };
  }, [
    imageSrc,
    colorCollection,
    isHue,
    hue,
    isLuminance,
    luminance,
    isSaturation,
    saturation,
    contrast,
    contrastLevel,
    brightness,
    brightnessLevel,
    edgeEnhancement,
    whiteSize,
  ]);

  return null;
};

export default ImageEditor;
