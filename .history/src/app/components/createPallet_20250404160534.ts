const createPalletWithSaturation = async (imageSrc: string, saturation: number): Promise<string[]> => {
  // 画像の読み込み
  const img = new Image();
  img.src = imageSrc;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // canvasを作成して画像を描画
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // OpenCV.jsで画像を読み込む
  const src = cv.imread(canvas);
  let hls = new cv.Mat();
  let alpha = new cv.Mat();

  // RGBA画像をHLSに変換（アルファチャンネルを分離）
  if (src.channels() === 4) {
    let channels = new cv.MatVector();
    cv.split(src, channels);
    let bgr = new cv.Mat();
    let merged = new cv.MatVector();

    // BGR部分のみHLSに変換
    merged.push_back(channels.get(0));
    merged.push_back(channels.get(1));
    merged.push_back(channels.get(2));
    cv.merge(merged, bgr);
    cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS);

    // アルファチャンネルを保持
    alpha = channels.get(3);

    // メモリ解放
    bgr.delete();
    channels.delete();
    merged.delete();
  } else {
    cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
  }

  // ピクセルごとに彩度(S)を調整
  for (let y = 0; y < hls.rows; y++) {
    for (let x = 0; x < hls.cols; x++) {
      let pixel = hls.ucharPtr(y, x);
      pixel[2] = saturation; // 彩度(S)の値を代入
    }
  }

  // HLSをRGBに戻す
  let dst = new cv.Mat();
  cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);

  // アルファチャンネルを統合
  if (src.channels() === 4) {
    let channels = new cv.MatVector();
    let output = new cv.Mat();
    cv.split(dst, channels);
    channels.push_back(alpha);
    cv.merge(channels, output);
    dst.delete();
    dst = output;

    // メモリ解放
    channels.delete();
    alpha.delete();
  }

  // 代表色を抽出（k-meansを使う）
  const pixels: number[][] = [];
  for (let y = 0; y < dst.rows; y++) {
    for (let x = 0; x < dst.cols; x++) {
      let pixel = dst.ucharPtr(y, x);
      pixels.push([pixel[0], pixel[1], pixel[2]]);
    }
  }

  // k-meansクラスタリングで代表色を抽出
  const numClusters = 8; // 代表色の数
  const result = await kmeans(pixels, numClusters);

  // RGB形式の色を文字列として返す
  const colorPalette = result.centroids.map((centroid: number[]) =>
    `rgb(${Math.round(centroid[0])}, ${Math.round(centroid[1])}, ${Math.round(centroid[2])})`
  );

  // メモリ解放
  hls.delete();
  src.delete();
  dst.delete();

  return colorPalette;
};

export default createPalletWithSaturation;
