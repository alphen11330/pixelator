const createPalette = (imageSrc: string, numColors: number = 8): string[] => {
  const cv = window.cv;
  
  if (!cv) {
    throw new Error('OpenCV.js is not loaded yet. Please ensure it is loaded before calling this function.');
  }

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

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = cv.matFromImageData(imageData);
  
  const rgbImg = new cv.Mat();
  cv.cvtColor(src, rgbImg, cv.COLOR_RGBA2RGB);

  // ポスタリゼーション処理
  const posterize = (pixels: number[][], numColors: number) => {
    const levels = Math.floor(256 / numColors);
    return pixels.map(pixel => {
      const r = Math.floor(pixel[0] / levels) * levels;
      const g = Math.floor(pixel[1] / levels) * levels;
      const b = Math.floor(pixel[2] / levels) * levels;
      return [r, g, b];
    });
  };

  const pixels = [];
  for (let y = 0; y < rgbImg.rows; y++) {
    for (let x = 0; x < rgbImg.cols; x++) {
      const pixel = rgbImg.ucharPtr(y, x);
      pixels.push([pixel[0], pixel[1], pixel[2]]);
    }
  }

  const posterizedPixels = posterize(pixels, numColors);

  // 重複を排除して色を取得
  const uniqueColors = Array.from(new Set(posterizedPixels.map(color => color.join(','))))
                             .map(color => color.split(',').map(Number));

  // numColorsに達するまで、重複を削除した後にランダムに追加
  const finalPalette = uniqueColors.slice(0, numColors);

  // RGBを文字列形式に変換
  const colorStrings = finalPalette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);

  // メモリ解放
  src.delete();
  rgbImg.delete();

  return colorStrings;
};

export default createPalette;
