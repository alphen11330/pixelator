"use client";
import React, { useEffect, useState } from "react";
import useGrayscaleProcessor from "./useGrayscaleProcessor";
import useInvertColorProcessor from "./useInvertColorProcessor";

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
  const [tempSrc, setTempSrc] = useState<string | null>(imageSrc);

  useEffect(() => {
    setTempSrc(imageSrc); // 画像が変わるたびに初期化
  }, [imageSrc]);

  useEffect(() => {
    if (!imageSrc) return;

    const processImage = async () => {
      let processedSrc = imageSrc;

      // グレースケール処理
      if (grayscale) {
        await new Promise<void>((resolve) => {
          useGrayscaleProcessor({
            imageSrc: processedSrc,
            setSmoothImageSrc: (newSrc) => {
              processedSrc = newSrc;
              resolve();
            },
            grayscale,
          });
        });
      }

      // 色反転処理
      if (invertColor) {
        await new Promise<void>((resolve) => {
          useInvertColorProcessor({
            imageSrc: processedSrc,
            setSmoothImageSrc: (newSrc) => {
              processedSrc = newSrc;
              resolve();
            },
            invert: true,
          });
        });
      }

      // 最終結果をセット
      setSmoothImageSrc(processedSrc);
    };

    processImage();
  }, [imageSrc, grayscale, invertColor, setSmoothImageSrc]);

  return null;
};

export default ImageEditor;
