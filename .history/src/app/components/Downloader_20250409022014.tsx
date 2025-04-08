"use client";
import React from "react";

interface DownloaderProps {
  dotsImageSrc: string | null;
  fileName?: string;
}

const Downloader: React.FC<DownloaderProps> = ({
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

  if (!dotsImageSrc) return null;

  return (
    <div className="mt-4 text-center">
      <Button onClick={handleDownload}>ドット絵を保存</Button>
    </div>
  );
};

export default Downloader;
