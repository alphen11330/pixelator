type RGB = [number, number, number];
type HSV = [number, number, number];

// 色空間のボックス（立方体）を表す
interface ColorBox {
  colors: RGB[];
  min: RGB;
  max: RGB;
  volume: number;
}

// ランベルト・ベールの法則に基づく輝度変換
function applyLambertBeerTransform(value: number): number {
  // 指数関数的な変換を適用（暗い部分を圧縮し、明るい部分を拡張）
  return Math.pow(value / 255, 0.2) * 255;
}

// 逆ランベルト・ベール変換（線形→非線形）
function inverseLambertBeerTransform(value: number): number {
  // 明るい値をより多く分布させる
  return Math.pow(value / 255, 10) * 255;
}

// MedianCutアルゴリズムによる色空間の量子化（ランベルト・ベール法則を考慮）
function medianCutQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels;
  }

  // 画素値をランベルト・ベール空間に変換
  const transformedPixels = pixels.map(pixel => {
    return [
      applyLambertBeerTransform(pixel[0]),
      applyLambertBeerTransform(pixel[1]),
      applyLambertBeerTransform(pixel[2])
    ] as RGB;
  });

  // ボックスを作成して初期化
  const initialBox: ColorBox = createBox(transformedPixels);
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

  // 各ボックスの平均色を計算し、元のRGB空間に戻す
  return boxes.map(box => {
    const avg = averageColor(box.colors);
    // 変換空間から元のRGB空間に戻す
    return [
      inverseLambertBeerTransform(avg[0]),
      inverseLambertBeerTransform(avg[1]),
      inverseLambertBeerTransform(avg[2])
    ] as RGB;
  });
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

// ボックスを分割（ランベルト・ベール法則に基づく急激な変化を反映）
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

  // ランベルト・ベール法則に基づいた非線形分割点を計算
  // 暗い色が少なく、明るい色が多くなるように調整
  const splitPosition = Math.floor(sortedColors.length * 0.7); // 70%地点で分割
  const colors1 = sortedColors.slice(0, splitPosition);
  const colors2 = sortedColors.slice(splitPosition);

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

// ランベルト・ベールの法則に基づいてパレットをHSVでソートする
// 明るい色が多く、暗い色は少なくなるようにする
function sortPaletteByLambertBeerHSV(palette: RGB[]): RGB[] {
  // HSVに変換
  const hsvPalette = palette.map(([r, g, b]) => {
    return {
      rgb: [r, g, b] as RGB,
      hsv: rgbToHsv(r, g, b)
    };
  });

  // ランベルト・ベール法則に基づくソート
  // 明度（V）を非線形に評価して、高明度の色がより多く分布するようにする
  return hsvPalette.sort((a, b) => {
    // 明度を非線形に評価（高明度の差異を強調）
    const vA = Math.pow(a.hsv[2] / 100, 0.5);
    const vB = Math.pow(b.hsv[2] / 100, 0.5);
    
    if (Math.abs(vB - vA) > 0.05) return vB - vA; // 明度が異なる場合
    
    // 彩度の評価（高彩度を優先）
    const sA = a.hsv[1];
    const sB = b.hsv[1];
    if (Math.abs(sB - sA) > 5) return sB - sA;
    
    // 色相によるソート（円環上を移動）
    return a.hsv[0] - b.hsv[0];
  }).map(item => item.rgb);
}

// 非線形のカラー距離計算（ランベルト・ベール法則考慮）
function lambertBeerColorDistance(color1: RGB, color2: RGB): number {
  // 明るい色の差異をより強調する
  const rMean = (color1[0] + color2[0]) / 2;
  
  // 各チャンネルの差分
  let r = color1[0] - color2[0];
  let g = color1[1] - color2[1];
  let b = color1[2] - color2[2];
  
  // ランベルト・ベール法則に基づいて明るい色の差異を強調
  const luminance1 = 0.299 * color1[0] + 0.587 * color1[1] + 0.114 * color1[2];
  const luminance2 = 0.299 * color2[0] + 0.587 * color2[1] + 0.114 * color2[2];
  const luminanceFactor = Math.pow(Math.max(luminance1, luminance2) / 255, 0.5);
  
  // 人間の目は緑に最も敏感で、青に最も鈍感
  // 明るさが高いほど差異を強調
  return Math.sqrt(
    (2 + rMean / 256) * r * r * luminanceFactor + 
    4 * g * g * luminanceFactor + 
    (2 + (255 - rMean) / 256) * b * b * luminanceFactor
  );
}

// 類似色をマージする（ランベルト・ベール法則を考慮）
function mergeSimilarColors(colors: RGB[], targetCount: number): RGB[] {
  if (colors.length <= targetCount) {
    return colors;
  }

  // 似た色のペアを見つける
  const colorDistances: Array<{ i: number, j: number, distance: number }> = [];
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const distance = lambertBeerColorDistance(colors[i], colors[j]);
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
    const color1 = result[i];
    const color2 = result[j];
    
    // 明るさを考慮した重み付き平均（明るい色を優先）
    const lum1 = 0.299 * color1[0] + 0.587 * color1[1] + 0.114 * color1[2];
    const lum2 = 0.299 * color2[0] + 0.587 * color2[1] + 0.114 * color2[2];
    
    // 明るい色により重みを置く
    const weight1 = lum1 / (lum1 + lum2);
    const weight2 = lum2 / (lum1 + lum2);
    
    const mergedColor: RGB = [
      Math.round(color1[0] * weight1 + color2[0] * weight2),
      Math.round(color1[1] * weight1 + color2[1] * weight2),
      Math.round(color1[2] * weight1 + color2[2] * weight2)
    ];
    
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
const createLambertBeerPalette = (imageSrc: string, numColors: number = 16): Promise<string[]> => {
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

      // ランベルト・ベール法則に基づくピクセルサンプリング
      // 明るいピクセルをより多くサンプリングする
      let sampledPixels = pixels;
      if (pixels.length > 10000) {
        const sampleSize = 10000;
        sampledPixels = [];
        
        // 輝度に基づいてソート（明るい順）
        const sortedByLuminance = [...pixels].sort((a, b) => {
          const lumA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
          const lumB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
          return lumB - lumA; // 明るい順
        });
        
        // 明るいピクセルを優先的にサンプリング
        for (let i = 0; i < sampleSize; i++) {
          // 非線形インデックス計算で明るいピクセルを多く選択
          const index = Math.floor(Math.pow(i / sampleSize, 2) * sortedByLuminance.length);
          sampledPixels.push(sortedByLuminance[index]);
        }
      }

      // MedianCutアルゴリズムでパレットを生成（ランベルト・ベール法則適用済み）
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

      // 類似色をマージする（ランベルト・ベール法則を考慮）
      palette = mergeSimilarColors(palette, numColors);
      
      // ランベルト・ベール法則に基づいてパレットをソート
      palette = sortPaletteByLambertBeerHSV(palette);

      // RGB形式の文字列に変換
      resolve(palette.map(([r, g, b]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`));
    };

    img.onerror = (e) => reject(`画像の読み込みに失敗しました: ${e}`);
  });
};

// ランベルト・ベール法則を視覚化するためのグラデーション生成関数
function createLambertBeerGradient(width: number = 256, height: number = 50): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // 線形グラデーション（比較用）
  const linearGrad = ctx.createLinearGradient(0, 0, width, 0);
  linearGrad.addColorStop(0, 'black');
  linearGrad.addColorStop(1, 'white');
  
  // ランベルト・ベール法則に基づく非線形グラデーション
  const lambertBeerGrad = ctx.createLinearGradient(0, 0, width, 0);
  
  // 非線形の色止めを設定
  for (let i = 0; i <= 20; i++) {
    const pos = i / 20;
    // 指数関数的な色の変化を生成（ランベルト・ベール法則）
    const intensity = Math.pow(pos, 2); // 二乗関数で急激な変化を表現
    const color = Math.round(intensity * 255);
    lambertBeerGrad.addColorStop(pos, `rgb(${color}, ${color}, ${color})`);
  }
  
  // 描画
  ctx.fillStyle = lambertBeerGrad;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

export default createLambertBeerPalette;
// ユーティリティ関数もエクスポート
export { createLambertBeerGradient };