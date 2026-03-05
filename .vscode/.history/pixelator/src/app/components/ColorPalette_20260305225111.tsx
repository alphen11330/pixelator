import { useEffect, useState } from "react";
import style from "../util.module.css";
import { createPalette } from "./createPalette";
import SelectPrePalette from "./SelectPrePalette";
import ToneCurveEditor from "./ToneCurveEditor";
import { CurvePoint } from "./toneCurveUtils";
import { sortPalette } from "./sortPalette";
import useDeviceChecker from "../deviceChecker";
import { Margarine } from "next/font/google";

const randomId = (length = 8): string => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

// JASC-PAL をパースする関数
const parsePalFile = async (file: File): Promise<string[]> => {
  const text = await file.text();
  const lines = text.trim().split(/\r?\n/);

  if (lines[0].trim() !== "JASC-PAL") {
    throw new Error("Not a JASC-PAL file");
  }

  const count = parseInt(lines[2].trim(), 10);
  const palette: string[] = [];

  for (let i = 3; i < 3 + count; i++) {
    const parts = lines[i].trim().split(/\s+/).map(Number);
    const [r, g, b] = parts;
    const hex =
      "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
    palette.push(hex);
  }

  return palette;
};
// JASC-PALテキスト変換関数
const generatePalText = (palette: string[]): string => {
  const lines = ["JASC-PAL", "0100", palette.length.toString()];

  for (const hex of palette) {
    const [r, g, b] = hexToRgb(hex);
    lines.push(`${r} ${g} ${b}`);
  }

  return lines.join("\n");
};

// JASC-PALダウンロード
const downloadPal = (palette: string[]) => {
  const palText = generatePalText(palette);
  const blob = new Blob([palText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const id = randomId(8);

  const a = document.createElement("a");
  a.href = url;
  a.download = `pixelatorPallet_${id}.pal`;
  a.click();

  URL.revokeObjectURL(url);
};

// RGB形式の色をHEX形式に変換する関数
const rgbToHex = (rgb: string | undefined | null): string => {
  if (typeof rgb !== "string" || !rgb) {
    return rgb || "#000000";
  }

  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

  if (!match) return rgb;

  const [, r, g, b] = match.map(Number);

  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  ).toUpperCase();
};

// HEX形式の色をRGB形式に変換する関数
const hexToRgb = (color: string): [number, number, number] => {
  // #RRGGBB
  if (color.startsWith("#")) {
    const clean = color.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [r, g, b];
  }

  // rgb(r, g, b)
  const rgbMatch = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (rgbMatch) {
    return [
      parseInt(rgbMatch[1], 10),
      parseInt(rgbMatch[2], 10),
      parseInt(rgbMatch[3], 10),
    ];
  }

  // 不明な形式なら黒にする(エラー回避)
  console.warn("Unknown color format:", color);
  return [0, 0, 0];
};

// 画像を読み込んでリサイズする関数
const readImage = (
  event: React.ChangeEvent<HTMLInputElement>,
  setImageToForPalette: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const MAX_SIZE = 1024;

  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      const img = new Image();
      img.src = e.target.result as string;
      img.onload = () => {
        const { width, height } = img;
        let newWidth = width;
        let newHeight = height;

        // 大きすぎる画像をリサイズ
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            newWidth = MAX_SIZE;
            newHeight = (height / width) * MAX_SIZE;
          } else {
            newHeight = MAX_SIZE;
            newWidth = (width / height) * MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          const resizedDataUrl = canvas.toDataURL("image/png");
          setImageToForPalette(resizedDataUrl);

          const inputElement = event.target as HTMLInputElement;
          inputElement.value = "";
        }
      };
    }
  };
  reader.readAsDataURL(file);
};

const readPalOrImage = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setImageToForPalette: React.Dispatch<React.SetStateAction<string | null>>,
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const ext = file.name.split(".").pop()?.toLowerCase();

  // PAL ファイルならパレットを読み込み
  if (ext === "pal") {
    try {
      const palette = await parsePalFile(file);
      setColorPalette(palette);
    } catch (err) {
      console.error(err);
      alert("PALファイルの読み込みに失敗しました");
    }
    event.target.value = "";
    return;
  }

  // それ以外は画像として扱う
  readImage(event, setImageToForPalette);
};

type Props = {
  colorReduction: boolean;
  colorPalette: string[];
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  smoothImageSrc: string | null;
  colorLevels: number;
  imageSrc: string | null;
  lockPalette: boolean;
  setLockPalette: React.Dispatch<React.SetStateAction<boolean>>;
  isJP: boolean;
  toneCurveEnabled: boolean;
  setToneCurveEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  toneCurvePoints: CurvePoint[];
  setToneCurvePoints: React.Dispatch<React.SetStateAction<CurvePoint[]>>;
};

const ColorPalette: React.FC<Props> = ({
  colorReduction,
  colorPalette,
  setColorPalette,
  smoothImageSrc,
  colorLevels,
  imageSrc,
  lockPalette,
  setLockPalette,
  isJP,
  toneCurveEnabled,
  setToneCurveEnabled,
  toneCurvePoints,
  setToneCurvePoints,
}) => {
  const [imageForPalette, setImageForPalette] = useState<string | null>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const isPC = useDeviceChecker();

  // カラーパレットの生成
  const fetchPalette = async (img: string | null) => {
    if (img) {
      // const palette = await createPalette(img, Math.pow(2, colorLevels));
      const palette = await createPalette(img, colorLevels);
      setColorPalette(palette);
    }
  };

  // 減色数を変更したときに編集画像からパレットを作成
  useEffect(() => {
    if (!lockPalette) fetchPalette(smoothImageSrc);
  }, [colorLevels, smoothImageSrc, lockPalette]);

  // パレット用画像からパレットを作成
  useEffect(() => {
    if (imageForPalette) {
      fetchPalette(imageForPalette);
      setImageForPalette(null);
    }
  }, [imageForPalette]);

  // 個別の色更新処理
  const handleColorChange = (index: number, newColor: string) => {
    const updatedPalette = [...colorPalette];
    updatedPalette[index] = newColor;
    setColorPalette(updatedPalette);
  };

  // カラーパレットをクリックしたときの処理
  const handleColorClick = (index: number) => {
    setSelectedColorIndex(index);
    setShowModal(true);
  };

  // モーダルを閉じる処理
  const closeModal = () => {
    setShowModal(false);
    setSelectedColorIndex(null);
  };

  // カラーピッカーで色が変更されたときの処理
  const handleColorPickerChange = (newColor: string) => {
    if (selectedColorIndex !== null) {
      handleColorChange(selectedColorIndex, newColor);
    }
  };

  // 色を複製
  const handleCopyColor = () => {
    if (selectedColorIndex !== null) {
      const newPalette = [...colorPalette];
      newPalette.splice(
        selectedColorIndex + 1,
        0,
        colorPalette[selectedColorIndex]
      );
      setColorPalette(newPalette);
    }
  };

  // 色を削除
  const handleDeleteColor = () => {
    if (selectedColorIndex !== null && colorPalette.length > 1) {
      const newPalette = colorPalette.filter(function (color, currentIndex) {
        return currentIndex !== selectedColorIndex;
      });

      setColorPalette(newPalette);
    }
  };

  // カラーピッカーを開く
  const handleOpenColorPicker = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const input = document.getElementById(
      "color-picker-modal"
    ) as HTMLInputElement;
    if (input) {
      // スマホの場合はフォーカスしてからクリック
      input.focus();
      setTimeout(() => {
        input.click();
      }, 100);
    }
  };

  const contentsBar: React.CSSProperties = {
    display: "flex",
    width: "calc(80% - 3px)",
    height: "1.5rem",
    color: "white",
    paddingInline: "1rem",
    background: "rgb(101, 98, 105)",
    borderRadius: "5px 5px 0 0",
    alignItems: "center",
    justifyContent: "space-between",
    marginInline: "auto",
    marginTop: "1rem",
    fontSize: "0.8rem",
    cursor: "pointer",
    userSelect: "none",
  };

  const colorPaletteStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "1rem",
    marginInline: "auto",
    width: "80%",
  };

  const buttonContainer: React.CSSProperties = {
    display: "flex",
    width: "calc(80% - 3px)",
    marginInline: "auto",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const [colorBoxSize, setColorBoxSize] = useState("medium");
  const colorBoxStyle: React.CSSProperties = {
    width:
      colorBoxSize === "small"
        ? "calc(100% / 16 - 3px)" // small の場合
        : colorBoxSize === "large"
        ? "calc(100% / 4 - 3px)" // large の場合
        : "calc(100% / 8 - 3px)", // medium またはその他の場合
    paddingTop:
      colorBoxSize === "small"
        ? "5%" // small の場合
        : colorBoxSize === "large"
        ? "20%" // large の場合
        : "10%", // medium またはその他の場合
    marginInline: "1.5px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    cursor: "pointer",
    backgroundColor: "rgb(255, 255, 255)",
  };

  const alignmentButtonStyle: React.CSSProperties = {
    width: "30%",
    height: "2rem",
    background: "rgb(206, 239, 255)",
    fontSize: "16px",
    border: "solid 1.5px rgb(102, 122, 149)",
    borderRadius: "5px",
    cursor: "pointer",
    userSelect: "none",
  };

  // const modalOverlayStyle: React.CSSProperties = {
  //   position: "fixed",
  //   top: 0,
  //   left: 0,
  //   width: "100%",
  //   height: "100%",
  //   display: "flex",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   zIndex: 30,
  // };

  const modalContentStyle: React.CSSProperties = {
    position: "sticky",
    top: "0",
    marginTop: "1rem",
    width: "calc(80% - 3px)",
    marginInline: "auto",
    backgroundColor: "white",
    padding: "0.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    border: "solid 1px rgb(184, 184, 184)",
  };

  const modalButtonStyle: React.CSSProperties = {
    padding: "0.5rem 1rem",
    display: "inline-block",
    width: "22.5%",
    fontSize: isPC ? "1rem" : "0.7rem",
    border: "solid 1px rgb(184, 184, 184)",
    borderRadius: "5px",
    cursor: "pointer",
    backgroundColor: "white",
    userSelect: "none",
  };

  const colorPreviewStyle: React.CSSProperties = {
    width: "100%",
    height: "2rem",
    borderRadius: "100px",
    border: "solid 2px rgb(184, 184, 184)",
  };

  return (
    <>
      {colorReduction && (
        // ボタンを配置
        <>
          <div style={buttonContainer}>
            {/* パレット作成ボタン */}
            <label
              htmlFor="fileForPalette-upload"
              className={style.createPaletteButton}
              style={{
                marginRight: "1rem",
              }}
            >
              <div>{isJP ? "画像｜palから配色" : "IMG｜pal to pallete"}</div>
            </label>
            <button
              className={style.downloadButton}
              style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                marginRight: "auto",
              }}
              onClick={() => downloadPal(colorPalette)}
            >
              {isJP ? "pal" : "pal"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="ml-1 size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>

            <input
              id="fileForPalette-upload"
              type="file"
              accept="image/*,.pal"
              style={{ display: "none" }}
              onChange={(e) =>
                readPalOrImage(e, setImageForPalette, setColorPalette)
              }
            />
            {/* ロックボタン */}
            <button onClick={() => setLockPalette(!lockPalette)}>
              <img
                src={lockPalette ? "/locked.png" : "/unlocked.png"}
                style={{
                  userSelect: "none",
                  pointerEvents: "none",
                }}
                width={30}
              />
            </button>
          </div>
          <SelectPrePalette setColorPalette={setColorPalette} isJP={isJP} />

          {/* トーンカーブアコーディオン */}
          <div
            style={contentsBar}
            onClick={() => setToneCurveEnabled((prev) => !prev)}
          >
            <span>{isJP ? "トーンカーブ" : "Tone Curve"}</span>
            <span
              style={{
                transform: toneCurveEnabled ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              ▼
            </span>
          </div>
          <div
            style={{
              marginInline: "auto",
              width: "calc(80% - 3px)",
            }}
          >
            <div
              style={{
                width: "100%",
                border: "solid 5px rgb(60, 58, 71)",
                borderRadius: "0 0 5px 5px",
                background: "rgb(189, 189, 195)",
                maxHeight: toneCurveEnabled ? "800px" : "0px",
                overflow: "hidden",
                transition: "max-height 0.5s ease",
                boxSizing: "border-box",
              }}
            >
              <div style={{ padding: "0.5rem" }}>
                <ToneCurveEditor
                  points={toneCurvePoints}
                  onChange={setToneCurvePoints}
                  isJP={isJP}
                />
              </div>
            </div>
          </div>
        </>
      )}
      {/* カラーパレット整列ボタン */}
      <div
        style={{
          ...buttonContainer,
          justifyContent: "left",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <button
          style={alignmentButtonStyle}
          onClick={() => {
            setColorPalette(sortPalette(colorPalette, "luminance"));
          }}
        >
          {isJP ? "輝度" : "Luminance"}
        </button>

        <button
          style={alignmentButtonStyle}
          onClick={() => {
            setColorPalette(sortPalette(colorPalette, "saturation"));
          }}
        >
          {isJP ? "彩度" : "Saturation"}
        </button>

        <button
          style={alignmentButtonStyle}
          onClick={() => {
            setColorPalette(sortPalette(colorPalette, "hue"));
          }}
        >
          {isJP ? "色相" : "Hue"}
        </button>

        {/* カラーボックスサイズ変更 */}
        <button
          style={{ marginLeft: "auto", cursor: "pointer" }}
          onClick={() =>
            setColorBoxSize((prevSize) => {
              switch (prevSize) {
                case "small":
                  return "medium";
                case "medium":
                  return "large";
                case "large":
                  return "small";
                default:
                  return "medium";
              }
            })
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
            />
          </svg>
        </button>
      </div>

      {/* モーダルメニュー */}
      {showModal && selectedColorIndex !== null && (
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div
            style={{
              ...colorPreviewStyle,
              backgroundColor: colorPalette[selectedColorIndex],
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: "0.5rem",
              justifyContent: "space-around",
            }}
          >
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <button
                style={modalButtonStyle}
                onClick={handleOpenColorPicker}
                onTouchStart={handleOpenColorPicker}
              >
                {isJP ? "変更" : "Change"}
              </button>
              <input
                id="color-picker-modal"
                type="color"
                value={rgbToHex(colorPalette[selectedColorIndex])}
                onChange={(e) => handleColorPickerChange(e.target.value)}
                style={{
                  position: "absolute",
                  opacity: 0,
                  pointerEvents: "none",
                  width: 0,
                  height: 0,
                }}
              />

              <button style={modalButtonStyle} onClick={handleCopyColor}>
                {isJP ? "複製" : "Copy"}
              </button>

              <button
                style={{
                  ...modalButtonStyle,
                  opacity: colorPalette.length <= 1 ? 0.5 : 1,
                  cursor: colorPalette.length <= 1 ? "not-allowed" : "pointer",
                }}
                onClick={handleDeleteColor}
                disabled={colorPalette.length <= 1}
              >
                {isJP ? "削除" : "Delete"}
              </button>
              <button style={modalButtonStyle} onClick={closeModal}>
                {isJP ? "閉じる" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* カラーパレットを配置 */}
      <div style={colorPaletteStyle}>
        {colorPalette.map((color, index) => (
          <button
            key={`color-${index}`}
            style={{
              ...colorBoxStyle,
              backgroundColor: color,
            }}
            onClick={() => handleColorClick(index)}
          />
        ))}
      </div>
    </>
  );
};

export default ColorPalette;
