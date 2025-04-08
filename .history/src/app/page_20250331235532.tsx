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

  return (
    <>
      <Uploader setImageSrc={setImageSrc} />
      {imageSrc && (
        <>
          <img
            src={imageSrc}
            width={"256px"}
            alt="Original"
            style={{
              display: "inline",
            }}
          />
          <PixelArtProcessor
            imageSrc={imageSrc}
            setDotsImageSrc={setDotsImageSrc}
          />
        </>
      )}
      {dotsImageSrc && (
        <img
          src={dotsImageSrc}
          width={"256px"}
          alt="Pixel Art"
          style={{
            display: "inline",
            imageRendering: "pixelated",
          }}
        />
      )}
    </>
  );
}
