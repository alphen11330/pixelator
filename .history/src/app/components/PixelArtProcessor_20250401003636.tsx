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
  setPixelLength,
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
        const dst = new cv.Mat();
        const size = new cv.Size(64, 64);

        // 画像を64×64に縮小（カラーのまま）
        cv.resize(src, dst, size, 0, 0, cv.INTER_NEAREST);

        // キャンバスに描画
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        cv.imshow(canvas, dst);

        // データURLとして取得
        setDotsImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        dst.delete();
      };
    };

    processImage();
  }, [imageSrc, setDotsImageSrc]);

  return null;
};
export default PixelArtProcessor;
