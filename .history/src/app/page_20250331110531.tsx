"use client";
import { useEffect, useRef, useState } from "react";
import cv from "@techstark/opencv-js";

export default function OpenCVTest() {
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const processImage = () => {
    if (!canvasRef.current) return;

    // OpenCV で画像作成
    let mat = new cv.Mat(100, 100, cv.CV_8UC3, new cv.Scalar(0, 0, 0));

    // 画像の中央に白い四角を描画
    let point1 = new cv.Point(30, 30);
    let point2 = new cv.Point(70, 70);
    let color = new cv.Scalar(255, 255, 255);
    cv.rectangle(mat, point1, point2, color, -1);

    // 画像を Canvas に描画
    cv.imshow(canvasRef.current, mat);
    mat.delete();
  };

  return (
    <div>
      <h1>OpenCV Test</h1>
      {isLoaded ? <p>OpenCV Loaded!</p> : <p>Loading OpenCV...</p>}
      <canvas ref={canvasRef} width={100} height={100} />
    </div>
  );
}
