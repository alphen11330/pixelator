"use client";
import React from "react";

type Props = {
  setImageSrc:       <Uploader setImageSrc={setImageSrc} />
  
};

const Uploader: React.FC<Props> = ({ onImageLoad }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageLoad(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};
export default Uploader;
