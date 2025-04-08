export const createPallet = async (imageSrc: string): Promise<number[][]> => {
  return new Promise<number[][]>((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0, img.width, img.height);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      
      const cv = window.cv;
      const src = cv.matFromImageData(imageData);
      const samples = new cv.Mat(src.rows * src.cols, 3, cv.CV_32F);
      
      for (let y = 0; y < src.rows; y++) {
        for (let x = 0; x < src.cols; x++) {
          const idx = y * src.cols + x;
          const r = src.data[idx * src.channels()];
          const g = src.data[idx * src.channels() + 1];
          const b = src.data[idx * src.channels() + 2];
          
          samples.floatPtr(idx)[0] = r;
          samples.floatPtr(idx)[1] = g;
          samples.floatPtr(idx)[2] = b;
        }
      }
      
      const K = 8;
      const criteria = new cv.TermCriteria(
        cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER,
        10,
        1.0
      );
      const attempts = 3;
      const flags = cv.KMEANS_PP_CENTERS;
      const labels = new cv.Mat();
      const centers = new cv.Mat();
      
      cv.kmeans(
        samples,
        K,
        labels,
        criteria,
        attempts,
        flags,
        centers
      );
      
      const rgbColors: number[][] = [];
      for (let i = 0; i < K; i++) {
        const r = Math.round(centers.floatAt(i, 0));
        const g = Math.round(centers.floatAt(i, 1));
        const b = Math.round(centers.floatAt(i, 2));
        rgbColors.push([r, g, b]);
      }
      
      src.delete();
      samples.delete();
      labels.delete();
      centers.delete();
      
      resolve(rgbColors);
    };
    
    img.src = imageSrc;
  });
};