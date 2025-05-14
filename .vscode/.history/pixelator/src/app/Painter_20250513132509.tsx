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
    height: "80%",
    aspectRatio: "1/1",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
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
    backgroundSize: "2.5% 2.5%",
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
