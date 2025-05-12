import style from "./util.module.css";
type Props = {};

const Painter: React.FC<Props> = () => {
  return (
    <>
      <button className={style.openPainter}>
        <img src={"/brush.png"} />
        <img src={"/palette.png"} />
      </button>
    </>
  );
};

export default Painter;
