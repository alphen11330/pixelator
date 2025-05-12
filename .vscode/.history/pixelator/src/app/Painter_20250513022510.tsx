import { useState } from "react";
import style from "./util.module.css";
type Props = {
  dotsImageSrc: string | null;
};

const Painter: React.FC<Props> = ({ dotsImageSrc }) => {
  const [isPainter, setIsPainter] = useState(false);
  return (
    <>
      <button className={style.openPainter} onClick={setIsPainter(true)}>
        <img src="/palette.png" alt="Palette" className={style.palette} />
        <img src="/brush.png" alt="Brush" className={style.brush} />
      </button>
    </>
  );
};

export default Painter;
