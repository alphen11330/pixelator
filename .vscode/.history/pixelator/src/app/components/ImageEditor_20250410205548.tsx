"use client";
import React, { useEffect, useRef } from "react";
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

  //コントラストと明度調整
  contrast: boolean;
  contrastLevel: number;
  brightness: boolean;
  brightnessLevel: number;

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
  contrast,
  contrastLevel,
  brightness,
  brightnessLevel,
  edgeEnhancement,
  whiteSize,
  blackSize,
}) => {
  // 画像処理が進行中かどうかを追跡するref
  const isProcessingRef = useRef(false);
  // 最新のパラメータを保存するref
  const paramsRef = useRef({
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
    contrast,
    contrastLevel,
    brightness,
    brightnessLevel,
    edgeEnhancement,
    whiteSize,
    blackSize,
  });

  // パラメータが変更されたときに参照を更新
  useEffect(() => {
    paramsRef.current = {
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
      contrast,
      contrastLevel,
      brightness,
      brightnessLevel,
      edgeEnhancement,
      whiteSize,
      blackSize,
    };

    // 現在処理中でなければ新しい処理を開始
    if (!isProcessingRef.current) {
      processImage();
    }
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
    contrast,
    contrastLevel,
    brightness,
    brightnessLevel,
    edgeEnhancement,
    whiteSize,
    blackSize,
  ]);

  // 画像処理を行う関数
  const processImage = () => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;

    // 処理中フラグをセット
    isProcessingRef.current = true;

    // 元の画像から処理を開始
    const imgElement = new Image();
    // クロスオリジンの問題を防ぐ
    imgElement.crossOrigin = "anonymous";
    imgElement.src = imageSrc;

    imgElement.onload = () => {
      const cv = window.cv;

      // 現在の最新パラメータを取得
      const params = paramsRef.current;

      try {
        // 元の画像からソースMat作成
        let src = cv.imread(imgElement);
        let dst = new cv.Mat();

        // 処理ステップ1: グレースケール処理
        if (params.grayscale) {
          dst = grayscaleProcessor(cv, src);
          src.delete();
          src = dst.clone();
        } else {
          // グレースケールしない場合はソースをそのままコピー
          dst = src.clone();
        }

        // 処理ステップ2: 色反転処理
        if (params.invertColor) {
          const inverted = invertColorProcessor(cv, dst);
          dst.delete();
          dst = inverted;
        }

        // 処理ステップ3: 色相統一処理とコントラスト・明度調整
        if (params.colorCollection) {
          const processed = colorCollectionProcessor(
            cv,
            dst,
            params.isHue,
            params.hue,
            params.isLuminance,
            params.luminance,
            params.isSaturation,
            params.saturation,
            params.contrast,
            params.contrastLevel,
            params.brightness,
            params.brightnessLevel
          );
          dst.delete();
          dst = processed;
        }

        // 処理ステップ4: 白黒画素処理による輪郭線処理
        if (params.edgeEnhancement) {
          const enhanced = erodeDilateProcessor(
            cv,
            dst,
            params.whiteSize,
            params.blackSize
          );
          dst.delete();
          dst = enhanced;
        }

        // オフスクリーンキャンバスに描画
        const canvas = document.createElement("canvas");
        canvas.width = imgElement.width;
        canvas.height = imgElement.height;
        cv.imshow(canvas, dst);

        // 処理済み画像をセット (遅延なく直接更新)
        const newImageUrl = canvas.toDataURL();
        setSmoothImageSrc(newImageUrl);

        // メモリ解放
        src.delete();
        dst.delete();
      } catch (error) {
        console.error("画像処理中にエラーが発生しました:", error);
      } finally {
        // 現在のパラメータと処理中に使用したパラメータが異なる場合、再処理を行う
        const currentParams = paramsRef.current;
        const needsReprocessing = Object.keys(params).some(
          (key) =>
            params[key as keyof typeof params] !==
            currentParams[key as keyof typeof currentParams]
        );

        if (needsReprocessing) {
          // 次のフレームで再処理
          setTimeout(processImage, 0);
        } else {
          // 処理中フラグを解除
          isProcessingRef.current = false;
        }
      }
    };

    // エラー処理
    imgElement.onerror = () => {
      console.error("画像の読み込みに失敗しました");
      isProcessingRef.current = false;
    };
  };

  return null;
};

export default ImageEditor;
