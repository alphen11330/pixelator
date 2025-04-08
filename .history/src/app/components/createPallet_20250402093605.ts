function createPallet(imageSrc: string): number[][] {
  // 画像を読み込む
  const img = new Image();
  img.src = imageSrc;
  img.crossOrigin = "Anonymous"; // CORSエラーを回避
  const cv = window.cv;

  // 画像がロード済みであることを前提に進めます
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Canvas context not available");
    return [];
  }

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0, img.width, img.height);
  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const mat = cv.matFromImageData(imgData);

  // 手動でデータを1次元化
  const samples = new cv.Mat(mat.rows * mat.cols, 1, cv.CV_32FC3); // 1列×RGB3チャネル
  for (let i = 0; i < mat.rows; i++) {
    for (let j = 0; j < mat.cols; j++) {
      const pixel = mat.ucharPtr(i, j);
      samples.floatPtr(i * mat.cols + j)[0] = pixel[0]; // B
      samples.floatPtr(i * mat.cols + j)[1] = pixel[1]; // G
      samples.floatPtr(i * mat.cols + j)[2] = pixel[2]; // R
    }
  }

  // k-means法でクラスタリング
  const k = 8; // 代表色の数
  const criteria = new cv.TermCriteria(
    cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER,
    100,
    0.2
  );
  const labels = new cv.Mat();
  const centers = new cv.Mat();
  cv.kmeans(samples, k, labels, criteria, 10, cv.KMEANS_RANDOM_CENTERS, centers);

  // HLSに変換
  const hlsColors: number[][] = [];
  for (let i = 0; i < centers.rows; i++) {
    const [b, g, r] = centers.row(i).data32F;
    const hls = rgbToHls(r, g, b); // RGBをHLSに変換
    hlsColors.push(hls);
  }

  // メモリ解放
  mat.delete();
  samples.delete();
  labels.delete();
  centers.delete();

  return hlsColors;
}

// RGBをHLSに変換する補助関数
function rgbToHls(r: number, g: number, b: number): [number, number, number] {
  const rgb = [r / 255, g / 255, b / 255];
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rgb[0]:
        h = (rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0);
        break;
      case rgb[1]:
        h = (rgb[2] - rgb[0]) / d + 2;
        break;
      case rgb[2]:
        h = (rgb[0] - rgb[1]) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]; // [H, L, S]
}

export default createPallet;
