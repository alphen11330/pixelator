"use client";
import React, { useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  imageSrc: string;
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
};

const GrayscaleProcessor: React.FC<Props> = ({ imageSrc, setImageSrc }) => {
  useEffect(() => {
    const processImage = async () => {
      if (!window.cv) {
        console.error("OpenCV is not loaded.");
        return;
      }
      const cv = window.cv;

      // 画像を読み込む
      const imgElement = document.createElement("img");
      imgElement.src = imageSrc;
      imgElement.onload = () => {
        const src = cv.imread(imgElement);

        // グレースケールに変換
        const grayImage = new cv.Mat();
        cv.cvtColor(src, grayImage, cv.COLOR_RGB2GRAY);

        // キャンバス作成
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // 透明背景をクリア
        }

        // OpenCV で描画
        cv.imshow(canvas, grayImage);

        // データURL取得
        setImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        grayImage.delete();
      };
    };

    processImage();
  }, [imageSrc, setImageSrc]);

  return null;
};

export default GrayscaleProcessor;
