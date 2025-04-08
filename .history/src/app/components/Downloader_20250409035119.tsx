// Downloader.tsx
import React from "react";

interface DownloaderProps {
  dotsImageSrc: string | null;
}

const Downloader: React.FC<DownloaderProps> = ({ dotsImageSrc }) => {
  const handleDownload = () => {
    if (dotsImageSrc) {
      const img = new Image();
      img.src = dotsImageSrc;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 幅か高さが1280px未満の場合にスケーリング
        if (width <= 720 && height <= 720) {
          const scale = Math.max(720 / width, 720 / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        } else if (width > 720 || height > 720) {
          // 幅または高さのいずれかが1280px以上の場合、アスペクト比を保ちながらスケーリング
          if (width > height) {
            const scale = 720 / width;
            width = 720;
            height = Math.round(height * scale);
          } else {
            const scale = 720 / height;
            height = 720;
            width = Math.round(width * scale);
          }
        }

        // 新しいCanvasに画像を描画し、スケーリング後の画像を作成
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const scaledImage = canvas.toDataURL("image/png");

          // 画像を保存
          const link = document.createElement("a");
          link.href = scaledImage;
          link.download = "scaled-dots-image.png"; // 保存するファイル名
          link.click(); // ダウンロード開始
        }
      };
    } else {
      // dotsImageSrcがnullの場合は何もしない
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
