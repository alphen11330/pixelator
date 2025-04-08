type Props = {
  ditherType: "none" | "ordered" | "atkinson" | "floydsteinberg";
  setDitherType: React.Dispatch<
    React.SetStateAction<"ordered" | "atkinson" | "floydsteinberg" | "none">
  >;
};

const ditherTypeDropdown: React.FC<Props> = ({
  mixBlendMode,
  setMixBlendMode,
}) => {
  const ditherType = [
    { value: "normal", label: "通常" },
    { value: "darken", label: "比較（暗）" },
    { value: "multiply", label: "乗算" },
    { value: "color-burn", label: "焼き込みカラー" },
    { value: "lighten", label: "比較（明）" },
    { value: "screen", label: "スクリーン" },
    { value: "color-dodge", label: "覆い焼きカラー" },
    { value: "plus-lighter", label: "加算" },
    { value: "overlay", label: "オーバーレイ" },
    { value: "soft-light", label: "ソフトライト" },
    { value: "hard-light", label: "ハードライト" },
    { value: "difference", label: "差の絶対値" },
    { value: "exclusion", label: "除外" },
    { value: "hue", label: "色相" },
    { value: "saturation", label: "彩度" },
    { value: "color", label: "カラー" },
    { value: "luminosity", label: "輝度" },
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
        value={mixBlendMode}
        style={ditherTypeSelect}
        onChange={(e) => setMixBlendMode(e.target.value)}
      >
        {ditherType.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ditherTypeDropdown;
