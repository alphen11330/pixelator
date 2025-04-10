import { useEffect } from "react";
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

type Props = {
  colorPalette: string[];
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  smoothImageSrc: string | null;
  colorLevels: number;
  refreshColorPalette: boolean;
  setRefreshColorPalette: React.Dispatch<React.SetStateAction<boolean>>;
};

const CollorPalette: React.FC<Props> = ({
  colorPalette,
  setColorPalette,
  smoothImageSrc,
  colorLevels,
  refreshColorPalette,
  setRefreshColorPalette,
}) => {
  // カラーパレットの生成
  useEffect(() => {
    const fetchPalette = async () => {
      if (smoothImageSrc) {
        const palette = await createPalette(
          smoothImageSrc,
          Math.pow(2, colorLevels)
        );
        setColorPalette(palette);
      }
    };

    fetchPalette();
  }, [refreshColorPalette, colorLevels]);

  const collorPaletteStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "1rem",
    marginBottom: "3rem",
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
  };

  return (
    <>
      <div style={buttonContainer}>
        <button
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
        </button>

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
          <div className={style.reload}> 　</div>
        </button>
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
    </>
  );
};

export default CollorPalette;
