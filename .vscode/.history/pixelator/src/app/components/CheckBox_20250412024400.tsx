type Props = {
  value: boolean;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
};

const CheckBox: React.FC<Props> = ({ value, setValue, name }) => {
  const checkBoxStyle: React.CSSProperties = {
    width: "20px",
    height: "20px",
    color: "rgb(255,255,255)",
    backgroundColor: value ? "rgb(89, 134, 240)" : "white",
    border: value
      ? "2px solid rgb(89, 80, 198)"
      : "2px solid rgb(138, 138, 138)",

    borderRadius: "4px",
    marginRight: "8px",
    marginLeft: "3rem",
    marginBlock: "1rem",

    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",

    transition: "all 0.25s ease",
    userSelect: "none",
    cursor: "pointer", // ユーザーにクリック可能と示す
  };

  const labelBoxStyle: React.CSSProperties = {
    height: "20px",
    marginBlock: "1rem",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: "bold",
    userSelect: "none",
    cursor: "pointer",
  };

  return (
    <>
      <input
        type="checkbox"
        style={{ display: "none" }} // デフォルトのチェックボックスを非表示
        checked={value}
        onChange={(e) => {
          setValue(e.target.checked);
        }}
      />
      <span style={checkBoxStyle} onClick={() => setValue(!value)}>
        {value ? <span style={{ color: "red" }}>✓</span> : <span>　</span>}
      </span>
      <span style={labelBoxStyle}>
        <span style={labelStyle} onClick={() => setValue(!value)}>
          {name}
        </span>
      </span>
    </>
  );
};

export default CheckBox;
