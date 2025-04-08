"use client";
import React, { useEffect } from "react";
import { colorReductionProcessor } from "./colorReductionProcessor"; // パスは調整してください

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  smoothImageSrc: string | null;
  dotsImageSrc: string | null;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
  colorReduction: boolean;
  colorPalette: string[];
};

const PixelArtProcessor: React.FC<Props> = ({
  smoothImageSrc,
  dotsImageSrc,
  setDotsImageSrc,
  pixelLength,
  colorReduction,
  colorPalette,
}) => {
  useEffect(() => {
    const processImage = async () => {
      const cv = window.cv;

      if (!cv) {
        console.error("OpenCV is not loaded.");
        return;
      }
      if (!smoothImageSrc) return;

      const imgElement = document.createElement("img");
      imgElement.src = smoothImageSrc;

      imgElement.onload = async () => {
        const src = cv.imread(imgElement);
        let width = src.cols;
        let height = src.rows;

        // リサイズ後のサイズ計算
        let newWidth, newHeight;
        if (width > height) {
          newWidth = pixelLength;
          newHeight = Math.round((height / width) * pixelLength);
        } else {
          newHeight = pixelLength;
          newWidth = Math.round((width / height) * pixelLength);
        }

        // リサイズ処理
        const dst = new cv.Mat();
        const size = new cv.Size(newWidth, newHeight);
        cv.resize(src, dst, size, 0, 0, cv.INTER_NEAREST);

        // canvas へ描画
        const canvas = document.createElement("canvas");
        canvas.width = pixelLength;
        canvas.height = pixelLength;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        cv.imshow(canvas, dst);

        let dataUrl = canvas.toDataURL();

        // 色置換フラグが true のとき
        if (colorReduction && colorPalette.length > 0) {
          try {
            dataUrl = await colorReductionProcessor(dataUrl, colorPalette);
          } catch (e) {
            console.error("Color reduction failed:", e);
          }
        }

        setDotsImageSrc(dataUrl);

        // メモリ解放
        src.delete();
        dst.delete();
      };
    };

    processImage();
  }, [smoothImageSrc, pixelLength, colorReduction, colorPalette]);

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    imageRendering: "pixelated",
  };

  return (
    <>
      {dotsImageSrc && (
        <img src={dotsImageSrc} alt="Pixel Art" style={imgStyle} />
      )}
    </>
  );
};

export default PixelArtProcessor;
