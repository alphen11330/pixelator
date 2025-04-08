"use client";
import React, { useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  imageSrc: string;
  setReducedImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  colorCount: number;
};

const ColorReducer: React.FC<Props> = ({
  imageSrc,
  setReducedImageSrc,
  colorCount,
}) => {
  useEffect(() => {
    const processImage = () => {
      if (!window.cv) {
        console.error("OpenCV is not loaded.");
        return;
      }

      const cv = window.cv;
      const imgElement = document.createElement("img");
      imgElement.src = imageSrc;

      imgElement.onload = () => {
        try {
          // 画像をCanvasに描画
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            console.error("Failed to get 2D context.");
            return;
          }
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

          // OpenCVで画像を読み込む
          const src = cv.imread(canvas);
          if (!(src instanceof cv.Mat)) {
            console.error("Failed to read image as cv.Mat.");
            return;
          }

          const dst = new cv.Mat();
          const samples = new cv.Mat();
          const labels = new cv.Mat();
          const centers = new cv.Mat();

          // ピクセルデータを1列に並べる
          src.convertTo(samples, cv.CV_32F); // OpenCVのk-means用にfloatへ変換
          samples.reshape(3, src.rows * src.cols); // 3チャンネル (RGB) のまま行列を変形

          // K-Means クラスタリングで色数を減らす
          cv.kmeans(
            samples,
            colorCount,
            labels,
            new cv.TermCriteria(
              cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
              10,
              1.0
            ),
            3,
            cv.KMEANS_PP_CENTERS,
            centers
          );

          // クラスタごとの色で塗り直す
          const newPixels = samples.data32F;
          for (let i = 0; i < samples.rows; i++) {
            const clusterIdx = labels.intAt(i, 0);
            newPixels[i * 3] = centers.floatAt(clusterIdx, 0);
            newPixels[i * 3 + 1] = centers.floatAt(clusterIdx, 1);
            newPixels[i * 3 + 2] = centers.floatAt(clusterIdx, 2);
          }

          // 画像を元のサイズに戻す
          const reshaped = samples.reshape(src.channels(), src.rows); // 形状を元に戻す
          reshaped.convertTo(dst, cv.CV_8U); // 8ビット整数へ戻す

          // キャンバスに描画
          cv.imshow(canvas, dst);
          setReducedImageSrc(canvas.toDataURL());

          // メモリ解放
          src.delete();
          dst.delete();
          samples.delete();
          labels.delete();
          centers.delete();
          reshaped.delete();
        } catch (error) {
          console.error("Error in image processing:", error);
        }
      };
    };

    processImage();
  }, [imageSrc, setReducedImageSrc, colorCount]);

  return null;
};

export default ColorReducer;
