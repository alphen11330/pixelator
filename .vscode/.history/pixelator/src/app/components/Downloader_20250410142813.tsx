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

        const minSize = 960;
        // 幅か高さがminSize px未満の場合にスケーリング
        if (width <= minSize && height <= minSize) {
          const scale = Math.max(minSize / width, minSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        } else if (width > minSize || height > minSize) {
          // 幅または高さのいずれかがminSize px以上の場合、アスペクト比を保ちながらスケーリング
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

        // 新しいCanvasに画像を描画し、スケーリング後の画像を作成
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          // ドット絵の鮮明さを保つために重要：アンチエイリアスを無効化
          ctx.imageSmoothingEnabled = false;

          // 他のブラウザ向けのプロパティも設定（古いブラウザ対応）
          // @ts-ignore
          ctx.mozImageSmoothingEnabled = false;
          // @ts-ignore
          ctx.webkitImageSmoothingEnabled = false;
          // @ts-ignore
          ctx.msImageSmoothingEnabled = false;

          ctx.drawImage(img, 0, 0, width, height);
          const scaledImage = canvas.toDataURL("image/png");

          // 画像を保存
          const link = document.createElement("a");
          link.href = scaledImage;
          link.download = `pixelator.png`;
          document.body.appendChild(link); // IEとSafariの互換性のため
          link.click();
          document.body.removeChild(link);
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
    border: "2px solid rgb(219, 145, 175)",
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
