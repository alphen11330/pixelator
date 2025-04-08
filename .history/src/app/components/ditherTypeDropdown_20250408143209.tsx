type Props = {
  ditherType: "none" | "ordered" | "atkinson" | "floydsteinberg";
  React.Dispatch<React.SetStateAction<"none" | "ordered" | "atkinson" | "floydsteinberg">>  >;
};

const ditherTypeDropdown: React.FC<Props> = ({ ditherType, setDitherType }) => {
  const dithers = [
    { value: "none", label: "通常" },
    { value: "darken", label: "比較（暗）" },
    { value: "multiply", label: "乗算" },
    { value: "color-burn", label: "焼き込みカラー" },
  ];

  const ditherTypeSelect: React.CSSProperties = {
    width: "50x",
    padding: "5px",
    marginTop: "1rem",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    outline: "none",
    display: "inline-block",
    textAlign: "center",
  };

  return (
    <div>
      <label htmlFor="blendModeSelect">ブレンドモード：</label>
      <select
        id="blendModeSelect"
        value={ditherType}
        style={ditherTypeSelect}
        onChange={(e) =>
          setDitherType(
            e.target.value as "none" | "ordered" | "atkinson" | "floydsteinberg"
          )
        }
      >
        {dithers.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ditherTypeDropdown;
