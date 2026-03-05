import { useState, useEffect } from "react";
import { paletteFiles } from "@/app/paletteList";

type Props = {
  setColorPalette: React.Dispatch<React.SetStateAction<string[]>>;
  isJP: boolean;
};

const SelectPrePalette: React.FC<Props> = ({ setColorPalette, isJP }) => {
  const [isOpenContents, setIsContents] = useState(false);

  // 読み込んだパレット一覧（複数）
  const [palettes, setPalettes] = useState<
    { name: string; author: string; link: string; colors: string[] }[]
  >([]);

  // ▼ すべてのパレットファイルを読み込む
  useEffect(() => {
    const loadAllPalettes = async () => {
      const results: {
        name: string;
        author: string;
        link: string;
        colors: string[];
      }[] = [];

      for (const [file, author, link] of paletteFiles) {
        const res = await fetch(`/paletteList/${file}`);
        const text = await res.text();

        const lines = text.split("\n").map((l) => l.trim());
        const colorLines = lines.slice(3);

        const rgbList = colorLines
          .filter((l) => l.length > 0)
          .map((line) => {
            const [r, g, b] = line.split(" ").map(Number);
            return `rgb(${r},${g},${b})`;
          });

        results.push({
          name: file.replace(".pal", ""),
          author,
          link,
          colors: rgbList,
        });
      }

      setPalettes(results);
    };

    loadAllPalettes();
  }, []);

  // ▼ UI スタイル
  const contentsBar: React.CSSProperties = {
    display: "flex",
    width: "calc(80% - 3px)",
    height: "1.5rem",
    color: "white",
    paddingInline: "1rem",
    background: "rgb(101, 98, 105)",
    borderRadius: "5px 5px 0 0",

    alignItems: "center",
    justifyContent: "space-between",
    marginInline: "auto",
    marginTop: "1rem",
    fontSize: "0.8rem",
    cursor: "pointer",
    userSelect: "none",
  };

  const contentsBox: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: "border-box",
    border: "solid 5px rgb(60, 58, 71)",
    borderRadius: "0 0 5px 5px",
    background: "rgb(189, 189, 195)",
    height: isOpenContents ? "40vh" : "0px", // 開閉アニメーション
    // maxHeight: "25vh",
    paddingInline: "1rem",
    overflow: "auto",
    transition: "height 0.5s ease",
  };

  return (
    <>
      <div style={contentsBar} onClick={() => setIsContents((prev) => !prev)}>
        <span>{isJP ? "プリパレットを選択" : "Select Pre-Palette"}</span>

        <span
          style={{
            transform: isOpenContents ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </div>

      {/* スライドダウン部分 */}
      <div
        style={{
          marginInline: "auto",
          width: "calc(80% - 3px)",
        }}
      >
        <div style={contentsBox}>
          {palettes.map((p, index) => (
            <div
              key={index}
              onClick={() => setColorPalette(p.colors)}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span>
                {/* パレット名 by 作者名 */}
                <span style={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                  {p.name}{" "}
                </span>

                {/* ▼ リンク */}
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    color: "rgb(82, 67, 253)",
                    textDecoration: "underline",
                    fontSize: "0.75rem",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span style={{ fontWeight: "normal", fontSize: "0.75rem" }}>
                    by {p.author}
                  </span>
                </a>
              </span>

              {/* ▼ 色プレビュー */}
              <div style={{ display: "flex" }}>
                {p.colors.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, // 色数に応じて幅を自動調整
                      height: "30px",
                      background: c,
                    }}
                  />
                ))}
              </div>

              {/* 区切り線 */}
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  background: "rgba(255,255,255,0.2)",
                  marginTop: "4px",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SelectPrePalette;
