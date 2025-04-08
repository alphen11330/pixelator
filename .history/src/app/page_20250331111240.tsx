"use client";
import React, { useRef } from "react";
import cv from "@techstark/opencv-js";

function App() {
  const imgElementRef = useRef<HTMLImageElement>(null!);
  const canvasElementRef = useRef<HTMLCanvasElement>(null!);
  console.log(cv);

  function fileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const imgElement = imgElementRef.current;

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      imgElement.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function imgLoaded() {
    const imgElement = imgElementRef.current;
    const canvasElement = canvasElementRef.current;

    if (!imgElement.complete) {
      return; // 画像の読み込みに失敗した場合
    }

    const src = cv.imread(imgElement);
    const dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.imshow(canvasElement, dst);

    src.delete();
    dst.delete();
  }

  return (
    <div>
      <input type="file" id="fileInput" onChange={fileSelected} />
      <div>
        <img id="input_img" ref={imgElementRef} onLoad={imgLoaded} />
        <canvas id="output_img" ref={canvasElementRef} />
      </div>
    </div>
  );
}

export default App;
