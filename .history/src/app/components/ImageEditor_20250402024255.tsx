"use client";
import React, { useEffect, useCallback } from "react";
import grayscaleProcessor from "./grayscaleProcessor";
import invertColorProcessor from "./invertColorProcessor";
import colorReductionProcessor from "./colorReductionProcessor";
import colorCollectionProcessor from "./colorCollectionProcessor";

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
  if (typeof window === "undefined" || !window.cv) {
    console.error("OpenCV is not loaded.");
    return null;
  }

  const cv = window.cv;

  /** グレースケール処理 */
  const applyGrayscale = useCallback(
    (src: any) => {
      if (!grayscale) return src.clone();
      const dst = grayscaleProcessor(cv, src);
      src.delete();
      return dst;
    },
    [grayscale]
  );

  /** 色反転処理 */
  const applyInvertColor = useCallback(
    (src: any) => {
      if (!invertColor) return src.clone();
      const dst = invertColorProcessor(cv, src);
      src.delete();
      return dst;
    },
    [invertColor]
  );

  /** 減色処理 */
  const applyColorReduction = useCallback(
    (src: any) => {
      if (!colorReduction) return src.clone();
      const dst = colorReductionProcessor(cv, src, Math.pow(2, colorLevels));
      src.delete();
      return dst;
    },
    [colorReduction, colorLevels]
  );

  /** 色補正処理 */
  const applyColorCollection = useCallback(
    (src: any) => {
      if (!colorCollection) return src.clone();
      const dst = colorCollectionProcessor(
        cv,
        src,
        isHue,
        hue,
        isLuminance,
        luminance,
        isSaturation,
        saturation
      );
      src.delete();
      return dst;
    },
    [
      colorCollection,
      isHue,
      hue,
      isLuminance,
      luminance,
      isSaturation,
      saturation,
    ]
  );

  useEffect(() => {
    if (!imageSrc) return;

    const imgElement = document.createElement("img");
    imgElement.src = imageSrc;

    imgElement.onload = () => {
      let src = cv.imread(imgElement);
      let dst = src.clone();

      dst = applyGrayscale(dst);
      dst = applyInvertColor(dst);
      dst = applyColorReduction(dst);
      dst = applyColorCollection(dst);

      // キャンバスに描画
      const canvas = document.createElement("canvas");
      canvas.width = imgElement.width;
      canvas.height = imgElement.height;
      cv.imshow(canvas, dst);

      // 変換後の画像をセット
      setSmoothImageSrc(canvas.toDataURL());

      // メモリ解放
      dst.delete();
    };
  }, [
    imageSrc,
    applyGrayscale,
    applyInvertColor,
    applyColorReduction,
    applyColorCollection,
  ]);

  return null;
};

export default ImageEditor;
