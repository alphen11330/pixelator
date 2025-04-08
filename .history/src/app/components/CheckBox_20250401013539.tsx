type Props = {
  value: boolean;
};

const CheckBox: React.FC<Props> = () => {
  const checkBoxStyle: React.CSSProperties = {
    display: "inline-block",
    width: "20px",
    height: "20px",
    lineHeight: "20px",
    textAlign: "center",
    color: "rgb(255,255,255)",
    border: value
      ? "2px solid rgb(92, 78, 244)"
      : "2px solid rgb(138, 138, 138)",
    borderRadius: "4px",
    marginRight: "8px",
    backgroundColor: value ? "rgb(92, 78, 244)" : "white",
    transition: "all 0.25s ease",
    userSelect: "none",
  };

  return (
    <>
      <input
        type="checkbox"
        style={{ display: "none" }} // デフォルトのチェックボックスを非表示
        //   checked={imageMask}
        //   onChange={(e) => setter(e.target.checked)}
      />
      <div style={checkBoxStyle}>{imageMask ? <>✓</> : <>　</>}</div>
      <span
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          userSelect: "none",
        }}
      >
        マスクを適用（透過画像）
      </span>
    </>
  );
};

export default CheckBox;
