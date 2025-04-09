"use client";
import React, { useState, useEffect } from "react";
import DeviceChecker from "./deviceChecker";
import Uploader from "./components/Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import CheckBox from "./components/CheckBox";
import ImageEditor from "./components/ImageEditor";
import CollorPalette from "./components/ColorPalette";
import DitherTypeDropdown from "./components/DitherTypeDropdown";
import style from "./icon.module.css";
import Downloader from "./components/Downloader";

declare global {
  interface Window {
    cv: any;
  }
}

export default function Page() {
  const isPC = DeviceChecker();

  const [imageSrc, setImageSrc] = useState<string | null>(null); // オリジナル保持
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null); // ドット化される前の画像
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null); // ドット化された画像

  const [pixelLength, setPixelLength] = useState(128); // ドット長
  const [grayscale, setGrayscale] = useState(false); // グレースケール化の判定
  const [invertColor, setInvertColor] = useState(false); // 色反転の判定

  const [display, setDisplay] = useState(true); // 表示画像

  //Hls色調補正
  const [colorCollection, setcolorCollection] = useState(false); // 色調補正処理の判定
  const [isHue, setIsHue] = useState(false);
  const [hue, setHue] = useState(60); // 色相の値
  const [isLuminance, setIsLuminance] = useState(false);
  const [luminance, setLuminance] = useState(128); // 輝度の値
  const [isSaturation, setIsSaturation] = useState(true);
  const [saturation, setSaturation] = useState(191); // 彩度の値

  //減色処理
  const [colorReduction, setColorReduction] = useState(false); // 減色処理の判定
  const [colorLevels, setColorLevels] = useState(4); // 減色数(bit)
  const [colorPalette, setColorPalette] = useState<string[]>([]); // 減色したカラーパレット
  const [ditherType, setDitherType] = useState<
    "ordered" | "atkinson" | "floydsteinberg" | "none"
  >("ordered"); // ディザリング手法の選択
  const [ditherStrength, setDitherStrength] = useState(0.25); // ディザリング強度

  const [edgeEnhancement, setEdgeEnhancement] = useState(false); // 輪郭線強調の判定
  const [whiteSize, setWhiteSize] = useState(2); // 白画素処理サイズ（正:縮小、負:拡大）
  const [blackSize, setBlackSize] = useState(1); // 黒画素処理サイズ（正:拡大、負:縮小）
  //   // OpenCV.js をロード
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js";
    script.async = true;
    script.onload = () => console.log("OpenCV.js Loaded");
    document.body.appendChild(script);
  }, []);

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const gridContainer: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "calc(100dvh - 50px)",
    display: "grid",
    gridTemplateColumns: isPC ? "1fr 1fr" : "1fr",
    gridTemplateRows: isPC ? "1fr" : "1fr 1fr",
    zIndex: "1",
  };

  const gridBox: React.CSSProperties = {
    overflowY: "auto",
    width: "100%",
    height: isPC ? "calc(100vh - 50px)" : "calc(100vh / 2 - 25px)",
  };

  const dotsBox: React.CSSProperties = {
    position: "relative",
    height: isPC ? "" : "min(100% - 10px)",
    width: isPC ? "70%" : "",
    aspectRatio: "1/1",
    display: isPC ? "" : "inline-block",
    border: "solid 1px rgb(135, 135, 135)",
    outline: "solid 1px rgb(135, 135, 135)",
    outlineOffset: "3px",
    backgroundImage: `
    conic-gradient(
      from 0deg,
      rgb(226, 226, 226) 25%, rgb(255, 255, 255) 25%, rgb(255, 255, 255) 50%,
      rgb(226, 226, 226) 50%, rgb(226, 226, 226) 75%, rgb(255, 255, 255) 75%, rgb(255, 255, 255) 100%
    )`,
    backgroundSize: "10% 10%",
    userSelect: "none",
  };

  const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
  };

  return (
    <>
      <div style={gridContainer}>
        <div
          style={{
            ...gridBox,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={dotsBox}>
            <span
              onClick={() => setDisplay(!display)} // クリックで display 変更
            >
              {display && <span className={style.dotToImg} />}
              {!display && <span className={style.imgToDot} />}
            </span>
            {smoothImageSrc && display && (
              <PixelArtProcessor //スムーズ画像をドット絵に変換
                smoothImageSrc={smoothImageSrc}
                dotsImageSrc={dotsImageSrc}
                setDotsImageSrc={setDotsImageSrc}
                pixelLength={pixelLength}
                colorReduction={colorReduction}
                colorPalette={colorPalette}
                ditherType={ditherType}
                ditherStrength={ditherStrength}
              />
            )}
            {smoothImageSrc && !display && (
              <img
                src={smoothImageSrc}
                alt="Pixel Art"
                style={{ ...imgStyle }}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
          </div>
        </div>
        <div style={gridBox}>
          <div>
            <Uploader
              setImageSrc={setImageSrc}
              setSmoothImageSrc={setSmoothImageSrc}
            />
            {imageSrc && <Downloader dotsImageSrc={dotsImageSrc} />}
          </div>
          {imageSrc && (
            <>
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
              <div>
                <CheckBox
                  name={"HLS色調補正"}
                  value={colorCollection}
                  setValue={setcolorCollection}
                />
                {colorCollection && (
                  <>
                    <div className="ml-7">
                      <CheckBox
                        name={"色相"}
                        value={isHue}
                        setValue={setIsHue}
                      />
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
              </div>

              <div>
                <CheckBox
                  name={"輪郭線強調"}
                  value={edgeEnhancement}
                  setValue={setEdgeEnhancement}
                />
                {edgeEnhancement && (
                  <div className="ml-7">
                    <InputRange
                      name={"白画素処理サイズ"}
                      min={-10}
                      max={10}
                      step={1}
                      value={whiteSize}
                      unit={"px"}
                      setValue={setWhiteSize}
                    />
                    <InputRange
                      name={"黒画素処理サイズ"}
                      min={-10}
                      max={10}
                      step={1}
                      value={blackSize}
                      unit={"px"}
                      setValue={setBlackSize}
                    />
                  </div>
                )}
              </div>

              <div>
                <CheckBox
                  name={"減色"}
                  value={colorReduction}
                  setValue={setColorReduction}
                />
                {colorReduction && (
                  <>
                    <div className="ml-7">
                      <DitherTypeDropdown
                        ditherType={ditherType}
                        setDitherType={setDitherType}
                      />
                      {ditherType != "none" && (
                        <InputRange
                          name={"ディザリング強度"}
                          min={0}
                          max={2}
                          step={0.01}
                          value={ditherStrength}
                          unit={""}
                          setValue={setDitherStrength}
                        />
                      )}
                      <InputRange
                        name={"カラー数"}
                        min={1}
                        max={8}
                        step={1}
                        value={colorLevels}
                        unit={"bit"}
                        setValue={setColorLevels}
                      />
                    </div>
                    {/* カラーパレットの表示*/}
                    <CollorPalette
                      colorPalette={colorPalette}
                      setColorPalette={setColorPalette}
                      smoothImageSrc={smoothImageSrc}
                      colorLevels={colorLevels}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {smoothImageSrc && imageSrc && (
        <>
          <ImageEditor
            imageSrc={imageSrc}
            setSmoothImageSrc={setSmoothImageSrc}
            grayscale={grayscale}
            invertColor={invertColor}
            colorReduction={colorReduction}
            colorLevels={colorLevels}
            colorCollection={colorCollection}
            isHue={isHue}
            hue={hue}
            isLuminance={isLuminance}
            luminance={luminance}
            isSaturation={isSaturation}
            saturation={saturation}
            edgeEnhancement={edgeEnhancement}
            whiteSize={whiteSize}
            blackSize={blackSize}
          />
        </>
      )}
    </>
  );
}
