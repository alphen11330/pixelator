type RGB = [number, number, number];
type HSV = [number, number, number];

// 色空間のボックス（立方体）を表す
interface ColorBox {
  colors: RGB[];
  min: RGB;
  max: RGB;
  volume: number;
}

// MedianCutアルゴリズムによる色空間の量子化
function medianCutQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels;
  }

  // ボックスを作成して初期化
  const initialBox: ColorBox = createBox(pixels);
  const boxes: ColorBox[] = [initialBox];

  // 必要なボックス数になるまで分割を続ける
  while (boxes.length < numColors) {
    // 最大ボリュームのボックスを見つける
    let maxVolumeIndex = 0;
    let maxVolume = 0;

    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].volume > maxVolume) {
        maxVolume = boxes[i].volume;
        maxVolumeIndex = i;
      }
    }

    // これ以上分割できない場合は終了
    if (maxVolume === 0 || boxes[maxVolumeIndex].colors.length < 2) {
      break;
    }

    // 最大ボリュームのボックスを分割
    const boxToSplit = boxes[maxVolumeIndex];
    const [box1, box2] = splitBox(boxToSplit);

    // 分割結果で置き換え
    boxes[maxVolumeIndex] = box1;
    boxes.push(box2);
  }

  // 各ボックスの平均色を計算
  return boxes.map(box => averageColor(box.colors));
}

// ボックスを作成
function createBox(colors: RGB[]): ColorBox {
  const min: RGB = [255, 255, 255];
  const max: RGB = [0, 0, 0];

  // 最小値と最大値を見つける
  colors.forEach(color => {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], color[i]);
      max[i] = Math.max(max[i], color[i]);
    }
  });

  // ボリュームを計算
  const volume = (max[0] - min[0]) * (max[1] - min[1]) * (max[2] - min[2]);

  return { colors, min, max, volume };
}

// ボックスを分割
function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  // 最長軸を見つける
  const ranges: [number, number][] = [
    [box.max[0] - box.min[0], 0],
    [box.max[1] - box.min[1], 1],
    [box.max[2] - box.min[2], 2]
  ];

  // 最長の軸でソート（降順）
  ranges.sort((a, b) => b[0] - a[0]);
  const longestAxis = ranges[0][1];

  // その軸に沿ってピクセルをソート
  const sortedColors = [...box.colors];
  sortedColors.sort((a, b) => a[longestAxis] - b[longestAxis]);

  // 中央で分割
  const medianIndex = Math.floor(sortedColors.length / 2);
  const colors1 = sortedColors.slice(0, medianIndex);
  const colors2 = sortedColors.slice(medianIndex);

  // 新しいボックスを作成
  const box1 = createBox(colors1);
  const box2 = createBox(colors2);

  return [box1, box2];
}

// RGBピクセルの平均色を計算
function averageColor(colors: RGB[]): RGB {
  const len = colors.length;
  if (len === 0) {
    return [0, 0, 0]; // 空の場合は黒を返す
  }

  const total = colors.reduce(
    (acc, [r, g, b]) => {
      acc[0] += r;
      acc[1] += g;
      acc[2] += b;
      return acc;
    },
    [0, 0, 0]
  );
  return [
    Math.round(total[0] / len),
    Math.round(total[1] / len),
    Math.round(total[2] / len)
  ];
}

// RGB値をHSV（色相、彩度、明度）に変換
function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, v * 100];
}

// パレットをHSVに基づいてソートする
function sortPaletteByHSV(palette: RGB[]): RGB[] {
  return palette.sort((a, b) => {
    const hsvA = rgbToHsv(a[0], a[1], a[2]);
    const hsvB = rgbToHsv(b[0], b[1], b[2]);
    // 明度（V）降順
    if (hsvB[2] !== hsvA[2]) return hsvB[2] - hsvA[2];
    // 彩度（S）降順
    if (hsvB[1] !== hsvA[1]) return hsvB[1] - hsvA[1];
    // 色相（H）昇順（360度の円として扱う）
    return hsvA[0] - hsvB[0];
  });
}

// RGB色の距離を計算（知覚的に近いCIELAB空間での距離）
function colorDistance(color1: RGB, color2: RGB): number {
  // 知覚的に近い重み付き距離
  const rMean = (color1[0] + color2[0]) / 2;
  const r = color1[0] - color2[0];
  const g = color1[1] - color2[1];
  const b = color1[2] - color2[2];
  
  // 人間の目は緑に最も敏感で、青に最も鈍感
  // 赤の知覚は明るさに依存する
  return Math.sqrt(
    (2 + rMean / 256) * r * r + 
    4 * g * g + 
    (2 + (255 - rMean) / 256) * b * b
  );
}

// 類似色をマージする
function mergeSimilarColors(colors: RGB[], targetCount: number): RGB[] {
  if (colors.length <= targetCount) {
    return colors;
  }

  // 似た色のペアを見つける
  const colorDistances: Array<{ i: number, j: number, distance: number }> = [];
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const distance = colorDistance(colors[i], colors[j]);
      colorDistances.push({ i, j, distance });
    }
  }

  // 距離でソート
  colorDistances.sort((a, b) => a.distance - b.distance);

  // 類似色をマージする
  const result: RGB[] = [...colors];
  const merged = new Set<number>();

  for (const { i, j } of colorDistances) {
    if (merged.has(i) || merged.has(j) || result.length <= targetCount) {
      continue;
    }

    // j番目の色を削除し、i番目の色を2色の平均に置き換え
    const mergedColor = averageColor([result[i], result[j]]);
    result[i] = mergedColor;
    
    // j番目をマークして後で削除
    merged.add(j);
    
    if (result.length - merged.size <= targetCount) {
      break;
    }
  }

  // マージされた色を除外
  return result.filter((_, index) => !merged.has(index));
}

// 画像から色パレットを生成する
const createPalette = (imageSrc: string, numColors: number = 16): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 128; // サンプリングサイズを制限
      let { width, height } = img;

      const aspectRatio = width / height;

      if (width > height && width > MAX_SIZE) {
        width = MAX_SIZE;
        height = Math.round(MAX_SIZE / aspectRatio);
      } else if (height > width && height > MAX_SIZE) {
        height = MAX_SIZE;
        width = Math.round(MAX_SIZE * aspectRatio);
      } else if (width > MAX_SIZE || height > MAX_SIZE) {
        const scale = MAX_SIZE / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('キャンバスコンテキストの取得に失敗しました');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: RGB[] = [];

      // ピクセル情報を抽出（透明度の高いピクセルのみ）
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        if (a >= 125) {
          pixels.push([r, g, b]);
        }
      }

      if (pixels.length === 0) {
        return reject('有効なピクセルが見つかりませんでした');
      }

      // まばらにサンプリング（大きな画像の場合）
      let sampledPixels = pixels;
      if (pixels.length > 10000) {
        const sampleSize = 10000;
        sampledPixels = [];
        const step = Math.floor(pixels.length / sampleSize);
        for (let i = 0; i < pixels.length; i += step) {
          sampledPixels.push(pixels[i]);
        }
      }

      // MedianCutアルゴリズムでパレットを生成
      let palette = medianCutQuantization(sampledPixels, numColors);

      // 黒と白が含まれているか確認
      const hasBlack = palette.some(([r, g, b]) => r < 20 && g < 20 && b < 20);
      const hasWhite = palette.some(([r, g, b]) => r > 230 && g > 230 && b > 230);

      // 必要に応じて黒と白を追加
      if (!hasBlack && palette.length < numColors) {
        palette.push([0, 0, 0]);
      }

      if (!hasWhite && palette.length < numColors) {
        palette.push([255, 255, 255]);
      }

      // 指定色数に合わせる
      if (palette.length > numColors) {
        palette = palette.slice(0, numColors);
      }

      // 色を重複排除し、似た色をマージする
      palette = mergeSimilarColors(palette, numColors);
      
      // HSVに基づいてパレットをソート
      palette = sortPaletteByHSV(palette);

      // RGB形式の文字列に変換
      resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`画像の読み込みに失敗しました: ${e}`);
  });
};

export default createPalette;