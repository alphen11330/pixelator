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
  // グレースケール処理
  useGrayscaleProcessor({
    imageSrc,
    setSmoothImageSrc,
    grayscale,
  });

  // 色反転処理
  useInvertColorProcessor({
    imageSrc,
    setSmoothImageSrc,
    invert: invertColor,
  });

  return null;
};

export default ImageEditor;
