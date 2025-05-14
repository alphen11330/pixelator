import { useEffect, useRef, useState } from "react";
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!dotsImageSrc) return;
    const img = new Image();
    img.src = dotsImageSrc; // publicディレクトリに置いた画像ファイル
    img.onload = () => {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const imgWidth = img.width;
      const imgHeight = img.height;

      // アスペクト比を保ったままリサイズ
      const imgAspect = imgWidth / imgHeight;
      const canvasAspect = canvasWidth / canvasHeight;

      let drawWidth, drawHeight;

      if (imgAspect > canvasAspect) {
        // 横に合わせて縮小
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgAspect;
      } else {
        // 縦に合わせて縮小
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imgAspect;
      }

      // 中央に配置
      const offsetX = (canvasWidth - drawWidth) / 2;
      const offsetY = (canvasHeight - drawHeight) / 2;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };
  }, []);

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
            {dotsImageSrc && (
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                style={{ border: "1px solid black" }}
              />
            )}
          </div>

          <MenuBar editMode={editMode} setEditMode={setEditMode} />
        </div>
      </>
    </>
  );
};

export default Painter;
