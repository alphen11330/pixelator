type Props = {
  ditherType: string;
  setDitherType: React.Dispatch<React.SetStateAction<string>>;
};

const DitherTypeDropdown: React.FC<Props> = ({ ditherType, setDitherType }) => {
  const dithers = [
    { value: "none", label: "　ーーーー　" }, // ディザリングなし
    { value: "bayerMatrixBasic", label: "ベーシック" }, //組織的ディザリング
    { value: "bayerMatrixNoise", label: "ノイズパターン" },
    { value: "bayerMatrixPlaid", label: "チェック" },
    { value: "bayerMatrixCheckered", label: "市松模様" },
    { value: "bayerMatrixLeadGlass", label: "ガラス" },
    { value: "bayerMatrixCRT_Vertical", label: "たてじま" },
    { value: "bayerMatrixCRT_Horizontal", label: "よこじま" },
    { value: "bayerMatrixDiagonal", label: "斜めストライプ" },
    { value: "bayerMatrixMeshShadow", label: "メッシュ（明）" },
    { value: "bayerMatrixMeshLight", label: "メッシュ（暗）" },
    { value: "bayerMatrixPolkadotShadow", label: "ハーフトーン（影）" },
    { value: "bayerMatrixPolkadotLight", label: "ハーフトーン（光）" },
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
        onChange={(e) => setDitherType(e.target.value)}
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
