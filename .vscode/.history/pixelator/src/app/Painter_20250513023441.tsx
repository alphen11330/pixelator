import { useState } from "react";
import style from "./util.module.css";
type Props = {
  dotsImageSrc: string | null;
};

const Painter: React.FC<Props> = ({ dotsImageSrc }) => {
  const [isPainter, setIsPainter] = useState(false);

  const paintBoad: React.CSSProperties = {
    position: "fixed",
    left: "0px",
    top: "0px",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(30, 30, 30, 0.5)",
    filter: "blur(5px)",
    zIndex: "100",
  };
  return (
    <>
      <button className={style.openPainter} onClick={() => setIsPainter(true)}>
        <img src="/palette.png" alt="Palette" className={style.palette} />
        <img src="/brush.png" alt="Brush" className={style.brush} />
      </button>
      {isPainter && (
        <>
          <div style={paintBoad}></div>
        </>
      )}
    </>
  );
};

export default Painter;
