import { useEffect } from "react";
import createPalette from "./createPalette";
import styled from "styled-components";

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

  const ColorInput = styled.input`
    appearance: none;
    -webkit-appearance: none;
    border: solid 1px rgb(184, 184, 184);
    border-radius: 4px;
    padding: 0;
    cursor: pointer;
    width: calc(100% / 8 - 3px);
    aspect-ratio: 4/3;
    margin-right: 3px;
    margin-bottom: 3px;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: none;
      border-radius: 4px;
    }
  `;

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
