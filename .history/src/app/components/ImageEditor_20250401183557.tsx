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
  const [tempImage, setTempImage] = useState<string | null>(imageSrc);

  useEffect(() => {
    if (!grayscale && !invertColor) {
      setSmoothImageSrc(imageSrc); // どちらもOFFならオリジナル画像に戻す
    } else {
      setSmoothImageSrc(tempImage); // 片方が有効なら一時画像を保持
    }
  }, [imageSrc, grayscale, invertColor]);

  // グレースケール処理 (結果をtempImageに保存)
  useGrayscaleProcessor({
    imageSrc: tempImage!,
    setSmoothImageSrc: setTempImage,
    grayscale,
  });

  // 色反転処理 (tempImageに保存されたグレースケール画像を使用)
  useInvertColorProcessor({
    imageSrc: tempImage!,
    setSmoothImageSrc,
    invertColor,
  });

  return null;
};

export default ImageEditor;
