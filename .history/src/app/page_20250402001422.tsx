"use client";
import React, { useState, useEffect } from "react";
import Uploader from "./components/Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import CheckBox from "./components/CheckBox";
import ImageEditor from "./components/ImageEditor";

export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null); // オリジナル保持
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null);
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null);
  const [pixelLength, setPixelLength] = useState(128);
  const [grayscale, setGrayscale] = useState(false); // グレースケール化の判定
  const [invertColor, setInvertColor] = useState(false); // 色反転の判定
  const [colorReduction, setColorReduction] = useState(false); // 減色処理の判定
  const [colorLevels, setColorLevels] = useState(3); // 減色処理の判定
  const [colorCollection, setcolorCollection] = useState(false); // 色調補正処理の判定
  const [hue, setHue] = useState(60); // 色相

  // OpenCV.js をロード
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js";
    script.async = true;
    script.onload = () => console.log("OpenCV.js Loaded");
    document.body.appendChild(script);
  }, []);

  const imgBox: React.CSSProperties = {
    display: "inline",
    margin: "1rem",
    padding: "1rem",
    border: "solid 1px rgb(0, 0, 0)",
  };

  return (
    <>
      <Uploader
        setImageSrc={setImageSrc}
        setSmoothImageSrc={setSmoothImageSrc}
      />
      {smoothImageSrc && imageSrc && (
        <>
          <img
            src={smoothImageSrc}
            width={"256px"}
            alt="Original"
            style={imgBox}
          />

          <ImageEditor //オリジナル画像をもとにスムーズ画像を加工
            imageSrc={imageSrc} //オリジナル画像
            setSmoothImageSrc={setSmoothImageSrc} //加工後の画像セッター
            grayscale={grayscale} //グレースケール処理の判定
            invertColor={invertColor} //色反転処理の判定
            colorReduction={colorReduction} // 減色処理の判定
            colorLevels={colorLevels} // 減色数（bit）
            hueShift={hueShift} // 色相統一の判定
          />

          <PixelArtProcessor //スムーズ画像をドット絵に変換
            smoothImageSrc={smoothImageSrc}
            setDotsImageSrc={setDotsImageSrc}
            pixelLength={pixelLength}
          />

          <span style={{ userSelect: "none" }}>▶</span>
        </>
      )}
      {dotsImageSrc && (
        <>
          <img
            src={dotsImageSrc}
            width={"256px"}
            alt="Pixel Art"
            style={{ ...imgBox, imageRendering: "pixelated" }}
          />
          <br />
        </>
      )}
      <CheckBox
        name={"グレースケール"}
        value={grayscale}
        setValue={setGrayscale}
      />
      <CheckBox name={"色反転"} value={invertColor} setValue={setInvertColor} />
      <InputRange
        name={"ドット長"}
        min={8}
        max={512}
        step={8}
        value={pixelLength}
        unit={"px"}
        setValue={setPixelLength}
      />
      <CheckBox
        name={"減色"}
        value={colorReduction}
        setValue={setColorReduction}
      />
      {colorReduction && (
        <InputRange
          name={"カラー数（bit）"}
          min={1}
          max={8}
          step={1}
          value={colorLevels}
          unit={"bit"}
          setValue={setColorLevels}
        />
      )}
      <br />
      <CheckBox
        name={"色調補正"}
        value={colorCollection}
        setValue={setcolorCollection}
      />
      <br />
      <br />
    </>
  );
}
