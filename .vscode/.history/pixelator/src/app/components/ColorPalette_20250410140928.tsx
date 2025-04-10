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
    marginRight: "3px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    cursor: "pointer",
    backgroundColor: "rgb(255, 255, 255)",
  };

  const refreshButton: React.CSSProperties = {
    position: "relative",
    height: "3.2rem",
    width: "3.2rem",
    display: "inline-flex",
    border: "2px solid hsl(125, 39.40%, 49.20%)",
    borderRadius: "5px",
    backgroundColor: "hsl(125, 59.30%, 88.40%)",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  const imgToPalleteButton: React.CSSProperties = {
    position: "relative",
    padding: "0.75rem",
    height: "3.2rem",
    border: "2px solid hsl(60, 39.40%, 49.20%)",
    borderRadius: "5px",
    backgroundColor: "hsl(60, 59.30%, 88.40%)",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
  };

  return (
    <>
      <button
        style={refreshButton}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "hsl(125, 51.70%, 70.80%)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "hsl(125, 59.30%, 88.40%)")
        }
        onClick={() => setRefreshColorPalette(!refreshColorPalette)}
      >
        <div
        // className={style.reload}
        >
          text
        </div>
      </button>

      <button
        style={imgToPalleteButton}
        onMouseOver={(e) =>
          (e.currentTarget.style.backgroundColor = "hsl(60, 51.70%, 70.80%)")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = "hsl(60, 59.30%, 88.40%)")
        }
      >
        <div>画像からパレットを作成</div>
      </button>

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
