import { useRef, useState, useEffect } from "react";

// Window に cv を追加（型定義）
declare global {
  interface Window {
    cv: any;
  }
}

export function usePixelate() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cvLoaded, setCvLoaded] = useState(false);
  const [pixelSize, setPixelSize] = useState(64);

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

  const processImage = () => {
    if (!cvLoaded || !imgRef.current || !canvasRef.current) return;

    const imgElement = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

  return { imgRef, canvasRef, pixelSize, setPixelSize, processImage };
}
