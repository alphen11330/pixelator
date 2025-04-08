import { useEffect } from "react";
import createPalette from "./createPalette";

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
    aspectRatio: "4/3",
    marginRight: "3px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    padding: 0,
    cursor: "pointer",
    appearance: "none", // Chrome, Edge, Safari
    WebkitAppearance: "none", // Safari
    MozAppearance: "none", // Firefox
  };

  return (
    <div style={collorPaletteStyle}>
      {colorPalette.map((color, index) => (
        <input
          key={index}
          type="color"
          value={color}
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
  );
};

export default CollorPalette;
