type RGB = [number, number, number];
type HSV = [number, number, number];

// RGBからHSVへの変換
function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // 無彩色
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, v * 100];
}

// HSVからRGBへの変換
function hsvToRgb(h: number, s: number, v: number): RGB {
  h /= 360;
  s /= 100;
  v /= 100;

  let r: number, g: number, b: number;
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
    default: r = 0; g = 0; b = 0;
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// HSV色空間での色の距離を計算（知覚的な距離を考慮）
function hsvColorDistance(hsv1: HSV, hsv2: HSV): number {
  // 色相の円環上の距離を計算
  const h1 = hsv1[0];
  const h2 = hsv2[0];
  const dh = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2)) / 180.0;
  
  // 彩度と明度の差
  const ds = Math.abs(hsv1[1] - hsv2[1]) / 100.0;
  const dv = Math.abs(hsv1[2] - hsv2[2]) / 100.0;
  
  // 色相と彩度・明度に重み付け
  return Math.sqrt(4 * dh * dh + ds * ds + 2 * dv * dv);
}

// ピクセルの重要度を評価する関数
function getPixelImportance(color: RGB, histogram: Map<string, number>, totalPixels: number): number {
  const key = color.join(',');
  const frequency = histogram.get(key) || 0;
  const frequencyFactor = frequency / totalPixels; // 出現頻度
  
  // HSVに変換
  const hsv = rgbToHsv(color[0], color[1], color[2]);
  
  // 彩度と明度に基づく重要度
  const saturationFactor = hsv[1] / 100; // 彩度が高いほど重要
  const valueFactor = (1 - Math.abs(hsv[2] - 50) / 50); // 明度が中間に近いほど重要
  
  // 重要度のスコア計算（パラメータは調整可能）
  return frequencyFactor * 0.5 + saturationFactor * 0.3 + valueFactor * 0.2;
}

// 改良されたWu量子化アルゴリズム
function improvedQuantization(pixels: RGB[], numColors: number, histogram: Map<string, number>, totalPixels: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels;
  }

  // ピクセルを重要度でソート
  const pixelsWithImportance = pixels.map(color => ({
    color,
    importance: getPixelImportance(color, histogram, totalPixels)
  }));
  pixelsWithImportance.sort((a, b) => b.importance - a.importance);

  // 上位の重要なピクセルを初期クラスターとして選択
  const topImportantColors = pixelsWithImportance.slice(0, Math.min(numColors, pixelsWithImportance.length));
  let clusters: RGB[] = topImportantColors.map(item => item.color);

  // K-means++に似た初期クラスター選択のアプローチ
  if (clusters.length < numColors) {
    // RGBをHSVに変換
    const hsvPixels = pixels.map(p => rgbToHsv(p[0], p[1], p[2]));
    const hsvClusters = clusters.map(c => rgbToHsv(c[0], c[1], c[2]));
    
    // 残りのクラスターを追加
    while (clusters.length < numColors && clusters.length < pixels.length) {
      // 各ピクセルから最も近いクラスターまでの距離を計算
      const distances = hsvPixels.map((hsv, i) => {
        let minDist = Infinity;
        for (const clusterHsv of hsvClusters) {
          const dist = hsvColorDistance(hsv, clusterHsv);
          minDist = Math.min(minDist, dist);
        }
        return { index: i, distance: minDist };
      });
      
      // 距離に比例した確率で新しいクラスターを選択
      distances.sort((a, b) => b.distance - a.distance);
      const newClusterIndex = distances[0].index;
      clusters.push(pixels[newClusterIndex]);
      hsvClusters.push(hsvPixels[newClusterIndex]);
    }
  }

  // K-means クラスタリング（HSV色空間で実行）
  let prevClusters: RGB[] = [];
  let iterationCount = 0;
  const maxIterations = 15; // イテレーション数を増やす

  // HSVに変換したピクセルとクラスター
  let hsvPixels = pixels.map(p => rgbToHsv(p[0], p[1], p[2]));
  let hsvClusters = clusters.map(c => rgbToHsv(c[0], c[1], c[2]));

  while (iterationCount < maxIterations && !arraysAreEqual(clusters, prevClusters)) {
    let clusterAssignments: number[] = [];

    // 各ピクセルを最も近いクラスターに割り当て
    for (let i = 0; i < hsvPixels.length; i++) {
      let minDist = Infinity;
      let assignedCluster = 0;
      for (let j = 0; j < hsvClusters.length; j++) {
        const dist = hsvColorDistance(hsvPixels[i], hsvClusters[j]);
        if (dist < minDist) {
          minDist = dist;
          assignedCluster = j;
        }
      }
      clusterAssignments[i] = assignedCluster;
    }

    prevClusters = [...clusters];
    
    // クラスターを更新
    for (let j = 0; j < clusters.length; j++) {
      const clusterPixels = pixels.filter((_, i) => clusterAssignments[i] === j);
      if (clusterPixels.length > 0) {
        clusters[j] = averageColor(clusterPixels);
        hsvClusters[j] = rgbToHsv(clusters[j][0], clusters[j][1], clusters[j][2]);
      }
    }

    iterationCount++;
  }

  // 結果のクラスターを色の重要度で再度ソート
  const sortedClusters = clusters.map(color => ({
    color,
    importance: getPixelImportance(color, histogram, totalPixels)
  }));
  sortedClusters.sort((a, b) => b.importance - a.importance);

  return sortedClusters.map(item => item.color);
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

// 2色のRGB配列が等しいかを比較
function arraysAreEqual(arr1: RGB[], arr2: RGB[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v.every((c, j) => c === arr2[i][j]));
}

// 色域をカバーする代表的な色を確保する
function ensureColorRepresentation(palette: RGB[], numColors: number): RGB[] {
  const result = [...palette];
  
  // 黒と白の確認と追加
  const hasBlack = result.some(([r, g, b]) => r < 20 && g < 20 && b < 20);
  const hasWhite = result.some(([r, g, b]) => r > 230 && g > 230 && b > 230);

  // 原色とその組み合わせの重要色を確認
  const importantColors: RGB[] = [
    [0, 0, 0],      // 黒
    [255, 255, 255], // 白
    [255, 0, 0],     // 赤
    [0, 255, 0],     // 緑
    [0, 0, 255],     // 青
    [255, 255, 0],   // 黄
    [255, 0, 255],   // マゼンタ
    [0, 255, 255]    // シアン
  ];

  // すでにパレットにある色に近い重要色はスキップ
  const missingImportantColors = importantColors.filter(impColor => {
    // パレット内の最も近い色との距離を計算
    let minDist = Infinity;
    for (const color of result) {
      const dist = Math.sqrt(
        Math.pow(color[0] - impColor[0], 2) +
        Math.pow(color[1] - impColor[1], 2) +
        Math.pow(color[2] - impColor[2], 2)
      );
      minDist = Math.min(minDist, dist);
    }
    // 距離が一定以上なら「欠けている」と判断
    return minDist > 50;
  });

  // 黒と白を優先的に追加
  if (!hasBlack && result.length < numColors) {
    result.push([0, 0, 0]);
  }
  if (!hasWhite && result.length < numColors) {
    result.push([255, 255, 255]);
  }

  // 残りの重要色を追加
  for (const color of missingImportantColors) {
    if (result.length >= numColors) break;
    // 黒と白は既に確認済みなのでスキップ
    if ((color[0] === 0 && color[1] === 0 && color[2] === 0) || 
        (color[0] === 255 && color[1] === 255 && color[2] === 255)) {
      continue;
    }
    result.push(color);
  }

  return result.slice(0, numColors);
}

// 画像から色パレットを生成する改良版関数
const createImprovedPalette = (imageSrc: string, numColors: number = 16): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 256; // 精度向上のためサイズを増加
      let { width, height } = img;

      const aspectRatio = width / height;

      if (width > height && width > MAX_SIZE) {
        width = MAX_SIZE;
        height = Math.round(MAX_SIZE / aspectRatio);
      } else if (height > width && height > MAX_SIZE) {
        height = MAX_SIZE;
        width = Math.round(MAX_SIZE * aspectRatio);
      } else if (width > MAX_SIZE) {
        width = height = MAX_SIZE;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: RGB[] = [];
      const histogram = new Map<string, number>();
      let totalPixels = 0;

      // ピクセルデータを収集し、ヒストグラムを作成
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        
        if (a >= 125) { // 透明度が十分ある場合のみ
          const pixel: RGB = [r, g, b];
          pixels.push(pixel);
          totalPixels++;
          
          // ヒストグラム作成（色の出現頻度）
          const key = pixel.join(',');
          const count = histogram.get(key) || 0;
          histogram.set(key, count + 1);
        }
      }

      if (pixels.length === 0) {
        return reject('No valid pixels found');
      }

      // 重複を削除し、ユニークな色の集合を作成（計算効率のため）
      const uniqueColors: RGB[] = [];
      const uniqueSet = new Set<string>();
      
      for (const pixel of pixels) {
        const key = pixel.join(',');
        if (!uniqueSet.has(key)) {
          uniqueSet.add(key);
          uniqueColors.push(pixel);
        }
      }

      // パレット生成（改良版アルゴリズム）
      let palette = improvedQuantization(
        uniqueColors.length > 10000 ? uniqueColors.slice(0, 10000) : uniqueColors, 
        numColors, 
        histogram, 
        totalPixels
      );

      // 重要な色を確保
      palette = ensureColorRepresentation(palette, numColors);

      resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

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


export default createImprovedPalette;