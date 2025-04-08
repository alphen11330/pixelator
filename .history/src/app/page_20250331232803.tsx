"use client";
import React, { useState } from "react";
import Uploader from "./Uploader";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  return (
    <>
      <div>ドット絵変換器</div>
      <Uploader setImageSrc={setImageSrc} />
      (imageSrc && {<div></div>})
    </>
  );
}
