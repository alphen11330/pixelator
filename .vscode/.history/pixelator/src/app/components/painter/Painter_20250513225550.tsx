import React, { useState, useEffect, useRef } from "react";
import useDeviceChecker from "../../deviceChecker"; // 既存のフック
import style from "../../util.module.css"; // 既存のスタイル
import MenuBar from "./MenuBar"; // 既存のコンポーネント

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
  const isPC = useDeviceChecker(); // 現在は未使用ですが、将来的な拡張のために残します

  // ["none", "brush", "eraser", "bucket", "hand", "line"]
  const [editMode, setEditMode] = useState("none");
  const [brushColor, setBrushColor] = useState("black"); // ブラシの色 (将来的には変更可能に)

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  // pixelLength x pixelLength の2次元配列で色を管理 (例: "rgb(0,0,0)", "white")
  const [pixelData, setPixelData] = useState<string[][]>([]);

  const [isPainting, setIsPainting] = useState(false);

  // --- スタイル定義 ---
  const paintBoadStyle: React.CSSProperties = {
    // paintBoad から paintBoadStyle にリネーム
    position: "absolute",
    left: "0px",
    top: "50px",
    width: "100%",
    height: "calc(100% - 50px)", // 50pxのMenuBar分を考慮
    backgroundColor: "rgba(233, 233, 233, 0.9)",
    backdropFilter: "blur(10px)",
    zIndex: "100",
  };

  const dotsBoxStyle: React.CSSProperties = {
    // dotsBox から dotsBoxStyle にリネーム
    position: "absolute",
    height: "calc(95% - 50px)", // MenuBarの高さを考慮する場合調整
    aspectRatio: "1/1",
    top: "50%", // 中央寄せのため調整
    left: "50%", // 中央寄せ
    transform: "translate(-50%,-50%)",
    display: "flex", // Flexboxは不要になるかも
    border: "solid 0px rgb(47, 47, 47)", // 枠線スタイルは維持
    outline: "solid 10px rgb(74, 74, 74)", // アウトラインスタイルは維持
    backgroundColor: "rgb(255,255,255)", // 背景色は維持
    userSelect: "none",
    overflow: "hidden", // overflowはcanvas自体で制御
  };

  const canvasBaseStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    userSelect: "none",
  };

  const drawingCanvasStyle: React.CSSProperties = {
    ...canvasBaseStyle,
    imageRendering: "pixelated",
    zIndex: 0, // グリッドの下
  };

  const gridCanvasStyle: React.CSSProperties = {
    ...canvasBaseStyle,
    pointerEvents: "none", // グリッドはマウスイベントを拾わない
    zIndex: 1, // 描画キャンバスの上
  };

  // --- 初期画像の読み込みとpixelDataの初期化 ---
  useEffect(() => {
    const initializePixelData = async () => {
      const newPixelData: string[][] = Array(pixelLength)
        .fill(null)
        .map(() => Array(pixelLength).fill("white")); // デフォルトは白

      if (dotsImageSrc) {
        try {
          const img = new Image();
          img.crossOrigin = "Anonymous"; // CORS対応 (必要な場合)
          img.src = dotsImageSrc;
          await img.decode(); // 画像の読み込み完了を待つ

          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = pixelLength;
          tempCanvas.height = pixelLength;
          const tempCtx = tempCanvas.getContext("2d");

          if (tempCtx) {
            tempCtx.imageSmoothingEnabled = false;
            tempCtx.drawImage(img, 0, 0, pixelLength, pixelLength);
            const imageData = tempCtx.getImageData(
              0,
              0,
              pixelLength,
              pixelLength
            ).data;

            for (let y = 0; y < pixelLength; y++) {
              for (let x = 0; x < pixelLength; x++) {
                const i = (y * pixelLength + x) * 4;
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const a = imageData[i + 3];
                if (a === 0) {
                  // 透明ピクセルは白として扱う (または背景色)
                  newPixelData[y][x] = "white";
                } else {
                  newPixelData[y][x] = `rgb(${r},${g},${b})`;
                }
              }
            }
          }
        } catch (error) {
          console.error("Error loading image for pixel data:", error);
          // エラー時も白いデータで初期化される
        }
      }
      setPixelData(newPixelData);
    };

    initializePixelData();
  }, [dotsImageSrc, pixelLength]);

  // --- 描画用キャンバスへの描画 (pixelDataが変更されたら再描画) ---
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || pixelData.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = pixelLength; // 内部解像度
    canvas.height = pixelLength; // 内部解像度

    ctx.imageSmoothingEnabled = false;

    // pixelDataに基づいて描画
    for (let y = 0; y < pixelLength; y++) {
      for (let x = 0; x < pixelLength; x++) {
        if (pixelData[y] && pixelData[y][x]) {
          ctx.fillStyle = pixelData[y][x];
          ctx.fillRect(x, y, 1, 1); // 1x1ピクセルを描画
        } else if (pixelData[y]) {
          // データが存在する行で、該当セルが未定義なら白
          ctx.fillStyle = "white";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [pixelData, pixelLength]);

  // --- グリッドの描画 ---
  useEffect(() => {
    const canvas = gridCanvasRef.current;
    const dotsBoxElem = canvas?.parentElement; // dotsBoxを取得
    if (!canvas || !dotsBoxElem) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = dotsBoxElem.getBoundingClientRect();

    // 表示サイズに合わせてcanvasの解像度を設定 (HiDPI対応)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // canvasのCSSサイズも設定
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // グリッドをクリア

    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)"; // グリッドの色
    ctx.lineWidth = 1; // グリッド線の太さ (デバイスピクセルに対して1px)

    const cellDisplayWidth = rect.width / pixelLength;
    const cellDisplayHeight = rect.height / pixelLength;

    for (let i = 0; i <= pixelLength; i++) {
      // 縦線
      const xPos = Math.round(i * cellDisplayWidth);
      ctx.beginPath();
      ctx.moveTo(xPos, 0);
      ctx.lineTo(xPos, rect.height);
      ctx.stroke();

      // 横線
      const yPos = Math.round(i * cellDisplayHeight);
      ctx.beginPath();
      ctx.moveTo(0, yPos);
      ctx.lineTo(rect.width, yPos);
      ctx.stroke();
    }
    // リサイズに対応するためには、ResizeObserverなどを使うと良いでしょう
  }, [pixelLength, pixelData]); // pixelDataの変更でもグリッドの再描画をトリガー（dotsBoxのサイズが変わる可能性があるため）

  // --- マウスイベントハンドラ ---
  const getPixelCoordsFromMouseEvent = (
    event: React.MouseEvent<HTMLDivElement>
  ): { x: number; y: number } | null => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect(); // 表示上のcanvasのサイズと位置
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 表示上の座標をpixelLengthベースの座標に変換
    const pixelX = Math.floor((mouseX / rect.width) * pixelLength);
    const pixelY = Math.floor((mouseY / rect.height) * pixelLength);

    if (
      pixelX >= 0 &&
      pixelX < pixelLength &&
      pixelY >= 0 &&
      pixelY < pixelLength
    ) {
      return { x: pixelX, y: pixelY };
    }
    return null;
  };

  const paintPixel = (pixelX: number, pixelY: number) => {
    if (pixelData[pixelY] && pixelData[pixelY][pixelX] !== brushColor) {
      setPixelData((prevData) => {
        const newData = prevData.map((row, yIdx) =>
          yIdx === pixelY
            ? row.map((cell, xIdx) => (xIdx === pixelX ? brushColor : cell))
            : row
        );
        return newData;
      });
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (editMode !== "brush") return;
    setIsPainting(true);
    const coords = getPixelCoordsFromMouseEvent(event);
    if (coords) {
      paintPixel(coords.x, coords.y);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPainting || editMode !== "brush") return;
    const coords = getPixelCoordsFromMouseEvent(event);
    if (coords) {
      paintPixel(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    if (editMode !== "brush") return;
    setIsPainting(false);
    // ここで変更を保存するなどの処理を追加可能
  };

  const handleMouseLeave = () => {
    // dotsBoxからマウスが出た場合も描画を中断
    if (isPainting) {
      setIsPainting(false);
    }
  };

  return (
    <>
      <div style={paintBoadStyle}>
        <button
          className={style.closeButton}
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 10,
          }} // zIndex確保
          onClick={() => setIsPainter(false)}
        />
        <div
          style={dotsBoxStyle}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave} // マウスが領域外に出たときの処理
        >
          {/* 描画用キャンバス */}
          <canvas ref={drawingCanvasRef} style={drawingCanvasStyle} />
          {/* グリッド用キャンバス */}
          <canvas ref={gridCanvasRef} style={gridCanvasStyle} />
        </div>

        <MenuBar
          editMode={editMode}
          setEditMode={setEditMode}
          // brushColor={brushColor} // MenuBarに渡す場合
          // setBrushColor={setBrushColor} // MenuBarから色変更する場合
        />
      </div>
    </>
  );
};

export default Painter;
