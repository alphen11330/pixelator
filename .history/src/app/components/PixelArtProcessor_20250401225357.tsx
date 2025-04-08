"use client";
import React, { useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  smoothImageSrc: string;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
  method: "average"; // 平均プーリング or 最大プーリング
};

const PixelArtProcessor: React.FC<Props> = ({
  smoothImageSrc,
  setDotsImageSrc,
  pixelLength,
  method,
}) => {
  useEffect(() => {
    const processImage = async () => {
      if (!window.cv) {
        console.error("OpenCV is not loaded.");
        return;
      }
      const cv = window.cv;

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

        // 出力用 Mat
        const dst = new cv.Mat(newHeight, newWidth, src.type());
        const blockSizeX = Math.floor(width / newWidth);
        const blockSizeY = Math.floor(height / newHeight);

        for (let y = 0; y < newHeight; y++) {
          for (let x = 0; x < newWidth; x++) {
            const startX = x * blockSizeX;
            const startY = y * blockSizeY;
            const roi = src.roi(
              new cv.Rect(startX, startY, blockSizeX, blockSizeY)
            );
            const channels = new cv.Mat();

            cv.split(roi, channels);
            let newPixel = [];

            for (let i = 0; i < channels.length; i++) {
              const channelData = channels[i].data;
              if (method === "average") {
                newPixel.push(
                  channelData.reduce((a, b) => a + b, 0) / channelData.length
                );
              } else if (method === "max") {
                newPixel.push(Math.max(...channelData));
              }
            }

            dst.ucharPtr(y, x)[0] = newPixel[0]; // B
            dst.ucharPtr(y, x)[1] = newPixel[1]; // G
            dst.ucharPtr(y, x)[2] = newPixel[2]; // R
            dst.ucharPtr(y, x)[3] = 255; // Alpha (透明度)

            roi.delete();
            channels.forEach((ch) => ch.delete());
          }
        }

        // キャンバス描画
        const canvas = document.createElement("canvas");
        canvas.width = pixelLength;
        canvas.height = pixelLength;
        cv.imshow(canvas, dst);
        setDotsImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        dst.delete();
      };
    };

    processImage();
  }, [smoothImageSrc, pixelLength, method]);

  return null;
};

export default PixelArtProcessor;
