import { useEffect, useState, useRef } from "react";
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
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
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
  const collorPalette: React.CSSProperties = {
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
    <div style={collorPalette}>
      {colorPalette.map((color, index) => (
        <div
          key={index}
          style={{ ...collorIcon, backgroundColor: color }}
          title={color}
          onClick={() => {
            setPickerIndex(index);
            inputRefs.current[index]?.click(); // input要素をクリックしてパレットを開く
          }}
        >
          {/* 非表示のcolor input */}
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="color"
            value={color}
            style={{ display: "none" }}
            onChange={(e) => {
              const updatedPalette = [...colorPalette];
              updatedPalette[index] = e.target.value;
              setColorPalette(updatedPalette);
            }}
            onClick={(e) => e.stopPropagation()} // 背景クリックイベントの防止
          />
        </div>
      ))}
    </div>
  );
};

export default CollorPalette;
