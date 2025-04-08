"use client";
import React, { useState } from "react";
import { usePixelate } from "./usePixelate";
import Uploader from "./Uploader";

export default function PixelArtCanvas() {
  const { imgRef, canvasRef, pixelSize, setPixelSize, processImage } =
    usePixelate();
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  return (
    <div>
      {/* 画像アップロードコンポーネント */}
      <Uploader onImageLoad={setImageSrc} />

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
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              onLoad={processImage}
              style={{ maxWidth: "300px" }}
            />
          )}
        </div>
        <div>
          <p>ドット絵風</p>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
