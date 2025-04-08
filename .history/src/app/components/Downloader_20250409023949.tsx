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

    const img = new Image();
    img.src = dotsImageSrc;

    img.onload = () => {
      // オリジナル画像の幅と高さを取得
      const width = img.width;
      const height = img.height;

      // Canvasに描画
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = width; // 元の画像の幅
        canvas.height = height; // 元の画像の高さ
        ctx.drawImage(img, 0, 0, width, height); // 画像をキャンバスに描画

        // 保存するためのデータURLを取得
        const dataUrl = canvas.toDataURL("image/png");

        // ダウンロードリンクの作成
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  };

  const boxStyle: React.CSSProperties = {
    position: "sticky",
    marginLeft: "3rem",
    marginTop: "1rem",
    padding: "10px 15px",
    border: "2px solid rgb(76, 145, 175)",
    borderRadius: "5px",
    backgroundColor: "rgb(208, 237, 243)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        style={{
          ...boxStyle,
          display: "inline-block",
          textAlign: "center",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(142, 196, 219)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(208, 237, 243)")
        }
      >
        <div className="select-none">ドット絵を保存</div>
      </button>
    </div>
  );
};

export default Downloader;
