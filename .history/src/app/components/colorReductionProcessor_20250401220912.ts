// RGBからHSVへの変換関数
function rgbToHsv(r, g, b) {
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = (max + min) / 2;
    let s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * h - 1));
    let v = max;
    return [h, s, v];
  }
  
  // HSVからRGBへの変換関数
  function hsvToRgb(h, s, v) {
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
  
  // 色相優先で量子化する関数
  function quantizeHsv(h, s, v, levels) {
    const factor = 1 / levels;
    h = Math.round(h / factor) * factor;
    s = Math.round(s / factor) * factor;
    v = Math.round(v / factor) * factor;
    return hsvToRgb(h, s, v);
  }
  
  // メインの色減少処理
  const colorReductionProcessor = (cv, src, levels = 4) => {
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
  
    const colorMap = new Map();
    const colorCounts = new Map();
  
    // 各ピクセルをスキャンして色の出現頻度をカウント
    for (let y = 0; y < processedSrc.rows; y++) {
      for (let x = 0; x < processedSrc.cols; x++) {
        const pixel = processedSrc.ucharPtr(y, x);
  
        // RGBをHSVに変換して量子化
        const [h, s, v] = rgbToHsv(pixel[0], pixel[1], pixel[2]);
        const quantizedColor = quantizeHsv(h, s, v, levels);
        
        const colorKey = `${quantizedColor[0]},${quantizedColor[1]},${quantizedColor[2]}`;
  
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
  
    // パレットを作成
    for (let i = 0; i < sortedColors.length; i++) {
      const [r, g, b] = sortedColors[i].split(',').map(Number);
      colorMap.set(sortedColors[i], { r, g, b });
    }
  
    // 元の画像に最も近い色を適用
    for (let y = 0; y < dst.rows; y++) {
      for (let x = 0; x < dst.cols; x++) {
        const pixel = dst.ucharPtr(y, x);
        const [h, s, v] = rgbToHsv(pixel[0], pixel[1], pixel[2]);
        const quantizedColor = quantizeHsv(h, s, v, levels);
        const quantizedKey = `${quantizedColor[0]},${quantizedColor[1]},${quantizedColor[2]}`;
  
        // 最も近い色を検索
        let closestColor = colorMap.get(quantizedKey);
  
        if (closestColor) {
          pixel[0] = closestColor.r;
          pixel[1] = closestColor.g;
          pixel[2] = closestColor.b;
        }
      }
    }
  
    // メモリ解放
    processedSrc.delete();
    return dst;
  };
  
  export default colorReductionProcessor;
  