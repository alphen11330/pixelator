import { useRef, useState } from "react";
import useDeviceChecker from "../../deviceChecker";
import style from "../../util.module.css";
import MenuBar from "./MenuBar";
type Props = {
  dotsImageSrc: string | null;
  setIsPainter: React.Dispatch<React.SetStateAction<boolean>>;
  pixelLength: number;
};

const Painter: React.FC<Props> = ({
  dotsImageSrc,
  setIsPainter,
  pixelLength,
}) => {
  const isPC = useDeviceChecker();

  // ["none", "brush", "eraser", "bucket", "hand", "line"]
  const [editMode, setEditMode] = useState("none");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <>
      <>
        <div style={paintBoad}>
          <button
            className={style.closeButton}
            style={{ position: "absolute", top: "10px", left: "10px" }}
            onClick={() => setIsPainter(false)}
          />
          <div style={dotsBox}>
            {dotsImageSrc && <img src={dotsImageSrc} style={imgStyle} />}
          </div>

          <MenuBar editMode={editMode} setEditMode={setEditMode} />
        </div>
      </>
    </>
  );
};

export default Painter;
