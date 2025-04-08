"use client";
import React, { useState, useEffect } from "react";
import Uploader from "./components/Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import GrayscaleProcessor from "./components/GrayscaleProcessor";
import CheckBox from "./components/CheckBox";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null);
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

  const imgBox: React.CSSProperties = {
    display: "inline",
    margin: "1rem",
    border: "solid 1px rgb(0, 0, 0)",
  };

  return (
    <>
      <Uploader
        setImageSrc={setImageSrc}
        setSmoothImageSrc={setSmoothImageSrc}
      />

      {smoothImageSrc && (
        <>
          <img
            src={smoothImageSrc}
            width={"256px"}
            alt="Original"
            style={imgBox}
          />
          <PixelArtProcessor
            imageSrc={smoothImageSrc}
            setDotsImageSrc={setDotsImageSrc}
            pixelLength={pixelLength}
          />
          <GrayscaleProcessor
            imageSrc={smoothImageSrc}
            setImageSrc={setSmoothImageSrc}
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
