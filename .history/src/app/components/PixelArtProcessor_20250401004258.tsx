"use client";
import React, { useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  imageSrc: string;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
};

const PixelArtProcessor: React.FC<Props> = ({
  imageSrc,
  setDotsImageSrc,
  pixelLength,
}) => {
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

        // 長辺を pixelLength に設定し、短辺を比率に応じて調整
        let newWidth, newHeight;
        if (width > height) {
          newWidth = pixelLength;
          newHeight = Math.round((height / width) * pixelLength);
        } else {
          newHeight = pixelLength;
          newWidth = Math.round((width / height) * pixelLength);
        }

        const dst = new cv.Mat();
        const size = new cv.Size(newWidth, newHeight);
        cv.resize(src, dst, size, 0, 0, cv.INTER_NEAREST);

        // キャンバスに描画（中央配置）
        const canvas = document.createElement("canvas");
        canvas.width = pixelLength;
        canvas.height = pixelLength;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // 透明背景
          const xOffset = (pixelLength - newWidth) / 2;
          const yOffset = (pixelLength - newHeight) / 2;
          cv.imshow(canvas, dst);
          ctx.drawImage(canvas, xOffset, yOffset, newWidth, newHeight);
        }

        // データURLとして取得
        setDotsImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        dst.delete();
      };
    };

    processImage();
  }, [imageSrc, setDotsImageSrc, pixelLength]);

  return null;
};

export default PixelArtProcessor;
