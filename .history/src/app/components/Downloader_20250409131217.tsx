import React, { useState } from "react";
import DeviceChecker from "../deviceChecker";

interface DownloaderProps {
  dotsImageSrc: string | null;
}

const Downloader: React.FC<DownloaderProps> = ({ dotsImageSrc }) => {
  const [scaledImageUrl, setScaledImageUrl] = useState<string | null>(null);

  const handleGenerate = () => {
    if (dotsImageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // クロスオリジン対策（必要なら）
      img.src = dotsImageSrc;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        const minSize = 1280;
        if (width <= minSize && height <= minSize) {
          const scale = Math.max(minSize / width, minSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        } else if (width > minSize || height > minSize) {
          if (width > height) {
            const scale = minSize / width;
            width = minSize;
            height = Math.round(height * scale);
          } else {
            const scale = minSize / height;
            height = minSize;
            width = Math.round(width * scale);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          // @ts-ignore
          ctx.mozImageSmoothingEnabled = false;
          // @ts-ignore
          ctx.webkitImageSmoothingEnabled = false;
          // @ts-ignore
          ctx.msImageSmoothingEnabled = false;

          ctx.drawImage(img, 0, 0, width, height);
          const scaledImage = canvas.toDataURL("image/png");

          // 画像URLをReactのstateに保存して表示
          setScaledImageUrl(scaledImage);
        }
      };
    } else {
      alert("画像が指定されていません");
    }
  };

  const boxStyle: React.CSSProperties = {
    position: "sticky",
    marginLeft: "1rem",
    marginTop: "1rem",
    padding: "10px 15px",
    border: "2px solid rgb(76, 145, 175)",
    borderRadius: "5px",
    backgroundColor: "rgb(243, 208, 218)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  const isPC = DeviceChecker();
  const downloadImgContainer: React.CSSProperties = {
    position: "fixed",
    width: isPC ? "" : "70%",
    height: isPC ? "" : "70%",
    aspectRatio: "1/1",
    top: "calc(50% + 50px)",
    left: "50%",
    transform: "translate(-50%,-50%)",
    border: "solid 1px black",
    zIndex: "100",
  };

  return (
    <>
      <button
        onClick={handleGenerate}
        style={boxStyle}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(219, 142, 165)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(243, 208, 218)")
        }
      >
        画像を保存
      </button>
      <div style={downloadImgContainer} />
      {/* 生成された画像を表示 */}
      {scaledImageUrl && (
        <img
          src={scaledImageUrl}
          alt="スケーリングされた画像"
          style={{ maxWidth: "100%" }}
        />
      )}
    </>
  );
};

export default Downloader;
