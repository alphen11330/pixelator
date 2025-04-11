type Props = {
  value: boolean;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
};

const CheckBox: React.FC<Props> = ({ value, setValue, name }) => {
  const checkBoxStyle: React.CSSProperties = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    width: "20px",
    height: "20px",
    color: "rgb(255,255,255)",
    border: value
      ? "2px solid rgb(92, 78, 244)"
      : "2px solid rgb(138, 138, 138)",
    borderRadius: "4px",
    marginRight: "8px",
    marginLeft: "3rem",
    marginBlock: "1rem",
    backgroundColor: value ? "rgb(92, 78, 244)" : "white",
    transition: "all 0.25s ease",
    userSelect: "none",
    cursor: "pointer", // ユーザーにクリック可能と示す
  };

  const labelBoxStyle: React.CSSProperties = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    height: "20px",
    marginBlock: "1rem",
    backgroundColor: "rgb(137, 137, 137)",
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
        {value ? <>✓</> : <>　</>}
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
