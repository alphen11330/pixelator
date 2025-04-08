/**
 * K-means法を使用した減色処理を行うユーティリティ関数（クォンタイズ版）
 */

/**
 * 画像の色数を減らす処理（クォンタイズ法）
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 減色後の色数（デフォルト：16）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv: any, src: any, levels: number = 16): any => {
  let dst = new cv.Mat();
  let samples = src.reshape(1, src.rows * src.cols);
  samples.convertTo(samples, cv.CV_32F);

  let criteria = new cv.TermCriteria(
    cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
    10,
    1.0
  );
  let labels = new cv.Mat();
  let centers = new cv.Mat();

  cv.kmeans(samples, levels, labels, criteria, 3, cv.KMEANS_PP_CENTERS, centers);

  let newColors = new cv.Mat(samples.rows, samples.cols, samples.type());
  for (let i = 0; i < samples.rows; i++) {
    let label = labels.intAt(i, 0);
    newColors.floatPtr(i, 0)[0] = centers.floatAt(label, 0);
    newColors.floatPtr(i, 1)[0] = centers.floatAt(label, 1);
    newColors.floatPtr(i, 2)[0] = centers.floatAt(label, 2);
  }

  newColors = newColors.reshape(src.channels(), src.rows);
  newColors.convertTo(dst, src.type());

  samples.delete();
  labels.delete();
  centers.delete();
  newColors.delete();

  return dst;
};

export default colorReductionProcessor;