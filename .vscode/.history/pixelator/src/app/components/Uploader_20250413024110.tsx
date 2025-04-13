"use client";
import React from "react";
import style from "../button.module.css";

type Props = {
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
};

const Uploader: React.FC<Props> = ({ setImageSrc, setSmoothImageSrc }) => {
  const MAX_SIZE = 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
  };

  const boxStyle: React.CSSProperties = {
    marginLeft: "3rem",
    marginTop: "1rem",
    padding: "10px 15px",
    border: "2px solid hsl(200, 39.40%, 49.20%)",
    borderRadius: "5px",
    backgroundColor: "hsl(190, 59.30%, 88.40%)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
    userSelect: "none",
  };

  return (
    <>
      <label
        htmlFor="file-upload"
        style={{
          marginLeft: "3rem",
          marginTop: "1rem",
          display: "inline-block",
        }}
        className={style.uploadButton}
      >
        <div>画像</div>
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e)}
        style={{ display: "none" }}
      />
    </>
  );
};

export default Uploader;
