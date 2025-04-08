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
    if (!imageSrc) return;

    const processImage = async () => {
      if (!window.cv) {
        console.error("OpenCV is not loaded.");
        return;
      }
      const cv = window.cv;

      const imgElement = document.createElement("img");
      imgElement.src = imageSrc;
      imgElement.onload = () => {
        const src = cv.imread(imgElement);

        const grayImage = new cv.Mat();
        cv.cvtColor(src, grayImage, cv.COLOR_RGBA2GRAY); // 透明部分を維持

        const finalImage = new cv.Mat();
        cv.cvtColor(grayImage, finalImage, cv.COLOR_GRAY2RGBA); // アルファチャンネルを戻す

        // キャンバス作成
        const canvas = document.createElement("canvas");
        canvas.width = src.cols;
        canvas.height = src.rows;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        cv.imshow(canvas, finalImage);

        setImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        grayImage.delete();
        finalImage.delete();
      };
    };

    processImage();
  }, [imageSrc]);

  return null;
};

export default GrayscaleProcessor;
