import style from "../util.module.css";

type Props = {};

const RefreshButton: React.FC<Props> = () => {
  return (
    <>
      <button
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: "1rem",
        }}
        className={style.refreshButton}
      >
        <div className={style.refresh} />
      </button>
    </>
  );
};
export default RefreshButton;
