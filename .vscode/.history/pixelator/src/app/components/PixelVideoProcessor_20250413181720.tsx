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

    video.addEventListener("play", () => {
      const processFrame = () => {
        if (video.paused || video.ended) return;

        // 元のサイズを取得
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

        // canvas に描画
      };
    });
  }, [dotsVideoSrc, pixelLength]);

  return (
    <>
      <video src={dotsVideoSrc ?? ""} controls />
    </>
  );
};

export default PixelVideoProcessor;
