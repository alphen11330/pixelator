"use client";
import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

export function usePixelate() {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cvLoaded, setCvLoaded] = useState(false);
  const [pixelSize, setPixelSize] = useState(64); // 初期解像度

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

  const processImage = () => {
    if (!cvLoaded || !imgRef.current || !canvasRef.current) return;

    const imgElement = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const src = window.cv.imread(imgElement);
    const dst = new window.cv.Mat();
    const small = new window.cv.Mat();

    // 縮小（ピクセル化）
    window.cv.resize(
      src,
      small,
