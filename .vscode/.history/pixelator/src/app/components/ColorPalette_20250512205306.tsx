import { useEffect, useState } from "react";
import style from "../util.module.css";
import { createPalette } from "./createPalette";

// RGB形式の色をHEX形式に変換する関数
const rgbToHex = (rgb: string): string => {
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
  );
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

type Props = {
  colorReduction: boolean;
  colorPalette: string[];
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  smoothImageSrc: string | null;
  colorLevels: number;
  imageSrc: string | null;
  lockPalette: boolean;
  setLockPalette: React.Dispatch<React.SetStateAction<boolean>>;
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
}) => {
  const [imageForPalette, setImageForPalette] = useState<string | null>(null);

  // カラーパレットの生成
  const fetchPalette = async (img: string | null) => {
    if (img) {
      const palette = await createPalette(img, Math.pow(2, colorLevels));
      setColorPalette(palette);
    }
  };

  // リフレッシュ、減色数を変更したときに編集画像からパレットを作成
  useEffect(() => {
    fetchPalette(smoothImageSrc);
  }, [refreshColorPalette, colorLevels]);

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

  const colorInputStyle: React.CSSProperties = {
    width: "calc(100% / 8 - 3px)",
    paddingTop: "10%",
    marginInline: "1.5px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    cursor: "pointer",
    backgroundColor: "rgb(255, 255, 255)",
  };

  const a: React.CSSProperties = {
    height: "3.2rem",
    padding: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "2px solid hsl(140, 39.40%, 49.20%)",
    backgroundColor: "hsl(125, 59.30%, 88.40%)",
    borderRadius: "5px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
    userSelect: "none",
  };

  return (
    <>
      {colorReduction && (
        // ボタンを配置
        <div style={buttonContainer}>
          {/* リフレッシュボタン */}
          <button
            className={style.refreshButton}
            onClick={() => setRefreshColorPalette(!refreshColorPalette)}
          >
            <div className={style.refresh} />
          </button>

          {/* パレット作成ボタン */}
          <label
            htmlFor="fileForPalette-upload"
            className={style.createPalettereButton}
          >
            <div>画像からパレットを作成</div>
          </label>
          <input
            id="fileForPalette-upload"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => readImage(e, setImageForPalette)}
          />
          {/* ロックボタン */}
          <button onClick={() => setLockPalette(!lockPalette)}>
            <img
              src={lockPalette ? "/locked.png" : "/unlocked.png"}
              width={30}
            />
          </button>
        </div>
      )}
      {/* カラーパレットを配置 */}
      <div style={colorPaletteStyle}>
        {colorPalette.map((color, index) => (
          <div
            key={`color-${index}`}
            style={{
              position: "relative",
              ...colorInputStyle,
              backgroundColor: color,
            }}
          >
            <input
              type="color"
              value={rgbToHex(color)}
              title={color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default ColorPalette;
