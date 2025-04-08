export default function PixelArtConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null); // オリジナル画像（不変）
  const [smoothImageSrc, setSmoothImageSrc] = useState<string | null>(null); // グレースケール適用後の画像
  const [dotsImageSrc, setDotsImageSrc] = useState<string | null>(null);
  const [pixelLength, setPixelLength] = useState(64);
  const [grayscale, setGrayscale] = useState(false);

  // OpenCV.js をロード
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/js/opencv.js";
    script.async = true;
    script.onload = () => console.log("OpenCV.js Loaded");
    document.body.appendChild(script);
  }, []);

  // グレースケールを解除したら `smoothImageSrc` をオリジナルに戻す
  useEffect(() => {
    if (!grayscale && imageSrc) {
      setSmoothImageSrc(imageSrc);
    }
  }, [grayscale, imageSrc]);

  return (
    <>
      <Uploader
        setImageSrc={(src) => {
          setImageSrc(src);
          setSmoothImageSrc(src); // 初期状態ではオリジナルのまま
        }}
      />

      {smoothImageSrc && (
        <>
          <img
            src={smoothImageSrc}
            width={"256px"}
            alt="Original"
            style={{
              display: "inline",
              margin: "1rem",
              border: "solid 1px black",
            }}
          />
          <PixelArtProcessor
            imageSrc={smoothImageSrc}
            setDotsImageSrc={setDotsImageSrc}
            pixelLength={pixelLength}
          />
          {grayscale && (
            <GrayscaleProcessor
              imageSrc={imageSrc}
              setImageSrc={setSmoothImageSrc} // グレースケール適用時のみ変更
              grayscale={grayscale}
            />
          )}
          <span style={{ userSelect: "none" }}>▶</span>
        </>
      )}

      {dotsImageSrc && (
        <>
          <img
            src={dotsImageSrc}
            width={"256px"}
            alt="Pixel Art"
            style={{
              display: "inline",
              margin: "1rem",
              border: "solid 1px black",
              imageRendering: "pixelated",
            }}
          />
          <br />
        </>
      )}

      <CheckBox
        name={"グレースケール"}
        value={grayscale}
        setValue={setGrayscale}
      />

      <InputRange
        name={"ドット長"}
        min={8}
        max={512}
        step={8}
        value={pixelLength}
        setValue={setPixelLength}
      />
    </>
  );
}
