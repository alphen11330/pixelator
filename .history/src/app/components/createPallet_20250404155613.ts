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

      // 画像データを1次元の配列に変換
      const pixels: number[] = [];
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // RGBを1つの配列に格納
        pixels.push(data[i], data[i + 1], data[i + 2]);
      }

      // OpenCV.jsのMatオブジェクトに変換
      const mat = cv.matFromArray(imageData.height, imageData.width, cv.CV_8UC3, pixels);

      // K-meansクラスタリングの設定
      const k = 8; // 代表色の数
      const criteria = new cv.TermCriteria(cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 100, 0.2);
      const attempts = 10;
      const flags = cv.KMEANS_RANDOM_CENTERS;

      // K-meansクラスタリング
      const [labels, centers] = new cv.Mat();
      cv.kmeans(mat, k, labels, criteria, attempts, flags, centers);

      // クラスタの代表色をRGBに戻す
      const dominantColors: string[] = [];
      for (let i = 0; i < centers.rows; i++) {
        const center = centers.row(i);
        const rgbColor = center.data32F;
        dominantColors.push(`rgb(${Math.round(rgbColor[0])}, ${Math.round(rgbColor[1])}, ${Math.round(rgbColor[2])})`);
      }

      // 結果をセット
      resolve(dominantColors);

      // リソース解放
      mat.delete();
      labels.delete();
      centers.delete();
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}
