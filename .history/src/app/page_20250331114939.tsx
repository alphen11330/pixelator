"use client";
import React, { useRef, useState, useEffect } from "react";

export default function PixelArtConverter() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cvLoaded, setCvLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.cv) {
      const script = document.createElement("script");
      script.src = "/js/opencv.js";
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

  const handleImageLoad = () => {
    if (!cvLoaded || !imgRef.current || !canvasRef.current) return;

    const imgElement = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // OpenCV で画像処理
    const src = cv.imread(imgElement);
    const dst = new cv.Mat();

    // 画像を 64x64 に縮小（最近傍補間でドット絵風に）
    const small = new cv.Mat();
    cv.resize(src, small, new cv.Size(64, 64), 0, 0, cv.INTER_NEAREST);

    // 元のサイズに拡大（最近傍補間）
    cv.resize(
      small,
      dst,
      new cv.Size(src.cols, src.rows),
      0,
      0,
      cv.INTER_NEAREST
    );

    // Canvas に表示
    cv.imshow(canvas, dst);

    // メモリ解放
    src.delete();
    dst.delete();
    small.delete();
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <div style={{ display: "flex", gap: "10px" }}>
        <div>
          <p>元画像</p>
          <img
            ref={imgRef}
            onLoad={handleImageLoad}
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
