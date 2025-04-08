/**
 * 画像の輪郭線を強調するプロセッサー
 * @param cv OpenCV.jsのインスタンス
 * @param src 処理対象の画像Mat
 * @param thickness 輪郭線の太さ（膨張カーネルサイズ）
 * @param intensity 輪郭線の強度（0.0～1.0）
 * @returns 輪郭線が強調されたMat
 */
const edgeEnhancementProcessor = (
    cv: any,
    src: any,
    thickness: number = 3,
    intensity: number = 0.7
  ) => {
    // 作業用の変数
    const dst = new cv.Mat();
    
    // グレースケールに変換（エッジ検出用）
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Cannyエッジ検出（パラメータは調整可能）
    const edges = new cv.Mat();
    cv.Canny(gray, edges, 50, 150);
    
    // エッジを膨張させる
    const dilatedEdges = new cv.Mat();
    const kernel = cv.getStructuringElement(
      cv.MORPH_RECT,
      new cv.Size(thickness, thickness)
    );
    cv.dilate(edges, dilatedEdges, kernel);
    
    // エッジマスクをRGBA形式に変換
    const edgeMask = new cv.Mat();
    cv.cvtColor(dilatedEdges, edgeMask, cv.COLOR_GRAY2RGBA);
    
    // 元の画像とエッジマスクを合成
    const edgeIntensity = Math.max(0, Math.min(1, intensity));
    const srcWeight = 1 - edgeIntensity;
    
    // 白い輪郭線を強調するための白色マット
    const white = new cv.Mat(src.rows, src.cols, src.type(), new cv.Scalar(255, 255, 255, 255));
    
    // 輪郭線部分を白くする処理
    cv.multiply(edgeMask, white, edgeMask, 1/255);
    
    // 結果を合成
    cv.addWeighted(src, srcWeight, edgeMask, edgeIntensity, 0, dst);
    
    // 使用したMatを解放
    gray.delete();
    edges.delete();
    dilatedEdges.delete();
    edgeMask.delete();
    white.delete();
    kernel.delete();
    
    return dst;
  };
  
  export default edgeEnhancementProcessor;