const createPalette = async (imageSrc: string, numColors: number = 16): Promise<string[]> => {
  const cv = window.cv;
  
  if (!cv) {
    throw new Error('OpenCV.js is not loaded yet. Please ensure it is loaded before calling this function.');
  }

  // 画像を非同期でロード
  const img = await loadImage(imageSrc);
  
  // 画像サイズの調整（処理速度向上のため）
  const maxDimension = 200;
  let { width, height } = img;
  
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
  
  // 画像を1次元の配列に変換（k-means用）
  const samples = prepareSamples(rgbImg);

  // k-meansのパラメータ設定
  const initialK = Math.min(numColors * 2, rgbImg.rows * rgbImg.cols);
  const criteria = new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 10, 1.0);
  const attempts = 5;
  const flags = cv.KMEANS_PP_CENTERS;
  
  // クラスタリング結果を格納する変数
  const labels = new cv.Mat();
  const centers = new cv.Mat();
  
  // k-meansクラスタリングを実行
  cv.kmeans(samples, initialK, labels, criteria, attempts, flags, centers);
  
  // クラスタごとのピクセル数をカウント
  const clusterCounts = countClusters(labels, rgbImg);
  
  // クラスタ中心（代表色）と出現頻度を抽出
  const colorClusters = extractColorClusters(centers, clusterCounts, rgbImg);
  
  // 色の多様性を確保するため、類似度ペナルティを追加
  applyColorSimilarityPenalty(colorClusters);
  
  // 特徴スコアでソート
  colorClusters.sort((a, b) => b.distinctiveScore - a.distinctiveScore);
  
  // 最終的なパレットを生成（上位numColors個を選択）
  const selectedColors = colorClusters.slice(0, numColors);
  
  // RGB値を文字列形式に変換
  const palette = selectedColors.map(color => `rgb(${color.r}, ${color.g}, ${color.b})`);
  
  // メモリ解放
  cleanup(src, rgbImg, samples, labels, centers);
  
  return palette;
};

// 非同期で画像をロードする関数
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

declare global {
  interface Window {
    cv: any;
  }
}

// 画像からサンプルデータを準備する関数
function prepareSamples(rgbImg: any): cv.Mat {
const cv = window.cv
  const pixelCount = rgbImg.rows * rgbImg.cols;
  const samples = new cv.Mat(pixelCount, 3, cv.CV_32F);
  
  for (let y = 0; y < rgbImg.rows; y++) {
    for (let x = 0; x < rgbImg.cols; x++) {
      const pixel = rgbImg.ucharPtr(y, x);
      const idx = y * rgbImg.cols + x;
      samples.floatPtr(idx, 0)[0] = pixel[0]; // R
      samples.floatPtr(idx, 1)[0] = pixel[1]; // G
      samples.floatPtr(idx, 2)[0] = pixel[2]; // B
    }
  }
  
  return samples;
}

// クラスタごとのピクセル数をカウント
function countClusters(labels: any, rgbImg: any): number[] {
  const clusterCounts = new Array(labels.rows).fill(0);
  for (let i = 0; i < labels.rows; i++) {
    const label = labels.intAt(i, 0);
    clusterCounts[label]++;
  }
  return clusterCounts;
}

// クラスタ中心を抽出
function extractColorClusters(centers: any, clusterCounts: number[], rgbImg: any): any[] {
  const colorClusters = [];
  const pixelCount = rgbImg.rows * rgbImg.cols;
  
  for (let i = 0; i < centers.rows; i++) {
    const r = Math.round(centers.floatAt(i, 0));
    const g = Math.round(centers.floatAt(i, 1));
    const b = Math.round(centers.floatAt(i, 2));
    
    // HSV変換して特徴スコアを計算
    const [h, s, v] = rgbToHsv(r, g, b);
    const count = clusterCounts[i];
    const percentage = (count / pixelCount) * 100;
    const distinctiveScore = percentage + (s * 2.0) + (v * 0.5);
    
    colorClusters.push({ r, g, b, h, s, v, count, percentage, distinctiveScore });
  }
  
  return colorClusters;
}

// 色の類似度ペナルティを適用する関数
function applyColorSimilarityPenalty(colorClusters: any[]): void {
  for (let i = 0; i < colorClusters.length; i++) {
    for (let j = 0; j < colorClusters.length; j++) {
      if (i !== j) {
        const colorDist = colorDistance(colorClusters[i], colorClusters[j]);
        const similarityPenalty = 20 / (1 + colorDist);
        colorClusters[i].distinctiveScore -= similarityPenalty;
      }
    }
  }
}

// メモリ解放
function cleanup(...args: any[]): void {
  args.forEach(arg => arg.delete && arg.delete());
}

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

// 色の距離を計算する関数（HSV空間での距離）
function colorDistance(color1: any, color2: any): number {
  const hDiff = Math.min(Math.abs(color1.h - color2.h), 1 - Math.abs(color1.h - color2.h)) * 2;
  const sDiff = Math.abs(color1.s - color2.s);
  const vDiff = Math.abs(color1.v - color2.v);
  
  const rDiff = Math.abs(color1.r - color2.r) / 255;
  const gDiff = Math.abs(color1.g - color2.g) / 255;
  const bDiff = Math.abs(color1.b - color2.b) / 255;
  
  return (hDiff * 2 + sDiff + vDiff + rDiff + gDiff + bDiff) / 6;
}

export default createPalette;
