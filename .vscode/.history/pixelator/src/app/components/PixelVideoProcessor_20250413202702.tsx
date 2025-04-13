import React, { useRef, useEffect, useState } from "react";
import style from "../util.module.css";

type Props = {
  dotsVideoSrc: string | null;
  setDotsVideoSrc: React.Dispatch<React.SetStateAction<string | null>>;
  pixelLength: number;
};

const PixelVideoProcessor: React.FC<Props> = ({
  dotsVideoSrc,
  setDotsVideoSrc,
  pixelLength,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedVideoSrc, setProcessedVideoSrc] = useState<string | null>(
    null
  );
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });

  // 動画のメタデータが読み込まれたときの処理
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;

    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;

    // アスペクト比を維持しながら、最大辺がpixelLengthになるようリサイズ
    let newWidth, newHeight;

    if (videoWidth >= videoHeight) {
      newWidth = pixelLength;
      newHeight = Math.floor((videoHeight / videoWidth) * pixelLength);
    } else {
      newHeight = pixelLength;
      newWidth = Math.floor((videoWidth / videoHeight) * pixelLength);
    }

    setVideoDimensions({ width: newWidth, height: newHeight });
  };

  // 1フレームをドット絵風に描画
  const renderPixelatedFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || videoDimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 一度小さなサイズで描画し、それを拡大することでピクセル化効果を得る
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // 小さいキャンバスのサイズを設定
    tempCanvas.width = videoDimensions.width;
    tempCanvas.height = videoDimensions.height;

    // 実際の表示サイズ（拡大後）- 元の動画と同じサイズに設定
    const displayWidth = video.videoWidth;
    const displayHeight = video.videoHeight;

    // メインキャンバスのサイズを設定
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // 小さいキャンバスに動画フレームを描画
    tempCtx.drawImage(
      video,
      0,
      0,
      videoDimensions.width,
      videoDimensions.height
    );

    // 画像化処理
    ctx.imageSmoothingEnabled = false; // ピクセル補間を無効化してドット感を出す
    ctx.drawImage(tempCanvas, 0, 0, displayWidth, displayHeight);

    return canvas;
  };

  // 動画全体をドット絵風に処理
  const processVideo = async () => {
    const video = videoRef.current;
    if (!video || videoDimensions.width === 0) return;

    setIsProcessing(true);
    setProgress(0);

    // 動画の準備
    video.currentTime = 0;
    await new Promise((resolve) => {
      video.addEventListener("seeked", resolve, { once: true });
    });

    // MediaRecorderを使用して新しい動画を作成
    const canvas = canvasRef.current;
    if (!canvas) {
      setIsProcessing(false);
      return;
    }

    const stream = canvas.captureStream();
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 5000000, // ビットレートを設定
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setProcessedVideoSrc(url);
      setDotsVideoSrc(url); // 親コンポーネントに新しい動画URLを渡す
      setIsProcessing(false);
    };

    mediaRecorder.start();

    // フレームレートを取得（または設定）
    const fps = 30;
    const duration = video.duration;
    const totalFrames = Math.floor(duration * fps);

    // フレームごとに処理
    let currentFrame = 0;

    const processFrame = async () => {
      if (currentFrame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }

      // 次のフレームに移動
      video.currentTime = currentFrame / fps;
      await new Promise((resolve) => {
        video.addEventListener("seeked", resolve, { once: true });
      });

      // フレームを描画
      renderPixelatedFrame();

      // 進捗を更新
      setProgress(Math.floor((currentFrame / totalFrames) * 100));

      currentFrame++;
      setTimeout(processFrame, 0); // 非同期で次のフレーム処理
    };

    processFrame();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !dotsVideoSrc) return;

    // イベントリスナーを設定
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      // クリーンアップ
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [dotsVideoSrc]);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    border: "solid 1px black",
  };

  const videoStyle: React.CSSProperties = {
    width: "100%",
    display: "block",
  };

  return (
    <div style={containerStyle}>
      {dotsVideoSrc && !processedVideoSrc && (
        <>
          <video
            ref={videoRef}
            src={dotsVideoSrc}
            style={videoStyle}
            controls
            onContextMenu={(e) => e.preventDefault()}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div
            className={style.videoControls}
            style={{ marginTop: "10px", textAlign: "center" }}
          >
            <button
              onClick={processVideo}
              disabled={isProcessing}
              className={style.controlButton}
            >
              {isProcessing ? `処理中... ${progress}%` : "ドット絵風に変換"}
            </button>
          </div>
        </>
      )}

      {processedVideoSrc && (
        <>
          <video
            src={processedVideoSrc}
            style={videoStyle}
            controls
            autoPlay
            onContextMenu={(e) => e.preventDefault()}
          />
          <div
            className={style.videoControls}
            style={{ marginTop: "10px", textAlign: "center" }}
          >
            <button
              onClick={() => {
                setProcessedVideoSrc(null);
                setDotsVideoSrc(null);
              }}
              className={style.controlButton}
            >
              新しい動画を選択
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PixelVideoProcessor;
