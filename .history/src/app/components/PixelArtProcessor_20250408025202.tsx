"use client";
import React, { useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  smoothImageSrc: string;
  dotsImageSrc: string | null;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
};

const PixelArtProcessor: React.FC<Props> = ({
  smoothImageSrc,
  setDotsImageSrc,
  pixelLength,
}) => {
  useEffect(() => {
    const processImage = async () => {
      const cv = window.cv;

      if (!window.cv) {
        console.error("OpenCV is not loaded.");
        return;
      }

      // 画像を読み込む
      const imgElement = document.createElement("img");
      imgElement.src = smoothImageSrc;

      imgElement.onload = () => {
        const src = cv.imread(imgElement);
        let width = src.cols;
        let height = src.rows;

        // アスペクト比を維持してリサイズ
        let newWidth, newHeight;
        if (width > height) {
          newWidth = pixelLength;
          newHeight = Math.round((height / width) * pixelLength);
        } else {
          newHeight = pixelLength;
          newWidth = Math.round((width / height) * pixelLength);
        }

        // 出力用 Mat の作成
        const dst = new cv.Mat();
        const size = new cv.Size(newWidth, newHeight);
        cv.resize(src, dst, size, 0, 0, cv.INTER_NEAREST);

        // キャンバス作成
        const canvas = document.createElement("canvas");
        canvas.width = pixelLength;
        canvas.height = pixelLength;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // 透明背景をクリア
        }

        // OpenCV で描画
        cv.imshow(canvas, dst);

        // データURL取得
        setDotsImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        dst.delete();
      };
    };

    processImage();
  }, [smoothImageSrc, pixelLength]);

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return null;
};

export default PixelArtProcessor;
