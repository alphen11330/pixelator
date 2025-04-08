const colorReductionProcessor = (cv, src, levels = 16) => {
  const width = src.cols;
  const height = src.rows;
  const channels = src.channels();

  // 画像データを一次元配列に変換
  let samples = src.reshape(1, width * height);
  samples.convertTo(samples, cv.CV_32F);

  // K-meansに必要なパラメータ
  let labels = new cv.Mat();
  let centers = new cv.Mat();
  let criteria = new cv.TermCriteria(cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER, 10, 1.0);

  // K-means法の適用
  cv.kmeans(samples, levels, labels, criteria, 3, cv.KMEANS_PP_CENTERS, centers);

  // クラスタ中心色で各ピクセルを置き換え
  let clustered = new cv.Mat(samples.rows, samples.cols, samples.type());
  for (let i = 0; i < samples.rows; i++) {
    let label = labels.intAt(i, 0);
    clustered.floatPtr(i, 0)[0] = centers.floatAt(label, 0);
    clustered.floatPtr(i, 1)[0] = centers.floatAt(label, 1);
    clustered.floatPtr(i, 2)[0] = centers.floatAt(label, 2);
  }

  // 元の形状に戻す
  let dst = clustered.reshape(channels, height);
  dst.convertTo(dst, src.type());

  // メモリ解放
  samples.delete();
  labels.delete();
  centers.delete();
  clustered.delete();

  return dst;
};

export default colorReductionProcessor;
