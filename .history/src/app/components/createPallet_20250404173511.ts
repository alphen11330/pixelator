const createPallet = (imageSrc: string, numColors: number = 8, harmonyType: string = 'complementary'): string[] => {
  // OpenCVのグローバルオブジェクトを取得
  const cv = window.cv;
  
  if (!cv) {
    throw new Error('OpenCV.js is not loaded yet. Please ensure it is loaded before calling this function.');
  }

  // 既に画像がロードされていることを前提とする
  const img = new Image();
  img.src = imageSrc;

  if (!img.complete) {
    throw new Error('Image not loaded yet. Please ensure it is loaded before calling this function.');
  }

  // 画像サイズの調整（処理速度向上のため）
  const maxDimension = 200;
  let width = img.width;
  let height = img.height;
  
  if (width > height && width > maxDimension) {
    height = Math.floor(height * (maxDimension / width));
    width = maxDimension;
  } else if (height > maxDimension) {
    width = Math.floor(width * (maxDimension / height));
    height = maxDimension;
  }

  // キャンバスの作成と画像の描画
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  
  // キャンバスから画像データを取得
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // OpenCVのMatに変換
  const src = cv.matFromImageData(imageData);
  
  // RGB形式に変換（OpenCVはデフォルトでBGR形式を使用するため）
  const rgbImg = new cv.Mat();
  cv.cvtColor(src, rgbImg, cv.COLOR_RGBA2RGB);
  
  // k-meansで基本となる色を抽出
  const baseColorCount = Math.min(Math.max(numColors, 12), rgbImg.rows * rgbImg.cols);
  
  // 画像を1次元の配列に変換（k-means用）
  const pixelCount = rgbImg.rows * rgbImg.cols;
  const samples = new cv.Mat(pixelCount, 3, cv.CV_32F);
  
  // ピクセルデータをサンプルに変換
  for (let y = 0; y < rgbImg.rows; y++) {
    for (let x = 0; x < rgbImg.cols; x++) {
      const pixel = rgbImg.ucharPtr(y, x);
      const idx = y * rgbImg.cols + x;
      
      // RGB値を取得
      const r = pixel[0];
      const g = pixel[1];
      const b = pixel[2];
      
      // サンプルデータに追加
      samples.floatPtr(idx, 0)[0] = r;
      samples.floatPtr(idx, 1)[0] = g;
      samples.floatPtr(idx, 2)[0] = b;
    }
  }
  
  // k-meansのパラメータ設定
  const criteria = new cv.TermCriteria(
    cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
    10, // 最大反復回数
    1.0 // 収束条件
  );
  const attempts = 5; // 試行回数
  const flags = cv.KMEANS_PP_CENTERS; // k-means++法
  
  // クラスタリング結果を格納する変数
  const labels = new cv.Mat();
  const centers = new cv.Mat();
  
  // k-meansクラスタリングを実行
  cv.kmeans(samples, baseColorCount, labels, criteria, attempts, flags, centers);
  
  // クラスタごとのピクセル数をカウント
  const clusterCounts = new Array(baseColorCount).fill(0);
  for (let i = 0; i < labels.rows; i++) {
    const label = labels.intAt(i, 0);
    clusterCounts[label]++;
  }
  
  // 抽出したベース色を格納
  const baseColors = [];
  for (let i = 0; i < baseColorCount; i++) {
    // クラスタ中心のRGB値を取得
    const r = Math.round(centers.floatAt(i, 0));
    const g = Math.round(centers.floatAt(i, 1));
    const b = Math.round(centers.floatAt(i, 2));
    
    // HSV色空間に変換
    const [h, s, v] = rgbToHsv(r, g, b);
    
    // 出現頻度を計算
    const count = clusterCounts[i];
    const percentage = (count / pixelCount) * 100;
    
    // 彩度と明度の重み付けを含めたスコアを計算
    const saturationWeight = 2.0;
    const valueWeight = 0.5;
    const score = percentage + (s * saturationWeight) + (v * valueWeight);
    
    baseColors.push({ r, g, b, h, s, v, count, percentage, score });
  }
  
  // 重要度スコアでソート
  baseColors.sort((a, b) => b.score - a.score);
  
  // トップn色を選択（nは調和の種類によって異なる）
  const topBaseColors = baseColors.slice(0, Math.min(4, baseColors.length));
  
  // 調和のとれた色パレットを生成
  const harmoniousColors: any[] = [];
  
  // 各ベース色から調和色を生成
  topBaseColors.forEach(baseColor => {
    // 元の色を追加
    harmoniousColors.push(baseColor);
    
    // 選択した調和タイプに基づいて調和色を生成
    const harmonicColors = generateHarmonicColors(baseColor, harmonyType);
    harmoniousColors.push(...harmonicColors);
  });
  
  // 類似色をフィルタリングして多様性を確保
  const filteredColors = filterSimilarColors(harmoniousColors, 0.15);
  
  // 上位の色を選択
  const selectedColors = filteredColors.slice(0, numColors);
  
  // RGB値を文字列形式に変換
  const palette = selectedColors.map(color => `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`);
  
  // メモリ解放
  src.delete();
  rgbImg.delete();
  samples.delete();
  labels.delete();
  centers.delete();
  
  return palette;
};

// RGB→HSV変換関数
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
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
  
  return [h, s, v];
}

// HSV→RGB変換関数
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
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
  
  return [r * 255, g * 255, b * 255];
}

// 調和色を生成する関数
function generateHarmonicColors(baseColor: any, harmonyType: string): any[] {
  const { h, s, v } = baseColor;
  const harmonicColors = [];
  
  switch (harmonyType.toLowerCase()) {
    case 'complementary':
      // 補色（色相環の反対側）
      const compH = (h + 0.5) % 1.0;
      const [compR, compG, compB] = hsvToRgb(compH, s, v);
      harmonicColors.push({ r: compR, g: compG, b: compB, h: compH, s, v, isHarmonic: true });
      break;
      
    case 'analogous':
      // 類似色（色相環上で隣接）
      const analogH1 = (h + 1/12) % 1.0;
      const analogH2 = (h - 1/12 + 1.0) % 1.0;
      const [aR1, aG1, aB1] = hsvToRgb(analogH1, s, v);
      const [aR2, aG2, aB2] = hsvToRgb(analogH2, s, v);
      harmonicColors.push({ r: aR1, g: aG1, b: aB1, h: analogH1, s, v, isHarmonic: true });
      harmonicColors.push({ r: aR2, g: aG2, b: aB2, h: analogH2, s, v, isHarmonic: true });
      break;
      
    case 'triadic':
      // 三角形の配色（色相環上で120度ずつ）
      const triH1 = (h + 1/3) % 1.0;
      const triH2 = (h + 2/3) % 1.0;
      const [tR1, tG1, tB1] = hsvToRgb(triH1, s, v);
      const [tR2, tG2, tB2] = hsvToRgb(triH2, s, v);
      harmonicColors.push({ r: tR1, g: tG1, b: tB1, h: triH1, s, v, isHarmonic: true });
      harmonicColors.push({ r: tR2, g: tG2, b: tB2, h: triH2, s, v, isHarmonic: true });
      break;
      
    case 'tetradic':
      // 四角形の配色（色相環上で90度ずつ）
      const tetH1 = (h + 0.25) % 1.0;
      const tetH2 = (h + 0.5) % 1.0;
      const tetH3 = (h + 0.75) % 1.0;
      const [teR1, teG1, teB1] = hsvToRgb(tetH1, s, v);
      const [teR2, teG2, teB2] = hsvToRgb(tetH2, s, v);
      const [teR3, teG3, teB3] = hsvToRgb(tetH3, s, v);
      harmonicColors.push({ r: teR1, g: teG1, b: teB1, h: tetH1, s, v, isHarmonic: true });
      harmonicColors.push({ r: teR2, g: teG2, b: teB2, h: tetH2, s, v, isHarmonic: true });
      harmonicColors.push({ r: teR3, g: teG3, b: teB3, h: tetH3, s, v, isHarmonic: true });
      break;
      
    case 'split-complementary':
      // 分裂補色（補色の両隣）
      const compSplitH = (h + 0.5) % 1.0;
      const splitH1 = (compSplitH + 1/12) % 1.0;
      const splitH2 = (compSplitH - 1/12 + 1.0) % 1.0;
      const [sR1, sG1, sB1] = hsvToRgb(splitH1, s, v);
      const [sR2, sG2, sB2] = hsvToRgb(splitH2, s, v);
      harmonicColors.push({ r: sR1, g: sG1, b: sB1, h: splitH1, s, v, isHarmonic: true });
      harmonicColors.push({ r: sR2, g: sG2, b: sB2, h: splitH2, s, v, isHarmonic: true });
      break;
      
    case 'monochromatic':
      // 単色（彩度と明度のバリエーション）
      const s1 = Math.max(0.3, s - 0.3);
      const s2 = Math.min(1.0, s + 0.3);
      const v1 = Math.max(0.3, v - 0.3);
      const v2 = Math.min(1.0, v + 0.3);
      
      const [mR1, mG1, mB1] = hsvToRgb(h, s1, v);
      const [mR2, mG2, mB2] = hsvToRgb(h, s2, v);
      const [mR3, mG3, mB3] = hsvToRgb(h, s, v1);
      const [mR4, mG4, mB4] = hsvToRgb(h, s, v2);
      
      harmonicColors.push({ r: mR1, g: mG1, b: mB1, h, s: s1, v, isHarmonic: true });
      harmonicColors.push({ r: mR2, g: mG2, b: mB2, h, s: s2, v, isHarmonic: true });
      harmonicColors.push({ r: mR3, g: mG3, b: mB3, h, s, v: v1, isHarmonic: true });
      harmonicColors.push({ r: mR4, g: mG4, b: mB4, h, s, v: v2, isHarmonic: true });
      break;
      
    default:
      // デフォルトは補色
      const defaultCompH = (h + 0.5) % 1.0;
      const [defR, defG, defB] = hsvToRgb(defaultCompH, s, v);
      harmonicColors.push({ r: defR, g: defG, b: defB, h: defaultCompH, s, v, isHarmonic: true });
  }
  
  return harmonicColors;
}

// 類似色をフィルタリングする関数
function filterSimilarColors(colors: any[], threshold: number): any[] {
  if (colors.length <= 1) return colors;
  
  const result = [colors[0]];
  
  for (let i = 1; i < colors.length; i++) {
    let isUnique = true;
    
    for (let j = 0; j < result.length; j++) {
      const dist = colorDistance(colors[i], result[j]);
      if (dist < threshold) {
        isUnique = false;
        break;
      }
    }
    
    if (isUnique) {
      result.push(colors[i]);
    }
  }
  
  return result;
}

// 色の距離を計算する関数
function colorDistance(color1: any, color2: any): number {
  // HSV空間での色の距離を計算
  const hDiff = Math.min(Math.abs(color1.h - color2.h), 1 - Math.abs(color1.h - color2.h)) * 2; // 色相は循環するため
  const sDiff = Math.abs(color1.s - color2.s);
  const vDiff = Math.abs(color1.v - color2.v);
  
  // RGB空間での色の距離も計算
  const rDiff = Math.abs(color1.r - color2.r) / 255;
  const gDiff = Math.abs(color1.g - color2.g) / 255;
  const bDiff = Math.abs(color1.b - color2.b) / 255;
  
  // HSVとRGBの距離を組み合わせて総合的な距離を算出
  return (hDiff * 2 + sDiff + vDiff + rDiff + gDiff + bDiff) / 6;
}

export default createPallet;