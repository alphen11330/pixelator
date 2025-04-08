"use client";
import React, { useEffect, useState } from "react";

export default function OpenCVComponent() {
  const [cvLoaded, setCvLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js"; // `public/js/opencv.js` を読み込む
    script.async = true;
    script.onload = () => {
      console.log("OpenCV.js Loaded");
      setCvLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div>
      {cvLoaded ? <p>✅ OpenCV.js is ready!</p> : <p>Loading OpenCV...</p>}
    </div>
  );
}
