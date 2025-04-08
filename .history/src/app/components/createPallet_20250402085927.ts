import cv from "opencv.js";

function createPallet(imageSrc) {
  return new Promise((resolve, reject) => {
    // 画像を読み込む
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "Anonymous"; // CORSエラーを回避
    img.onload = () => {
      // Canvasを利用して画像データを取得
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
if(!ctx)return

        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const mat = cv.matFromImageData(imgData);

      // 画像データを2次元から1次元に変換
      const samples = new cv.Mat();
      mat.reshape(1, mat.rows * mat.cols).convertTo(samples, cv.CV_32F);

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
      const hlsColors = [];
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

      resolve(hlsColors);
    };

    img.onerror = (err) => reject(err);
  });
}

// RGBをHLSに変換する補助関数
function rgbToHls(r, g, b) {
  const rgb = [r / 255, g / 255, b / 255];
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const l = (max + min) / 2;

  let h, s;

  if (max === min) {
    h = 0;
    s = 0;
  } else {
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
