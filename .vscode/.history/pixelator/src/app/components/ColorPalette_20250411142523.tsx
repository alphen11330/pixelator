import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import createPalette from "./createPalette";
import style from "../icon.module.css";

// キャッシュを使用して変換を最適化
const rgbToHexCache = new Map<string, string>();

const rgbToHex = (rgb: string): string => {
  // キャッシュにあればそれを返す
  if (rgbToHexCache.has(rgb)) {
    return rgbToHexCache.get(rgb)!;
  }

  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;

  const [, r, g, b] = match.map(Number);
  const hex =
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("");

  // 結果をキャッシュ
  rgbToHexCache.set(rgb, hex);
  return hex;
};

const readImage = (
  event: React.ChangeEvent<HTMLInputElement>,
  setImageToForPalette: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const MAX_SIZE = 512;

  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target?.result) {
      const img = new Image();
      img.src = e.target.result as string;
      img.onload = () => {
        const { width, height } = img;
        let newWidth = width;
        let newHeight = height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            newWidth = MAX_SIZE;
            newHeight = (height / width) * MAX_SIZE;
          } else {
            newHeight = MAX_SIZE;
            newWidth = (width / height) * MAX_SIZE;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          const resizedDataUrl = canvas.toDataURL("image/png");
          setImageToForPalette(resizedDataUrl);

          const inputElement = event.target as HTMLInputElement;
          inputElement.value = "";
        }
      };
    }
  };
  reader.readAsDataURL(file);
};

type Props = {
  colorPalette: string[];
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  smoothImageSrc: string | null;
  colorLevels: number;
  imageSrc: string | null;
  refreshColorPalette: boolean;
  setRefreshColorPalette: React.Dispatch<React.SetStateAction<boolean>>;
};

const ColorPalette: React.FC<Props> = ({
  colorPalette,
  setColorPalette,
  smoothImageSrc,
  colorLevels,
  imageSrc,
  refreshColorPalette,
  setRefreshColorPalette,
}) => {
  const [imageForPalette, setImageForPalette] = useState<string | null>(null);
  // ローカルの編集用パレット状態
  const [localPalette, setLocalPalette] = useState<string[]>([]);
  // 更新をバッチ処理するためのタイマーID
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  // パレット更新が保留中かどうか
  const pendingUpdateRef = useRef<boolean>(false);

  // カラーパレットの生成 - useCallbackで関数を最適化
  const fetchPalette = useCallback(
    async (img: string | null) => {
      if (img) {
        const palette = await createPalette(img, Math.pow(2, colorLevels));
        setColorPalette(palette);
        setLocalPalette(palette);
      }
    },
    [setColorPalette, colorLevels]
  );

  // リフレッシュ、減色数を変更したときに編集画像からパレットを作成
  useEffect(() => {
    fetchPalette(smoothImageSrc);
  }, [
    fetchPalette,
    smoothImageSrc,
    imageSrc,
    refreshColorPalette,
    colorLevels,
  ]);

  // パレット用画像からパレットを作成
  useEffect(() => {
    if (imageForPalette) {
      fetchPalette(imageForPalette);
      setImageForPalette(null);
    }
  }, [fetchPalette, imageForPalette]);

  // 親から受け取ったパレットが変わったらローカルパレットを更新
  useEffect(() => {
    if (
      !pendingUpdateRef.current &&
      JSON.stringify(colorPalette) !== JSON.stringify(localPalette)
    ) {
      setLocalPalette(colorPalette);
    }
  }, [colorPalette]);

  // 色変更を最適化する関数
  const handleColorChange = useCallback(
    (index: number, newColor: string) => {
      // ローカルの状態をすぐに更新（UI反応性のため）
      setLocalPalette((prev) => {
        const updated = [...prev];
        updated[index] = newColor;
        return updated;
      });

      // 更新が保留中であることをマーク
      pendingUpdateRef.current = true;

      // 既存のタイマーをクリア
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }

      // 300ms後に親コンポーネントにパレット更新を通知（デバウンス）
      updateTimerRef.current = setTimeout(() => {
        setColorPalette((prev) => {
          const updated = [...prev];
          updated[index] = newColor;
          return updated;
        });
        pendingUpdateRef.current = false;
      }, 300);
    },
    [setColorPalette]
  );

  // パレットを小さなチャンクに分割して表示するためのロジック
  const paletteChunks = useMemo(() => {
    // パレットが大きい場合は仮想化を検討
    const MAX_VISIBLE_COLORS = 128; // 一度に表示する最大数

    if (localPalette.length <= MAX_VISIBLE_COLORS) {
      return [localPalette];
    }

    // パレットが大きい場合は複数チャンクに分割
    const chunks: string[][] = [];
    const chunkSize = MAX_VISIBLE_COLORS;

    for (let i = 0; i < localPalette.length; i += chunkSize) {
      chunks.push(localPalette.slice(i, i + chunkSize));
    }

    return chunks;
  }, [localPalette]);

  // スタイル定義
  const collorPaletteStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    marginTop: "1rem",
    marginInline: "auto",
    width: "80%",
  };

  const colorInputStyle: React.CSSProperties = {
    width: "calc(100% / 8 - 3px)",
    paddingTop: "10%",
    marginInline: "1.5px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    cursor: "pointer",
    backgroundColor: "rgb(255, 255, 255)",
  };

  const buttonContainer: React.CSSProperties = {
    display: "flex",
    width: "calc(80% - 3px)",
    marginInline: "auto",
    justifyContent: "space-between",
    alignItems: "center",
  };

  const buttonStyle: React.CSSProperties = {
    position: "relative",
    height: "3.2rem",
    padding: "1rem",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "5px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
    userSelect: "none",
  };

  // カラーサンプル表示用のスタイル
  const colorSampleStyle: React.CSSProperties = {
    width: "calc(100% / 8 - 3px)",
    paddingTop: "10%",
    marginInline: "1.5px",
    marginBottom: "3px",
    borderRadius: "4px",
    border: "solid 1px rgb(184, 184, 184)",
    cursor: "pointer",
  };

  return (
    <>
      <div style={buttonContainer}>
        <button
          style={{
            ...buttonStyle,
            border: "2px solid hsl(140, 39.40%, 49.20%)",
            backgroundColor: "hsl(125, 59.30%, 88.40%)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(140, 51.70%, 70.80%)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(125, 59.30%, 88.40%)")
          }
          onClick={() => setRefreshColorPalette(!refreshColorPalette)}
        >
          <div className={style.reload} />
        </button>

        <label
          htmlFor="fileForPalette-upload"
          style={{
            ...buttonStyle,
            border: "2px solid hsl(70, 39.40%, 49.20%)",
            backgroundColor: "hsl(60, 59.30%, 88.40%)",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(70, 51.70%, 70.80%)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = "hsl(60, 59.30%, 88.40%)")
          }
        >
          <div>画像からパレットを作成</div>
        </label>
        <input
          id="fileForPalette-upload"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => readImage(e, setImageForPalette)}
        />
      </div>

      {paletteChunks.map((chunk, chunkIndex) => (
        <div key={`chunk-${chunkIndex}`} style={collorPaletteStyle}>
          {chunk.map((color, index) => {
            const actualIndex = chunkIndex * 128 + index;
            const hexColor = useMemo(() => rgbToHex(color), [color]);

            return (
              <input
                key={`color-${actualIndex}`}
                type="color"
                value={hexColor}
                title={color}
                onChange={(e) => {
                  handleColorChange(actualIndex, e.target.value);
                }}
                style={{ ...colorInputStyle, backgroundColor: color }}
              />
            );
          })}
        </div>
      ))}
    </>
  );
};

export default ColorPalette;
