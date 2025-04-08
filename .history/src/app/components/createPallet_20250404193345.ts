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

  // 画像のピクセルデータを配列に変換
  const pixels: number[] = [];
  for (let y = 0; y < rgbImg.rows; y++) {
    for (let x = 0; x < rgbImg.cols; x++) {
      const pixel = rgbImg.ucharPtr(y, x);
      pixels.push(pixel[0], pixel[1], pixel[2]); // R, G, Bを順番に格納
    }
  }

  // k-meansで色をクラスタリング
  const samples = new cv.Mat(pixels.length / 3, 1, cv.CV_32FC3); // ピクセルデータをk-means用に変換
  for (let i = 0; i < pixels.length; i += 3) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    samples.floatPtr(i / 3, 0)[0] = r;
    samples.floatPtr(i / 3, 1)[0] = g;
    samples.floatPtr(i / 3, 2)[0] = b;
  }

  const criteria = new cv.TermCriteria(
    cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
    100, // 最大反復回数
    1.0 // 収束条件
  );
  
  const flags = cv.KMEANS_PP_CENTERS; // k-means++法を使用

  const labels = new cv.Mat();
  const centers = new cv.Mat();
  
  // k-meansクラスタリング実行
  cv.kmeans(samples, numColors, labels, criteria, 10, flags, centers);
  
  // クラスタ中心（代表色）をRGBに変換
  const palette: string[] = [];
  for (let i = 0; i < numColors; i++) {
    const r = Math.round(centers.floatAt(i, 0));
    const g = Math.round(centers.floatAt(i, 1));
    const b = Math.round(centers.floatAt(i, 2));
    palette.push(`rgb(${r}, ${g}, ${b})`);
  }

  // メモリ解放
  src.delete();
  rgbImg.delete();
  samples.delete();
  labels.delete();
  centers.delete();

  return palette;
};

export default createPalette;
