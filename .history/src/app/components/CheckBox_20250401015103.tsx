type Props = {
  value: boolean;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
};

const CheckBox: React.FC<Props> = ({ value, setValue, name }) => {
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
    cursor: "pointer", // ユーザーにクリック可能と示す
  };

  return (
    <>
      <input
        type="checkbox"
        style={{ display: "" }} // デフォルトのチェックボックスを非表示
        checked={value}
        onChange={(e) => {
          setValue(e.target.checked);
          alert(e.target.checked);
        }}
      />
      <div style={checkBoxStyle} onClick={() => setValue(!value)}>
        {value ? <>✓</> : <>　</>}
      </div>
      <span
        style={{
          fontSize: "16px",
          fontWeight: "bold",
          userSelect: "none",
          cursor: "pointer",
        }}
        onClick={() => setValue(!value)}
      >
        {name}
      </span>
    </>
  );
};

export default CheckBox;
