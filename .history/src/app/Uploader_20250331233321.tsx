"use client";
import React from "react";

type Props = {
  setImageSrc: React.Dispatch<React.SetStateAction<string | null>>;
};

const Uploader: React.FC<Props> = ({ setImageSrc }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageSrc(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const boxStyle: React.CSSProperties = {
    padding: "10px 15px",
    border: "2px solid rgb(76, 145, 175)",
    borderRadius: "5px",
    backgroundColor: "rgb(240, 240, 240)",
    color: " #333",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={boxStyle}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(76, 145, 175)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(240, 240, 240)")
        }
      />
    </div>
  );
};

export default Uploader;
