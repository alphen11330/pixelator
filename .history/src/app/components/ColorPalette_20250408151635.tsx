import { useEffect, useRef } from "react";
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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // スタイル定義
  const collorPaletteContainer: React.CSSProperties = {
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    marginTop: "20px",
    marginInline: "auto",
    width: "80%",
  };

  const collorIcon: React.CSSProperties = {
    width: "calc(100% / 8 - 3px)",
    aspectRatio: "4/3",
    marginRight: "3px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    cursor: "pointer",
    position: "relative",
  };

  return (
    <div style={collorPaletteContainer}>
      {colorPalette.map((collor, index) => (
        <div
          key={index}
          style={{ ...collorIcon, backgroundColor: collor }}
          title={collor}
          onClick={() => {
            inputRefs.current[index]?.click(); // input要素をクリックしてパレットを開く
          }}
        >
          {/* 非表示のcolor input */}
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="color"
            title={collor}
            style={{ ...collorInput, backgroundColor: collor }}
            value={collor}
            onChange={(e) => {
              const updatedPalette = [...colorPalette];
              updatedPalette[index] = e.target.value;
              setColorPalette(updatedPalette);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ))}
    </div>
  );
};

export default CollorPalette;
