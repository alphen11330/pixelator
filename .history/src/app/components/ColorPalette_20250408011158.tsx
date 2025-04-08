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
        ); // 非同期でカラーパレットを取得
        setColorPalette(palette); // 取得したカラーパレットをステートにセット
      }
    };

    fetchPalette(); // 非同期関数の呼び出し
  }, [smoothImageSrc, colorLevels]); // imageSrcが変更されたときに実行

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
    backgroundColor: "color",
    borderRadius: "8px",
  };
  return (
    <>
      {/* カラーパレットの表示 */}
      <div style={collorPalette}>
        {colorPalette.map((color, index) => (
          <div
            key={index}
            style={{ ...collorIcon, backgroundColor: color }}
            title={color}
          ></div>
        ))}
      </div>
    </>
  );
};

export default CollorPalette;
