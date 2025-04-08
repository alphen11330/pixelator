/**
 * 減色処理を行うためのユーティリティ関数
 */

/**
 * 画像の色数を減らす処理
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 各チャンネルの色のレベル数（デフォルト：4）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv: any, src: any, levels: number = 4): any => {
    // 新しい出力Matを作成
    let dst = src.clone();
    
    // 各チャンネルの値を量子化するための値を計算
    // 例：levels=4の場合、各チャンネルは0, 85, 170, 255のいずれかになる
    const quantizationFactor = 255 / (levels - 1);
    
    // 画像データを直接処理
    const channels = src.channels();
    const totalPixels = src.rows * src.cols;
    
    // チャンネル数に応じて処理
    for (let pixel = 0; pixel < totalPixels; pixel++) {
      for (let c = 0; c < channels; c++) {
        if (c < 3) { // RGBチャンネルのみ処理（アルファは処理しない）
          // 現在の画素値を取得
          const pixelValue = src.data[pixel * channels + c];
          
          // 量子化：最も近い量子化レベルを計算
          const quantizedLevel = Math.round(pixelValue / quantizationFactor);
          const newValue = Math.min(255, Math.max(0, quantizedLevel * quantizationFactor));
          
          // 新しい値をセット
          dst.data[pixel * channels + c] = newValue;
        }
      }
    }
    
    return dst;
  };
  
  export default colorReductionProcessor;