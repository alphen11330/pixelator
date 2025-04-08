/**
 * 最適化された減色処理を行うユーティリティ関数
 */

/**
 * 画像の色数を減らす処理（最適化版）
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 各チャンネルの量子化レベル（デフォルト：4）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv: any, src: any, levels: number = 4): any => {
  // 画像のサイズとチャンネル数を取得
  const channels = src.channels();
  const hasAlpha = channels === 4;
  
  // 出力画像を作成
  let dst = src.clone();
  
  // 各チャンネル(R,G,B)を指定されたレベル数に量子化する値を計算
  const factor = 255 / (levels - 1);
  
  // 画像を小さくしてから処理する（処理を軽くするため）
  const maxProcessSize = 200; // 処理する最大サイズ
  let processedSrc = src.clone();
  let scale = 1;
  
  // 画像が大きい場合はリサイズして処理を軽くする
  if (src.rows > maxProcessSize || src.cols > maxProcessSize) {
    scale = Math.min(maxProcessSize / src.rows, maxProcessSize / src.cols);
    let dsize = new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale));
    cv.resize(src, processedSrc, dsize, 0, 0, cv.INTER_AREA);
  }
  
  // メディアンカットや部分的なK-meansを代用したシンプルな実装
  // 各RGB値を量子化し、LUT（Look-Up Table）を作成
  const colorMap = new Map();
  const colorCounts = new Map();
  
  // 画像の各ピクセルをスキャンして色の出現頻度をカウント
  for (let y = 0; y < processedSrc.rows; y++) {
    for (let x = 0; x < processedSrc.cols; x++) {
      const pixel = processedSrc.ucharPtr(y, x);
      
      // RGBを量子化
      const r = Math.round(pixel[0] / factor) * factor;
      const g = Math.round(pixel[1] / factor) * factor;
      const b = Math.round(pixel[2] / factor) * factor;
      
      // 量子化した色をキーとして保存
      const colorKey = `${r},${g},${b}`;
      
      if (colorCounts.has(colorKey)) {
        colorCounts.set(colorKey, colorCounts.get(colorKey) + 1);
      } else {
        colorCounts.set(colorKey, 1);
      }
    }
  }
  
  // 出現頻度でソートして上位のlevels個の色を選択
  const sortedColors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, levels)
    .map(entry => entry[0]);
  
  // 選択された色をパレットとして使用
  for (let i = 0; i < sortedColors.length; i++) {
    const [r, g, b] = sortedColors[i].split(',').map(Number);
    colorMap.set(sortedColors[i], { r, g, b });
  }
  
  // 元の画像の各ピクセルに最も近い色を適用
  for (let y = 0; y < dst.rows; y++) {
    for (let x = 0; x < dst.cols; x++) {
      const pixel = dst.ucharPtr(y, x);
      
      // 最も近い色を見つける
      let minDist = Infinity;
      let closestColor = null;
      
      // RGBを量子化して探索範囲を減らす
      const r = Math.round(pixel[0] / factor) * factor;
      const g = Math.round(pixel[1] / factor) * factor;
      const b = Math.round(pixel[2] / factor) * factor;
      const quantizedKey = `${r},${g},${b}`;
      
      // 量子化した色が直接パレットにある場合は高速に検索
      if (colorMap.has(quantizedKey)) {
        closestColor = colorMap.get(quantizedKey);
      } else {
        // ない場合は最も近い色を探す
        for (const [_, color] of colorMap.entries()) {
          const dr = color.r - pixel[0];
          const dg = color.g - pixel[1];
          const db = color.b - pixel[2];
          const dist = dr * dr + dg * dg + db * db;
          
          if (dist < minDist) {
            minDist = dist;
            closestColor = color;
          }
        }
      }
      
      // 最も近い色を適用
      if (closestColor) {
        pixel[0] = closestColor.r;
        pixel[1] = closestColor.g;
        pixel[2] = closestColor.b;
        // アルファチャンネルは変更しない
      }
    }
  }
  
  // メモリ解放
  processedSrc.delete();
  
  return dst;
};

export default colorReductionProcessor;