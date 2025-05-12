import { useState } from "react";
import style from "./util.module.css";
type Props = {
  dotsImageSrc: string | null;
};

const Painter: React.FC<Props> = ({ dotsImageSrc }) => {
  const paintBoad: React.CSSProperties = {
    position: "absolute",
    left: "0px",
    top: "0px",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(30, 30, 30, 0.5)",
    zIndex: "100",
  };
  return (
    <>
      <>
        <div style={paintBoad}></div>
      </>
    </>
  );
};

export default Painter;
