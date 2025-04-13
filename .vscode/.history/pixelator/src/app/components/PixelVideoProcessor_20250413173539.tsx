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
        style={videoStyle}
        onContextMenu={(e) => e.preventDefault()}
      />{" "}
      {dotsVideoSrc}
    </>
  );
};
export default PixelVideoProcessor;
