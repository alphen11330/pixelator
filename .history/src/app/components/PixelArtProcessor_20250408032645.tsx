"use client";
import React, { useEffect } from "react";

declare global {
  interface Window {
    cv: any;
  }
}

type Props = {
  smoothImageSrc: string | null;
  dotsImageSrc: string | null;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
  colorReduction: boolean;
  colorPalette: string[];
};

// RGBの距離を計算
const colorDistance = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
) => {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

// パレットの中から一番近い色を返す
const findNearestColor = (
  r: number,
  g: number,
  b: number,
  palette: [number, number, number][]
) => {
  let minDist = Infinity;
  let nearestColor: [number, number, number] = palette[0];

  for (const [pr, pg, pb] of palette) {
    const dist = colorDistance(r, g, b, pr, pg, pb);
    if (dist < minDist) {
      minDist = dist;
      nearestColor = [pr, pg, pb];
    }
  }

  return nearestColor;
};

// "rgb(255, 0, 0)" → [255, 0, 0]
const parseRgb = (rgbStr: string): [number, number, number] => {
  const match = rgbStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
};

const PixelArtProcessor: React.FC<Props> = ({
  smoothImageSrc,
  dotsImageSrc,
  setDotsImageSrc,
  pixelLength,
  colorReduction,
  colorPalette,
}) => {
  useEffect(() => {
    const processImage = () => {
      const cv = window.cv;
      if (!cv) {
        console.error("OpenCV is not loaded.");
        return;
      }

      if (!smoothImageSrc) return;

      const imgElement = document.createElement("img");
      imgElement.src = smoothImageSrc;

      imgElement.onload = async () => {
        const src = cv.imread(imgElement);
        let width = src.cols;
        let height = src.rows;

        let newWidth, newHeight;
        if (width > height) {
          newWidth = pixelLength;
          newHeight = Math.round((height / width) * pixelLength);
        } else {
          newHeight = pixelLength;
          newWidth = Math.round((width / height) * pixelLength);
        }

        const dst = new cv.Mat();
        const size = new cv.Size(newWidth, newHeight);
        cv.resize(src, dst, size, 0, 0, cv.INTER_NEAREST);

        const canvas = document.createElement("canvas");
        canvas.width = pixelLength;
        canvas.height = pixelLength;
        const ctx = canvas.getContext("2d");

        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        cv.imshow(canvas, dst);

        // 色置換処理
        if (colorReduction && colorPalette.length > 0 && ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const paletteRGB = colorPalette.map(parseRgb);

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // αが0に近ければスキップ
            if (a < 10) continue;

            const [nr, ng, nb] = findNearestColor(r, g, b, paletteRGB);
            data[i] = nr;
            data[i + 1] = ng;
            data[i + 2] = nb;
          }

          ctx.putImageData(imageData, 0, 0);
        }

        setDotsImageSrc(canvas.toDataURL());

        src.delete();
        dst.delete();
      };
    };

    processImage();
  }, [smoothImageSrc, pixelLength, colorReduction, colorPalette]);

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    imageRendering: "pixelated",
  };

  return (
    <>
      {dotsImageSrc && (
        <img src={dotsImageSrc} alt="Pixel Art" style={imgStyle} />
      )}
    </>
  );
};

export default PixelArtProcessor;
