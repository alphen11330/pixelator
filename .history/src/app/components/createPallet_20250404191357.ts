// OpenCV.jsを使ったk-means法による色抽出（RGB値を直接扱う）
const createPalette = (imageSrc: string, numColors: number = 8): string[] => {
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
  const K = Math.min(numColors, pixelCount); // クラスタ数（最大8）
  const criteria = new cv.TermCriteria(
    cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
    10, // 最大反復回数
    1.0 // 収束条件
  );
  const attempts = 3; // 試行回数
  const flags = cv.KMEANS_PP_CENTERS; // k-means++法（初期値の選択を改善）

  // クラスタリング結果を格納する変数
  const labels = new cv.Mat();
  const centers = new cv.Mat();

  // k-meansクラスタリングを実行
  cv.kmeans(samples, K, labels, criteria, attempts, flags, centers);

  // クラスタごとのピクセル数をカウント
  const clusterCounts = new Array(K).fill(0);
  for (let i = 0; i < labels.rows; i++) {
    const label = labels.intAt(i, 0);
    clusterCounts[label]++;
  }

  // クラスタ中心（代表色）と出現頻度を抽出
  const colorClusters = [];
  for (let i = 0; i < K; i++) {
    // クラスタ中心のRGB値を取得
    const r = Math.round(centers.floatAt(i, 0));
    const g = Math.round(centers.floatAt(i, 1));
    const b = Math.round(centers.floatAt(i, 2));

    // ピクセル数と割合を計算
    const count = clusterCounts[i];
    const percentage = (count / pixelCount) * 100;

    colorClusters.push({ r, g, b, count, percentage });
  }

  // 出現頻度でソート（多い順）
  colorClusters.sort((a, b) => b.count - a.count);

  // RGB値を文字列形式に変換
  const palette = colorClusters.map(color => rgb(${color.r}, ${color.g}, ${color.b}));

  // メモリ解放
  src.delete();
  rgbImg.delete();
  samples.delete();
  labels.delete();
  centers.delete();

  return palette;
};

export default createPalette;