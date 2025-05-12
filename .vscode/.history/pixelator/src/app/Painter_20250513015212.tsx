import style from "./util.module.css";
type Props = {};

const Painter: React.FC<Props> = () => {
  return (
    <>
      <button className={style.openPainter}></button>
    </>
  );
};

export default Painter;
