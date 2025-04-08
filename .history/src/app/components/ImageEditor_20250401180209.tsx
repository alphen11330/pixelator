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
  useEffect(() => {
    setSmoothImageSrc(imageSrc);
  }, [imageSrc, grayscale]);

  // グレースケール処理
  useGrayscaleProcessor({
    imageSrc,
    setSmoothImageSrc,
    grayscale,
  });

  return null;
};

export default ImageEditor;
