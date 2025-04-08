"use client";
import React from "react";
import PixelArtCanvas from "./PixelArtCanvas";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  return (
    <>
      <div>ドット絵変換器</div>
      <PixelArtCanvas />
    </>
  );
}
