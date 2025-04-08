"use client";
import React, { useState } from "react";
import Uploader from "./Uploader";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState(null);
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null);

  return (
    <>
      <Uploader setImageSrc={setImageSrc} />
      {imageSrc && (
        <>
          <img src={imageSrc} width={"500px"}></img>
        </>
      )}
    </>
  );
}
