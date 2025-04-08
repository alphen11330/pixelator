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
  colorCount: number; // 使用する色の数
};

const ColorReducer: React.FC<Props> = ({
  imageSrc,
  setReducedImageSrc,
  colorCount,
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
        const samples = src.reshape(1, src.rows * src.cols); // 1行のデータに変換
        const samples32f = new cv.Mat();
        samples.convertTo(samples32f, cv.CV_32F); // float型に変換

        // k-means クラスタリングの設定
        const labels = new cv.Mat();
        const centers = new cv.Mat();
        cv.kmeans(
          samples32f,
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

        // 各ピクセルをクラスタ中心に置き換え
        const newColors = new Uint8Array(labels.rows * 3);
        for (let i = 0; i < labels.rows; i++) {
          const centerIdx = labels.intAt(i, 0);
          newColors[i * 3] = centers.floatAt(centerIdx, 0);
          newColors[i * 3 + 1] = centers.floatAt(centerIdx, 1);
          newColors[i * 3 + 2] = centers.floatAt(centerIdx, 2);
        }

        // 画像に変換
        const reduced = new cv.Mat(src.rows, src.cols, cv.CV_8UC3);
        reduced.data().set(newColors);
        reduced.reshape(3, src.rows);

        // キャンバスに描画
        const canvas = document.createElement("canvas");
        canvas.width = src.cols;
        canvas.height = src.rows;
        cv.imshow(canvas, reduced);

        // データURLとして取得
        setReducedImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        samples.delete();
        samples32f.delete();
        labels.delete();
        centers.delete();
        reduced.delete();
      };
    };

    processImage();
  }, [imageSrc, setReducedImageSrc, colorCount]);

  return null;
};

export default ColorReducer;
