import style from "./util.module.css";

type Props = {};

const RefreshButton: React.FC<Props> = () => {
  return (
    <>
      <button className={style.refreshButton}>
        <div className={style.refresh} />
      </button>
    </>
  );
};
export default RefreshButton;
