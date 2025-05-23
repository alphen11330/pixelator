import style from "../util.module.css";

type Props = {
  setColorCollection: React.Dispatch<React.SetStateAction<boolean>>;
  setEdgeEnhancement: React.Dispatch<React.SetStateAction<boolean>>;
  setColorReduction: React.Dispatch<React.SetStateAction<boolean>>;
  setContrast: React.Dispatch<React.SetStateAction<boolean>>;
  setIsHue: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaturation: React.Dispatch<React.SetStateAction<boolean>>;
  setRefreshColorPalette: React.Dispatch<React.SetStateAction<boolean>>;
  refreshColorPalette: boolean;

  setPixelLength: React.Dispatch<React.SetStateAction<number>>;
  setContrastLevel: React.Dispatch<React.SetStateAction<number>>;
  setHue: React.Dispatch<React.SetStateAction<number>>;
  setSaturation: React.Dispatch<React.SetStateAction<number>>;
};

const RandomButton: React.FC<Props> = ({
  setColorCollection,
  setEdgeEnhancement,
  setColorReduction,
  setContrast,
  setIsHue,
  setIsSaturation,
  setRefreshColorPalette,
  refreshColorPalette,

  setPixelLength,
  setContrastLevel,
  setHue,
  setSaturation,
}) => {
  const setRandom = () => {
    setColorCollection(true); //色調補正オン
    setEdgeEnhancement(true); //輪郭線協調オン
    setColorReduction(true); //減色オン
    setContrast(true);
    setIsHue(true);
    setIsSaturation(true);

    // Pixel Length: 128～512の8の倍数
    const randomLength =
      Math.floor(Math.random() * ((512 - 128) / 8 + 1)) * 8 + 64;
    setPixelLength(randomLength);

    // Contrast Level: 0.8～1.2 (0.1刻み)
    const randomContrastLevel =
      Math.floor(Math.random() * ((1.2 - 0.8) / 0.1 + 1)) * 0.1 + 0.8;
    setContrastLevel(randomContrastLevel);

    // Hue: 0～179 (1刻み)
    const randomHue = Math.floor(Math.random() * 180);
    setHue(randomHue);

    // Saturation: -30～90 (1刻み)
    const randomSaturation = Math.floor(Math.random() * (90 - -30 + 1)) - 30;
    setSaturation(randomSaturation);

    // カラーパレット更新
    setRefreshColorPalette(!refreshColorPalette);
  };

  return (
    <>
      <button
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: "auto",
        }}
        className={style.rainbowButton}
        onClick={() => {
          setRandom();
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path
            fillRule="evenodd"
            d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
            clipRule="evenodd"
            stroke="rgb(144, 157, 44)"
            strokeWidth="1.5px"
          />
        </svg>
      </button>
    </>
  );
};

export default RandomButton;
