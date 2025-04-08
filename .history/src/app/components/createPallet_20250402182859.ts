// 改良版: Octreeによる色のクォンタイズを使って画像から代表的な8色を抽出する関数
export const createPallet = async (imageSrc: string): Promise<number[][]> => {
  return new Promise<number[][]>((resolve) => {
    // 画像を読み込む
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // canvas要素を作成して画像を描画
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }
      
      // リサイズして処理を高速化（必要に応じて調整）
      const maxSize = 300;
      let width = img.width;
      let height = img.height;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // 画像データを取得
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      
      // 色の出現頻度を数える簡易アプローチ
      const colorCounts = new Map<string, { count: number, rgb: number[] }>();
      
      // 色の量子化レベル（精度）
      const quantizationLevel = 8; // 0-255を8段階に量子化
      const mask = 255 - (quantizationLevel - 1);
      
      // 各ピクセルの色をカウント
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] & mask;
        const g = pixels[i + 1] & mask;
        const b = pixels[i + 2] & mask;
        const a = pixels[i + 3];
        
        // 完全な透明ピクセルはスキップ
        if (a < 10) continue;
        
        const colorKey = `${r},${g},${b}`;
        
        if (colorCounts.has(colorKey)) {
          colorCounts.get(colorKey)!.count++;
        } else {
          colorCounts.set(colorKey, { count: 1, rgb: [r, g, b] });
        }
      }
      
      // 出現頻度でソート
      const sortedColors = Array.from(colorCounts.values())
        .sort((a, b) => b.count - a.count);
      
      // 上位8色を取得
      const topColors = sortedColors.slice(0, 8);
      
      // もし8色未満の場合は、デフォルト色を追加
      while (topColors.length < 8) {
        // 存在しない色を追加
        const defaultColors = [
          { count: 0, rgb: [255, 0, 0] },    // 赤
          { count: 0, rgb: [0, 255, 0] },    // 緑
          { count: 0, rgb: [0, 0, 255] },    // 青
          { count: 0, rgb: [255, 255, 0] },  // 黄
          { count: 0, rgb: [255, 0, 255] },  // マゼンタ
          { count: 0, rgb: [0, 255, 255] },  // シアン
          { count: 0, rgb: [255, 255, 255] },// 白
          { count: 0, rgb: [0, 0, 0] }       // 黒
        ];
        
        for (const color of defaultColors) {
          if (!topColors.some(c => 
            c.rgb[0] === color.rgb[0] && 
            c.rgb[1] === color.rgb[1] && 
            c.rgb[2] === color.rgb[2]
          )) {
            topColors.push(color);
            break;
          }
        }
      }
      
      // RGB配列の形式で返す
      const palette = topColors.map(color => color.rgb);
      
      // 出力が8色になるようにする
      const result = palette.slice(0, 8);
      
      // 量子化された色を元の色空間に戻す（オプション）
      const finalPalette = result.map(color => [
        Math.min(255, color[0] + Math.floor(quantizationLevel / 2)),
        Math.min(255, color[1] + Math.floor(quantizationLevel / 2)),
        Math.min(255, color[2] + Math.floor(quantizationLevel / 2))
      ]);
      
      // 結果を返す
      resolve(finalPalette);
    };
    
    img.src = imageSrc;
    
    // エラーハンドリング
    img.onerror = () => {
      console.error('画像の読み込みに失敗しました');
      resolve([
        [255, 0, 0],    // デフォルトカラーパレット
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
        [255, 0, 255],
        [0, 255, 255],
        [255, 255, 255],
        [0, 0, 0]
      ]);
    };
  });
};

// 使用例:
/*
const [colorPalette, setColorPalette] = useState<string[]>([]);

useEffect(() => {
  if (imageSrc) {
    const fetchPalette = async () => {
      try {
        const rgbColors = await createPallet(imageSrc); // RGB形式で色を取得
        const stringPalette = rgbColors.map((color) => color.join(", "));
        setColorPalette(stringPalette);
      } catch (error) {
        console.error('カラーパレットの生成中にエラーが発生しました:', error);
      }
    };
    
    fetchPalette();
  }
}, [imageSrc]);
*/