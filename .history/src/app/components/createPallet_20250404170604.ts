// RGB to HSB (HSV) conversion
const rgbToHsb = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let v = max;

  let delta = max - min;
  if (max !== 0) {
    s = delta / max;
  }
  if (max !== min) {
    if (max === r) {
      h = (g - b) / delta;
    } else if (max === g) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, v };
};
const cv = window.cv
// OpenCV.jsを使ったk-means法による色抽出
const createKMeansPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  

  return new Promise((resolve, reject) => {
    // OpenCVがロードされていることを確認
    if (typeof cv === 'undefined') {
      reject(new Error('OpenCV.js is not loaded yet. Please ensure it is loaded before calling this function.'));
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous"; // CORS対策
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
        reject(new Error("Failed to get canvas context"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // キャンバスから画像データを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        // OpenCVのMatに変換
        const src = cv.matFromImageData(imageData);
        
        // k-means用にデータを準備（ピクセルデータを行列に）
        const samples = new cv.Mat(src.rows * src.cols, 3, cv.CV_32F);
        let sampleIdx = 0;
        
        // 透明度が低いピクセルを除外するためのマスク
        const validPixels = [];
        
        for (let y = 0; y < src.rows; y++) {
          for (let x = 0; x < src.cols; x++) {
            const pixel = src.ucharPtr(y, x);
            const b = pixel[0];
            const g = pixel[1];
            const r = pixel[2];
            const a = pixel.length > 3 ? pixel[3] : 255; // アルファチャンネルがある場合
            
            // 透明度が高いピクセルのみ処理
            if (a >= 128) {
              samples.floatPtr(sampleIdx, 0)[0] = r;
              samples.floatPtr(sampleIdx, 1)[0] = g;
              samples.floatPtr(sampleIdx, 2)[0] = b;
              validPixels.push(sampleIdx);
              sampleIdx++;
            }
          }
        }
        
        // 有効なピクセルがある場合のみ処理
        if (validPixels.length > 0) {
          // 有効なピクセルだけを含む新しいサンプル行列を作成
          const validSamples = new cv.Mat(validPixels.length, 3, cv.CV_32F);
          for (let i = 0; i < validPixels.length; i++) {
            const origIdx = validPixels[i];
            validSamples.floatPtr(i, 0)[0] = samples.floatPtr(origIdx, 0)[0];
            validSamples.floatPtr(i, 1)[0] = samples.floatPtr(origIdx, 1)[0];
            validSamples.floatPtr(i, 2)[0] = samples.floatPtr(origIdx, 2)[0];
          }
          
          // k-meansのパラメータ設定
          const criteria = new cv.TermCriteria(
            cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
            20, // 最大反復回数
            0.1  // 収束条件
          );
          
          const K = Math.min(numColors, validPixels.length); // クラスタ数
          const labels = new cv.Mat();
          const centers = new cv.Mat();
          const attempts = 5; // 試行回数（精度と速度のバランス）
          const flags = cv.KMEANS_PP_CENTERS; // k-means++法（初期値の選択を改善）
          
          // k-meansクラスタリングの実行
          cv.kmeans(validSamples, K, labels, criteria, attempts, flags, centers);
          
          // クラスタごとのピクセル数をカウント
          const clusterCounts = new Array(K).fill(0);
          for (let i = 0; i < labels.rows; i++) {
            const label = labels.intAt(i, 0);
            clusterCounts[label]++;
          }
          
          // クラスタ中心（代表色）と出現頻度を格納
          const colorClusters = [];
          for (let i = 0; i < K; i++) {
            const r = Math.round(centers.floatAt(i, 0));
            const g = Math.round(centers.floatAt(i, 1));
            const b = Math.round(centers.floatAt(i, 2));
            const count = clusterCounts[i];
            const hsv = rgbToHsb(r, g, b);
            
            colorClusters.push({
              r, g, b, count, hsv,
              percentage: (count / validPixels.length) * 100
            });
          }
          
          // 特徴的な色を選出するロジック
          // 1. 出現頻度の高い色（上位3色）
          colorClusters.sort((a, b) => b.count - a.count);
          const dominantColors = colorClusters.slice(0, Math.min(3, colorClusters.length));
          
          // 2. 彩度の高い色を選出（既に選ばれた色を除く）
          const remainingClusters = colorClusters.filter(
            color => !dominantColors.some(
              dc => dc.r === color.r && dc.g === color.g && dc.b === color.b
            )
          );
          
          remainingClusters.sort((a, b) => b.hsv.s - a.hsv.s);
          
          // 結果を生成（出現頻度の高い色 + 彩度の高い色）
          const significantColors = [
            ...dominantColors,
            ...remainingClusters.slice(0, Math.min(numColors - dominantColors.length, remainingClusters.length))
          ];
          
          // RGB文字列に変換
          const result = significantColors.map(color => `rgb(${color.r},${color.g},${color.b})`);
          
          // 色相でソート
          result.sort((a, b) => {
            const colorA = a.match(/rgb\((\d+),(\d+),(\d+)\)/)!;
            const colorB = b.match(/rgb\((\d+),(\d+),(\d+)\)/)!;
            
            const hsvA = rgbToHsb(parseInt(colorA[1]), parseInt(colorA[2]), parseInt(colorA[3]));
            const hsvB = rgbToHsb(parseInt(colorB[1]), parseInt(colorB[2]), parseInt(colorB[3]));
            
            return hsvA.h - hsvB.h;
          });
          
          // メモリ解放
          src.delete();
          samples.delete();
          validSamples.delete();
          labels.delete();
          centers.delete();
          
          resolve(result);
        } else {
          reject(new Error("No valid pixels found in the image"));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    
    img.src = imageSrc;
  });
};

// React Hooksと組み合わせて使用するためのラッパー関数
const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  // OpenCVが利用可能かチェック
  if (typeof cv !== 'undefined') {
    return createKMeansPalette(imageSrc, numColors);
  } else {
    return new Promise((resolve, reject) => {
      // OpenCVが読み込まれるまで待機（最大5秒）
      let attempts = 0;
      const maxAttempts = 50;
      const checkInterval = 100; // 100ms間隔
      
      const checkCv = () => {
        if (typeof cv !== 'undefined') {
          createKMeansPalette(imageSrc, numColors)
            .then(resolve)
            .catch(reject);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkCv, checkInterval);
        } else {
          reject(new Error("OpenCV.js did not load within the timeout period"));
        }
      };
      
      checkCv();
    });
  }
};

export default createPalette;