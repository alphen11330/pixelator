type Props = {};

const PixelVideoProcessor: React.FC<Props> = () => {
  return;

  <>
    <video
      src={dotsVideoSrc}
      style={imgStyle}
      onContextMenu={(e) => e.preventDefault()}
    />{" "}
    {dotsVideoSrc}
  </>;
};
export default PixelVideoProcessor;
