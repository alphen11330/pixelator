type Props = {
  ditherType: "none" | "ordered" | "atkinson" | "floydsteinberg";
  setDitherType: React.Dispatch<
    React.SetStateAction<"none" | "ordered" | "atkinson" | "floydsteinberg">
  >;
};

const DitherTypeDropdown: React.FC<Props> = ({ ditherType, setDitherType }) => {
  const dithers = [
    { value: "none", label: "ーーーー" },
    { value: "ordered", label: "組織的ディザリング" },
    { value: "atkinson", label: "アトキンソンディザリング" },
    { value: "floydsteinberg", label: "フロイド・スタインバーグディザリング" },
  ];

  const label: React.CSSProperties = {
    position: "relative",
    fontSize: "16px",
    marginLeft: "3rem",
    fontWeight: "bold",
    color: " black",
    userSelect: "none",
  };

  const ditherTypeSelect: React.CSSProperties = {
    width: "50x",
    padding: "5px",
    marginTop: "1rem",
    marginBottom: "1rem",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    outline: "none",
    display: "inline-block",
    textAlign: "center",
  };

  return (
    <div>
      <label htmlFor="blendModeSelect">
        <span style={label}>ディザリングタイプ：</span>

        <select
          id="blendModeSelect"
          value={ditherType}
          style={ditherTypeSelect}
          onChange={(e) =>
            setDitherType(
              e.target.value as
                | "none"
                | "ordered"
                | "atkinson"
                | "floydsteinberg"
            )
          }
        >
          {dithers.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default DitherTypeDropdown;
