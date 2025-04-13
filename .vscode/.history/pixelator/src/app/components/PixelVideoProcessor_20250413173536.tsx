type Props = {};

const PixelVideoProcessor: React.FC<Props> = () => {
  const videoStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "none",
  };

  return (
    <>
      <video
        src={dotsVideoSrc}
        style={imgStyle}
        onContextMenu={(e) => e.preventDefault()}
      />{" "}
      {dotsVideoSrc}
    </>
  );
};
export default PixelVideoProcessor;
