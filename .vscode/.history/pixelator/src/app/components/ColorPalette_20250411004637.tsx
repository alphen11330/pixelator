import { useEffect, useState } from "react";
import createPalette from "./createPalette";
import style from "../icon.module.css";

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

const readImage = (
  event: React.ChangeEvent<HTMLInputElement>,
  setImageToForPalette: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const MAX_SIZE = 512;

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
  colorPalette: string[];
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  smoothImageSrc: string | null;
  colorLevels: number;
  imageSrc: string | null;
  refreshColorPalette: boolean;
  setRefreshColorPalette: React.Dispatch<React.SetStateAction<boolean>>;
};

const CollorPalette: React.FC<Props> = ({
  colorPalette,
  setColorPalette,
  smoothImageSrc,
  colorLevels,
  imageSrc,
  refreshColorPalette,
  setRefreshColorPalette,
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
  }, [imageSrc, refreshColorPalette, colorLevels]);

  // パレット用画像からパレットを作成
  useEffect(() => {
    fetchPalette(imageForPalette);
    setImageForPalette(null);
  }, [imageForPalette]);

  const collorPaletteStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "1rem",
    marginInline: "auto",
    width: "80%",
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

  const buttonContainer: React.CSSProperties = {
    display: "flex",
    width: "calc(80% - 3px)",
    marginInline: "auto",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const buttonStyle: React.CSSProperties = {
    position: "relative",
    height: "3.2rem",
    padding: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "5px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
    userSelect: "none",
  };

  function createLambertBeerGradient(
    width: number = 256,
    height: number = 50
  ): string {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return "";

    // より強力な非線形グラデーション（明るい領域をより細かく表現）
    const lambertBeerGrad = ctx.createLinearGradient(0, 0, width, 0);

    // 非線形の色止めを設定（より多くのステップで明るい部分を細かく表現）
    for (let i = 0; i <= 255; i++) {
      const pos = i / 255;
      // より強い指数関数的な色の変化を生成
      const intensity = Math.pow(pos, 0.7); // より急激な変化
      const color = Math.round(intensity * 255);
      lambertBeerGrad.addColorStop(pos, `rgb(${color}, ${color}, ${color})`);
    }

    // 描画
    ctx.fillStyle = lambertBeerGrad;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL();
  }
  const [gradientUrl, setGradientUrl] = useState<string>("");

  useEffect(() => {
    // コンポーネントのマウント時にグラデーションを生成
    const url = createLambertBeerGradient(256, 50);
    setGradientUrl(url);
  }, [refreshColorPalette]);

  return (
    <>
      <div style={buttonContainer}>
        <button
          style={{
            ...buttonStyle,

            border: "2px solid hsl(140, 39.40%, 49.20%)",
            backgroundColor: "hsl(125, 59.30%, 88.40%)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(140, 51.70%, 70.80%)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(125, 59.30%, 88.40%)")
          }
          onClick={() => setRefreshColorPalette(!refreshColorPalette)}
        >
          <div className={style.reload} />
        </button>

        <label
          htmlFor="fileForPalette-upload"
          style={{
            ...buttonStyle,
            border: "2px solid hsl(70, 39.40%, 49.20%)",
            backgroundColor: "hsl(60, 59.30%, 88.40%)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(70, 51.70%, 70.80%)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(60, 59.30%, 88.40%)")
          }
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
      </div>

      <div style={collorPaletteStyle}>
        {colorPalette.map((color, index) => (
          <input
            key={index}
            type="color"
            value={rgbToHex(color)}
            title={color}
            onChange={(e) => {
              const updatedPalette = [...colorPalette];
              updatedPalette[index] = e.target.value;
              setColorPalette(updatedPalette);
            }}
            style={{ ...colorInputStyle, backgroundColor: color }}
          />
        ))}
      </div>

      <div>
        <h2>Lambert-Beer グラデーション</h2>
        {gradientUrl ? (
          <div
            style={{
              width: "256px",
              height: "50px",
              border: "solid 1px black",
              backgroundImage: `url(${gradientUrl})`,
            }}
          />
        ) : (
          <p>グラデーションを読み込み中...</p>
        )}
      </div>
    </>
  );
};

export default CollorPalette;
