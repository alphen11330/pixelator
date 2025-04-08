"use client";
import React, { useEffect } from "react";
import grayscaleProcessor from "./grayscaleProcessor";
import invertColorProcessor from "./invertColorProcessor";
import colorCollectionProcessor from "./colorCollectionProcessor";
import erodeDilateProcessor from "./erodeDilateProcessors";

type Props = {
  imageSrc: string; // オリジナル画像
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>; // 加工用画像のセッター

  grayscale: boolean; //グレースケール
  invertColor: boolean; //色反転

  //減色処理
  colorReduction: boolean;
  colorLevels: number;

  //色調補正
  colorCollection: boolean;
  isHue: boolean;
  hue: number;
  isLuminance: boolean;
  luminance: number;
  isSaturation: boolean;
  saturation: number;

  //輪郭線強調（更新）
  edgeEnhancement: boolean;
  whiteSize: number; // 白画素処理サイズ（正:縮小、負:拡大）
  blackSize: number; // 黒画素処理サイズ（正:拡大、負:縮小）
};

const ImageEditor: React.FC<Props> = ({
  imageSrc,
  setSmoothImageSrc,
  grayscale,
  invertColor,
  colorReduction,
  colorLevels,
  colorCollection,
  isHue,
  hue,
  isLuminance,
  luminance,
  isSaturation,
  saturation,
  edgeEnhancement,
  whiteSize,
  blackSize,
}) => {
  useEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;

    // 元の画像から処理を開始
    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;

    imgElement.onload = () => {
      const cv = window.cv;

      // 元の画像からソースMat作成
      let src = cv.imread(imgElement);
      let dst = new cv.Mat();

      // 処理ステップ1: グレースケール処理
      if (grayscale) {
        dst = grayscaleProcessor(cv, src);
        src.delete();
        src = dst.clone();
      } else {
        // グレースケールしない場合はソースをそのままコピー
        dst = src.clone();
      }

      // 処理ステップ2: 色反転処理
      if (invertColor) {
        let inverted = invertColorProcessor(cv, dst);
        dst.delete();
        dst = inverted;
      }

      // 処理ステップ3: 色相統一処理
      if (colorCollection) {
        let reduced = colorCollectionProcessor(
          cv,
          dst,
          isHue,
          hue,
          isLuminance,
          luminance,
          isSaturation,
          saturation
        );
        dst.delete();
        dst = reduced;
      }

      // 処理ステップ4: 白黒画素処理による輪郭線処理（更新）
      if (edgeEnhancement) {
        let enhanced = erodeDilateProcessor(
          cv,
          dst,
          whiteSize, // 変数名変更
          blackSize // 変数名変更
        );
        dst.delete();
        dst = enhanced;
      }

      // キャンバスに描画
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      cv.imshow(canvas, dst);

      // 変換後の画像をセット
      setSmoothImageSrc(canvas.toDataURL());

      // メモリ解放
      src.delete();
      dst.delete();
    };
  }, [
    imageSrc,
    grayscale,
    invertColor,
    colorReduction,
    colorLevels,
    colorCollection,
    isHue,
    hue,
    isLuminance,
    luminance,
    isSaturation,
    saturation,
    edgeEnhancement,
    whiteSize,
    blackSize,
  ]);

  return null;
};

export default ImageEditor;
