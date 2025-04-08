"use client";
import React from "react";

type Props = {
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setSmoothImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
};

const Uploader: React.FC<Props> = ({ setImageSrc, setSmoothImageSrc }) => {
  const MAX_SIZE = 512;

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
    marginTop: "1rem",
    marginLeft: "1rem",
    padding: "10px 15px",
    border: "2px solid rgb(76, 145, 175)",
    borderRadius: "5px",
    backgroundColor: "rgb(240, 240, 240)",
    color: "#333",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  return (
    <div>
      <label
        htmlFor="file-upload"
        style={{
          ...boxStyle,
          display: "inline-block",
          textAlign: "center",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(142, 196, 219)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(240, 240, 240)")
        }
      >
        <span className="select-none">〘⇨⇨</span>
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default Uploader;
