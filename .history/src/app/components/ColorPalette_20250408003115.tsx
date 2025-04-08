type Props = {
  colorPalette: string[];
};

const CollorPalette: React.FC<Props> = ({ colorPalette }) => {
  const collorPalette: React.CSSProperties = {};
  const collorIcon: React.CSSProperties = {
    width: "50px",
    height: "50px",
    backgroundColor: "color",
    borderRadius: "8px",
    marginBottom: "5px",
  };
  return (
    <>
      {/* カラーパレットの表示 */}
      <div style={{ marginTop: "20px" }}>
        <h2>Color Palette (RGB Strings)</h2>
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
