import { useState } from "react";
import style from "./util.module.css";
type Props = {
  dotsImageSrc: string | null;
};

const Painter: React.FC<Props> = ({ dotsImageSrc }) => {
  const [isPainter, setIsPainter] = useState(false);

  const paintBoad: React.CSSProperties = {
    width: "100%",
    height: "calc(100% - 50px)",
    backgroundColor: rgba(0, 0, 0, 0.5)",
  };
  return (
    <>
      <button className={style.openPainter} onClick={() => setIsPainter(true)}>
        <img src="/palette.png" alt="Palette" className={style.palette} />
        <img src="/brush.png" alt="Brush" className={style.brush} />
      </button>
      {isPainter && (
        <>
          <div></div>
        </>
      )}
    </>
  );
};

export default Painter;
