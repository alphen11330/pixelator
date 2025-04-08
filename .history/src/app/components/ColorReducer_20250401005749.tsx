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
        // 画像を読み込む
        const src = cv.imread(imgElement);
        if (!(src instanceof cv.Mat)) {
          console.error("Failed to read image as cv.Mat.");
          return;
        }

        const dst = new cv.Mat();
        const sample = new cv.Mat();

        // k-means クラスタリングで減色
        const pixelCount = src.rows * src.cols;
        const samples = src.reshape(1, pixelCount);
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

        sample.reshape(3, src.rows).copyTo(dst);

        // キャンバスに描画
        const canvas = document.createElement("canvas");
        cv.imshow(canvas, dst);

        // 画像をDataURLとして取得
        setReducedImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        dst.delete();
        sample.delete();
        labels.delete();
        centers.delete();
      };
    };

    processImage();
  }, [imageSrc, setReducedImageSrc, colorCount]);

  return null;
};

export default ColorReducer;
