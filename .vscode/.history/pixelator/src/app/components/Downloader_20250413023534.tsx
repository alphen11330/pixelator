import React from "react";
import style from "../button.module.css"; // CSSを読み込む

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
        const minSize = 960;
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
        // @ts-ignore
        ctx.mozImageSmoothingEnabled = false;
        // @ts-ignore
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
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

  return (
    <button
      style={{
        marginLeft: "1rem",
        marginTop: "1rem",
      }}
      className={style.downloadButton}
      onClick={handleDownload}
    >
      画像を保存
    </button>
  );
};

export default Downloader;
