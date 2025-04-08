"use client";
import React, { useRef, useEffect } from "react";

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
      // キャンバスを作成して画像サイズに設定
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // イメージスムージングを無効化（これがピクセルをシャープに保つ鍵）
      ctx.imageSmoothingEnabled = false;

      // 画像をキャンバスに描画
      ctx.drawImage(img, 0, 0, img.width, img.height);

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
        disabled={!dotsImageSrc}
      >
        <div className="select-none">ドット絵を保存</div>
      </button>
    </div>
  );
};

export default Downloader;
// return (
//     <>
//       <button
//         onClick={handleDownload}
//         style={{
//           ...boxStyle,
//           display: "inline-block",
//           textAlign: "center",
//         }}
//         onMouseOver={(e) =>
//           (e.currentTarget.style.backgroundColor = "rgb(219, 142, 165)")
//         }
//         onMouseOut={(e) =>
//           (e.currentTarget.style.backgroundColor = "rgb(243, 208, 218)")
//         }
//       >
//         <div className="select-none">ドット絵を保存</div>
//       </button>
//     </>
//   );
