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
    } // 色反転がオフなら処理しない

    const processImage = async () => {
      if (!window.cv) {
        console.error("OpenCV is not loaded.");
        return;
      }
      const cv = window.cv;

      // 画像読み込み
      const imgElement = document.createElement("img");
      imgElement.src = imageSrc;
      imgElement.onload = () => {
        const src = cv.imread(imgElement);
        const dst = new cv.Mat();

        // 色を反転
        cv.bitwise_not(src, dst);

        // キャンバス作成
        const canvas = document.createElement("canvas");
        cv.imshow(canvas, dst);
        setSmoothImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        dst.delete();
      };
    };

    processImage();
  }, [imageSrc, invert]);

  return null;
};

export default InvertColorProcessor;
