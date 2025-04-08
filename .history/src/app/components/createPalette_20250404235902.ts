const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // OpenCVのグローバルオブジェクトを取得
    const cv = window.cv;
    
    if (!cv) {
      return reject('OpenCV.js is not loaded yet. Please ensure it is loaded before calling this function.');
    }

    // 画像の読み込み
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
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
        return reject("Failed to get canvas context");
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // キャンバスから画像データを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // OpenCVのMatに変換
      const src = cv.matFromImageData(imageData);
      
      // RGB形式に変換（OpenCVはデフォルトでBGR形式を使用するため）
      const rgbImg = new cv.Mat();
      cv.cvtColor(src, rgbImg, cv.COLOR_RGBA2RGB);
      
      // まずは多めのクラスタ数でk-meansを実行
      const maxClusters = 50; // 最大クラスタ数
      const initialK = Math.min(numColors*2, Math.min(rgbImg.rows * rgbImg.cols, maxClusters));
      
      
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
      const attempts = 100; // 試行回数（増加させて精度を向上）
      const flags = cv.KMEANS_PP_CENTERS; // k-means++法
      
      // クラスタリング結果を格納する変数
      const labels = new cv.Mat();
      const centers = new cv.Mat();
      
      // k-meansクラスタリングを実行（多めのクラスタ数で）
      cv.kmeans(samples, initialK, labels, criteria, attempts, flags, centers);
      
      // クラスタごとのピクセル数をカウント
      const clusterCounts = new Array(initialK).fill(0);
      for (let i = 0; i < labels.rows; i++) {
        const label = labels.intAt(i, 0);
        clusterCounts[label]++;
      }
      
      // クラスタ中心（代表色）と出現頻度を抽出
      const colorClusters = [];
      for (let i = 0; i < initialK; i++) {
        // クラスタ中心のRGB値を取得
        const r = Math.round(centers.floatAt(i, 0));
        const g = Math.round(centers.floatAt(i, 1));
        const b = Math.round(centers.floatAt(i, 2));
        
        // HSV色空間に変換して彩度と明度を計算
        const [h, s, v] = rgbToHsv(r, g, b);
        
        // 彩度と明度の重み付け
        const saturationWeight = 2; // 彩度の重み
        const valueWeight = 1; // 明度の重み
        
        // ピクセル数と割合を計算
        const count = clusterCounts[i];
        const percentage = (count / pixelCount) * 100;
        
        // 特徴スコアを計算：出現頻度 + 彩度の重み付け - 他の色との類似度ペナルティ
        let distinctiveScore = percentage + (s * saturationWeight) + (v * valueWeight);
        colorClusters.push({ r, g, b, h, s, v, count, percentage, distinctiveScore });
      }
      
      // 色の多様性を確保するために、他の色との類似度に基づくペナルティを追加
      for (let i = 0; i < colorClusters.length; i++) {
        for (let j = 0; j < colorClusters.length; j++) {
          if (i !== j) {
            const colorDist = colorDistance(colorClusters[i], colorClusters[j]);
            // 距離が近い（類似している）場合にスコアを減少
            const similarityPenalty = 20 / (1 + colorDist);
            colorClusters[i].distinctiveScore -= similarityPenalty;
          }
        }
      }
      
      // 特徴スコアでソート（高い順）
      colorClusters.sort((a, b) => b.distinctiveScore - a.distinctiveScore);
      
      // 最終的なパレットを生成（上位numColors個を選択）
      const selectedColors = colorClusters.slice(0, numColors);
      
      // RGB値を文字列形式に変換
      const palette = selectedColors.map(color => `rgb(${color.r}, ${color.g}, ${color.b})`);
      
      // メモリ解放
      src.delete();
      rgbImg.delete();
      samples.delete();
      labels.delete();
      centers.delete();
      
      // 結果をresolveで返す
      resolve(palette);
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
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

// 色の距離を計算する関数（HSV空間での距離）
function colorDistance(color1: any, color2: any): number {
  // HSV空間での色の距離を計算
  const hDiff = Math.min(Math.abs(color1.h - color2.h), 1 - Math.abs(color1.h - color2.h)) * 2; // 色相は循環するため
  const sDiff = Math.abs(color1.s - color2.s);
  const vDiff = Math.abs(color1.v - color2.v);
  
  // RGB空間での色の距離を計算
  const rDiff = Math.abs(color1.r - color2.r) / 255;
  const gDiff = Math.abs(color1.g - color2.g) / 255;
  const bDiff = Math.abs(color1.b - color2.b) / 255;
  
  // HSVとRGBの距離を組み合わせて総合的な距離を算出
  return (hDiff * 2 + sDiff + vDiff + rDiff + gDiff + bDiff) / 6;
}

export default createPalette;
