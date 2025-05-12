type Props = {};

const RefreshButton: React.FC<Props> = () => {
  return (
    <>
      <button
        className={style.refreshButton}
        onClick={() => setRefreshColorPalette(!refreshColorPalette)}
      >
        <div className={style.refresh} />
      </button>
    </>
  );
};
export default RefreshButton;
