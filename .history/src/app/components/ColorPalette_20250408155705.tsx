import { useEffect } from "react";
import createPalette from "./createPalette";

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
};

const CollorPalette: React.FC<Props> = ({
  colorPalette,
  setColorPalette,
  smoothImageSrc,
  colorLevels,
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
  }, [smoothImageSrc, colorLevels]);

  const collorPaletteStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "20px",
    marginInline: "auto",
    width: "80%",
  };

  const colorInputStyle: React.CSSProperties = {
    width: "calc(100% / 8 - 3px)",
    paddingTop: "100%",
    marginRight: "3px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    cursor: "pointer",
    backgroundColor: "rgb(255, 255, 255)",
  };

  return (
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
          style={colorInputStyle}
        />
      ))}
    </div>
  );
};

export default CollorPalette;
