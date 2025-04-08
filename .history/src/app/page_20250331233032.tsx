"use client";
import React, { useState } from "react";
import Uploader from "./Uploader";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  return (
    <>
      {imageSrc && (
        <>
          <img src={imageSrc} width={"500px"}></img>
        </>
      )}
    </>
  );
}
