// createPalette.ts

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface ColorBox {
  pixels: RGB[];
  minR: number;
  maxR: number;
  minG: number;
  maxG: number;
  minB: number;
  maxB: number;
}

/**
 * 画像から代表的な色を抽出してカラーパレットを作成する
 * @param img - 画像のDataURL形式または画像へのパス
 * @param colorCount - 抽出する色の数
 * @returns RGB値の文字列配列 (例: ["rgb(255,0,0)", "rgb(0,255,0)"])
 */
export const createPalette = async (img: string, colorCount: number): Promise<string[]> => {
  try {
    // 画像からピクセルデータを取得
    const pixelData = await getPixelDataFromImage(img);
    
    // メディアンカット法でカラーパレットを生成
    const palette = medianCut(pixelData, colorCount);
    
    // RGB形式の文字列に変換
    return palette.map(color => `rgb(${Math.round(color.r)},${Math.round(color.g)},${Math.round(color.b)})`);
  } catch (error) {
    console.error('カラーパレット生成エラー:', error);
    return [];
  }
};

/**
 * 画像からピクセルデータを抽出する
 */
const getPixelDataFromImage = (imgSrc: string): Promise<RGB[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      // Canvasを使用して画像データを取得
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas 2D contextを取得できませんでした'));
        return;
      }
      
      // 画像サイズにキャンバスを設定
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 画像をキャンバスに描画
      ctx.drawImage(img, 0, 0);
      
      // ピクセルデータを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels: RGB[] = [];
      
      // サンプリングを行う（すべてのピクセルを処理すると重くなるため）
      const samplingRate = Math.max(1, Math.floor(Math.sqrt(imageData.width * imageData.height) / 100));
      
      for (let i = 0; i < imageData.data.length; i += 4 * samplingRate) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        
        // 透明でないピクセルのみ処理
        if (a >= 128) {
          pixels.push({ r, g, b });
        }
      }
      
      resolve(pixels);
    };
    
    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };
    
    img.src = imgSrc;
  });
};

/**
 * メディアンカット法によるカラーパレット生成
 */
const medianCut = (pixels: RGB[], colorCount: number): RGB[] => {
  if (pixels.length === 0) {
    return [];
  }
  
  // 最初のボックスを作成
  const initialBox = createColorBox(pixels);
  const boxes: ColorBox[] = [initialBox];
  
  // 必要な色数になるまでボックスを分割
  while (boxes.length < colorCount) {
    // 最大範囲を持つボックスを見つける
    let maxRangeIndex = 0;
    let maxRange = 0;
    
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const rRange = box.maxR - box.minR;
      const gRange = box.maxG - box.minG;
      const bRange = box.maxB - box.minB;
      
      // 最大の範囲を持つ色成分を見つける
      const boxRange = Math.max(rRange, gRange, bRange);
      
      if (boxRange > maxRange) {
        maxRange = boxRange;
        maxRangeIndex = i;
      }
    }
    
    // これ以上分割できない場合は終了
    if (maxRange === 0 || boxes[maxRangeIndex].pixels.length <= 1) {
      break;
    }
    
    // 選択されたボックスを分割
    const boxToSplit = boxes[maxRangeIndex];
    const { boxA, boxB } = splitBox(boxToSplit);
    
    // 分割したボックスを配列に戻す
    boxes.splice(maxRangeIndex, 1, boxA, boxB);
  }
  
  // 各ボックスの平均色を計算
  return boxes.map(box => getAverageColor(box.pixels));
};

/**
 * ピクセル配列からカラーボックスを作成
 */
const createColorBox = (pixels: RGB[]): ColorBox => {
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;
  
  // 最小値と最大値を見つける
  for (const pixel of pixels) {
    minR = Math.min(minR, pixel.r);
    maxR = Math.max(maxR, pixel.r);
    minG = Math.min(minG, pixel.g);
    maxG = Math.max(maxG, pixel.g);
    minB = Math.min(minB, pixel.b);
    maxB = Math.max(maxB, pixel.b);
  }
  
  return { pixels, minR, maxR, minG, maxG, minB, maxB };
};

/**
 * カラーボックスを2つに分割
 */
const splitBox = (box: ColorBox): { boxA: ColorBox; boxB: ColorBox } => {
  const rRange = box.maxR - box.minR;
  const gRange = box.maxG - box.minG;
  const bRange = box.maxB - box.minB;
  
  // 最大範囲を持つ色成分で分割
  let sortComponent: keyof RGB;
  
  if (rRange >= gRange && rRange >= bRange) {
    sortComponent = 'r';
  } else if (gRange >= rRange && gRange >= bRange) {
    sortComponent = 'g';
  } else {
    sortComponent = 'b';
  }
  
  // 選択された色成分でピクセルをソート
  const sortedPixels = [...box.pixels].sort((a, b) => a[sortComponent] - b[sortComponent]);
  
  // 中央値でピクセルを分割
  const medianIndex = Math.floor(sortedPixels.length / 2);
  const pixelsA = sortedPixels.slice(0, medianIndex);
  const pixelsB = sortedPixels.slice(medianIndex);
  
  // 新しいボックスを作成
  const boxA = createColorBox(pixelsA);
  const boxB = createColorBox(pixelsB);
  
  return { boxA, boxB };
};

/**
 * ピクセル配列の平均色を計算
 */
const getAverageColor = (pixels: RGB[]): RGB => {
  if (pixels.length === 0) {
    return { r: 0, g: 0, b: 0 };
  }
  
  let totalR = 0, totalG = 0, totalB = 0;
  
  for (const pixel of pixels) {
    totalR += pixel.r;
    totalG += pixel.g;
    totalB += pixel.b;
  }
  
  return {
    r: totalR / pixels.length,
    g: totalG / pixels.length,
    b: totalB / pixels.length
  };
};