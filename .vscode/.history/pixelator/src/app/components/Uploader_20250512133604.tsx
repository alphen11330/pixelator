"use client";
import React from "react";
import style from "../util.module.css";

type Props = {
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
};

const Uploader: React.FC<Props> = ({ setImageSrc, setSmoothImageSrc }) => {
  // 読み込んだ画像を縮小
  const MAX_SIZE = 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type;

    // 画像ファイル処理
    if (fileType.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const img = new Image();
          img.src = e.target.result as string;
          img.onload = () => {
            const { width, height } = img;
            let newWidth = width;
            let newHeight = height;

            if (width > MAX_SIZE || height > MAX_SIZE) {
              if (width > height) {
                newWidth = MAX_SIZE;
                newHeight = (height / width) * MAX_SIZE;
              } else {
                newHeight = MAX_SIZE;
                newWidth = (width / height) * MAX_SIZE;
              }
            }

            const canvas = document.createElement("canvas");
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
              const resizedDataUrl = canvas.toDataURL("image/png");
              setImageSrc(resizedDataUrl);
              setSmoothImageSrc(resizedDataUrl);
            }
          };
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <label
        htmlFor="file-upload"
        style={{
          display: "inline-block",
        }}
        className={style.uploadButton}
      >
        <div>画像を選択</div>
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </>
  );
};

export default Uploader;
