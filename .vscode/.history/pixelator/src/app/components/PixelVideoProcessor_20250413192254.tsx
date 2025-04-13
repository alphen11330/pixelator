import React, { useRef, useEffect, useState } from "react";
import style from "../util.module.css";

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
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);

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

  // キャンバスに動画をドット絵風に描画
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

    // 実際の表示サイズ（拡大後）
    const displayWidth = Math.min(500, window.innerWidth - 40); // 表示上限を設定
    const ratio = displayWidth / videoDimensions.width;
    const displayHeight = videoDimensions.height * ratio;

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

    // 画像化処理（ここではシンプルに拡大のみ）
    ctx.imageSmoothingEnabled = false; // ピクセル補間を無効化してドット感を出す
    ctx.drawImage(tempCanvas, 0, 0, displayWidth, displayHeight);

    // 動画再生中なら次のフレームを描画
    if (isPlaying) {
      requestAnimationFrame(renderPixelatedFrame);
    }
  };

  // 再生状態の管理
  const handlePlay = () => {
    setIsPlaying(true);
    requestAnimationFrame(renderPixelatedFrame);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // イベントリスナーを設定
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      // クリーンアップ
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  // 動画ディメンションが変化したとき、一度描画する
  useEffect(() => {
    if (videoDimensions.width > 0) {
      renderPixelatedFrame();
    }
  }, [videoDimensions]);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    border: "solid 1px black",
  };

  const videoStyle: React.CSSProperties = {
    position: "absolute",
    opacity: 0,
  };

  return (
    <div style={containerStyle}>
      {dotsVideoSrc && (
        <>
          <video
            ref={videoRef}
            src={dotsVideoSrc}
            style={videoStyle}
            controls={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <canvas
            ref={canvasRef}
            style={{ display: "block", margin: "0 auto" }}
          />
          <div className={style.videoControls}>
            <button
              onClick={() => videoRef.current?.play()}
              className={style.controlButton}
            >
              再生
            </button>
            <button
              onClick={() => videoRef.current?.pause()}
              className={style.controlButton}
            >
              一時停止
            </button>
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  renderPixelatedFrame();
                }
              }}
              className={style.controlButton}
            >
              最初に戻る
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PixelVideoProcessor;
