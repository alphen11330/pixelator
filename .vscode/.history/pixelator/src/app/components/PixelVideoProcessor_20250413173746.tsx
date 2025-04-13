type Props = {
  dotsVideoSrc: string | null;
};

const PixelVideoProcessor: React.FC<Props> = ({ dotsVideoSrc }) => {
  const videoStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none",
  };

  return (
    <>
      {dotsVideoSrc && (
        <video
          src={dotsVideoSrc}
          style={videoStyle}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </>
  );
};
export default PixelVideoProcessor;
