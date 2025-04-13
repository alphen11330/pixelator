"use client";
import React from "react";
import style from "../util.module.css";

type Props = {
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setDotsImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setVideoSrc: React.Dispatch<React.SetStateAction<string | null>>; // 動画にも対応
  setDotsVideoSrc: React.Dispatch<React.SetStateAction<string | null>>; // 動画にも対応
};

const Uploader: React.FC<Props> = ({
  setImageSrc,
  setSmoothImageSrc,
  setDotsImageSrc,
  setVideoSrc,
  setDotsVideoSrc,
}) => {
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
      setVideoSrc(null);
      setDotsVideoSrc(null);
    }

    // 動画ファイル処理
    else if (fileType.startsWith("video/")) {
      const videoURL = URL.createObjectURL(file);
      if (setVideoSrc) {
        setVideoSrc(videoURL);
      }
      setImageSrc(null);
      setSmoothImageSrc(null);
      setDotsImageSrc(null);
    }

    // サポート外
    else {
      alert(
        "対応していないファイル形式です。画像または動画を選択してください。"
      );
    }
  };

  return (
    <>
      <label
        htmlFor="file-upload"
        style={{
          marginLeft: "3rem",
          marginTop: "2rem",
          display: "inline-block",
        }}
        className={style.uploadButton}
      >
        <div>画像 / 動画を選択</div>
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </>
  );
};

export default Uploader;
