export function createPallet(imageSrc: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const result: string[] = [];

    img.crossOrigin = 'Anonymous'; // クロスオリジン対応
    img.src = imageSrc;

    img.onload = () => {
      // canvasサイズ調整（必要に応じて）
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        reject('Failed to get canvas context');
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const src = cv.matFromImageData(imageData);

      // 画像をLab色空間に変換
      const lab = new cv.Mat();
      cv.cvtColor(src, lab, cv.COLOR_RGB2Lab);

      // 画像をピクセルのリストに変換
      const reshaped = lab.reshape(1, src.rows * src.cols);

      // K-meansクラスタリングの設定
      const k = 8; // 代表色の数
      const criteria = new cv.TermCriteria(cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 100, 0.2);
      const attempts = 10;
      const flags = cv.KMEANS_RANDOM_CENTERS;

      // K-meansクラスタリング
      const [labels, centers] = new cv.Mat();
      cv.kmeans(reshaped, k, labels, criteria, attempts, flags, centers);

      // クラスタの代表色をRGBに戻す
      const dominantColors: string[] = [];
      for (let i = 0; i < centers.rows; i++) {
        const labColor = centers.row(i);
        const rgbColor = cv.cvtColor(labColor, cv.COLOR_Lab2RGB);
        dominantColors.push(`rgb(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})`);
      }

      // 結果をセット
      resolve(dominantColors);

      // リソース解放
      src.delete();
      lab.delete();
      reshaped.delete();
      labels.delete();
      centers.delete();
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}
