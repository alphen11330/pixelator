import style from "../util.module.css";

type Props = {
  setColorCollection: React.Dispatch<React.SetStateAction<boolean>>;
  setEdgeEnhancement: React.Dispatch<React.SetStateAction<boolean>>;
  setColorReduction: React.Dispatch<React.SetStateAction<boolean>>;
  setContrast: React.Dispatch<React.SetStateAction<boolean>>;
  setBrightness: React.Dispatch<React.SetStateAction<boolean>>;
  setIsHue: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLuminance: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaturation: React.Dispatch<React.SetStateAction<boolean>>;
  setPixelLength: React.Dispatch<React.SetStateAction<number>>;

  setContrastLevel: React.Dispatch<React.SetStateAction<number>>;
  setBrightnessLevel: React.Dispatch<React.SetStateAction<number>>;
  setHue: React.Dispatch<React.SetStateAction<number>>;
  setLuminance: React.Dispatch<React.SetStateAction<number>>;
  setSaturation: React.Dispatch<React.SetStateAction<number>>;
  setWhiteSize: React.Dispatch<React.SetStateAction<number>>;
  setDitherType: React.Dispatch<React.SetStateAction<string>>;
  setDitherStrength: React.Dispatch<React.SetStateAction<number>>;
  setColorLevels: React.Dispatch<React.SetStateAction<number>>;
  setLockPalette: React.Dispatch<React.SetStateAction<boolean>>;
};

const RefreshButton: React.FC<Props> = ({
  setColorCollection,
  setEdgeEnhancement,
  setColorReduction,
  setContrast,
  setBrightness,
  setIsHue,
  setIsLuminance,
  setIsSaturation,

  setPixelLength,
  setContrastLevel,
  setBrightnessLevel,
  setHue,
  setLuminance,
  setSaturation,
  setWhiteSize,
  setDitherType,
  setDitherStrength,
  setColorLevels,
  setLockPalette,
}) => {
  const setInit = () => {
    // パレットをロック
    setLockPalette(true);

    // 項目を閉じる
    setColorCollection(false);
    setEdgeEnhancement(false);
    setColorReduction(false);
    setContrast(true);
    setBrightness(false);
    setIsHue(false);
    setIsLuminance(false);
    setIsSaturation(true);

    // 初期値に設定
    setPixelLength(256);
    setContrastLevel(1.1);
    setBrightnessLevel(25);
    setHue(60);
    setLuminance(10);
    setSaturation(30);
    setWhiteSize(2);
    setDitherType("bayerMatrixBasic");
    setDitherStrength(0.1);
    setColorLevels(5);
    // パレットを開放
    setLockPalette(false);
  };

  return (
    <>
      <button
        style={{
          marginLeft: "1rem",
        }}
        className={style.refreshButton}
        onClick={setInit}
      >
        <div className={style.refresh} />
      </button>
    </>
  );
};
export default RefreshButton;
