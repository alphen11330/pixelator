/**
 * K-means法を使用した減色処理を行うユーティリティ関数
 */

/**
 * 画像の色数を減らす処理
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 減色後の色数（デフォルト：4）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv: any, src: any, levels: number = 4): any => {
  // 画像のサイズを取得
  const width = src.cols;
  const height = src.rows;
  const channels = src.channels();

  // 入力画像を1行x3列（RGB）または4列（RGBA）のサンプルに変換
  let samples = new cv.Mat(width * height, 3, cv.CV_32F);
  
  // 画像データをサンプル行列に変換
  let sampleIdx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 各ピクセルのRGB値を取得
      let pixel = src.ucharPtr(y, x);
      samples.floatPtr(sampleIdx, 0)[0] = pixel[0]; // R
      samples.floatPtr(sampleIdx, 1)[0] = pixel[1]; // G
      samples.floatPtr(sampleIdx, 2)[0] = pixel[2]; // B
      sampleIdx++;
    }
  }

  // K-meansに必要なパラメータを設定
  let labels = new cv.Mat();
  let centers = new cv.Mat();
  let criteria = new cv.TermCriteria(
    cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
    10,     // 最大反復回数
    1.0     // 精度
  );
  
  // K-means法を適用（RGBをクラスタリング）
  cv.kmeans(
    samples,
    levels,       // クラスタ数（色数）
    labels,
    criteria,
    3,           // 試行回数
    cv.KMEANS_PP_CENTERS,  // k-means++アルゴリズム
    centers
  );

  // 出力画像を準備
  let dst = new cv.Mat(height, width, src.type());
  
  // 各ピクセルを最も近いクラスタの中心色に置き換え
  sampleIdx = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // このピクセルが属するクラスタを取得
      const label = labels.intAt(sampleIdx, 0);
      
      // クラスタの中心色を取得
      const centerR = centers.floatAt(label, 0);
      const centerG = centers.floatAt(label, 1);
      const centerB = centers.floatAt(label, 2);
      
      // 中心色を出力画像に設定
      let pixel = dst.ucharPtr(y, x);
      pixel[0] = centerR;
      pixel[1] = centerG;
      pixel[2] = centerB;
      
      // アルファチャンネルがある場合は元の値をコピー
      if (channels === 4) {
        pixel[3] = src.ucharPtr(y, x)[3];
      }
      
      sampleIdx++;
    }
  }

  // メモリ解放
  samples.delete();
  labels.delete();
  centers.delete();
  
  return dst;
};

export default colorReductionProcessor;