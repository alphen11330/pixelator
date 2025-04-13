/**
 * 白画素の拡大・縮小を行うプロセッサー
 * - 正の値: 白画素縮小（erode）
 * - 負の値: 白画素拡大（dilate）
 *
 * @param cv OpenCV.jsのインスタンス
 * @param src 処理対象の画像Mat
 * @param whiteSize 白画素処理のカーネルサイズ（正:縮小、負:拡大）
 * @returns 処理後のMat
 */
const erodeDilateProcessor = (
  cv: any,
  src: any,
  whiteSize: number = 2
) => {
  // 結果を格納するMat
  let result = new cv.Mat();
  src.copyTo(result);

  const absWhiteSize = Math.abs(whiteSize);
  if (absWhiteSize === 0) {
    return result;
  }

  // カラー画像（RGBA）処理
  if (src.channels() === 4) {
    const rgbaPlanes = new cv.MatVector();
    cv.split(result, rgbaPlanes);

    for (let i = 0; i < 3; i++) {
      const channel = rgbaPlanes.get(i);
      let processed = channel.clone();

      const whiteKernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(absWhiteSize, absWhiteSize)
      );

      const whiteProcessed = new cv.Mat();
      if (whiteSize > 0) {
        cv.erode(processed, whiteProcessed, whiteKernel);
      } else {
        cv.dilate(processed, whiteProcessed, whiteKernel);
      }

      processed.delete();
      processed = whiteProcessed.clone();
      whiteProcessed.delete();
      whiteKernel.delete();

      rgbaPlanes.set(i, processed);
      channel.delete();
    }

    result.delete();
    result = new cv.Mat();
    cv.merge(rgbaPlanes, result);
    rgbaPlanes.delete();
  }
}

return result;
};

export default erodeDilateProcessor;
