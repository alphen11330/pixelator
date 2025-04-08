/**
 * K-means法を使用した減色処理を行うユーティリティ関数
 */

/**
 * 画像の色数を減らす処理
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 減色後の色数（デフォルト：4）
 * @param scaleFactor 縮小倍率（デフォルト：0.5）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv: any, src: any, levels: number = 4, scaleFactor: number = 0.5): any => {
  // 画像を縮小
  let small = new cv.Mat();
  cv.resize(src, small, new cv.Size(0, 0), scaleFactor, scaleFactor, cv.INTER_LINEAR);

  const width = small.cols;
  const height = small.rows;
  const channels = small.channels();

  // 入力画像を1行x3列（RGB）または4列（RGBA）のサンプルに変換
  let samples = new cv.Mat(width * height, 3, cv.CV_32F);

  let sampleIdx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let pixel = small.ucharPtr(y, x);
      samples.floatPtr(sampleIdx, 0)[0] = pixel[0];
      samples.floatPtr(sampleIdx, 1)[0] = pixel[1];
      samples.floatPtr(sampleIdx, 2)[0] = pixel[2];
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

  let dst = new cv.Mat(height, width, small.type());
  sampleIdx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const label = labels.intAt(sampleIdx, 0);
      let pixel = dst.ucharPtr(y, x);
      pixel[0] = centers.floatAt(label, 0);
      pixel[1] = centers.floatAt(label, 1);
      pixel[2] = centers.floatAt(label, 2);
      if (channels === 4) {
        pixel[3] = small.ucharPtr(y, x)[3];
      }
      sampleIdx++;
    }
  }

  let finalDst = new cv.Mat();
  cv.resize(dst, finalDst, new cv.Size(src.cols, src.rows), 0, 0, cv.INTER_NEAREST);

  samples.delete();
  labels.delete();
  centers.delete();
  small.delete();
  dst.delete();

  return finalDst;
};

export default colorReductionProcessor;