import style from "./util.module.css";
type Props = {};

const Painter: React.FC<Props> = () => {
  return (
    <>
      <button className={style.openPainter}>
        <img src={"/palette.png"} />
        <img src={"/blush.png"} />
      </button>
    </>
  );
};

export default Painter;
