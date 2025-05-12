"use client";
import React, { useState, useEffect } from "react";
import useDeviceChecker from "./deviceChecker";
import style from "./util.module.css";

import Uploader from "./components/Uploader";
import PixelArtProcessor from "./components/PixelArtProcessor";
import InputRange from "./components/InputRange";
import CheckBox from "./components/CheckBox";
import ImageEditor from "./components/ImageEditor";
import DitherTypeDropdown from "./components/DitherTypeDropdown";
import Downloader from "./components/Downloader";
import ColorPalette from "./components/ColorPalette";
import RandomButton from "./components/RandomButton";

declare global {
  interface Window {
    cv: any;
  }
}

export default function Page() {
  const isPC = useDeviceChecker();

  const [imageSrc, setImageSrc] = useState<string | null>(null); // オリジナル保持
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null); // ドット化される前の画像
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null); // ドット化された画像

  const [isRecommendedSize, setIsRecommendedSize] = useState(true);

  const [pixelLength, setPixelLength] = useState(256); // ドット長

  const [display, setDisplay] = useState(true); // 表示画像

  //色調補正
  const [colorCollection, setColorCollection] = useState(false); // 色調補正処理の判定
  const [isHue, setIsHue] = useState(false);
  const [hue, setHue] = useState(60); // 色相の値
  const [isLuminance, setIsLuminance] = useState(false);
  const [luminance, setLuminance] = useState(10); // 輝度の値
  const [isSaturation, setIsSaturation] = useState(true);
  const [saturation, setSaturation] = useState(30); // 彩度の値
  const [contrast, setContrast] = useState(true);
  const [contrastLevel, setContrastLevel] = useState(1.2); // コントラスト
  const [brightness, setBrightness] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState(25); // 明度

  //減色処理
  const [colorReduction, setColorReduction] = useState(false); // 減色処理の判定
  const [colorLevels, setColorLevels] = useState(5); // 減色数(bit)
  const [colorPalette, setColorPalette] = useState<string[]>([]); // 減色したカラーパレット
  const [refreshColorPalette, setRefreshColorPalette] = useState(false); // カラーパレットをリフレッシュ
  const [lockPalette, setLockPalette] = useState(false);

  //ディザリング
  const [ditherType, setDitherType] = useState("bayerMatrixBasic"); // ディザリング手法の選択
  const [ditherStrength, setDitherStrength] = useState(0.1); // ディザリング強度

  //輪郭線強調
  const [edgeEnhancement, setEdgeEnhancement] = useState(false); // 輪郭線強調の判定
  const [whiteSize, setWhiteSize] = useState(2); // 白画素処理サイズ（正:縮小、負:拡大）
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
    height: "100svh",
    display: "grid",
    gridTemplateColumns: isPC ? "1fr 1fr" : "1fr",
    gridTemplateRows: isPC ? "1fr" : "1fr 1fr",
    zIndex: "1",
    backgroundColor: "hsl(0, 0.00%, 100.00%)",
  };

  const gridBox: React.CSSProperties = {
    overflowY: "auto",
    width: "100%",
    height: isPC ? "calc(100svh - 0px)" : "calc(100svh )",
  };

  const dotsBox: React.CSSProperties = {
    position: "relative",
    height: isPC ? "" : "min(100% - 10px)",
    width: isPC ? "80%" : "",
    aspectRatio: "1/1",
    display: "flex",
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
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
    opacity: display ? "0" : "1",
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
          {/* 画像ディスプレイ  */}
          <div style={dotsBox}>
            <span
              onClick={() => setDisplay(!display)} // クリックで display 変更
            >
              {display && <span className={style.dotToImg} />}
              {!display && <span className={style.imgToDot} />}
            </span>

            {imageSrc && (
              <span style={{ opacity: display ? "1" : "0" }}>
                <PixelArtProcessor //スムーズ画像をドット絵に変換
                  smoothImageSrc={smoothImageSrc}
                  dotsImageSrc={dotsImageSrc}
                  setDotsImageSrc={setDotsImageSrc}
                  pixelLength={pixelLength}
                  colorReduction={colorReduction}
                  colorPalette={colorPalette}
                  colorLevels={colorLevels}
                  ditherType={ditherType}
                  ditherStrength={ditherStrength}
                />
              </span>
            )}
            {imageSrc && smoothImageSrc && (
              <>
                <img
                  src={smoothImageSrc}
                  alt="edited Image"
                  style={imgStyle}
                  onContextMenu={(e) => e.preventDefault()}
                />{" "}
              </>
            )}
          </div>
        </div>
        {/* パネル操作画面 */}
        <div style={gridBox}>
          <div
            style={{
              width: "calc(100% - 6rem)",
              marginTop: "2rem",
              marginInline: "auto",
              display: "flex",
              alignItems: "strech",
            }}
          >
            <Uploader // 画像をアップロード
              setImageSrc={setImageSrc}
              setSmoothImageSrc={setSmoothImageSrc}
            />
            {imageSrc && (
              <>
                <Downloader // ドット画像をダウンロード
                  dotsImageSrc={dotsImageSrc}
                  isRecommendedSize={isRecommendedSize}
                />
                <RandomButton
                  setColorCollection={setColorCollection}
                  setEdgeEnhancement={setEdgeEnhancement}
                  setColorReduction={setColorReduction}
                  setContrast={setContrast}
                  setIsHue={setIsHue}
                  setIsSaturation={setIsSaturation}
                  setPixelLength={setPixelLength}
                  setContrastLevel={setContrastLevel}
                  setHue={setHue}
                  setSaturation={setSaturation}
                  setWhiteSize={setWhiteSize}
                  setDitherStrength={setDitherStrength}
                  setColorPalette={setColorPalette}
                  setDitherType={setDitherType}
                />
              </>
            )}
          </div>
          {imageSrc && (
            <div>
              <CheckBox
                name={"推奨サイズで保存"}
                value={isRecommendedSize}
                setValue={setIsRecommendedSize}
              />
            </div>
          )}
          {imageSrc && (
            <>
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
                  name={"色調補正"}
                  value={colorCollection}
                  setValue={setColorCollection}
                />
                {colorCollection && (
                  <>
                    <div className="ml-7">
                      <CheckBox
                        name={"コントラスト"}
                        value={contrast}
                        setValue={setContrast}
                      />

                      <CheckBox
                        name={"明度"}
                        value={brightness}
                        setValue={setBrightness}
                      />
                      {contrast && (
                        <div className="ml-7">
                          <InputRange
                            name={"コントラスト"}
                            min={0.1}
                            max={2}
                            step={0.1}
                            value={contrastLevel}
                            unit={""}
                            setValue={setContrastLevel}
                          />
                        </div>
                      )}
                      {brightness && (
                        <div className="ml-7">
                          <InputRange
                            name={"明度"}
                            min={-100}
                            max={100}
                            step={1}
                            value={brightnessLevel}
                            unit={""}
                            setValue={setBrightnessLevel}
                          />
                        </div>
                      )}
                    </div>

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
                            min={-255}
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
                            min={-255}
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
                      min={-5}
                      max={5}
                      step={1}
                      value={whiteSize}
                      unit={"px"}
                      setValue={setWhiteSize}
                    />
                  </div>
                )}
              </div>

              <div className="mb-14">
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
                          max={1}
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
                  </>
                )}

                {/* カラーパレットの表示*/}
                <ColorPalette
                  colorReduction={colorReduction}
                  colorPalette={colorPalette}
                  setColorPalette={setColorPalette}
                  smoothImageSrc={smoothImageSrc}
                  colorLevels={colorLevels}
                  imageSrc={imageSrc}
                  lockPalette={lockPalette}
                  setLockPalette={setLockPalette}
                />
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
            colorCollection={colorCollection}
            isHue={isHue}
            hue={hue}
            isLuminance={isLuminance}
            luminance={luminance}
            isSaturation={isSaturation}
            saturation={saturation}
            edgeEnhancement={edgeEnhancement}
            whiteSize={whiteSize}
            contrast={contrast}
            contrastLevel={contrastLevel}
            brightness={brightness}
            brightnessLevel={brightnessLevel}
          />
        </>
      )}
    </>
  );
}
