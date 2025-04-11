type Props = {
  ditherType: string
  >;
};

const DitherTypeDropdown: React.FC<Props> = ({ ditherType, setDitherType }) => {
  const dithers = [
    { value: "none", label: "ーーーー" },
    { value: "orderedClassic", label: "ディザリングＡ" }, //組織的ディザリング
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
    userSelect: "none",
  };

  return (
    <>
      <span style={label}>ディザリングタイプ：</span>

      <select
        value={ditherType}
        style={ditherTypeSelect}
        onChange={(e) => setDitherType(e.target.value as "none" | "ordered")}
      >
        {dithers.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </>
  );
};

export default DitherTypeDropdown;
