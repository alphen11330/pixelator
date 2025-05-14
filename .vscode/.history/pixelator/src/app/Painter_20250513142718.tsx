import { useState } from "react";
import useDeviceChecker from "./deviceChecker";
import style from "./util.module.css";
type Props = {
  dotsImageSrc: string | null;
  setIsPainter: React.Dispatch<React.SetStateAction<boolean>>;
};

const Painter: React.FC<Props> = ({ dotsImageSrc, setIsPainter }) => {
  const isPC = useDeviceChecker();

  const paintBoad: React.CSSProperties = {
    position: "absolute",
    left: "0px",
    top: "50px",
    width: "100%",
    height: "calc(100% - 0px)",
    backgroundColor: "rgba(233, 233, 233, 0.9)",
    backdropFilter: "blur(10px)",
    zIndex: "100",
  };

  const dotsBox: React.CSSProperties = {
    position: "absolute",
    height: "95%",
    aspectRatio: "1/1",
    top: "50%",
    transform: "translate(0%,-50%)",
    display: "flex",
    border: "solid 1px rgb(135, 135, 135)",
    outline: "solid 1px rgb(135, 135, 135)",
    outlineOffset: "3px",
    backgroundColor: "rgb(255,255,255)",
    userSelect: "none",
    overflow: "hidden",
  };

  const [imgPosition, setImgPosition] = useState({ X: 0, Y: 0 });
  const imgStyle: React.CSSProperties = {
    position: "absolute",
    top: imgPosition.Y + "px",
    left: imgPosition.X + "px",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    imageRendering: "pixelated",
    userSelect: "none",
    pointerEvents: "none",
  };

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
  return (
    <>
      <>
        <div style={paintBoad}>
          <button
            className={style.closeButton}
            onClick={() => setIsPainter(false)}
          />
          <div style={dotsBox}>
            {dotsImageSrc && <img src={dotsImageSrc} style={imgStyle} />}
          </div>
          <div style={toolBar}>
            <div style={toolBox}></div>
            <div style={toolBox}></div>
          </div>
        </div>
      </>
    </>
  );
};

export default Painter;
