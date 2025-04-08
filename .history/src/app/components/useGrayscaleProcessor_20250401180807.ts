"use client";
import React, { useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  imageSrc: string;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  grayscale: boolean;
};

const useGrayscaleProcessor = ({ imageSrc, setSmoothImageSrc, grayscale }: Props) => {
  useEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;

    // グレースケールを適用しない場合、元画像に戻す
    if (!grayscale) {
      setSmoothImageSrc(imageSrc);
      return;
    }

    const cv = window.cv;
    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;
    imgElement.crossOrigin = "Anonymous"; // CORS回避

    imgElement.onload = () => {
      const src = cv.imread(imgElement);
      const dst = new cv.Mat();

      if (src.channels() === 4) {
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
      } else {
        cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY);
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
  }, [imageSrc, grayscale, setSmoothImageSrc]);
};

export default useGrayscaleProcessor;
