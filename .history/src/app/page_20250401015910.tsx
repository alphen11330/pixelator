"use client";
import React, { useState, useEffect } from "react";
import Uploader from "./Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import GrayscaleProcessor from "./components/GrayscaleProcessor";
import CheckBox from "./components/CheckBox";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null); // 元の画像を保持
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null);
  const [pixelLength, setPixelLength] = useState(64);
  const [grayscale, setGrayscale] = useState(false);

  // OpenCV.js をロード
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js";
    script.async = true;
    script.onload = () => console.log("OpenCV.js Loaded");
    document.body.appendChild(script);
  }, []);

  // グレースケールの切り替え処理
  useEffect(() => {
    if (!originalImageSrc) return;
    if (grayscale) {
      setImageSrc(originalImageSrc); // グレースケール処理を適用
    } else {
      setImageSrc(originalImageSrc); // オリジナル画像に戻す
    }
  }, [grayscale, originalImageSrc]);

  const handleUpload = (src: string) => {
    setImageSrc(src);
    setOriginalImageSrc(src); // アップロード時にオリジナルを保持
  };

  const imgBox: React.CSSProperties = {
    display: "inline",
    margin: "1rem",
    border: "solid 1px rgb(0, 0, 0)",
  };

  return (
    <>
      <Uploader setImageSrc={handleUpload} />
      {imageSrc && (
        <>
          <img src={imageSrc} width={"256px"} alt="Original" style={imgBox} />
          <PixelArtProcessor
            imageSrc={imageSrc}
            setDotsImageSrc={setDotsImageSrc}
            pixelLength={pixelLength}
          />
          {grayscale && (
            <GrayscaleProcessor
              imageSrc={originalImageSrc!}
              setImageSrc={setImageSrc}
            />
          )}
          <span style={{ userSelect: "none" }}>▶</span>
        </>
      )}
      {dotsImageSrc && (
        <>
          <img
            src={dotsImageSrc}
            width={"256px"}
            alt="Pixel Art"
            style={{ ...imgBox, imageRendering: "pixelated" }}
          />
          <br />
        </>
      )}

      <CheckBox
        name={"グレースケール"}
        value={grayscale}
        setValue={setGrayscale}
      />

      <InputRange
        name={"ドット長"}
        min={8}
        max={512}
        step={8}
        value={pixelLength}
        setValue={setPixelLength}
      />
    </>
  );
}
