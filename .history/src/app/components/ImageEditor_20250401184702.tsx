"use client";
import React, { useEffect, useState } from "react";
import useGrayscaleProcessor from "./useGrayscaleProcessor";
import useInvertColorProcessor from "./useInvertColorProcessor";

type Props = {
  imageSrc: string;
  smoothImageSrc: string;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  grayscale: boolean;
  invertColor: boolean;
};

const ImageEditor: React.FC<Props> = ({
  imageSrc,
  smoothImageSrc,
  setSmoothImageSrc,
  grayscale,
  invertColor,
}) => {
  useEffect(() => {
    if (!window.cv) {
      console.error("OpenCV is not loaded.");
      return;
    }
    //条件が更新されるとオリジナル画像に更新
    setSmoothImageSrc(imageSrc);
  }, [grayscale, invertColor]);

  return null;
};

export default ImageEditor;
