type Props = {
  dotsVideoSrc: string | null;
  pixelLength: number;
};

const PixelVideoProcessor: React.FC<Props> = ({ dotsVideoSrc }) => {
  const videoStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  return (
    <>
      {dotsVideoSrc && (
        <video
          src={dotsVideoSrc}
          style={videoStyle}
          controls
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </>
  );
};
export default PixelVideoProcessor;
