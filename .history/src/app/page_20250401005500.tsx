"use client";
import React, { useState, useEffect } from "react";
import Uploader from "./Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/inputRange";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null);
  const [pixelLength, setPixelLength] = useState(64);
  const [reducedImageSrc, setReducedImageSrc] = useState<string | null>(null);
  const [colorCount, setColorCount] = useState(8); // 初期値8色

  // OpenCV.js をロード
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js";
    script.async = true;
    script.onload = () => console.log("OpenCV.js Loaded");
    document.body.appendChild(script);
  }, []);

  const imgBox: React.CSSProperties = {
    display: "inline",
    margin: "1rem",
    border: "solid 1px rgb(0, 0, 0)",
  };

  return (
    <>
      <Uploader setImageSrc={setImageSrc} />
      {imageSrc && (
        <>
          <img src={imageSrc} width={"256px"} alt="Original" style={imgBox} />
          <PixelArtProcessor
            imageSrc={imageSrc}
            setDotsImageSrc={setDotsImageSrc}
            pixelLength={pixelLength}
          />
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

      {dotsImageSrc && (
        <>
          <InputRange
            name={"ドット長"}
            min={8}
            max={512}
            step={8}
            value={pixelLength}
            setValue={setPixelLength}
          />
        </>
      )}
    </>
  );
}
