/**
 * 白画素を縮小（erode）し、黒画素を拡大（dilate）して輪郭線を強調するプロセッサー
 * @param cv OpenCV.jsのインスタンス
 * @param src 処理対象の画像Mat
 * @param whiteErodeSize 白画素縮小のカーネルサイズ
 * @param blackDilateSize 黒画素拡大のカーネルサイズ
 * @returns 輪郭線が強調されたMat
 */
const erodeDilateProcessor = (
    cv: any,
    src: any,
    whiteErodeSize: number = 2,
    blackDilateSize: number = 2
  ) => {
    // 結果を格納するMat
    const result = new cv.Mat();
    src.copyTo(result);
    
    // カラー画像の場合、チャンネルごとに処理
    if (src.channels() === 4) { // RGBA画像を想定
      // チャンネル分割
      const rgbaPlanes = new cv.MatVector();
      cv.split(result, rgbaPlanes);
      
      // R, G, B各チャンネルで処理（Aは無視）
      for (let i = 0; i < 3; i++) {
        const channel = rgbaPlanes.get(i);
        
        // 白画素縮小（erode）用のカーネル
        const erodeKernel = cv.getStructuringElement(
          cv.MORPH_ELLIPSE,
          new cv.Size(whiteErodeSize, whiteErodeSize)
        );
        
        // 黒画素拡大（dilate）用のカーネル
        const dilateKernel = cv.getStructuringElement(
          cv.MORPH_ELLIPSE, 
          new cv.Size(blackDilateSize, blackDilateSize)
        );
        
        // 白画素の縮小（明るい部分を縮小）
        const whiteEroded = new cv.Mat();
        cv.erode(channel, whiteEroded, erodeKernel);
        
        // 黒画素の拡大（暗い部分を拡大）
        // 注：OpenCVではdilateは明るい部分を拡大するため、画像を反転させて処理
        const inverted = new cv.Mat();
        cv.bitwise_not(whiteEroded, inverted);
        
        const blackDilated = new cv.Mat();
        cv.dilate(inverted, blackDilated, dilateKernel);
        
        // 再度反転して元に戻す
        cv.bitwise_not(blackDilated, channel);
        
        // 処理したチャンネルを戻す
        rgbaPlanes.set(i, channel);
        
        // 使用したMatを解放
        erodeKernel.delete();
        dilateKernel.delete();
        whiteEroded.delete();
        inverted.delete();
        blackDilated.delete();
      }
      
      // チャンネルを結合して結果を得る
      cv.merge(rgbaPlanes, result);
      
      // MatVectorを解放
      rgbaPlanes.delete();
    } else {
      // グレースケールの場合、直接処理
      // 白画素縮小（erode）用のカーネル
      const erodeKernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE,
        new cv.Size(whiteErodeSize, whiteErodeSize)
      );
      
      // 黒画素拡大（dilate）用のカーネル
      const dilateKernel = cv.getStructuringElement(
        cv.MORPH_ELLIPSE, 
        new cv.Size(blackDilateSize, blackDilateSize)
      );
      
      // 白画素の縮小（明るい部分を縮小）
      const whiteEroded = new cv.Mat();
      cv.erode(result, whiteEroded, erodeKernel);
      result.delete();
      result = whiteEroded.clone();
      
      // 黒画素の拡大（暗い部分を拡大）
      // 注：OpenCVではdilateは明るい部分を拡大するため、画像を反転させて処理
      const inverted = new cv.Mat();
      cv.bitwise_not(result, inverted);
      
      const blackDilated = new cv.Mat();
      cv.dilate(inverted, blackDilated, dilateKernel);
      
      // 再度反転して元に戻す
      whiteEroded.delete();
      result = new cv.Mat();
      cv.bitwise_not(blackDilated, result);
      
      // 使用したMatを解放
      erodeKernel.delete();
      dilateKernel.delete();
      inverted.delete();
      blackDilated.delete();
    }
    
    return result;
  };
  
  export default erodeDilateProcessor;