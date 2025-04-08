"use client";
import { useEffect, useRef, useState } from "react";
import cv from "@techstark/opencv-js";

export default function OpenCVTest() {
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div>
      <h1>OpenCV Test</h1>
      {isLoaded ? <p>OpenCV Loaded!</p> : <p>Loading OpenCV...</p>}
      <canvas ref={canvasRef} width={100} height={100} />
    </div>
  );
}
