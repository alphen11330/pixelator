import style from "../util.module.css";

type Props = {
  setColorCollection: React.Dispatch<React.SetStateAction<boolean>>;
  setEdgeEnhancement: React.Dispatch<React.SetStateAction<boolean>>;
  setColorReduction: React.Dispatch<React.SetStateAction<boolean>>;
  setContrast: React.Dispatch<React.SetStateAction<boolean>>;
  setIsHue: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaturation: React.Dispatch<React.SetStateAction<boolean>>;
  setPixelLength: React.Dispatch<React.SetStateAction<number>>;
  setContrastLevel: React.Dispatch<React.SetStateAction<number>>;
  setHue: React.Dispatch<React.SetStateAction<number>>;
  setSaturation: React.Dispatch<React.SetStateAction<number>>;
  setWhiteSize: React.Dispatch<React.SetStateAction<number>>;
  setDitherStrength: React.Dispatch<React.SetStateAction<number>>;
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  setDitherType: React.Dispatch<React.SetStateAction<string>>;
};

const RefreshButton: React.FC<Props> = (
  setColorCollection,
  setEdgeEnhancement,
  setColorReduction,
  setContrast,
  setIsHue,
  setIsSaturation,

  setPixelLength,
  setContrastLevel,
  setHue,
  setSaturation,
  setWhiteSize,
  setDitherStrength,
  setColorPalette,
  setDitherType
) => {
  return (
    <>
      <button
        style={{
          marginLeft: "1rem",
        }}
        className={style.refreshButton}
      >
        <div className={style.refresh} />
      </button>
    </>
  );
};
export default RefreshButton;
