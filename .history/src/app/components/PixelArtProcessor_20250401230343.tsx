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
  method: "average" | "max"; // 平均プーリング or 最大プーリング
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
        try {
          const src = cv.imread(imgElement);
          let width = src.cols;
          let height = src.rows;

          // アスペクト比を維持してリサイズ
          let newWidth, newHeight;
          if (width > height) {
            newWidth = pixelLength;
            newHeight = Math.max(1, Math.round((height / width) * pixelLength));
          } else {
            newHeight = pixelLength;
            newWidth = Math.max(1, Math.round((width / height) * pixelLength));
          }

          // 出力用 Mat
          const dst = new cv.Mat(newHeight, newWidth, src.type());
          const blockSizeX = Math.max(1, Math.floor(width / newWidth));
          const blockSizeY = Math.max(1, Math.floor(height / newHeight));

          for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
              const startX = x * blockSizeX;
              const startY = y * blockSizeY;
              const roi = src.roi(
                new cv.Rect(startX, startY, blockSizeX, blockSizeY)
              );
              const channels = new cv.MatVector();

              cv.split(roi, channels);
              let newPixel = [0, 0, 0, 255];

              for (let i = 0; i < 3; i++) {
                // BGRの3チャンネルのみ処理
                const channelData = channels.get(i).data;
                if (channelData.length === 0) continue;
                if (method === "average") {
                  newPixel[i] =
                    channelData.reduce((a, b) => a + b, 0) / channelData.length;
                } else if (method === "max") {
                  newPixel[i] = Math.max(...channelData);
                }
              }

              dst.ucharPtr(y, x).set(newPixel);
              roi.delete();
              channels.delete();
            }
          }

          // キャンバス描画
          const canvas = document.createElement("canvas");
          canvas.width = newWidth;
          canvas.height = newHeight;
          cv.imshow(canvas, dst);
          setDotsImageSrc(canvas.toDataURL());

          // メモリ解放
          src.delete();
          dst.delete();
        } catch (error) {
          console.error("Error processing image:", error);
        }
      };
    };

    processImage();
  }, [smoothImageSrc, pixelLength, method]);

  return null;
};

export default PixelArtProcessor;
