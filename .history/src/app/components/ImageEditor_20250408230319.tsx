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

  //輪郭線強調（新規追加）
  edgeEnhancement: boolean;
  whiteErodeSize: number; // 白画素縮小サイズ
  blackDilateSize: number; // 黒画素拡大サイズ
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
  whiteErodeSize,
  blackDilateSize,
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

      // 処理ステップ4: 白画素縮小・黒画素拡大による輪郭線強調処理（新規追加）
      if (edgeEnhancement) {
        let enhanced = erodeDilateProcessor(
          cv,
          dst,
          whiteErodeSize,
          blackDilateSize
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
    whiteErodeSize,
    blackDilateSize,
  ]);

  return null;
};

export default ImageEditor;
