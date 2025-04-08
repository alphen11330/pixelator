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
  pixelLength,
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

        // 画像を8色に減色する処理
        const reducedColorsMat = reduceColors(dst, 8);

        // キャンバス作成
        const canvas = document.createElement("canvas");
        canvas.width = pixelLength;
        canvas.height = pixelLength;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // 透明背景をクリア
        }

        // OpenCV で描画
        cv.imshow(canvas, reducedColorsMat);

        // データURL取得
        setDotsImageSrc(canvas.toDataURL());

        // メモリ解放
        src.delete();
        dst.delete();
        reducedColorsMat.delete();
      };
    };

    processImage();
  }, [imageSrc, setDotsImageSrc, pixelLength]);

  // 画像を指定した色数に減色する関数
  const reduceColors = (src: any, numColors: number) => {
    const cv = window.cv;

    // 画像をLAB色空間に変換
    const labImage = new cv.Mat();
    cv.cvtColor(src, labImage, cv.COLOR_RGB2LAB);

    // KMeansクラスタリングを用いて色数を減らす
    const data = labImage.data32F;
    const rows = data.length / 3;
    const samples = new cv.Mat(rows, 1, cv.CV_32FC3); // サンプルは1行あたり3色(RGB)のデータを持つ

    // サンプルデータを適切にセット
    for (let i = 0; i < rows; i++) {
      samples.data32F[i * 3] = [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]; // R, G, B
    }

    const criteria = new cv.TermCriteria(
      cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER,
      10,
      1.0
    );
    const kmeansResult = new cv.Mat();
    const labels = new cv.Mat();
    const centers = new cv.Mat();
    cv.kmeans(
      samples,
      numColors,
      labels,
      criteria,
      10,
      cv.KMEANS_RANDOM_CENTERS,
      centers
    );

    // 新しい色で画像を塗りつぶす
    for (let i = 0; i < data.length; i += 3) {
      const label = labels.data32S[i / 3];
      const center = centers.data32F.subarray(label * 3, (label + 1) * 3);
      data[i] = center[0]; // L
      data[i + 1] = center[1]; // A
      data[i + 2] = center[2]; // B
    }

    // 色空間をRGBに戻す
    const reducedImage = new cv.Mat();
    cv.cvtColor(labImage, reducedImage, cv.COLOR_LAB2RGB);

    // 結果を返す
    return reducedImage;
  };

  return null;
};

export default PixelArtProcessor;
