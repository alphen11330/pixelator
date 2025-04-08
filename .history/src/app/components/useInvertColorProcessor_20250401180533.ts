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

const useInvertColorProcessor = ({ imageSrc, setSmoothImageSrc, invert }: Props) => {
  useEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;

    const processImage = async () => {
      const cv = window.cv;
      const imgElement = document.createElement("img");
      imgElement.src = imageSrc;
      imgElement.crossOrigin = "Anonymous"; // CORS回避

      imgElement.onload = () => {
        try {
          const src = cv.imread(imgElement);
          const dst = new cv.Mat();

          if (src.channels() === 4) {
            // RGBA を分割
            const rgbaChannels = new cv.MatVector();
            cv.split(src, rgbaChannels);

            // RGBの色反転
            cv.bitwise_not(rgbaChannels.get(0), rgbaChannels.get(0));
            cv.bitwise_not(rgbaChannels.get(1), rgbaChannels.get(1));
            cv.bitwise_not(rgbaChannels.get(2), rgbaChannels.get(2));

            // マージ
            cv.merge(rgbaChannels, dst);

            // メモリ解放
            rgbaChannels.delete();
          } else {
            // 3チャンネル (RGB) の場合はそのまま反転
            cv.bitwise_not(src, dst);
          }

          // キャンバスに描画
          const canvas = document.createElement("canvas");
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          cv.imshow(canvas, dst);

          // 反転後の画像をセット
          setSmoothImageSrc(canvas.toDataURL());

          // メモリ解放
          src.delete();
          dst.delete();
        } catch (error) {
          console.error("Error processing image:", error);
        }
      };
    };

    if (invert) {
      processImage();
    } else {
      setSmoothImageSrc(imageSrc); // 反転を解除したときに元の画像に戻す
    }
  }, [imageSrc, invert, setSmoothImageSrc]);
};

export default useInvertColorProcessor;
