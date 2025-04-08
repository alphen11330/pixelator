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
    //条件が更新されるとオリジナル画像に更新
    setSmoothImageSrc(imageSrc);
  }, [imageSrc, grayscale, invertColor]);

  // グレースケール処理
  // useGrayscaleProcessor({
  //   imageSrc: smoothImageSrc,
  //   setSmoothImageSrc,
  //   grayscale,
  // });

  useInvertColorProcessor({
    imageSrc: smoothImageSrc,
    setSmoothImageSrc,
    invertColor,
  });

  return null;
};

export default ImageEditor;
