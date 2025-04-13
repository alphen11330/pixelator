/**
 * 画素を拡大・縮小して輪郭線を処理するプロセッサー
 * マイナス値にも対応: 
 * - 正の値: 従来通りの処理（白画素縮小・黒画素拡大）
 * - 負の値: 逆の処理（白画素拡大・黒画素縮小）
 * 
 * @param cv OpenCV.jsのインスタンス
 * @param src 処理対象の画像Mat
 * @param whiteSize 白画素処理のカーネルサイズ（正:縮小、負:拡大）
 * @param blackSize 黒画素処理のカーネルサイズ（正:拡大、負:縮小）
 * @returns 処理後のMat
 */
const erodeDilateProcessor = (
  cv: any,
  src: any,
  whiteSize: number = 2,
  blackSize: number = 2
) => {
  // 結果を格納するMat
  let result = new cv.Mat();
  src.copyTo(result);

  // 値の絶対値を計算（カーネルサイズに使用）
  const absWhiteSize = Math.abs(whiteSize);
  const absBlackSize = Math.abs(blackSize);

  // サイズが0の場合は処理をスキップ
  if (absWhiteSize === 0 && absBlackSize === 0) {
    return result;
  }

  // カラー画像の場合、チャンネルごとに処理
  if (src.channels() === 4) { // RGBA画像を想定
    // チャンネル分割
    const rgbaPlanes = new cv.MatVector();
    cv.split(result, rgbaPlanes);

    // R, G, B各チャンネルで処理（Aは無視）
    for (let i = 0; i < 3; i++) {
      const channel = rgbaPlanes.get(i);
      let processed = channel.clone();

      // 白画素処理（値に応じて縮小または拡大）
      if (absWhiteSize > 0) {
        const whiteKernel = cv.getStructuringElement(
          cv.MORPH_ELLIPSE,
          new cv.Size(absWhiteSize, absWhiteSize)
        );

        const whiteProcessed = new cv.Mat();
        if (whiteSize > 0) {
          // 正の値：白画素縮小（erode）
          cv.erode(processed, whiteProcessed, whiteKernel);
        } else {
          // 負の値：白画素拡大（dilate）
          cv.dilate(processed, whiteProcessed, whiteKernel);
        }

        processed.delete();
        processed = whiteProcessed.clone();
        whiteProcessed.delete();
        whiteKernel.delete();
      }

      // 黒画素処理（値に応じて拡大または縮小）
      if (absBlackSize > 0) {
        // 黒画素を処理するため画像を反転
        const inverted = new cv.Mat();
        cv.bitwise_not(processed, inverted);

        const blackKernel = cv.getStructuringElement(
          cv.MORPH_ELLIPSE,
          new cv.Size(absBlackSize, absBlackSize)
        );

        const blackProcessed = new cv.Mat();
        if (blackSize > 0) {
          // 正の値：黒画素拡大（dilateを反転画像に適用）
          cv.dilate(inverted, blackProcessed, blackKernel);
        } else {
          // 負の値：黒画素縮小（erodeを反転画像に適用）
          cv.erode(inverted, blackProcessed, blackKernel);
        }

        // 再度反転して元に戻す
        processed.delete();
        processed = new cv.Mat();
        cv.bitwise_not(blackProcessed, processed);

        // 使用したMatを解放
        inverted.delete();
        blackProcessed.delete();
        blackKernel.delete();
      }

      // 処理したチャンネルを戻す
      rgbaPlanes.set(i, processed);
      channel.delete();
    }

    // チャンネルを結合して結果を得る
    result.delete();
    result = new cv.Mat();
    cv.merge(rgbaPlanes, result);

    // MatVectorを解放
    rgbaPlanes.delete();
  } else {
    // グレースケールの場合、直接処理
    let processed = result.clone();
    result.delete();

    // 白画素処理
    if (absWhiteSize > 0) {
      const whiteKernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(absWhiteSize, absWhiteSize)
      );

      const whiteProcessed = new cv.Mat();
      if (whiteSize > 0) {
        // 正の値：白画素縮小（erode）
        cv.erode(processed, whiteProcessed, whiteKernel);
      } else {
        // 負の値：白画素拡大（dilate）
        cv.dilate(processed, whiteProcessed, whiteKernel);
      }

      processed.delete();
      processed = whiteProcessed.clone();
      whiteProcessed.delete();
      whiteKernel.delete();
    }

    // 黒画素処理
    if (absBlackSize > 0) {
      // 黒画素を処理するため画像を反転
      const inverted = new cv.Mat();
      cv.bitwise_not(processed, inverted);

      const blackKernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(absBlackSize, absBlackSize)
      );

      const blackProcessed = new cv.Mat();
      if (blackSize > 0) {
        // 正の値：黒画素拡大（dilateを反転画像に適用）
        cv.dilate(inverted, blackProcessed, blackKernel);
      } else {
        // 負の値：黒画素縮小（erodeを反転画像に適用）
        cv.erode(inverted, blackProcessed, blackKernel);
      }

      // 再度反転して元に戻す
      processed.delete();
      result = new cv.Mat();
      cv.bitwise_not(blackProcessed, result);

      // 使用したMatを解放
      inverted.delete();
      blackProcessed.delete();
      blackKernel.delete();
    } else {
      result = processed.clone();
      processed.delete();
    }
  }

  return result;
};

export default erodeDilateProcessor;