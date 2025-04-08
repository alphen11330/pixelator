"use client";
import React from "react";
import { usePixelate } from "./usePixelate";

export default function PixelArtCanvas() {
  const { imgRef, canvasRef, pixelSize, setPixelSize, processImage } =
    usePixelate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (imgRef.current) imgRef.current.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />

      <div>
        <label>
          ピクセルサイズ: {pixelSize} x {pixelSize}
        </label>
        <input
          type="range"
          min="8"
          max="128"
          step="8"
          value={pixelSize}
          onChange={(e) => {
            setPixelSize(Number(e.target.value));
            processImage();
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <div>
          <p>元画像</p>
          <img
            ref={imgRef}
            onLoad={processImage}
            style={{ maxWidth: "300px" }}
          />
        </div>
        <div>
          <p>ドット絵風</p>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
