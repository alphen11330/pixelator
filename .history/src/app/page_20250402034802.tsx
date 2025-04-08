"use client";
import React, { useState, useEffect } from "react";
import DeviceChecker from "./deviceChecker";
import Uploader from "./components/Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import CheckBox from "./components/CheckBox";
import ImageEditor from "./components/ImageEditor";

export default function PixelArtConverter() {
  const isPC = DeviceChecker();

  const [imageSrc, setImageSrc] = useState<string | null>(null); // オリジナル保持
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null); // ドット化される前の画像
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null); // ドット化された画像

  const [pixelLength, setPixelLength] = useState(128); // ドット長
  const [grayscale, setGrayscale] = useState(false); // グレースケール化の判定
  const [invertColor, setInvertColor] = useState(false); // 色反転の判定

  //減色処理
  const [colorReduction, setColorReduction] = useState(false); // 減色処理の判定
  const [colorLevels, setColorLevels] = useState(3); // 減色処理の判定

  //Hls色調補正
  const [colorCollection, setcolorCollection] = useState(false); // 色調補正処理の判定
  const [isHue, setIsHue] = useState(false);
  const [hue, setHue] = useState(60); // 色相の値
  const [isLuminance, setIsLuminance] = useState(false);
  const [luminance, setLuminance] = useState(128); // 輝度の値
  const [isSaturation, setIsSaturation] = useState(true);
  const [saturation, setSaturation] = useState(255); // 彩度の値

  // OpenCV.js をロード
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js";
    script.async = true;
    script.onload = () => console.log("OpenCV.js Loaded");
    document.body.appendChild(script);
  }, []);

  const gridContainer: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "calc(100vh - 50px)",
    display: "grid",
    gridTemplateColumns: isPC ? "1fr 1fr" : "1fr",
    gridTemplateRows: isPC ? "1fr" : "1fr 1fr",
  };

  const gridBox: React.CSSProperties = {
    display: "flex",
    width: "100%",
    height: isPC ? "calc(100vh - 50px)" : "calc(100vh / 2 - 25px)",
    border: "solid 1px black",
  };

  const imgBox1: React.CSSProperties = {
    border: "solid 1px rgb(0, 0, 0)",
  };
  const imgBox2: React.CSSProperties = {
    border: "solid 1px rgb(0, 0, 0)",
  };
  return (
    <>
      <div style={gridContainer}>
        <div style={gridBox}>
          {smoothImageSrc && dotsImageSrc && (
            <>
              <div style={imgBox1}>
                <img src={smoothImageSrc} alt="smoot" />
              </div>
              <div style={imgBox1}>
                <img
                  src={dotsImageSrc}
                  alt="Pixel Art"
                  style={{ ...imgBox2, imageRendering: "pixelated" }}
                />
              </div>
            </>
          )}
        </div>
        <div style={gridBox}>
          <Uploader
            setImageSrc={setImageSrc}
            setSmoothImageSrc={setSmoothImageSrc}
          />
        </div>
      </div>

      {smoothImageSrc && imageSrc && (
        <>
          <ImageEditor //オリジナル画像をもとにスムーズ画像を加工
            imageSrc={imageSrc} //オリジナル画像
            setSmoothImageSrc={setSmoothImageSrc} //加工後の画像セッター
            grayscale={grayscale} //グレースケール処理の判定
            invertColor={invertColor} //色反転処理の判定
            //減色処理
            colorReduction={colorReduction} // 減色処理の判定
            colorLevels={colorLevels} // 減色数（bit）
            //色調補正
            colorCollection={colorCollection} // 色相統一の判定
            isHue={isHue}
            hue={hue}
            isLuminance={isLuminance}
            luminance={luminance}
            isSaturation={isSaturation}
            saturation={saturation}
          />

          <PixelArtProcessor //スムーズ画像をドット絵に変換
            smoothImageSrc={smoothImageSrc}
            setDotsImageSrc={setDotsImageSrc}
            pixelLength={pixelLength}
          />

          <span style={{ userSelect: "none" }}>▶</span>
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
        <div className="ml-7">
          <InputRange
            name={"カラー数（bit）"}
            min={1}
            max={8}
            step={1}
            value={colorLevels}
            unit={"bit"}
            setValue={setColorLevels}
          />
        </div>
      )}
      <br />
      <CheckBox
        name={"HLS色調補正"}
        value={colorCollection}
        setValue={setcolorCollection}
      />
      {colorCollection && (
        <>
          <br />
          <div className="ml-7">
            <CheckBox name={"色相"} value={isHue} setValue={setIsHue} />
            <CheckBox
              name={"輝度"}
              value={isLuminance}
              setValue={setIsLuminance}
            />
            <CheckBox
              name={"彩度"}
              value={isSaturation}
              setValue={setIsSaturation}
            />
            {isHue && (
              <div className="ml-7">
                <InputRange
                  name={"色相"}
                  min={0}
                  max={179}
                  step={1}
                  value={hue}
                  unit={""}
                  setValue={setHue}
                />
              </div>
            )}

            {isLuminance && (
              <div className="ml-7">
                <InputRange
                  name={"輝度"}
                  min={0}
                  max={255}
                  step={1}
                  value={luminance}
                  unit={""}
                  setValue={setLuminance}
                />
              </div>
            )}

            {isSaturation && (
              <div className="ml-7">
                <InputRange
                  name={"彩度"}
                  min={0}
                  max={255}
                  step={1}
                  value={saturation}
                  unit={""}
                  setValue={setSaturation}
                />
              </div>
            )}
          </div>
        </>
      )}

      <br />
      <br />
    </>
  );
}
