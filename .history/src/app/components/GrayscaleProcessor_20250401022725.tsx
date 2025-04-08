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
  grayscale: boolean;
};

const GrayscaleProcessor: React.FC<Props> = ({
  imageSrc,
  setSmoothImageSrc,
  grayscale,
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

        // RGBAの場合、アルファチャンネルを維持してRGBをグレースケール化
        if (src.channels() === 4) {
          // 4チャンネル (RGBA) の場合、アルファを保持しながらRGB部分をグレースケール化
          const rgbaImage = new cv.Mat();
          cv.cvtColor(src, rgbaImage, cv.COLOR_RGBA2RGB); // RGBAをRGBに変換

          // グレースケールに変換
          const grayImage = new cv.Mat();
          cv.cvtColor(rgbaImage, grayImage, cv.COLOR_RGB2GRAY);

          // グレースケール画像にアルファチャンネルを戻す
          const finalImage = new cv.Mat();
          cv.cvtColor(grayImage, finalImage, cv.COLOR_GRAY2RGBA);

          // アルファチャンネルを元のものに戻す
          for (let i = 0; i < finalImage.rows; i++) {
            for (let j = 0; j < finalImage.cols; j++) {
              const pixel = finalImage.ucharPtr(i, j);
              const alpha = src.ucharPtr(i, j)[3]; // アルファ値を元の画像から取得
              pixel[3] = alpha; // アルファチャンネルを保持
            }
          }

          // キャンバス作成
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 透明背景をクリア
          }

          // OpenCV で描画
          cv.imshow(canvas, finalImage);

          // データURL取得
          setSmoothImageSrc(canvas.toDataURL());

          // メモリ解放
          src.delete();
          rgbaImage.delete();
          grayImage.delete();
          finalImage.delete();
        } else {
          // 透明部分がない場合はそのままグレースケール化
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
          setSmoothImageSrc(canvas.toDataURL());

          // メモリ解放
          src.delete();
          grayImage.delete();
        }
      };
    };

    processImage();
  }, [imageSrc]);

  return null;
};

export default GrayscaleProcessor;
