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
  const [processedSrc, setProcessedSrc] = useState<string | null>(imageSrc);

  // グレースケール処理
  useGrayscaleProcessor({
    imageSrc,
    setSmoothImageSrc: setProcessedSrc,
    grayscale,
  });

  // 色反転処理
  useInvertColorProcessor({
    imageSrc: processedSrc || imageSrc,
    setSmoothImageSrc,
    invert: invertColor,
  });

  return null;
};

export default ImageEditor;
