"use client";
import React, { useEffect, useState } from "react";
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
  // 内部で処理済み画像を保持するstate
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  // 初回レンダリングでの元画像を設定
  useEffect(() => {
    if (imageSrc && !processedImage) {
      setProcessedImage(imageSrc);
      setSmoothImageSrc(imageSrc);
    }
  }, [imageSrc, processedImage, setSmoothImageSrc]);

  // 画像処理のメイン処理
  useEffect(() => {
    // OpenCV がロードされていない場合は処理しない
    if (!window.cv) {
      const checkCV = setInterval(() => {
        if (window.cv) {
          clearInterval(checkCV);
          processImageWithCV();
        }
      }, 100);
      return () => clearInterval(checkCV);
    }

    if (!imageSrc) return;

    // 画像処理を行う関数
    function processImageWithCV() {
      const startSrc = processedImage || imageSrc;
      const imgElement = new Image();
      imgElement.crossOrigin = "anonymous";
      imgElement.src = startSrc;

      imgElement.onload = () => {
        try {
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
            const inverted = invertColorProcessor(cv, dst);
            dst.delete();
            dst = inverted;
          }

          // 処理ステップ3: 色相統一処理とコントラスト・明度調整
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

          // 処理ステップ4: 白黒画素処理による輪郭線処理
          if (edgeEnhancement) {
            const enhanced = erodeDilateProcessor(
              cv,
              dst,
              whiteSize,
              blackSize
            );
            dst.delete();
            dst = enhanced;
          }

          // キャンバスに描画
          const canvas = document.createElement("canvas");
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          cv.imshow(canvas, dst);

          // 処理結果を一度内部状態に保存してから外部に通知
          const newImageUrl = canvas.toDataURL();
          setProcessedImage(newImageUrl);
          setSmoothImageSrc(newImageUrl);

          // メモリ解放
          src.delete();
          dst.delete();
        } catch (error) {
          console.error("画像処理エラー:", error);
        }
      };

      imgElement.onerror = () => {
        console.error("画像の読み込みに失敗しました");
      };
    }

    // ディボウンス処理で頻繁な処理を防止
    const debounceTimer = setTimeout(() => {
      processImageWithCV();
    }, 50); // 50msのディレイを設定

    return () => clearTimeout(debounceTimer);
  }, [
    imageSrc,
    processedImage,
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
    setSmoothImageSrc,
  ]);

  return null;
};

export default ImageEditor;
