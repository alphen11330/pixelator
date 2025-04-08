"use client";
import React, { useState, useEffect } from "react";
import DeviceChecker from "./deviceChecker";
import Uploader from "./components/Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import CheckBox from "./components/CheckBox";
import ImageEditor from "./components/ImageEditor";
import createPallet from "./components/createPallet";

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

  const [colorPalette, setColorPalette] = useState<string[]>([]);
  //カラーパレット
  // カラーパレットの生成
  useEffect(() => {
    // 非同期関数を定義して実行する
    const fetchPalette = async () => {
      if (imageSrc) {
        const palette = await createPalet(imageSrc); // 非同期でカラーパレットを取得
        setColorPalette(palette); // 取得したカラーパレットをステートにセット
      }
    };

    fetchPalette(); // 非同期関数の呼び出し
  }, [imageSrc]); // imageSrcが変更されたときに実行

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
    position: "sticky",
    overflowY: "auto",
    width: "100%",
    height: isPC ? "calc(100vh - 50px)" : "calc(100vh / 2 - 25px)",
  };

  const dotsBox: React.CSSProperties = {
    position: "relative",
    height: "min(100% - 2rem, 560px)",
    aspectRatio: "1/1",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    display: isPC ? "" : "inline-block",
    border: "solid 1px rgb(135, 135, 135)",
    outline: "solid 1px rgb(135, 135, 135)",
    outlineOffset: "5px",
    backgroundImage: `
    conic-gradient(
      from 0deg,
      rgb(226, 226, 226) 25%, rgb(255, 255, 255) 25%, rgb(255, 255, 255) 50%,
      rgb(226, 226, 226) 50%, rgb(226, 226, 226) 75%, rgb(255, 255, 255) 75%, rgb(255, 255, 255) 100%
    )`,
    backgroundSize: "10% 10%",
    userSelect: "none",
  };

  const smoothBox: React.CSSProperties = {
    position: "sticky",
    display: "block",
    marginLeft: "auto",
    top: "10px",
    right: "10px",
    width: "30%",
    aspectRatio: "1/1",
    border: "solid 1px rgb(135, 135, 135)",
    outline: "solid 1px rgb(135, 135, 135)",
    outlineOffset: "5px",
    backgroundColor: "#ccc",
    backgroundImage: `
    conic-gradient(
      from 0deg,
      rgb(226, 226, 226) 25%, rgb(255, 255, 255) 25%, rgb(255, 255, 255) 50%,
      rgb(226, 226, 226) 50%, rgb(226, 226, 226) 75%, rgb(255, 255, 255) 75%, rgb(255, 255, 255) 100%
    )`,
    backgroundSize: "10% 10%",
    userSelect: "none",
    zIndex: "1",
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <>
      <div style={gridContainer}>
        <div style={gridBox}>
          <>
            <div style={dotsBox}>
              {dotsImageSrc && (
                <img
                  src={dotsImageSrc}
                  alt="Pixel Art"
                  style={{ ...imgStyle, imageRendering: "pixelated" }}
                />
              )}
            </div>
          </>
        </div>
        <div style={gridBox}>
          <div style={smoothBox}>
            {smoothImageSrc && (
              <img src={smoothImageSrc} alt="smoot" style={imgStyle} />
            )}
          </div>
          <Uploader
            setImageSrc={setImageSrc}
            setSmoothImageSrc={setSmoothImageSrc}
          />
          <CheckBox
            name={"グレースケール"}
            value={grayscale}
            setValue={setGrayscale}
          />
          <CheckBox
            name={"色反転"}
            value={invertColor}
            setValue={setInvertColor}
          />
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
                name={"カラー数"}
                min={1}
                max={4}
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
          {/* カラーパレットの表示*/}
          <div style={{ marginTop: "20px" }}>
            <h2>Color Palette (RGB Strings)</h2>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {colorPalette.map((color, index) => (
                <div key={index}>
                  {/* 色のサンプルとRGBの文字列 */}
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      backgroundColor: color,
                      borderRadius: "8px",
                      marginBottom: "5px",
                    }}
                    title={color} // ツールチップでRGBの文字列を表示
                  ></div>
                </div>
              ))}
            </div>
          </div>
          {/* カラーパレットの表示*/}

          <br />
          <br />
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
        </>
      )}
    </>
  );
}
