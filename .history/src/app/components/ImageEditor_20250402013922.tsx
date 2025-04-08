import React, { useEffect, useMemo, useState } from "react";
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
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

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

      // 減色処理（ここで `useMemo` を適用）
      dst = memoizedColorReduction(dst);

      // 色補正
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
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      cv.imshow(canvas, dst);

      setSmoothImageSrc(canvas.toDataURL());

      // メモリ解放
      src.delete();
      dst.delete();
    };
  }, [
    imageSrc,
    grayscale,
    invertColor,
    colorCollection,
    isHue,
    hue,
    isLuminance,
    luminance,
    isSaturation,
    saturation,
  ]);

  // **減色処理を useMemo で最適化**
  const memoizedColorReduction = useMemo(() => {
    return (inputMat: any) => {
      if (!colorReduction) return inputMat;

      let reduced = colorReductionProcessor(
        window.cv,
        inputMat,
        Math.pow(2, colorLevels)
      );

      return reduced;
    };
  }, [colorReduction, colorLevels]);

  return null;
};

export default ImageEditor;
