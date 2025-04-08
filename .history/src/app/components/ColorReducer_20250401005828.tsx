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
          // 画像をCanvasに描画してcv.Matとして取得
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            console.error("Failed to get 2D context.");
            return;
          }

          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

          const src = cv.imread(canvas); // ここで画像をcv.Matに変換
          if (!(src instanceof cv.Mat)) {
            console.error("Failed to read image as cv.Mat.");
            return;
          }

          const dst = new cv.Mat();
          const sample = new cv.Mat();

          // k-means クラスタリングで減色
          const pixelCount = src.rows * src.cols;
          const samples = src.reshape(3, pixelCount); // ここを修正
          samples.convertTo(sample, cv.CV_32F);

          const labels = new cv.Mat();
          const centers = new cv.Mat();
          cv.kmeans(
            sample,
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

          // ピクセルを減色後の色に置き換え
          for (let i = 0; i < pixelCount; i++) {
            const clusterIdx = labels.intAt(i, 0);
            sample.data[i * 3] = centers.floatAt(clusterIdx, 0);
            sample.data[i * 3 + 1] = centers.floatAt(clusterIdx, 1);
            sample.data[i * 3 + 2] = centers.floatAt(clusterIdx, 2);
          }

          sample.reshape(src.rows, src.cols).copyTo(dst);

          // キャンバスに描画
          cv.imshow(canvas, dst);

          // 画像をDataURLとして取得
          setReducedImageSrc(canvas.toDataURL());

          // メモリ解放
          src.delete();
          dst.delete();
          sample.delete();
          labels.delete();
          centers.delete();
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
