"use client";
import React from "react";

type Props = {
  dotsImageSrc: string | null;
  fileName?: string;
};

const Downloader: React.FC<Props> = ({
  dotsImageSrc,
  fileName = "pixelart.png",
}) => {
  const handleDownload = () => {
    if (!dotsImageSrc) return;

    // 新しい画像を作成してピクセルアートを鮮明に保存
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = dotsImageSrc;

    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;

      // 1280を超えるスケーリングの計算
      let newWidth = originalWidth;
      let newHeight = originalHeight;

      // 横のサイズが1280を超える場合
      if (newWidth > newHeight) {
        if (newWidth > 1280) {
          newHeight = Math.floor((1280 / newWidth) * newHeight);
          newWidth = 1280;
        }
      }
      // 縦のサイズが1280を超える場合
      else {
        if (newHeight > 1280) {
          newWidth = Math.floor((1280 / newHeight) * newWidth);
          newHeight = 1280;
        }
      }

      // スケーリングした画像を描画するキャンバスを作成
      const canvas = document.createElement("canvas");
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // イメージスムージングを無効化（これがピクセルをシャープに保つ鍵）
      ctx.imageSmoothingEnabled = false;

      // 画像をスケーリングしてキャンバスに描画
      ctx.drawImage(
        img,
        0,
        0,
        originalWidth,
        originalHeight,
        0,
        0,
        newWidth,
        newHeight
      );

      // キャンバスから鮮明なPNGを生成
      const pngDataUrl = canvas.toDataURL("image/png");

      // ダウンロードリンクを作成
      const link = document.createElement("a");
      link.href = pngDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  const boxStyle: React.CSSProperties = {
    position: "sticky",
    marginLeft: "1rem",
    marginTop: "1rem",
    padding: "10px 15px",
    border: "2px solid rgb(219, 142, 165)",
    borderRadius: "5px",
    backgroundColor: "rgb(243, 208, 218)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  return (
    <>
      <button
        onClick={handleDownload}
        style={{
          ...boxStyle,
          display: "inline-block",
          textAlign: "center",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(219, 142, 165)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(243, 208, 218)")
        }
      >
        <div className="select-none">ドット絵を保存</div>
      </button>
    </>
  );
};

export default Downloader;
