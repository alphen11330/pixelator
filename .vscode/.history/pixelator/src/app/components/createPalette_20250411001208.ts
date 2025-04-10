type RGB = [number, number, number];
type HSV = [number, number, number];

// 色空間のボックス（立方体）を表す
interface ColorBox {
  colors: RGB[];
  min: RGB;
  max: RGB;
  volume: number;
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

// HSV値をRGBに変換
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
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// 非線形明度変換（暗い領域を圧縮し、明るい領域を拡張）
function applyValueTransform(value: number): number {
  // 非線形変換を適用（明度に対して指数関数的に拡張）
  return Math.pow(value / 100, 1) * 100;
}

// 逆明度変換（明度空間から元のRGB空間へ）
function inverseValueTransform(value: number): number {
  // 明るい明度をさらに多く分布させる
  return Math.pow(value / 100, 2.5) * 100;
}

// MedianCutアルゴリズムによる色空間の量子化（HSV明度空間ベース）
function medianCutQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels;
  }

  // 画素値をHSV空間に変換
  const hsvPixels = pixels.map(pixel => {
    const hsv = rgbToHsv(pixel[0], pixel[1], pixel[2]);
    // 明度に非線形変換を適用
    hsv[2] = applyValueTransform(hsv[2]);
    return { rgb: pixel, hsv };
  });

  // HSV空間でのボックスを作成
  const initialBox: ColorBox = createBoxFromHSV(hsvPixels);
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
    const [box1, box2] = splitBoxByValue(boxToSplit, hsvPixels);

    // 分割結果で置き換え
    boxes[maxVolumeIndex] = box1;
    boxes.push(box2);
  }

  // 各ボックスの平均色を計算
  return boxes.map(box => {
    const avgColor = averageColor(box.colors);
    return avgColor;
  });
}

// HSVデータからボックスを作成
function createBoxFromHSV(hsvPixels: Array<{ rgb: RGB, hsv: HSV }>): ColorBox {
  const min: RGB = [255, 255, 255];
  const max: RGB = [0, 0, 0];
  const rgbColors: RGB[] = [];

  // 最小値と最大値を見つける（RGB空間で）
  hsvPixels.forEach(({ rgb }) => {
    rgbColors.push(rgb);
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], rgb[i]);
      max[i] = Math.max(max[i], rgb[i]);
    }
  });

  // ボリュームを計算
  const volume = (max[0] - min[0]) * (max[1] - min[1]) * (max[2] - min[2]);

  return { colors: rgbColors, min, max, volume };
}

// ボックスを明度ベースで分割
function splitBoxByValue(box: ColorBox, hsvPixels: Array<{ rgb: RGB, hsv: HSV }>): [ColorBox, ColorBox] {
  // ボックス内のピクセルを見つける
  const boxPixels = hsvPixels.filter(({ rgb }) => 
    box.colors.some(color => 
      color[0] === rgb[0] && color[1] === rgb[1] && color[2] === rgb[2]
    )
  );
  
  // 明度に基づいてピクセルをソート
  boxPixels.sort((a, b) => a.hsv[2] - b.hsv[2]);
  
  // 平均明度を計算
  const avgValue = boxPixels.reduce((sum, { hsv }) => sum + hsv[2], 0) / boxPixels.length;
  const maxValue = Math.max(...boxPixels.map(({ hsv }) => hsv[2]));
  
  // 分割点を決定（高明度領域をより細かく分割）
  let splitRatio = 0.5; // デフォルト分割比
  
  // 平均明度が高い場合、より非対称な分割を行う
  if (avgValue > 60) { // HSVの明度は0-100
    // 明るいボックスはより細かく分割する（明るい色のバリエーションを増やす）
    splitRatio = 0.75; // 75%点で分割
  } else if (maxValue > 80) {
    // 最大明度が高い場合も明るい部分を細かく分割
    splitRatio = 0.65; // 65%点で分割
  }
  
  const splitPosition = Math.floor(boxPixels.length * splitRatio);
  
  // 分割したピクセルからRGBデータを抽出
  const colors1 = boxPixels.slice(0, splitPosition).map(({ rgb }) => rgb);
  const colors2 = boxPixels.slice(splitPosition).map(({ rgb }) => rgb);

  // 新しいボックスを作成
  const box1 = createBox(colors1);
  const box2 = createBox(colors2);

  return [box1, box2];
}

// RGBデータからボックスを作成（通常のRGB空間用）
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

// RGBピクセルの平均色を計算
function averageColor(colors: RGB[]): RGB {
  const len = colors.length;
  if (len === 0) {
    return [0, 0, 0];
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

// 明るい色を増やすためのカラーパレット補正
function enhanceBrightColors(palette: RGB[], extraBrightColors: number = 0): RGB[] {
  if (extraBrightColors <= 0) return palette;
  
  // HSVに変換
  const hsvPalette = palette.map(rgb => {
    return {
      rgb,
      hsv: rgbToHsv(rgb[0], rgb[1], rgb[2])
    };
  });
  
  // 最も明るい色を見つける（明度でソート）
  hsvPalette.sort((a, b) => b.hsv[2] - a.hsv[2]);
  const brightestColors = hsvPalette.slice(0, Math.min(3, hsvPalette.length));
  
  // 明るい色のバリエーションを生成
  const newBrightColors: RGB[] = [];
  
  for (let i = 0; i < extraBrightColors; i++) {
    const baseColor = brightestColors[i % brightestColors.length];
    const [h, s, v] = baseColor.hsv;
    
    // 類似の明るい色を生成（色相を少しずらし、彩度を少し変更）
    const newH = (h + 15 * (i + 1)) % 360;
    const newS = Math.min(100, Math.max(10, s + (i % 3 - 1) * 10)); // 彩度をランダムに変更
    const newV = Math.min(100, v + 2); // 明度を少し上げる
    
    newBrightColors.push(hsvToRgb(newH, newS, newV));
  }
  
  // 新しい明るい色を追加
  return [...palette, ...newBrightColors];
}

// カラーパレットをソート（HSV空間で明度優先）
function sortPaletteByHSV(palette: RGB[]): RGB[] {
  // HSVに変換
  const hsvPalette = palette.map(([r, g, b]) => {
    return {
      rgb: [r, g, b] as RGB,
      hsv: rgbToHsv(r, g, b)
    };
  });

  // HSV基準でソート（明度を重視）
  return hsvPalette.sort((a, b) => {
    // 明度を非線形に評価（高明度の差異をより強く強調）
    const vA = Math.pow(a.hsv[2] / 100, 0.3);
    const vB = Math.pow(b.hsv[2] / 100, 0.3);
    
    if (Math.abs(vB - vA) > 0.03) return vB - vA; // 明度が異なる場合
    
    // 彩度の評価（高彩度を優先）
    const sA = a.hsv[1];
    const sB = b.hsv[1];
    if (Math.abs(sB - sA) > 3) return sB - sA;
    
    // 色相によるソート（色の急激な変化を作るためにステップ関数を使用）
    const hStep = 45; // 45度ごとにグループ化
    const hGroupA = Math.floor(a.hsv[0] / hStep);
    const hGroupB = Math.floor(b.hsv[0] / hStep);
    
    if (hGroupA !== hGroupB) return hGroupA - hGroupB;
    return a.hsv[0] - b.hsv[0];
  }).map(item => item.rgb);
}

// HSV空間での色距離計算（明度の差異を強調）
function hsvColorDistance(color1: RGB, color2: RGB): number {
  const hsv1 = rgbToHsv(color1[0], color1[1], color1[2]);
  const hsv2 = rgbToHsv(color2[0], color2[1], color2[2]);
  
  // 色相の差（環状なので最短距離を計算）
  let hDiff = Math.abs(hsv1[0] - hsv2[0]);
  if (hDiff > 180) hDiff = 360 - hDiff;
  
  // 彩度と明度の差
  const sDiff = Math.abs(hsv1[1] - hsv2[1]);
  const vDiff = Math.abs(hsv1[2] - hsv2[2]);
  
  // 明度による重み付け（明るい色の差異をより強調）
  const avgValue = (hsv1[2] + hsv2[2]) / 2;
  const valueWeight = Math.pow(avgValue / 100, 0.3);
  
  // 明度の差に大きな重みを付け、色相と彩度の差にも適切な重みを付ける
  return Math.sqrt(
    (hDiff / 180 * 60) * (hDiff / 180 * 60) +
    (sDiff / 100 * 40) * (sDiff / 100 * 40) +
    (vDiff / 100 * 100 * valueWeight) * (vDiff / 100 * 100 * valueWeight)
  );
}

// 類似色をマージする（暗い色を優先的にマージ）
function mergeSimilarColors(colors: RGB[], targetCount: number): RGB[] {
  if (colors.length <= targetCount) {
    return colors;
  }

  // HSVに変換して明度情報を取得
  const colorsWithHSV = colors.map((rgb) => {
    const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    return { rgb, hsv };
  });
  
  // 似た色のペアを見つける（暗い色のペアを優先的に見つける）
  const colorDistances: Array<{ i: number, j: number, distance: number, avgValue: number }> = [];
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const distance = hsvColorDistance(colors[i], colors[j]);
      const value1 = colorsWithHSV[i].hsv[2];
      const value2 = colorsWithHSV[j].hsv[2];
      const avgValue = (value1 + value2) / 2;
      
      colorDistances.push({ i, j, distance, avgValue });
    }
  }

  // 距離でソートするが、明度も考慮
  // 暗い色のペアを優先的にマージするように重み付け
  colorDistances.sort((a, b) => {
    // 明度に基づく重み付け（暗いペアほど優先的にマージ）
    const valueFactor = Math.pow(a.avgValue / 100, 2) - Math.pow(b.avgValue / 100, 2);
    const weightedDistanceA = a.distance * (1 - valueFactor * 0.5);
    const weightedDistanceB = b.distance * (1 - valueFactor * 0.5);
    
    return weightedDistanceA - weightedDistanceB;
  });

  // 類似色をマージする
  const result: RGB[] = [...colors];
  const merged = new Set<number>();

  for (const { i, j, avgValue } of colorDistances) {
    if (merged.has(i) || merged.has(j) || result.length - merged.size <= targetCount) {
      continue;
    }

    // 明るい色のペア（明度 > 80）はマージしない
    if (avgValue > 80 && merged.size < targetCount * 0.3) {
      continue; // 明るい色の多様性を確保
    }
    
    // j番目の色を削除し、i番目の色を2色の平均に置き換え
    const color1 = result[i];
    const color2 = result[j];
    
    // 明度を考慮した重み付き平均（明るい色を優先）
    const hsv1 = rgbToHsv(color1[0], color1[1], color1[2]);
    const hsv2 = rgbToHsv(color2[0], color2[1], color2[2]);
    
    // より明るい色に大きな重みを置く
    const weight1 = Math.pow(hsv1[2] / 100, 0.5);
    const weight2 = Math.pow(hsv2[2] / 100, 0.5);
    const totalWeight = weight1 + weight2;
    
    const mergedColor: RGB = [
      Math.round((color1[0] * weight1 + color2[0] * weight2) / totalWeight),
      Math.round((color1[1] * weight1 + color2[1] * weight2) / totalWeight),
      Math.round((color1[2] * weight1 + color2[2] * weight2) / totalWeight)
    ];
    
    result[i] = mergedColor;
    merged.add(j);
    
    if (result.length - merged.size <= targetCount) {
      break;
    }
  }

  // マージされた色を除外
  return result.filter((_, index) => !merged.has(index));
}

// 明度ベースのサンプリングによる画像から色パレットを生成する
const createEnhancedHSVPalette = (imageSrc: string, numColors: number = 16): Promise<string[]> => {
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

      // HSV変換を行い、明度に基づいた非線形サンプリング
      let sampledPixels = pixels;
      if (pixels.length > 10000) {
        const sampleSize = 10000;
        sampledPixels = [];
        
        // HSV変換と明度別にピクセルをグループ化
        const pixelsByValue: {[key: string]: RGB[]} = {};
        const valueGroups = 10; // 明度グループ数
        
        pixels.forEach(pixel => {
          const hsv = rgbToHsv(pixel[0], pixel[1], pixel[2]);
          const value = hsv[2]; // 明度を取得
          const groupIndex = Math.min(valueGroups - 1, Math.floor(value / 100 * valueGroups));
          
          if (!pixelsByValue[groupIndex]) {
            pixelsByValue[groupIndex] = [];
          }
          pixelsByValue[groupIndex].push(pixel);
        });
        
        // 高明度のグループから多くサンプリング（非線形サンプリング）
        for (let g = 0; g < valueGroups; g++) {
          if (!pixelsByValue[g]) continue;
          
          // 非線形サンプリング比率（高明度グループほど多くサンプル）
          // 指数関数的にサンプル数を増加
          const groupRatio = Math.pow((g + 1) / valueGroups, 2);
          const groupSampleCount = Math.floor(sampleSize * groupRatio / 
                                 (valueGroups * (valueGroups + 1) / 2));
          
          const groupPixels = pixelsByValue[g];
          
          // サンプリング（ランダム）
          for (let i = 0; i < groupSampleCount && i < groupPixels.length; i++) {
            const randomIndex = Math.floor(Math.random() * groupPixels.length);
            sampledPixels.push(groupPixels[randomIndex]);
          }
        }
        
        // 高明度領域をさらに細かくサンプリング
        if (pixelsByValue[valueGroups - 1]) {
          const brightPixels = pixelsByValue[valueGroups - 1];
          // 明るいピクセルからさらに追加でサンプリング
          const extraBrightSamples = Math.min(
            brightPixels.length,
            Math.floor(sampleSize * 0.3) // 全サンプルの30%を明るいピクセルに割り当て
          );
          
          for (let i = 0; i < extraBrightSamples; i++) {
            const randomIndex = Math.floor(Math.random() * brightPixels.length);
            sampledPixels.push(brightPixels[randomIndex]);
          }
        }
      }

      // MedianCutアルゴリズムでパレットを生成（HSV明度空間で処理）
      // 目標色数より少し多めに生成（後で明るい色を増やすため）
      const baseColorCount = Math.max(3, Math.floor(numColors * 0.8));
      let palette = medianCutQuantization(sampledPixels, baseColorCount);

      // 黒と白が含まれているか確認
      const hasBlack = palette.some(([r, g, b]) => r < 20 && g < 20 && b < 20);
      const hasWhite = palette.some(([r, g, b]) => r > 230 && g > 230 && b > 230);

      // 必要に応じて黒と白を追加
      if (!hasBlack) {
        palette.push([0, 0, 0]);
      }

      if (!hasWhite) {
        palette.push([255, 255, 255]);
      }

      // 明るい色のバリエーションを追加
      const extraBrightColors = numColors - palette.length;
      if (extraBrightColors > 0) {
        palette = enhanceBrightColors(palette, extraBrightColors);
      }

      // 指定色数に合わせる
      if (palette.length > numColors) {
        // 暗い色を優先的にマージ
        palette = mergeSimilarColors(palette, numColors);
      }
      
      // HSV空間でパレットをソート（明度優先）
      palette = sortPaletteByHSV(palette);

      // RGB形式の文字列に変換
      resolve(palette.map(([r, g, b]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`));
    };

    img.onerror = (e) => reject(`画像の読み込みに失敗しました: ${e}`);
  });
};

// HSV明度を視覚化するためのグラデーション生成関数
function createValueGradient(width: number = 256, height: number = 50): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // 非線形の明度グラデーション（より多くのステップで明るい部分を強調）
  const valueGrad = ctx.createLinearGradient(0, 0, width, 0);
  
  // より細かな色止めを設定
  for (let i = 0; i <= 30; i++) {
    const pos = i / 30;
    // 非線形の明度変化を生成（明るい部分をより拡張）
    const value = Math.pow(pos, 0.4); // 明るい部分の表現を拡張
    const rgb = hsvToRgb(0, 0, value * 100); // 彩度0で明度のみのグラデーション
    valueGrad.addColorStop(pos, `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  }
  
  // 描画
  ctx.fillStyle = valueGrad;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

// HSV色空間の可視化（デバッグ用）
function visualizeHsvColorSpace(size: number = 256): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // HSV色空間を描画（色相-彩度平面、明度は固定）
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  
  // 固定明度値（明るい色を強調するため高めに設定）
  const value = 90;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const hue = (x / size) * 360; // 0-360度
      const saturation = (1 - y / size) * 100; // 上が100%、下が0%
      
      const [r, g, b] = hsvToRgb(hue, saturation, value);
      
      const index = (y * size + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = 255; // 不透明
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  return canvas.toDataURL();
}

export default createEnhancedHSVPalette;
// ユーティリティ関数もエクスポート
export { createValueGradient, visualizeHsvColorSpace };