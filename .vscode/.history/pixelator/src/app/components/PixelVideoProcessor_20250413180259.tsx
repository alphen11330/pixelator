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
        canvas.width = newWidth;
        canvas.height = newHeight;

        // 最近傍補間は強制できないが、画素の拡大処理でそれっぽくできる
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(video, 0, 0, newWidth, newHeight);

        requestAnimationFrame(processFrame);
      };

      requestAnimationFrame(processFrame);
    });
  }, [dotsVideoSrc, pixelLength]);

  return (
    <div>
      <video
        src={dotsVideoSrc ?? ""}
        controls
        width="480"
        onError={() => console.error("動画の読み込みに失敗しました")}
        onLoadedData={() => console.log("動画読み込み成功")}
        style={{ border: "2px solid red" }}
      />
      {dotsVideoSrc}

      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "auto",
          imageRendering: "pixelated", // CSSでドット感を出す
        }}
      />
    </div>
  );
};

export default PixelVideoProcessor;
