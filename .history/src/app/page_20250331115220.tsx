"use client";
import React, { useRef, useState, useEffect } from "react";

// Window インターフェースを拡張（型定義）
declare global {
  interface Window {
    cv: any;
  }
}

export default function PixelArtConverter() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cvLoaded, setCvLoaded] = useState(false);
  const [pixelSize, setPixelSize] = useState(64); // 初期解像度: 64x64

  useEffect(() => {
    if (typeof window !== "undefined" && !window.cv) {
      const script = document.createElement("script");
      script.src = "/js/opencv.js"; // public/js/opencv.js に配置
      script.async = true;
      script.onload = () => {
        window.cv.onRuntimeInitialized = () => {
          console.log("OpenCV.js Loaded!");
          setCvLoaded(true);
        };
      };
      document.body.appendChild(script);
    } else if (window.cv) {
      setCvLoaded(true);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (imgRef.current) imgRef.current.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processImage = () => {
    if (!cvLoaded || !imgRef.current || !canvasRef.current) return;

    const imgElement = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // OpenCV で画像処理
    const src = window.cv.imread(imgElement);
    const dst = new window.cv.Mat();

    // 画像を pixelSize x pixelSize に縮小（最近傍補間でドット絵風に）
    const small = new window.cv.Mat();
    window.cv.resize(
      src,
      small,
      new window.cv.Size(pixelSize, pixelSize),
      0,
      0,
      window.cv.INTER_NEAREST
    );

    // 元のサイズに拡大（最近傍補間）
    window.cv.resize(
      small,
      dst,
      new window.cv.Size(src.cols, src.rows),
      0,
      0,
      window.cv.INTER_NEAREST
    );

    // Canvas に表示
    window.cv.imshow(canvas, dst);

    // メモリ解放
    src.delete();
    dst.delete();
    small.delete();
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
            processImage(); // スライダー変更時に即時反映
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
