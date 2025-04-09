import React, { useState } from "react";
import DeviceChecker from "../deviceChecker";

interface DownloaderProps {
  dotsImageSrc: string | null;
}

const Downloader: React.FC<DownloaderProps> = ({ dotsImageSrc }) => {
  const [scaledImageUrl, setScaledImageUrl] = useState<string | null>(null);
  const isPC = DeviceChecker();
  const [isDisplayImg, setIsDisplayImg] = useState(false);

  const handleGenerate = () => {
    if (dotsImageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = dotsImageSrc;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
          setScaledImageUrl(scaledImage);
          setIsDisplayImg(true); // 画像読み込み後に表示
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
    border: "2px solid rgb(76, 145, 175)",
    borderRadius: "5px",
    backgroundColor: "rgb(243, 208, 218)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: isDisplayImg ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
    zIndex: 99,
    transition: "all 0.5s ease",
    pointerEvents: isDisplayImg ? "auto" : "none",
    userSelect: "none",
  };

  const downloadImgContainer: React.CSSProperties = {
    position: "relative",
    top: "0",
    width: isPC ? "auto" : "80%",
    height: isPC ? "80%" : "auto",
    aspectRatio: "1/1",
    backgroundColor: "rgb(255,255,255)",
    border: "solid 1px black",
    borderRadius: "2%",
    zIndex: 100,
    transition: "all 0.5s ease",
  };

  const downloadImg: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <>
      <button
        onClick={handleGenerate}
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
      <div style={overlayStyle} onClick={() => setIsDisplayImg(false)}>
        {scaledImageUrl && isDisplayImg && (
          <div
            style={downloadImgContainer}
            onClick={(e) => e.stopPropagation()} // 画像クリックで閉じないように
          >
            <img
              src={scaledImageUrl}
              alt="スケーリングされた画像"
              style={downloadImg}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Downloader;
