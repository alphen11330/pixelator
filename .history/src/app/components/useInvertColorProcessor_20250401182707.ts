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
  invertColor: boolean;
};

const useInvertColorProcessor = ({ imageSrc, setSmoothImageSrc, invertColor }: Props) => {
  useEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;

    // 色反転を適用しない場合、元画像をそのままセット
    if (!invertColor) {
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

      // 変換後の画像をセット
      setSmoothImageSrc(canvas.toDataURL());

      // メモリ解放
      src.delete();
      dst.delete();
    };
  }, [imageSrc, invertColor]);
};

export default useInvertColorProcessor;
