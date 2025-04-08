import { useEffect, useState } from "react";
import createPalette from "./createPalette";
import { SketchPicker } from "react-color";

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
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

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
  const collorPalette: React.CSSProperties = {
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
    <>
      <div style={collorPalette}>
        {colorPalette.map((color, index) => (
          <div
            key={index}
            style={{ ...collorIcon, backgroundColor: color }}
            title={color}
            onClick={() => setPickerIndex(index)}
          >
            {/* 色選択ピッカー */}
            {pickerIndex === index && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 2,
                  top: "100%",
                  left: 0,
                }}
                onClick={(e) => e.stopPropagation()} // 親divのonClickを防ぐ
              >
                <SketchPicker
                  color={color}
                  onChangeComplete={(newColor) => {
                    const updatedPalette = [...colorPalette];
                    updatedPalette[index] = newColor.hex;
                    setColorPalette(updatedPalette);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 背景クリックでピッカーを閉じる */}
      {pickerIndex !== null && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 1,
          }}
          onClick={() => setPickerIndex(null)}
        />
      )}
    </>
  );
};

export default CollorPalette;
