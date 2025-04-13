"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  dotsVideoSrc: string | null;
  pixelLength: number;
};

const PixelVideoProcessor: React.FC<Props> = ({
  dotsVideoSrc,
  pixelLength,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!dotsVideoSrc) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const processFrame = () => {
      if (video.paused || video.ended) return;

      const width = video.videoWidth;
      const height = video.videoHeight;

      // リサイズ後のサイズを計算（最大辺が pixelLength）
      let newWidth, newHeight;
      if (width > height) {
        newWidth = pixelLength;
        newHeight = Math.round((height / width) * pixelLength);
      } else {
        newHeight = pixelLength;
        newWidth = Math.round((width / height) * pixelLength);
      }

      // canvas サイズ設定
      canvas.width = newWidth;
      canvas.height = newHeight;

      // 描画
      ctx.drawImage(video, 0, 0, newWidth, newHeight);

      // 次のフレームも処理
      requestAnimationFrame(processFrame);
    };

    video.addEventListener("play", () => {
      requestAnimationFrame(processFrame);
    });
  }, [dotsVideoSrc, pixelLength]);

  return (
    <>
      <canvas ref={canvasRef} />
    </>
  );
};

export default PixelVideoProcessor;
