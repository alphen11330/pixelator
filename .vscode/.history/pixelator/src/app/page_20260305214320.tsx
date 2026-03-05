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
import RefreshButton from "./components/RefreshButton";
import Painter from "./components/painter/Painter";
import RandomButton from "./components/RandomButton";
import Header from "./header";

import { pupupuFont } from "./fonts/pupupuFont";
import ImgPreviewer from "./components/ImgPreviewer";
import { Exo_2 } from "next/font/google";
import InputColorLevelsRange from "./components/InputColorLevelsRange";
import Link from "next/link";

declare global {
  interface Window {
    cv: any;
  }
}

export default function Page() {
  const isPC = useDeviceChecker();
  const [isJP, setIsJP] = useState(true);

  const [imageSrc, setImageSrc] = useState<string | null>(null); // オリジナル保持
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null); // ドット化される前の画像
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null); // ドット化された画像

  const [isRecommendedSize, setIsRecommendedSize] = useState(true);

  const [pixelLength, setPixelLength] = useState(256); // ドット長

  const [display, setDisplay] = useState(true); // 表示画像

  //色調補正
  const [colorCollection, setColorCollection] = useState(true); // 色調補正処理の判定
  const [isHue, setIsHue] = useState(false);
  const [hue, setHue] = useState(10); // 色相の値
  const [isLuminance, setIsLuminance] = useState(false);
  const [luminance, setLuminance] = useState(10); // 輝度の値
  const [isSaturation, setIsSaturation] = useState(true);
  const [saturation, setSaturation] = useState(30); // 彩度の値
  const [contrast, setContrast] = useState(true);
  const [contrastLevel, setContrastLevel] = useState(1.1); // コントラスト
  const [brightness, setBrightness] = useState(false);
  const [brightnessLevel, setBrightnessLevel] = useState(25); // 明度

  //減色処理
  const [colorReduction, setColorReduction] = useState(true); // 減色処理の判定
  const [colorLevels, setColorLevels] = useState(5); // 減色数(bit)
  const [colorPalette, setColorPalette] = useState<string[]>([]); // 減色したカラーパレット
  const [lockPalette, setLockPalette] = useState(false);

  //ディザリング
  const [ditherType, setDitherType] = useState("bayerMatrixBasic"); // ディザリング手法の選択
  const [ditherStrength, setDitherStrength] = useState(0.1); // ディザリング強度

  //輪郭線強調
  const [edgeEnhancement, setEdgeEnhancement] = useState(true); // 輪郭線強調の判定
  const [whiteSize, setWhiteSize] = useState(2); // 白画素処理サイズ（正:縮小、負:拡大）

  const [isPainter, setIsPainter] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

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
    height: "calc(100svh - 50px)",
    display: "grid",
    gridTemplateColumns: isPC ? "1fr 1fr" : "1fr",
    gridTemplateRows: isPC ? "1fr" : "1fr 1fr",
    zIndex: "1",
    backgroundColor: "hsl(0, 0.00%, 100.00%)",
  };

  const gridBox: React.CSSProperties = {
    overflowY: "auto",
    width: "100%",
    // height: isPC ? "calc(100svh - 0px)" : "calc(100svh / 2)",
  };

  const dotsBox: React.CSSProperties = {
    position: "relative",
    height: isPC ? "" : "min(100% - 20px)",
    width: isPC ? "80%" : "min(100% - 20px)",
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
    backgroundSize: isPC ? "10% 10%" : "40px 40px",
    backgroundPosition: isPC ? "2.5% 2.5%" : "10px 10px",
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
      <Header isJP={isJP} setIsJP={setIsJP} />
      <ImgPreviewer
        imageSrc={dotsImageSrc}
        isPreview={isPreview}
        setIsPreview={setIsPreview}
      />
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
            {imageSrc && (
              <>
                {/* ドット風絵オリジナル画像の交換ボタン */}
                <span
                  onClick={() => setDisplay(!display)} // クリックで display 変更
                >
                  {display && <span className={style.dotToImg} />}
                  {!display && <span className={style.imgToDot} />}
                </span>
                {/* プレビューボタン */}
                <span className={style.previewButton}>
                  <div
                    className={pupupuFont.className}
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      fontSize: "2.5rem",
                      color: "rgb(255, 175, 209)",
                      WebkitTextStroke: "1px rgb(163, 158, 194)",
                      textShadow: "4px 3px  rgb(146, 208, 255)",
                    }}
                    onClick={() => setIsPreview(!isPreview)}
                  >
                    P
                  </div>
                </span>

                {/* <span
                  className={style.openPainter}
                  onClick={() => setIsPainter(true)} // クリックで ペインターを開く
                >
                  <img
                    src="/palette.png"
                    alt="Palette"
                    className={style.palette}
                  />
                  <img src="/brush.png" alt="Brush" className={style.brush} />
                </span> */}

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
              </>
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
          {imageSrc && (
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
              setColorLevels={setColorLevels}
              colorLevels={colorLevels}
              setLockPalette={setLockPalette}
            />
          )}
          <div
            style={{
              width: "calc(100% - 6rem)",
              marginTop: "1rem",
              marginInline: "auto",
              display: "flex",
              alignItems: "strech",
            }}
          >
            <Uploader // 画像をアップロード
              setImageSrc={setImageSrc}
              setSmoothImageSrc={setSmoothImageSrc}
              isJP={isJP}
            />

            {imageSrc && (
              <>
                <Downloader // ドット画像をダウンロード
                  dotsImageSrc={dotsImageSrc}
                  isRecommendedSize={isRecommendedSize}
                  isJP={isJP}
                />
                {/* リフレッシュボタン */}
                <RefreshButton
                  setColorCollection={setColorCollection}
                  setEdgeEnhancement={setEdgeEnhancement}
                  setColorReduction={setColorReduction}
                  setContrast={setContrast}
                  setBrightness={setBrightness}
                  setIsHue={setIsHue}
                  setIsLuminance={setIsLuminance}
                  setIsSaturation={setIsSaturation}
                  setPixelLength={setPixelLength}
                  setContrastLevel={setContrastLevel}
                  setBrightnessLevel={setBrightnessLevel}
                  setHue={setHue}
                  setLuminance={setLuminance}
                  setSaturation={setSaturation}
                  setWhiteSize={setWhiteSize}
                  setDitherType={setDitherType}
                  setDitherStrength={setDitherStrength}
                  setColorLevels={setColorLevels}
                  setLockPalette={setLockPalette}
                />
              </>
            )}
          </div>
          {imageSrc && (
            <div>
              <CheckBox
                name={isJP ? "推奨サイズで保存" : "Save with Recommended Size"}
                value={isRecommendedSize}
                setValue={setIsRecommendedSize}
              />
            </div>
          )}
          {imageSrc && (
            <>
              <InputRange
                name={isJP ? "ピクセルサイズ" : "Pixel Size"}
                min={8}
                max={1024}
                step={8}
                value={pixelLength}
                unit={"px"}
                setValue={setPixelLength}
              />

              <div>
                <CheckBox
                  name={isJP ? "色調補正" : "Color Adjustment"}
                  value={colorCollection}
                  setValue={setColorCollection}
                />
                {colorCollection && (
                  <>
                    <div className="ml-7">
                      <CheckBox
                        name={isJP ? "コントラスト" : "Contrast"}
                        value={contrast}
                        setValue={setContrast}
                      />

                      <CheckBox
                        name={isJP ? "明度" : "Brightness"}
                        value={brightness}
                        setValue={setBrightness}
                      />
                      {contrast && (
                        <div className="ml-7">
                          <InputRange
                            name={isJP ? "コントラスト" : "Contrast"}
                            min={0.1}
                            max={2}
                            step={0.01}
                            value={contrastLevel}
                            unit={""}
                            setValue={setContrastLevel}
                          />
                        </div>
                      )}
                      {brightness && (
                        <div className="ml-7">
                          <InputRange
                            name={isJP ? "明度" : "Brightness"}
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
                        name={isJP ? "色相" : "Hue"}
                        value={isHue}
                        setValue={setIsHue}
                      />
                      <CheckBox
                        name={isJP ? "輝度" : "Luminance"}
                        value={isLuminance}
                        setValue={setIsLuminance}
                      />
                      <CheckBox
                        name={isJP ? "彩度" : "Saturation"}
                        value={isSaturation}
                        setValue={setIsSaturation}
                      />
                      {isHue && (
                        <div className="ml-7">
                          <InputRange
                            name={isJP ? "色相" : "Hue"}
                            min={0}
                            max={180}
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
                            name={isJP ? "輝度" : "Luminance"}
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
                            name={isJP ? "彩度" : "Saturation"}
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
                  name={isJP ? "エッジ強調" : "Edge Enhancement"}
                  value={edgeEnhancement}
                  setValue={setEdgeEnhancement}
                />
                {edgeEnhancement && (
                  <div className="ml-7">
                    <InputRange
                      name={isJP ? "エッジ強調度" : "Edge Enhancement Strength"}
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
                  name={isJP ? "減色" : "Color Reduction"}
                  value={colorReduction}
                  setValue={setColorReduction}
                />
                {colorReduction && (
                  <>
                    <div className="ml-7">
                      <DitherTypeDropdown
                        ditherType={ditherType}
                        setDitherType={setDitherType}
                        isJP={isJP}
                      />
                      {ditherType != "none" && (
                        <InputRange
                          name={isJP ? "ディザリング強度" : "Dither Strength"}
                          min={0}
                          max={1}
                          step={0.01}
                          value={ditherStrength}
                          unit={""}
                          setValue={setDitherStrength}
                        />
                      )}
                      <InputColorLevelsRange
                        name={isJP ? "カラー数" : "Palette Colors"}
                        min={1}
                        max={8}
                        step={1}
                        value={colorLevels}
                        unit={isJP ? "色" : "colors"}
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
                  colorLevels={Math.pow(2, colorLevels)}
                  imageSrc={imageSrc}
                  lockPalette={lockPalette}
                  setLockPalette={setLockPalette}
                  isJP={isJP}
                />
              </div>
            </>
          )}

          {/* 利用規約 */}
          {!imageSrc && (
            <div
              style={{
                width: "80%",
                height: "auto",
                marginInline: "auto",
                padding: "1rem",
                marginBlock: "1rem",
                background: "rgb(255, 255, 255)",
                border: "double 1px rgb(0,0,0)",
                outline: "solid 1px rgb(0,0,0)",
                outlineOffset: "4px",
                borderRadius: "5px",
              }}
            >
              <span
                style={{
                  display: "block",
                  textAlign: "center",
                  marginBottom: "0.8rem",
                  marginTop: "-0.5rem",
                  fontSize: "4rem",
                  color: "rgb(255, 74, 74)",
                  WebkitTextStroke: "1px rgb(255, 235, 235)",
                  textShadow: "0.3rem 0.3rem  rgb(160, 161, 228)",
                }}
                className={pupupuFont.className}
              >
                {isJP ? "読んでね！" : "READ!"}
              </span>

              <span
                style={{
                  display: "block",
                  width: "fit-content",
                  marginInline: "auto",
                  marginBottom: "0.8rem",
                  fontSize: "1.2rem",
                }}
              >
                {isJP
                  ? "-当サイトの利用について-"
                  : "- About the use of this site -"}
              </span>
              <span>
                <p>
                  {isJP ? "・商用利用OKです" : "・Commercial use is allowed."}
                </p>
                <p>{isJP ? "・報告不要です" : "・No reporting required."}</p>
                <p>
                  {isJP
                    ? "・クレジットは表記不要です"
                    : "・No credit notation required."}
                </p>
                <p>
                  {isJP
                    ? "・当ツールで情報取集は行っておりません"
                    : "・This tool does not collect information."}
                </p>
                <p>
                  {isJP
                    ? "・公序良俗に反しない使い方をお願いいたします"
                    : "・Please use it in a way that does not violate public order and morals."}
                </p>
                <p>
                  {isJP
                    ? "・予告なくサービス変更や終了をする場合があります"
                    : "・The service may be changed or terminated without prior notice."}
                </p>
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "fit-content",
                  marginLeft: "auto",
                  marginTop: "1rem",
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
      {/* {isPainter && (
        <Painter
          dotsImageSrc={dotsImageSrc}
          setIsPainter={setIsPainter}
          pixelLength={pixelLength}
        />
      )} */}
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
