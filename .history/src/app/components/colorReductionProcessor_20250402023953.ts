/**
 * K-means法を使用した減色処理を行うユーティリティ関数（クォンタイズ法修正）
 */

/**
 * 画像の色数を減らす処理（クォンタイズ法）
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 減色後の色数（デフォルト：16）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv: any, src: any, levels: number = 16): any => {
  const width = src.cols;
  const height = src.rows;
  const channels = src.channels();

  let samples = new cv.Mat(height * width, channels, cv.CV_32F);
  let sampleIdx = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let pixel = src.ucharPtr(y, x);
      for (let c = 0; c < channels; c++) {
        samples.floatPtr(sampleIdx, c)[0] = pixel[c];
      }
      sampleIdx++;
    }
  }

  let labels = new cv.Mat();
  let centers = new cv.Mat();
  let criteria = new cv.TermCriteria(
    cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
    10,
    1.0
  );

  cv.kmeans(samples, levels, labels, criteria, 3, cv.KMEANS_PP_CENTERS, centers);

  let dst = new cv.Mat(height, width, src.type());
  sampleIdx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const label = labels.intAt(sampleIdx, 0);
      let pixel = dst.ucharPtr(y, x);
      for (let c = 0; c < channels; c++) {
        pixel[c] = centers.floatAt(label, c);
      }
      sampleIdx++;
    }
  }

  samples.delete();
  labels.delete();
  centers.delete();

  return dst;
};

export default colorReductionProcessor;