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

    // グレースケールを適用しない場合、元画像をそのままセット
    if (!grayscale) {
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

      // 変換後の画像をセット
      setSmoothImageSrc(canvas.toDataURL());

      // メモリ解放
      src.delete();
      dst.delete();
    };
  }, [grayscale]);

};

export default useGrayscaleProcessor;
