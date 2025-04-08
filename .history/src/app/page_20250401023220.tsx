"use client";
import React, { useState, useEffect } from "react";
import Uploader from "./components/Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import GrayscaleProcessor from "./components/GrayscaleProcessor";
import InvertColorProcessor from "./components/InvertColorProcessor"; // 追加
import CheckBox from "./components/CheckBox";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null); // オリジナル画像
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null);
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null);
  const [pixelLength, setPixelLength] = useState(64);
  const [grayscale, setGrayscale] = useState(false);
  const [invertColor, setInvertColor] = useState(false); // 色反転の状態

  // OpenCV.js をロード
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js";
    script.async = true;
    script.onload = () => console.log("OpenCV.js Loaded");
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <Uploader
        setImageSrc={setImageSrc}
        setSmoothImageSrc={setSmoothImageSrc}
      />
      {smoothImageSrc && imageSrc && (
        <>
          <img
            src={smoothImageSrc}
            width={"256px"}
            alt="Original"
            style={{ margin: "1rem", border: "solid 1px black" }}
          />
          <PixelArtProcessor
            smoothImageSrc={smoothImageSrc}
            setDotsImageSrc={setDotsImageSrc}
            pixelLength={pixelLength}
          />
          <GrayscaleProcessor
            imageSrc={imageSrc}
            setSmoothImageSrc={setSmoothImageSrc}
            grayscale={grayscale}
          />
          <InvertColorProcessor
            imageSrc={smoothImageSrc}
            setSmoothImageSrc={setSmoothImageSrc}
            invert={invertColor}
          />{" "}
          {/* 追加 */}
          <span style={{ userSelect: "none" }}>▶</span>
        </>
      )}
      {dotsImageSrc && (
        <>
          <img
            src={dotsImageSrc}
            width={"256px"}
            alt="Pixel Art"
            style={{
              margin: "1rem",
              border: "solid 1px black",
              imageRendering: "pixelated",
            }}
          />
          <br />
        </>
      )}
      <CheckBox
        name={"グレースケール"}
        value={grayscale}
        setValue={setGrayscale}
      />
      <CheckBox name={"色反転"} value={invertColor} setValue={setInvertColor} />{" "}
      {/* 追加 */}
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
