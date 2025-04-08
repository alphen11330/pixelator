import React, { useEffect, useState } from "react";
import grayscaleProcessor from "./grayscaleProcessor";
import invertColorProcessor from "./invertColorProcessor";
import colorCollectionProcessor from "./colorCollectionProcessor";
import colorReductionProcessor from "./colorReductionProcessor";

type Props = {
  imageSrc: string;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  grayscale: boolean;
  invertColor: boolean;
  colorReduction: boolean;
  colorLevels: number;
  colorCollection: boolean;
  isHue: boolean;
  hue: number;
  isLuminance: boolean;
  luminance: number;
  isSaturation: boolean;
  saturation: number;
};

const ImageEditor: React.FC<Props> = ({
  imageSrc,
  setSmoothImageSrc,
  grayscale,
  invertColor,
  colorReduction,
  colorLevels,
  colorCollection,
  isHue,
  hue,
  isLuminance,
  luminance,
  isSaturation,
  saturation,
}) => {
  const [processedMat, setProcessedMat] = useState<any | null>(null);

  useEffect(() => {
    if (!imageSrc || !window.cv) return;

    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;

    imgElement.onload = () => {
      const cv = window.cv;
      let src = cv.imread(imgElement);
      let dst = new cv.Mat();

      // グレースケール
      if (grayscale) {
        dst = grayscaleProcessor(cv, src);
        src.delete();
        src = dst.clone();
      } else {
        dst = src.clone();
      }

      // 色反転
      if (invertColor) {
        let inverted = invertColorProcessor(cv, dst);
        dst.delete();
        dst = inverted;
      }

      // **減色処理を useEffect で適用**
      if (colorReduction) {
        let reduced = colorReductionProcessor(
          cv,
          dst,
          Math.pow(2, colorLevels)
        );
        dst.delete();
        dst = reduced;
      }

      // 処理結果を状態として保存（再計算を防ぐ）
      setProcessedMat(dst);

      // メモリ解放
      src.delete();
    };
  }, [imageSrc, grayscale, invertColor, colorReduction, colorLevels]);

  useEffect(() => {
    if (!processedMat || !window.cv) return;

    const cv = window.cv;
    let dst = processedMat.clone();

    // 色補正処理
    if (colorCollection) {
      let corrected = colorCollectionProcessor(
        cv,
        dst,
        isHue,
        hue,
        isLuminance,
        luminance,
        isSaturation,
        saturation
      );
      dst.delete();
      dst = corrected;
    }

    // キャンバスに描画
    const canvas = document.createElement("canvas");
    canvas.width = processedMat.cols;
    canvas.height = processedMat.rows;
    cv.imshow(canvas, dst);

    setSmoothImageSrc(canvas.toDataURL());

    // メモリ解放
    dst.delete();
  }, [
    processedMat,
    colorCollection,
    isHue,
    hue,
    isLuminance,
    luminance,
    isSaturation,
    saturation,
  ]);

  return null;
};

export default ImageEditor;
