"use client";
import React, { useLayoutEffect } from "react";
import grayscaleProcessor from "./grayscaleProcessor";
import invertColorProcessor from "./invertColorProcessor";

type Props = {
  imageSrc: string;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  grayscale: boolean;
  invertColor: boolean;
};

const ImageEditor: React.FC<Props> = ({
  imageSrc,
  setSmoothImageSrc,
  grayscale,
  invertColor,
}) => {
  useLayoutEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    if (!imageSrc) return;

    // 元の画像から処理を開始
    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;

    imgElement.onload = () => {
      const cv = window.cv;

      // 元の画像からソースMat作成
      let src = cv.imread(imgElement);
      let dst = new cv.Mat();

      // グレースケール処理
      if (grayscale) {
        dst = grayscaleProcessor(cv, src);
        src.delete();
        src = dst.clone();
      } else {
        // グレースケールしない場合はソースをそのままコピー
        dst = src.clone();
      }

      // 色反転処理
      if (invertColor) {
        let inverted = invertColorProcessor(cv, dst);
        dst.delete();
        dst = inverted;
      } else {
        // 色反転しない場合はソースをそのままコピー
        dst = src.clone();
      }

      // キャンバスに描画
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      cv.imshow(canvas, dst);

      // 変換後の画像をセット
      setSmoothImageSrc(canvas.toDataURL());

      // メモリ解放
      src.delete();
      dst.delete();
    };
  }, [imageSrc, grayscale, invertColor]);

  return null;
};

export default ImageEditor;
