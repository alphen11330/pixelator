"use client";
import React from "react";

type Props = {
  dotsImageSrc: string | null;
  fileName?: string;
};

const Downloader: React.FC<Props> = ({
  dotsImageSrc,
  fileName = "pixelart.png",
}) => {
  const handleDownload = () => {
    if (!dotsImageSrc) return;

    const link = document.createElement("a");
    link.href = dotsImageSrc;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const boxStyle: React.CSSProperties = {
    position: "sticky",
    marginLeft: "1rem",
    marginTop: "1rem",
    padding: "10px 15px",
    border: "2px solid rgb(76, 145, 175)",
    borderRadius: "5px",
    backgroundColor: "rgb(208, 237, 243)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  return (
    <>
      <button
        onClick={handleDownload}
        style={{
          ...boxStyle,
          display: "inline-block",
          textAlign: "center",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(142, 196, 219)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "rgb(208, 237, 243)")
        }
      >
        <div className="select-none">ドット絵を保存</div>
      </button>
    </>
  );
};

export default Downloader;
