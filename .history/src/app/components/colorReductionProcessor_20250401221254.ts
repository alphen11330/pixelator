/**
 * 最適化された減色処理を行うユーティリティ関数
 */

/**
 * RGBからHSVへの変換関数
 */
function rgbToHsv(r: number, g: number, b: number): number[] {
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = (max + min) / 2;
    let s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * h - 1));
    let v = max;
    return [h, s, v];
  }
  
  /**
   * HSVからRGBへの変換関数
   */
  function hsvToRgb(h: number, s: number, v: number): number[] {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    
    if (i % 6 === 0) { r = v; g = t; b = p; }
    else if (i % 6 === 1) { r = q; g = v; b = p; }
    else if (i % 6 === 2) { r = p; g = v; b = t; }
    else if (i % 6 === 3) { r = p; g = q; b = v; }
    else if (i % 6 === 4) { r = t; g = p; b = v; }
    else { r = v; g = p; b = q; }
  
    return [r * 255, g * 255, b * 255];
  }
  
  /**
   * 彩度が高い色を優先する関数
   */
  function isVibrant(color: { r: number, g: number, b: number }): boolean {
    const [h, s, v] = rgbToHsv(color.r, color.g, color.b);
    return s > 0.5;  // 彩度が50%以上の色を鮮やかとみなす
  }
  
  /**
   * エッジ強調フィルタ
   */
  function edgeEnhancement(cv: any, src: any): any {
    let dst = new cv.Mat();
    cv.GaussianBlur(src, dst, new cv.Size(5, 5), 0);  // ノイズを減らすためのブラー
    cv.Laplacian(src, dst, cv.CV_8U, 3, 1, 0, 1, cv.BORDER_DEFAULT);  // エッジ強調
    return dst;
  }
  
  /**
   * 色数を減らす処理（最適化版）
   */
  const colorReductionProcessor = (cv: any, src: any, levels: number = 4): any => {
    let dst = src.clone();
    const factor = 255 / (levels - 1);
  
    // 画像を小さくしてから処理する（処理を軽くするため）
    const maxProcessSize = 200;
    let processedSrc = src.clone();
    let scale = 1;
  
    // 画像が大きい場合はリサイズして処理を軽くする
    if (src.rows > maxProcessSize || src.cols > maxProcessSize) {
      scale = Math.min(maxProcessSize / src.rows, maxProcessSize / src.cols);
      let dsize = new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale));
      cv.resize(src, processedSrc, dsize, 0, 0, cv.INTER_AREA);
    }
  
    // 色相優先で量子化
    const colorMap = new Map();
    const colorCounts = new Map();
  
    // 各ピクセルをスキャンして色の出現頻度をカウント
    for (let y = 0; y < processedSrc.rows; y++) {
      for (let x = 0; x < processedSrc.cols; x++) {
        const pixel = processedSrc.ucharPtr(y, x);
  
        // RGBをHSVに変換して量子化
        const [h, s, v] = rgbToHsv(pixel[0], pixel[1], pixel[2]);
        const quantizedColor = hsvToRgb(Math.round(h * (levels - 1)), Math.round(s * (levels - 1)), Math.round(v * (levels - 1)));
        
        const colorKey = `${quantizedColor[0]},${quantizedColor[1]},${quantizedColor[2]}`;
  
        if (colorCounts.has(colorKey)) {
          colorCounts.set(colorKey, colorCounts.get(colorKey) + 1);
        } else {
          colorCounts.set(colorKey, 1);
        }
      }
    }
  
    // 鮮やかな色をフィルタリングして選択
    const vibrantColors = [...colorCounts.entries()]
      .filter(entry => isVibrant({ r: entry[0].split(',')[0], g: entry[0].split(',')[1], b: entry[0].split(',')[2] }))  // 鮮やかな色だけを選択
      .sort((a, b) => b[1] - a[1])
      .slice(0, levels)
      .map(entry => entry[0]);
  
    // パレットを作成
    for (let i = 0; i < vibrantColors.length; i++) {
      const [r, g, b] = vibrantColors[i].split(',').map(Number);
      colorMap.set(vibrantColors[i], { r, g, b });
    }
  
    // 元の画像に最も近い色を適用
    for (let y = 0; y < dst.rows; y++) {
      for (let x = 0; x < dst.cols; x++) {
        const pixel = dst.ucharPtr(y, x);
        const [h, s, v] = rgbToHsv(pixel[0], pixel[1], pixel[2]);
        const quantizedColor = hsvToRgb(Math.round(h * (levels - 1)), Math.round(s * (levels - 1)), Math.round(v * (levels - 1)));
        const quantizedKey = `${quantizedColor[0]},${quantizedColor[1]},${quantizedColor[2]
  