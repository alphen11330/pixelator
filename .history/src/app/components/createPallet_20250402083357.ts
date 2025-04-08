const createPallet = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const cv = window.cv;
      if (!cv) {
        console.error("OpenCV.js is not loaded.");
        return reject("OpenCV.js is not loaded.");
      }
  
      const img = new Image();
      img.crossOrigin = "Anonymous"; // CORS対応
      img.src = imageSrc;
  
      img.onload = () => {
        // Canvas に描画
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject("Failed to get 2D context");
        }
        ctx.drawImage(img, 0, 0);
  
        // OpenCVで画像をMatとして取得
        let src = cv.imread(canvas);
  
        // 画像をRGBの配列に変換
        let samples = [];
        for (let y = 0; y < src.rows; y++) {
          for (let x = 0; x < src.cols; x++) {
            let pixel = src.ucharPtr(y, x); // ピクセルのRGB値を取得
            samples.push([pixel[0], pixel[1], pixel[2]]);
          }
        }
  
        // 配列をcv.Matに変換
        let samplesMat = cv.matFromArray(samples.length, 1, cv.CV_32FC3, samples.flat());
  
        let labels = new cv.Mat();
        let centers = new cv.Mat();
  
        // k-meansクラスタリングの条件設定
        let criteria = new cv.TermCriteria(cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 10, 1.0);
        let attempts = 10;
        let flags = cv.KMEANS_PP_CENTERS;
  
        // k-means実行
        cv.kmeans(samplesMat, numColors, labels, criteria, attempts, flags, centers);
  
        // 代表色を取得（整数に変換）
        let extractedColors: string[] = [];
        for (let i = 0; i < numColors; i++) {
          let r = Math.round(centers.floatAt(i, 0));
          let g = Math.round(centers.floatAt(i, 1));
          let b = Math.round(centers.floatAt(i, 2));
          extractedColors.push(`#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`);
        }
  
        // メモリ解放
        src.delete();
        samplesMat.delete();
        labels.delete();
        centers.delete();
  
        resolve(extractedColors);
      };
  
      img.onerror = (err) => reject(`Failed to load image: ${err}`);
    });
  };
  
  export default createPallet;
  