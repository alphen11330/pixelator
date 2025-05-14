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
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M10.5 1.875a1.125 1.125 0 0 1 2.25 0v8.219c.517.162 1.02.382 1.5.659V3.375a1.125 1.125 0 0 1 2.25 0v10.937a4.505 4.505 0 0 0-3.25 2.373 8.963 8.963 0 0 1 4-.935A.75.75 0 0 0 18 15v-2.266a3.368 3.368 0 0 1 .988-2.37 1.125 1.125 0 0 1 1.591 1.59 1.118 1.118 0 0 0-.329.79v3.006h-.005a6 6 0 0 1-1.752 4.007l-1.736 1.736a6 6 0 0 1-4.242 1.757H10.5a7.5 7.5 0 0 1-7.5-7.5V6.375a1.125 1.125 0 0 1 2.25 0v5.519c.46-.452.965-.832 1.5-1.141V3.375a1.125 1.125 0 0 1 2.25 0v6.526c.495-.1.997-.151 1.5-.151V1.875Z" />
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
