type Props = {
  value: boolean;
  setValue: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
};

const CheckBox: React.FC<Props> = ({ value, setValue, name }) => {
  const checkBoxStyle: React.CSSProperties = {
    display: "inline-flex",
    width: "20px",
    height: "20px",
    color: "rgb(255,255,255)",
    border: value
      ? "2px solid rgb(92, 78, 244)"
      : "2px solid rgb(138, 138, 138)",
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
