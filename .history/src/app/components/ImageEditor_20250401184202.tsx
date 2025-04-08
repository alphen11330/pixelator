"use client";
import React, { useEffect, useState } from "react";
import useGrayscaleProcessor from "./useGrayscaleProcessor";
import useInvertColorProcessor from "./useInvertColorProcessor";

type Props = {
  imageSrc: string;
  smoothImageSrc: string;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  grayscale: boolean;
  invertColor: boolean;
};

const ImageEditor: React.FC<Props> = ({
  imageSrc,
  smoothImageSrc,
  setSmoothImageSrc,
  grayscale,
  invertColor,
}) => {
  // 処理順序を制御するための状態
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [intermediateImage, setIntermediateImage] = useState<string | null>(
    null
  );

  // 元画像を設定（条件が変わったとき）
  useEffect(() => {
    setSmoothImageSrc(imageSrc);
    setProcessingStage(1); // グレースケール処理へ
  }, [imageSrc, grayscale, invertColor, setSmoothImageSrc]);

  // ステージ1: グレースケール処理
  const onGrayscaleProcessed = (processed: string | null) => {
    if (processed) {
      setIntermediateImage(processed);
    }
    setProcessingStage(2); // 色反転処理へ
  };

  // ステージ2: 色反転処理
  const onInvertProcessed = (processed: string | null) => {
    if (processed) {
      setSmoothImageSrc(processed);
    }
    setProcessingStage(0); // 処理完了
  };

  // グレースケール処理
  useEffect(() => {
    if (processingStage !== 1 || !smoothImageSrc) return;

    if (!grayscale) {
      // グレースケール処理をスキップ
      onGrayscaleProcessed(smoothImageSrc);
      return;
    }

    processGrayscale(smoothImageSrc, onGrayscaleProcessed);
  }, [processingStage, smoothImageSrc, grayscale]);

  // 色反転処理
  useEffect(() => {
    if (processingStage !== 2 || !intermediateImage) return;

    if (!invertColor) {
      // 色反転処理をスキップ
      onInvertProcessed(intermediateImage);
      return;
    }

    processInvertColor(intermediateImage, onInvertProcessed);
  }, [processingStage, intermediateImage, invertColor]);

  return null;
};

// グレースケール処理関数
const processGrayscale = (
  imageSrc: string,
  callback: (result: string | null) => void
) => {
  if (!window.cv) {
    console.error("OpenCV is not loaded.");
    callback(imageSrc);
    return;
  }

  const cv = window.cv;
  const imgElement = document.createElement("img");
  imgElement.src = imageSrc;
  imgElement.crossOrigin = "Anonymous"; // CORS回避

  imgElement.onload = () => {
    const src = cv.imread(imgElement);
    let dst = new cv.Mat();

    if (src.channels() === 4) {
      // RGBA画像ならアルファチャンネルを保持しつつRGBをグレースケール化
      const rgbaChannels = new cv.MatVector();
      cv.split(src, rgbaChannels);

      const r = rgbaChannels.get(0);
      const g = rgbaChannels.get(1);
      const b = rgbaChannels.get(2);
      const a = rgbaChannels.get(3); // アルファチャンネル

      const gray = new cv.Mat();
      cv.addWeighted(r, 0.3, g, 0.59, 0, gray);
      cv.addWeighted(gray, 1, b, 0.11, 0, gray);

      // 4チャンネルに戻す
      const mergedChannels = new cv.MatVector();
      mergedChannels.push_back(gray);
      mergedChannels.push_back(gray);
      mergedChannels.push_back(gray);
      mergedChannels.push_back(a); // アルファチャンネルを戻す

      cv.merge(mergedChannels, dst);

      // メモリ解放
      r.delete();
      g.delete();
      b.delete();
      a.delete();
      gray.delete();
      rgbaChannels.delete();
      mergedChannels.delete();
    } else {
      // RGB画像ならそのままグレースケール化
      cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY);
      cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGB);
    }

    // キャンバスに描画
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    cv.imshow(canvas, dst);

    // 変換後の画像をコールバック
    callback(canvas.toDataURL());

    // メモリ解放
    src.delete();
    dst.delete();
  };

  imgElement.onerror = () => {
    console.error("Failed to load image");
    callback(imageSrc);
  };
};

// 色反転処理関数
const processInvertColor = (
  imageSrc: string,
  callback: (result: string | null) => void
) => {
  if (!window.cv) {
    console.error("OpenCV is not loaded.");
    callback(imageSrc);
    return;
  }

  const cv = window.cv;
  const imgElement = document.createElement("img");
  imgElement.src = imageSrc;
  imgElement.crossOrigin = "Anonymous"; // CORS回避

  imgElement.onload = () => {
    const src = cv.imread(imgElement);
    let dst = new cv.Mat();

    if (src.channels() === 4) {
      // RGBA画像ならアルファチャンネルを保持しつつRGBを色反転
      const rgbaChannels = new cv.MatVector();
      cv.split(src, rgbaChannels);

      const r = rgbaChannels.get(0);
      const g = rgbaChannels.get(1);
      const b = rgbaChannels.get(2);
      const a = rgbaChannels.get(3); // アルファチャンネル

      // RGB部分を色反転
      cv.bitwise_not(r, r);
      cv.bitwise_not(g, g);
      cv.bitwise_not(b, b);

      // 4チャンネルに戻す
      const mergedChannels = new cv.MatVector();
      mergedChannels.push_back(r);
      mergedChannels.push_back(g);
      mergedChannels.push_back(b);
      mergedChannels.push_back(a); // アルファチャンネルを戻す

      cv.merge(mergedChannels, dst);

      // メモリ解放
      r.delete();
      g.delete();
      b.delete();
      a.delete();
      rgbaChannels.delete();
      mergedChannels.delete();
    } else {
      // RGB画像ならそのまま色反転
      cv.bitwise_not(src, dst);
    }

    // キャンバスに描画
    const canvas = document.createElement("canvas");
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    cv.imshow(canvas, dst);

    // 変換後の画像をコールバック
    callback(canvas.toDataURL());

    // メモリ解放
    src.delete();
    dst.delete();
  };

  imgElement.onerror = () => {
    console.error("Failed to load image");
    callback(imageSrc);
  };
};

export default ImageEditor;
