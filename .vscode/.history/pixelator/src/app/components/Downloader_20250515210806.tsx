import React from "react";
import style from "../util.module.css";

type Props = {
  dotsImageSrc: string | null;
  isRecommendedSize: boolean;
};

const Downloader: React.FC<Props> = ({ dotsImageSrc, isRecommendedSize }) => {
  const handleDownload = () => {
    if (!dotsImageSrc) {
      alert("画像が指定されていません");
      return;
    }

    const img = new Image();
    img.src = dotsImageSrc;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (isRecommendedSize) {
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
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const randomStr = generateRandomString();
            const fileName = `pixelator_${randomStr}.png`;

            const url = URL.createObjectURL(blob);
            // ダウンロード
            const link = document.createElement("a");
            link.href = url;
            link.download = "pixelator.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // メモリ解放
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        }, "image/png");
      }
    };
  };

  function generateRandomString(length = 8) {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  return (
    <button
      style={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        marginLeft: "1rem",
      }}
      className={style.downloadButton}
      onClick={handleDownload}
    >
      保存
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="ml-1 size-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
    </button>
  );
};

export default Downloader;
