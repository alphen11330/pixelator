import React from "react";

interface DownloaderProps {
  dotsImageSrc: string | null;
}

const Downloader: React.FC<DownloaderProps> = ({ dotsImageSrc }) => {
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

        canvas.toBlob((blob) => {
          if (!blob) {
            alert("画像の作成に失敗しました");
            return;
          }

          const blobUrl = URL.createObjectURL(blob);

          // ダウンロード
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = "pixelator.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // メモリ解放
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }, "image/png");
      }
    };
  };

  const boxStyle: React.CSSProperties = {
    position: "sticky",
    marginLeft: "1rem",
    marginTop: "1rem",
    padding: "10px 15px",
    border: "2px solid hsl(335, 39.40%, 49.20%)",
    borderRadius: "5px",
    backgroundColor: "hsl(345, 59.30%, 88.40%)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
    userSelect: "none",
  };

  return (
    <button
      onClick={handleDownload}
      style={boxStyle}
      onMouseOver={(e) =>
        (e.currentTarget.style.backgroundColor = "hsl(335, 51.70%, 70.80%)")
      }
      onMouseOut={(e) =>
        (e.currentTarget.style.backgroundColor = "hsl(345, 59.30%, 88.40%)")
      }
    >
      画像を保存
    </button>
  );
};

export default Downloader;
