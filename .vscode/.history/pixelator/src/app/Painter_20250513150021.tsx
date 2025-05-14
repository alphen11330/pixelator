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
    left: "15%",
    transform: "translate(0%,-50%)",
    display: "flex",
    border: "solid 0px rgb(47, 47, 47)",
    outline: "solid 10px rgb(74, 74, 74)",
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
    aspectRatio: "1/1",
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
            <div style={toolBox}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="10 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                className="text-red-600"
              >
                <path d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" />
              </svg>
            </div>
            <div style={toolBox}></div>
          </div>
        </div>
      </>
    </>
  );
};

export default Painter;
