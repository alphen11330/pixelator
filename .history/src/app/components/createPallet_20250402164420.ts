// OpenCV.jsを使用してイメージから代表的な8色を抽出する関数
export const createPallet = (imageSrc: string): number[][] => {
  return new Promise<number[][]>((resolve) => {
    // 画像を読み込む
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // canvas要素を作成して画像を描画
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0, img.width, img.height);
      
      // 画像データを取得
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      // OpenCVで処理するためのMatを作成
      const cv = window.cv
      const src = cv.matFromImageData(imageData);
      const samples = new cv.Mat(src.rows * src.cols, 3, cv.CV_32F);
      
      // RGBデータをサンプルに変換
      for (let y = 0; y < src.rows; y++) {
        for (let x = 0; x < src.cols; x++) {
          const idx = y * src.cols + x;
          const r = src.data[idx * src.channels()];
          const g = src.data[idx * src.channels() + 1];
          const b = src.data[idx * src.channels() + 2];
          
          // RGBからHLSに変換
          const rgb = new cv.Mat(1, 1, cv.CV_8UC3, new cv.Scalar(r, g, b));
          const hls = new cv.Mat();
          cv.cvtColor(rgb, hls, cv.COLOR_RGB2HLS);
          
          // HLSの値を取得
          const h = hls.data[0]; // 色相 (0-180)
          const l = hls.data[1]; // 明度 (0-255)
          const s = hls.data[2]; // 彩度 (0-255)
          
          // samplesに格納
          samples.floatPtr(idx)[0] = h;
          samples.floatPtr(idx)[1] = l;
          samples.floatPtr(idx)[2] = s;
          
          // 一時的なMatを解放
          rgb.delete();
          hls.delete();
        }
      }
      
      // K-means クラスタリングのための変数を準備
      const K = 8; // 8色抽出
      const criteria = new cv.TermCriteria(
        cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER,
        10,  // 最大反復回数
        1.0  // 精度
      );
      const attempts = 3;
      const flags = cv.KMEANS_PP_CENTERS;
      const labels = new cv.Mat();
      const centers = new cv.Mat();
      
      // K-meansを実行して色を抽出
      cv.kmeans(
        samples,
        K,
        labels,
        criteria,
        attempts,
        flags,
        centers
      );
      
      // 抽出した色情報をHLS形式で配列に格納
      const hlsColors: number[][] = [];
      for (let i = 0; i < K; i++) {
        const h = Math.round(centers.floatAt(i, 0)); // 色相
        const l = Math.round(centers.floatAt(i, 1)); // 明度
        const s = Math.round(centers.floatAt(i, 2)); // 彩度
        hlsColors.push([h, l, s]);
      }
      
      // メモリ解放
      src.delete();
      samples.delete();
      labels.delete();
      centers.delete();
      
      // 結果を返す
      resolve(hlsColors);
    };
    
    img.src = imageSrc;
  });
};