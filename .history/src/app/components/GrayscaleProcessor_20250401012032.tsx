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
        let width = src.cols;
        let height = src.rows;

        // 出力用 Mat の作成
        const dst = new cv.Mat();
        const size = new cv.Size(width, height);
        cv.resize(src, dst, size, 0, 0, cv.INTER_NEAREST);

        // グレースケールに変換
        const grayImage = new cv.Mat();
        cv.cvtColor(dst, grayImage, cv.COLOR_RGB2GRAY);

        // キャンバス作成
        const canvas = document.createElement("canvas");
        canvas.width = pixelLength;
        canvas.height = pixelLength;
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
        dst.delete();
        grayImage.delete();
      };
    };

    processImage();
  }, [imageSrc, pixelLength]);

  return null;
};

export default GrayscaleProcessor;
