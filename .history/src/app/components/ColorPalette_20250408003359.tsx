type Props = {
  colorPalette: string[];
};

const CollorPalette: React.FC<Props> = ({ colorPalette }) => {
  const collorPalette: React.CSSProperties = {
    marginTop: "20px",
    marginInline: "auto",
    width: "80%",
    padding: "1rem",
    border: "solid 1px rgb(0,0,0)",
  };
  const collorIcon: React.CSSProperties = {
    width: "10%",
    height: "50px",
    backgroundColor: "color",
    borderRadius: "8px",
    marginBottom: "5px",
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
