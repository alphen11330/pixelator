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
    display: "flex" /* flexbox */,
    flexWrap: "wrap" /* 折返し指定 */,
    marginTop: "20px",
    marginInline: "auto",
    width: "80%",
    padding: "1rem",
    border: "solid 1px rgb(0,0,0)",
  };
  const collorIcon: React.CSSProperties = {
    width: "50px",
    height: "50px",
    backgroundColor: "color",
    borderRadius: "8px",
    margin: "2px",
  };
  return (
    <>
      {/* カラーパレットの表示 */}
      <div style={collorPalette}>
        {colorPalette.map((color, index) => (
          <div key={index}>
            {/* 色のサンプルとRGBの文字列 */}
            <div
              style={{ ...collorIcon, backgroundColor: color }}
              title={color} // ツールチップでRGBの文字列を表示
            ></div>
          </div>
        ))}
      </div>
    </>
  );
};

export default CollorPalette;
