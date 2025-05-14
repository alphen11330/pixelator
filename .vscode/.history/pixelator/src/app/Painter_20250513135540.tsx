import useDeviceChecker from "./deviceChecker";
import style from "./util.module.css";
type Props = {
  dotsImageSrc: string | null;
  setIsPainter: React.Dispatch<React.SetStateAction<boolean>>;
};

const Painter: React.FC<Props> = ({ dotsImageSrc, setIsPainter }) => {
  const isPC = useDeviceChecker();

  const paintBoad: React.CSSProperties = {
    position: "absolute",
    left: "0px",
    top: "50px",
    width: "100%",
    height: "calc(100% - 50px)",
    backgroundColor: "rgba(233, 233, 233, 0.9)",
    backdropFilter: "blur(10px)",
    zIndex: "100",
  };

  const dotsBox: React.CSSProperties = {
    position: "absolute",
    height: "95%",
    aspectRatio: "1/1",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
    display: "flex",
    border: "solid 1px rgb(135, 135, 135)",
    outline: "solid 1px rgb(135, 135, 135)",
    outlineOffset: "3px",
    backgroundColor: "rgb(255,255,255)",
    userSelect: "none",
  };

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    objectFit: "contain",
    imageRendering: "pixelated",
    userSelect: "none",
  };

  return (
    <>
      <>
        <div style={paintBoad}>
          <button
            className={style.closeButton}
            onClick={() => setIsPainter(false)}
          />
          <div style={dotsBox}>
            {dotsImageSrc && <img src={dotsImageSrc} style={imgStyle} />}
          </div>
        </div>
      </>
    </>
  );
};

export default Painter;
