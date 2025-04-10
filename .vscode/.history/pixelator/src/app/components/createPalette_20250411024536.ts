type RGB = [number, number, number];
type HSV = [number, number, number];

// 色空間のボックス（立方体）を表す
interface ColorBox {
  colors: RGB[];
  min: RGB;
  max: RGB;
  volume: number;
}

// ランベルト・ベールの法則に基づく輝度変換（より強力な非線形変換）
function applyLambertBeerTransform(value: number): number {
  // より強い非線形変換を適用（より暗い部分を圧縮、明るい部分を大幅に拡張）
  return Math.pow(value / 255, 1) * 255;
}

// 逆ランベルト・ベール変換（線形→非線形）
function inverseLambertBeerTransform(value: number): number {
  // 明るい値をさらに多く分布させる
  return Math.pow(value / 255, 1) * 255;
}

// MedianCutアルゴリズムによる色空間の量子化（ランベルト・ベール法則を強化）
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

// ボックスを分割（輝度に基づく非均等分割）
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

  // ボックス内のピクセルの輝度を計算
  const luminances = sortedColors.map(color => 
    0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]
  );

  // 平均輝度を計算
  const avgLuminance = luminances.reduce((sum, lum) => sum + lum, 0) / luminances.length;
  const maxLuminance = Math.max(...luminances);
  
  // 分割点を決定（高輝度領域をより細かく分割）
  let splitRatio = 0.5; // デフォルト分割比
  
  // 平均輝度が高い場合、より非対称な分割を行う
  if (avgLuminance > 128) {
    // 明るいボックスはより細かく分割する（明るい色のバリエーションを増やす）
    splitRatio = 0.75; // 75%点で分割
  } else if (maxLuminance > 200) {
    // 最大輝度が高い場合も明るい部分を細かく分割
    splitRatio = 0.65; // 65%点で分割
  }
  
  const splitPosition = Math.floor(sortedColors.length * splitRatio);
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
  
  // 最も明るい色を見つける
  hsvPalette.sort((a, b) => b.hsv[2] - a.hsv[2]);
  const brightestColors = hsvPalette.slice(0, Math.min(3, hsvPalette.length));
  
  // 明るい色のバリエーションを生成
  const newBrightColors: RGB[] = [];
  
  for (let i = 0; i < extraBrightColors; i++) {
    const baseColor = brightestColors[i % brightestColors.length];
    const [h, s, v] = baseColor.hsv;
    
    // 類似の明るい色を生成（色相を少しずらし、彩度と明度を高める）
    const newH = (h + 15 * (i + 1)) % 360;
    const newS = Math.min(100, s + 5);
    const newV = Math.min(100, v + 2);
    
    newBrightColors.push(hsvToRgb(newH, newS, newV));
  }
  
  // 新しい明るい色を追加
  return [...palette, ...newBrightColors];
}

// カラーパレットをソート（明るい色を重視）
function sortPaletteByLambertBeerHSV(palette: RGB[]): RGB[] {
  // HSVに変換
  const hsvPalette = palette.map(([r, g, b]) => {
    return {
      rgb: [r, g, b] as RGB,
      hsv: rgbToHsv(r, g, b)
    };
  });

  // ランベルト・ベール法則に基づくソート（明るい色を優先的に配置）
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

// 非線形のカラー距離計算（明るい色の差異を強調）
function lambertBeerColorDistance(color1: RGB, color2: RGB): number {
  // 各チャンネルの差分
  let r = color1[0] - color2[0];
  let g = color1[1] - color2[1];
  let b = color1[2] - color2[2];
  
  // 輝度計算
  const luminance1 = 0.299 * color1[0] + 0.587 * color1[1] + 0.114 * color1[2];
  const luminance2 = 0.299 * color2[0] + 0.587 * color2[1] + 0.114 * color2[2];
  
  // 明るい色の差異をより強調する重み付け
  const avgLuminance = (luminance1 + luminance2) / 2;
  const luminanceWeight = Math.pow(avgLuminance / 255, 0.3);
  
  // 明るさが高いほど色差を強調（人間の目の感度を考慮）
  return Math.sqrt(
    (3 * luminanceWeight) * r * r + 
    (4 * luminanceWeight) * g * g + 
    (2 * luminanceWeight) * b * b
  );
}

// 類似色をマージする（暗い色を優先的にマージ）
function mergeSimilarColors(colors: RGB[], targetCount: number): RGB[] {
  if (colors.length <= targetCount) {
    return colors;
  }

  // HSVに変換して明度情報を取得
  const colorsWithHSV = colors.map((rgb, index) => {
    const hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    return { rgb, hsv, index };
  });
  
  // 似た色のペアを見つける（暗い色のペアを優先的に見つける）
  const colorDistances: Array<{ i: number, j: number, distance: number, avgBrightness: number }> = [];
  
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const distance = lambertBeerColorDistance(colors[i], colors[j]);
      const brightness1 = colorsWithHSV[i].hsv[2];
      const brightness2 = colorsWithHSV[j].hsv[2];
      const avgBrightness = (brightness1 + brightness2) / 2;
      
      colorDistances.push({ i, j, distance, avgBrightness });
    }
  }

  // 距離でソートするが、明るさも考慮
  // 暗い色のペアを優先的にマージするように重み付け
  colorDistances.sort((a, b) => {
    // 輝度に基づく重み付け（暗いペアほど優先的にマージ）
    const brightnessFactor = Math.pow(a.avgBrightness / 100, 2) - Math.pow(b.avgBrightness / 100, 2);
    const weightedDistanceA = a.distance * (1 - brightnessFactor * 0.5);
    const weightedDistanceB = b.distance * (1 - brightnessFactor * 0.5);
    
    return weightedDistanceA - weightedDistanceB;
  });

  // 類似色をマージする
  const result: RGB[] = [...colors];
  const merged = new Set<number>();

  for (const { i, j, avgBrightness } of colorDistances) {
    if (merged.has(i) || merged.has(j) || result.length - merged.size <= targetCount) {
      continue;
    }
    
    // j番目の色を削除し、i番目の色を2色の平均に置き換え
    const color1 = result[i];
    const color2 = result[j];
    
    // 明るさを考慮した重み付き平均（明るい色を優先）
    const lum1 = 0.299 * color1[0] + 0.587 * color1[1] + 0.114 * color1[2];
    const lum2 = 0.299 * color2[0] + 0.587 * color2[1] + 0.114 * color2[2];
    
    // より明るい色に大きな重みを置く
    const weight1 = Math.pow(lum1 / 255, 0.5);
    const weight2 = Math.pow(lum2 / 255, 0.5);
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

// 非線形明るさサンプリングによる画像から色パレットを生成する
const createEnhancedLambertBeerPalette = (imageSrc: string, numColors: number = 16): Promise<string[]> => {
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

      // 輝度に基づいたより強力な非線形サンプリング
      let sampledPixels = pixels;
      if (pixels.length > 10000) {
        const sampleSize = 10000;
        sampledPixels = [];
        
        // 輝度計算と輝度別にピクセルをグループ化
        const pixelsByLuminance: {[key: string]: RGB[]} = {};
        const luminanceGroups = 10; // 輝度グループ数
        
        pixels.forEach(pixel => {
          const lum = 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
          const groupIndex = Math.min(luminanceGroups - 1, Math.floor(lum / 256 * luminanceGroups));
          
          if (!pixelsByLuminance[groupIndex]) {
            pixelsByLuminance[groupIndex] = [];
          }
          pixelsByLuminance[groupIndex].push(pixel);
        });
        
        // 高輝度のグループから多くサンプリング（非線形サンプリング）
        for (let g = 0; g < luminanceGroups; g++) {
          if (!pixelsByLuminance[g]) continue;
          
          // 非線形サンプリング比率（高輝度グループほど多くサンプル）
          // 指数関数的にサンプル数を増加
          const groupRatio = Math.pow((g + 1) / luminanceGroups, 2);
          const groupSampleCount = Math.floor(sampleSize * groupRatio / 
                                 (luminanceGroups * (luminanceGroups + 1) / 2));
          
          const groupPixels = pixelsByLuminance[g];
          
          // サンプリング（ランダム）
          // サンプリング（等間隔）
          for (let i = 0; i < groupSampleCount && groupPixels.length > 0; i++) {
            const index = Math.floor(i * groupPixels.length / groupSampleCount);
            sampledPixels.push(groupPixels[index]);
          }

        }
        
        // 高輝度領域をさらに細かくサンプリング
        if (pixelsByLuminance[luminanceGroups - 1]) {
          const brightPixels = pixelsByLuminance[luminanceGroups - 1];
           // 明るいピクセルからさらに追加でサンプリング
          const extraBrightSamples = Math.min(
            brightPixels.length,
            Math.floor(sampleSize * 0.3)
          );
        
          for (let i = 0; i < extraBrightSamples; i++) {
            const index = Math.floor(i * brightPixels.length / extraBrightSamples);
            sampledPixels.push(brightPixels[index]);
          }
        }
        
      }

      // MedianCutアルゴリズムでパレットを生成（強化版ランベルト・ベール法則適用）
      // 目標色数より少し多めに生成（後で明るい色を増やすため）
      const baseColorCount = Math.max(3, Math.floor(numColors * 5));
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
      
      // ランベルト・ベール法則に基づいてパレットをソート
      palette = sortPaletteByLambertBeerHSV(palette);

      // RGB形式の文字列に変換
      resolve(palette.map(([r, g, b]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`));
    };

    img.onerror = (e) => reject(`画像の読み込みに失敗しました: ${e}`);
  });
};

export default createEnhancedLambertBeerPalette;
