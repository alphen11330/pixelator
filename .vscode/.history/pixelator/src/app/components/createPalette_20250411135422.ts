type RGB = [number, number, number];
type HSV = [number, number, number];

// 色空間のボックス（立方体）を表す
interface ColorBox {
  colors: RGB[];
  min: RGB;
  max: RGB;
  volume: number;
  luminance: number; // 輝度の平均値を追加
}

// ランベルト・ベールの法則に基づく輝度マッピング
function lambertBeerLuminanceMapping(value: number): number {
  // 指数関数的に減少する輝度値を返す
  // ここでは実測値を参考に、指数的に減少する曲線を近似
  const luminanceValues = [100, 97, 93, 88, 82, 75, 68, 60, 50, 35, 0];
  const steps = luminanceValues.length - 1;
  
  // 0-1の範囲にマッピング
  const normalizedValue = Math.max(0, Math.min(1, value));
  const index = normalizedValue * steps;
  
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.min(steps, Math.ceil(index));
  
  // 補間
  const t = index - lowerIndex;
  return luminanceValues[lowerIndex] * (1 - t) + luminanceValues[upperIndex] * t;
}

// RGB値からHSV値に変換
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

// HSV値からRGB値に変換
function hsvToRgb(h: number, s: number, v: number): RGB {
  h /= 360;
  s /= 100;
  v /= 100;

  let r = 0, g = 0, b = 0;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255)
  ];
}

// RGB値から輝度（明度）を計算
function getLuminance(color: RGB): number {
  // 人間の視覚に適した輝度計算
  // ITU-R BT.709準拠の重み付け
  return 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2];
}

// ボックスを作成
function createBox(colors: RGB[]): ColorBox {
  const min: RGB = [255, 255, 255];
  const max: RGB = [0, 0, 0];
  let totalLuminance = 0;

  // 最小値と最大値を見つける
  colors.forEach(color => {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], color[i]);
      max[i] = Math.max(max[i], color[i]);
    }
    // 輝度の計算
    totalLuminance += getLuminance(color);
  });

  // ボリュームを計算
  const volume = (max[0] - min[0]) * (max[1] - min[1]) * (max[2] - min[2]);
  const luminance = colors.length > 0 ? totalLuminance / colors.length : 0;

  return { colors, min, max, volume, luminance };
}

// ボックスを分割（輝度を考慮）
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

  // 輝度に基づいて分割ポイントを決定
  // ランベルト・ベールの法則に基づき、明るい色により多くのスペースを与える
  const medianIndex = Math.floor(sortedColors.length * 0.6); // 60%を明るい色に
  const colors1 = sortedColors.slice(0, medianIndex);
  const colors2 = sortedColors.slice(medianIndex);

  // 新しいボックスを作成
  const box1 = createBox(colors1);
  const box2 = createBox(colors2);

  return [box1, box2];
}

// MedianCutアルゴリズムによる色空間の量子化（輝度重み付け）
function medianCutQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels;
  }

  // ボックスを作成して初期化
  const initialBox: ColorBox = createBox(pixels);
  const boxes: ColorBox[] = [initialBox];

  // 必要なボックス数になるまで分割を続ける
  while (boxes.length < numColors) {
    // ボックスを輝度で重み付けしたボリュームでソート
    boxes.sort((a, b) => {
      // 輝度とボリュームの両方を考慮した重み付け
      const weightA = a.volume * (1 + a.luminance / 255);
      const weightB = b.volume * (1 + b.luminance / 255);
      return weightB - weightA; // 大きい順
    });

    // 分割するボックスを選択（最大重み付きボリューム）
    const boxToSplit = boxes[0];

    // これ以上分割できない場合は終了
    if (boxToSplit.volume === 0 || boxToSplit.colors.length < 2) {
      break;
    }

    // ボックスを分割
    const [box1, box2] = splitBox(boxToSplit);

    // 分割結果で置き換え
    boxes[0] = box1;
    boxes.push(box2);
  }

  // 各ボックスの代表色を計算
  return boxes.map(box => {
    if (box.colors.length === 0) return [0, 0, 0];
    
    // 色相と彩度を平均化
    const hsvValues = box.colors.map(c => rgbToHsv(c[0], c[1], c[2]));
    
    let sumH = 0;
    let sumS = 0;
    let sumV = 0;
    
    hsvValues.forEach(hsv => {
      sumH += hsv[0];
      sumS += hsv[1];
      sumV += hsv[2];
    });
    
    const avgH = sumH / hsvValues.length;
    const avgS = sumS / hsvValues.length;
    const avgV = sumV / hsvValues.length;
    
    // ランベルト・ベールの法則に基づいて明度を調整
    const mappedV = lambertBeerLuminanceMapping(avgV / 100) / 100 * 100;
    
    return hsvToRgb(avgH, avgS, mappedV);
  });
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
    if (merged.has(i) || merged.has(j) || result.length - merged.size <= targetCount) {
      continue;
    }

    // j番目の色を削除し、i番目の色を2色の平均に置き換え
    const mergedColor = averageColor([result[i], result[j]]);
    result[i] = mergedColor;
    
    // j番目をマークして後で削除
    merged.add(j);
  }

  // マージされた色を除外
  return result.filter((_, index) => !merged.has(index));
}

// パレットをHSVに基づいてソートする（ランベルト・ベールの輝度マッピングを反映）
function sortPaletteByHSV(palette: RGB[]): RGB[] {
  // HSVに変換
  const hsvPalette = palette.map(color => {
    const [h, s, v] = rgbToHsv(color[0], color[1], color[2]);
    return { rgb: color, hsv: [h, s, v] };
  });

  // ランベルト・ベールの法則に基づいて輝度をマッピング
  const luminanceDistribution = Array.from({ length: 11 }, (_, i) => i / 10)
    .map(v => lambertBeerLuminanceMapping(v));

  // 輝度分布に合わせてソート
  return hsvPalette
    .sort((a, b) => {
      // 輝度（V）降順
      if (Math.abs(b.hsv[2] - a.hsv[2]) > 5) return b.hsv[2] - a.hsv[2];
      // 彩度（S）降順
      if (Math.abs(b.hsv[1] - a.hsv[1]) > 5) return b.hsv[1] - a.hsv[1];
      // 色相（H）昇順
      return a.hsv[0] - b.hsv[0];
    })
    .map(item => item.rgb);
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

      // ランベルト・ベール法則を適用したMedianCutアルゴリズムでパレットを生成
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
      
      // ランベルト・ベールの法則に基づいてパレットをソート
      palette = sortPaletteByHSV(palette);

      // 最終的な輝度調整
      palette = palette.map((color, index) => {
        const [h, s, v] = rgbToHsv(color[0], color[1], color[2]);
        // パレット内の位置に応じて輝度を調整
        const position = index / (palette.length - 1);
        const newV = lambertBeerLuminanceMapping(1 - position);
        return hsvToRgb(h, s, newV);
      });

      // RGB形式の文字列に変換
      resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`画像の読み込みに失敗しました: ${e}`);
  });
};

// パレットの輝度分布を視覚化
function visualizeLuminanceDistribution(palette: RGB[]): void {
  const luminances = palette.map(color => {
    const [_, __, v] = rgbToHsv(color[0], color[1], color[2]);
    return v;
  });
  
  console.log("パレットの輝度分布:", luminances);
  
  // 理想的なランベルト・ベール分布との比較
  const idealDistribution = Array.from({ length: palette.length }, (_, i) => {
    const position = i / (palette.length - 1);
    return lambertBeerLuminanceMapping(1 - position);
  });
  
  console.log("理想的な輝度分布:", idealDistribution);
}

export default createPalette;
export { medianCutQuantization, lambertBeerLuminanceMapping, visualizeLuminanceDistribution };