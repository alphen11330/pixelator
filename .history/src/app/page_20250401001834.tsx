"use client";
import React, { useState, useEffect } from "react";
import Uploader from "./Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(64);

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

  const labelStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "bold",
    userSelect: "none",
    marginInline: "2rem",
  };

  const sliderStyle: React.CSSProperties = {
    marginInline: "2rem",
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
          <label htmlFor="dotLengthRange" style={labelStyle}>
            ▼ドット長：{pixelSize}
            <br />
          </label>

          <input
            id="dotLengthRange"
            type="range"
            min="8"
            max="256"
            value={pixelSize}
            step="1"
            onChange={(e) => {
              setPixelSize(parseInt(e.target.value));
            }}
            style={sliderStyle}
          />
        </>
      )}
    </>
  );
}
