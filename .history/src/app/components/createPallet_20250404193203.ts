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

  // 各RGBチャネルを指定した階層数に量子化（ポスタリゼーション）
  const levels = numColors; // ポスタリゼーションのレベル数（この場合8）
  
  const factor = 256 / levels;

  // ポスタリゼーション処理
  for (let y = 0; y < rgbImg.rows; y++) {
    for (let x = 0; x < rgbImg.cols; x++) {
      const pixel = rgbImg.ucharPtr(y, x);
      for (let i = 0; i < 3; i++) {
        pixel[i] = Math.floor(pixel[i] / factor) * factor;
      }
    }
  }

  // キャンバスに戻して処理結果を表示
  cv.imshow(canvas, rgbImg);

  // 画像からカラーパレットを取得
  const palette: string[] = [];
  const colorSet: Set<string> = new Set();

  for (let y = 0; y < rgbImg.rows; y++) {
    for (let x = 0; x < rgbImg.cols; x++) {
      const pixel = rgbImg.ucharPtr(y, x);
      const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

      colorSet.add(color);
      if (colorSet.size >= numColors) {
        break;
      }
    }
    if (colorSet.size >= numColors) {
      break;
    }
  }

  // カラーパレットを配列として取得
  colorSet.forEach((color) => palette.push(color));

  // メモリ解放
  src.delete();
  rgbImg.delete();

  return palette;
};

export default createPalette;
