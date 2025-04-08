type Props = {
  colorPalette: string[];
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  smoothImageSrc: string | null;
};

const CollorPalette: React.FC<Props> = ({ colorPalette, setColorPalette }) => {
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
        <div style={{ display: "flex", flexWrap: "wrap" }}>
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
      </div>
    </>
  );
};

export default CollorPalette;
