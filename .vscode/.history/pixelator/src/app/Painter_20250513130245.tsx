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
    height: "100%",
    backgroundColor: "rgba(233, 233, 233, 0.9)",
    backdropFilter: "blur(10px)",
    zIndex: "100",
  };

  const dotsBox: React.CSSProperties = {
    position: "relative",
    height: isPC ? "90%" : "",
    width: isPC ? "" : "",
    aspectRatio: "1/1",
    display: "flex",
    border: "solid 1px rgb(135, 135, 135)",
    outline: "solid 1px rgb(135, 135, 135)",
    outlineOffset: "3px",
    backgroundImage: `
      conic-gradient(
        from 0deg,
        rgb(226, 226, 226) 25%, rgb(255, 255, 255) 25%, rgb(255, 255, 255) 50%,
        rgb(226, 226, 226) 50%, rgb(226, 226, 226) 75%, rgb(255, 255, 255) 75%, rgb(255, 255, 255) 100%
      )`,
    backgroundSize: isPC ? "10% 10%" : "40px 40px",
    backgroundPosition: isPC ? "2.5% 2.5%" : "10px 10px",
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
          <div style={dotsBox}></div>
        </div>
      </>
    </>
  );
};

export default Painter;
