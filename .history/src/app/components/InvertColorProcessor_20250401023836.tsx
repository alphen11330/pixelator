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
  invert: boolean;
};

const InvertColorProcessor: React.FC<Props> = ({
  imageSrc,
  setSmoothImageSrc,
  invert,
}) => {
  useEffect(() => {
    if (!invert) {
      setSmoothImageSrc(imageSrc);
      return;
    }

    const processImage = async () => {
      if (!window.cv) {
        console.error("OpenCV is not loaded.");
        return;
      }
      const cv = window.cv;

      const imgElement = document.createElement("img");
      imgElement.src = imageSrc;
      imgElement.crossOrigin = "Anonymous"; // CORS回避

      imgElement.onload = () => {
        try {
          const src = cv.imread(imgElement);
          const dst = new cv.Mat();

          if (src.channels() === 4) {
            // RGBAを分割
            const rgbaChannels = new cv.MatVector();
            cv.split(src, rgbaChannels);

            // 各チャンネルを取得
            const r = rgbaChannels.get(0);
            const g = rgbaChannels.get(1);
            const b = rgbaChannels.get(2);
            const a = rgbaChannels.get(3); // アルファチャンネル

            // RGBの色反転
            cv.bitwise_not(r, r);
            cv.bitwise_not(g, g);
            cv.bitwise_not(b, b);

            // 新しい MatVector に追加してマージ
            const mergedChannels = new cv.MatVector();
            mergedChannels.push_back(r);
            mergedChannels.push_back(g);
            mergedChannels.push_back(b);
            mergedChannels.push_back(a);

            cv.merge(mergedChannels, dst);

            // メモリ解放
            r.delete();
            g.delete();
            b.delete();
            a.delete();
            rgbaChannels.delete();
            mergedChannels.delete();
          } else {
            // 3チャンネル (RGB) の場合はそのまま反転
            cv.bitwise_not(src, dst);
          }

          // キャンバスに描画
          const canvas = document.createElement("canvas");
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          cv.imshow(canvas, dst);

          // DataURL で出力
          setSmoothImageSrc(canvas.toDataURL());

          // メモリ解放
          src.delete();
          dst.delete();
        } catch (error) {
          console.error("Error processing image:", error);
        }
      };
    };

    processImage();
  }, [imageSrc, invert]);

  return null;
};

export default InvertColorProcessor;
