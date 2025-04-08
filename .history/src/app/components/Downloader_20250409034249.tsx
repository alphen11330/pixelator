// Downloader.tsx
import React from "react";

interface DownloaderProps {
  dotsImageSrc: string | null;
}

const Downloader: React.FC<DownloaderProps> = ({ dotsImageSrc }) => {
  const handleDownload = () => {
    // 画像を保存するためのリンクを作成
    const link = document.createElement("a");
    link.href = dotsImageSrc;
    link.download = "dots-image.png"; // 保存するファイル名
    link.click(); // ダウンロード開始
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
    <button
      onClick={handleDownload}
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
  );
};

export default Downloader;
