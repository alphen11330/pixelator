type Props = {};

const MenuBar = () => {
  const toolBar: React.CSSProperties = {
    position: "absolute",
    left: "0px",
    top: "50%",
    transform: "translate(0,-50%)",
    width: "5%",
    height: "80%",
    backgroundColor: "rgb(47, 47, 47)",
    borderRadius: "0px 10px 10px 0px",
    paddingBlock: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  };

  const toolBox: React.CSSProperties = {
    position: "relative",
    width: "70%",
    aspectRatio: "1/1",
    backgroundColor: "rgb(79, 79, 79)",
  };

  return <></>;
};

export default MenuBar;
