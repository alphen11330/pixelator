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

          // ▼▼ iOS Safari 対策 ▼▼
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

          if (isIOS) {
            const win = window.open();
            if (win) {
              // iOSでは即座に開いたタブに画像を表示する
              win.document.write(`
                <!DOCTYPE html>
                <html>
                  <head><title>画像プレビュー</title></head>
                  <body style="margin:0;">
                    <img src="${scaledImage}" style="width:100vw;height:auto;" />
                  </body>
                </html>
              `);
              win.document.close();
            } else {
              alert(
                "新しいタブを開けませんでした。ポップアップブロックを解除してください。"
              );
            }
          } else {
            // ▼▼ その他ブラウザはダウンロード処理 ▼▼
            const link = document.createElement("a");
            link.href = scaledImage;
            link.download = `pixelator.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
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
