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

    // 出力サイズを元の動画より小さくして処理を軽くする
    // 元のサイズの半分にする（カスタマイズ可能）
    const scale = 0.5;
    const displayWidth = Math.floor(video.videoWidth * scale);
    const displayHeight = Math.floor(video.videoHeight * scale);

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

  // 動画全体をドット絵風に処理（高速化バージョン）
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
      mimeType: "video/webm",
      videoBitsPerSecond: 2500000, // ビットレートを下げて軽量化
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

    // フレームレートを下げて処理量を削減（元の1/3のフレームレート）
    const targetFps = 30;
    const duration = video.duration;

    // 均等にフレームを抽出するためのタイムステップを計算
    const totalFrames = duration * targetFps; // 最大フレーム数を制限
    const timeStep = duration / totalFrames;

    // フレームごとに処理
    let currentFrame = 0;

    const processNextFrameBatch = async () => {
      const batchSize = 20; // 一度に処理するフレーム数
      const endFrame = Math.min(currentFrame + batchSize, totalFrames);

      for (let i = currentFrame; i < endFrame; i++) {
        // フレームの時間位置を計算
        const time = i * timeStep;
        video.currentTime = time;

        await new Promise((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            resolve(null);
          };
          video.addEventListener("seeked", onSeeked);
        });

        // フレームを描画
        renderPixelatedFrame();

        // 進捗を更新
        setProgress(Math.floor((i / totalFrames) * 100));
      }

      currentFrame = endFrame;

      if (currentFrame < totalFrames) {
        // 少し待ってから次のバッチを処理（UIのブロックを防ぐ）
        setTimeout(processNextFrameBatch, 10);
      } else {
        // 処理完了
        mediaRecorder.stop();
      }
    };

    // 処理開始
    processNextFrameBatch();
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
              {isProcessing
                ? `処理中... ${progress}%`
                : "ドット絵風に変換（高速版）"}
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
