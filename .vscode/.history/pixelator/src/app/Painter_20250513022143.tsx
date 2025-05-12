import style from "./util.module.css";
type Props = {
  dotsImageSrc: string | null;
};

const Painter: React.FC<Props> = () => {
  return (
    <>
      <button className={style.openPainter}>
        <img src="/palette.png" alt="Palette" className={style.palette} />
        <img src="/brush.png" alt="Brush" className={style.brush} />
      </button>
    </>
  );
};

export default Painter;
