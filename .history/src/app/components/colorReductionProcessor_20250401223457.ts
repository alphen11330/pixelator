const colorReductionProcessor = (cv: any, src: any, levels: number = 4): any => {
    const channels = src.channels();
    const hasAlpha = channels === 4;
    let dst = src.clone();
    const factor = 255 / (levels - 1);
    const maxProcessSize = 200;
    let processedSrc = src.clone();
    let scale = 1;
  
    if (src.rows > maxProcessSize || src.cols > maxProcessSize) {
      scale = Math.min(maxProcessSize / src.rows, maxProcessSize / src.cols);
      let dsize = new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale));
      cv.resize(src, processedSrc, dsize, 0, 0, cv.INTER_AREA);
    }
  
    const colorMap = new Map();
    const colorCounts = new Map();
  
    for (let y = 0; y < processedSrc.rows; y++) {
      for (let x = 0; x < processedSrc.cols; x++) {
        const pixel = processedSrc.ucharPtr(y, x);
  
        const r = Math.round(pixel[0] / factor) * factor;
        const g = Math.round(pixel[1] / factor) * factor;
        const b = Math.round(pixel[2] / factor) * factor;
  
        const colorKey = `${r},${g},${b}`;
  
        if (colorCounts.has(colorKey)) {
          colorCounts.set(colorKey, colorCounts.get(colorKey) + 1);
        } else {
          colorCounts.set(colorKey, 1);
        }
      }
    }
  
    const sortedColors = [...colorCounts.entries()]
      .sort((a, b) => b[1] - a[1]) // 出現頻度でソート
      .slice(0, levels);
  
    const enhancedColors = sortedColors.map(entry => {
      const [r, g, b] = entry[0].split(',').map(Number);
  
      const hsv = cv.cvtColor(cv.matFromArray([r, g, b], cv.CV_8UC3), cv.COLOR_RGB2HSV);
      const hue = hsv.data[0]; // 色相
      const saturation = hsv.data[1]; // 彩度
  
      return { r, g, b, hue, saturation };
    });
  
    const selectedColors = enhancedColors
      .sort((a, b) => (b.saturation + Math.abs(b.hue - 128)) - (a.saturation + Math.abs(a.hue - 128)))
      .slice(0, levels);
  
    for (const color of selectedColors) {
      colorMap.set(`${color.r},${color.g},${color.b}`, { r: color.r, g: color.g, b: color.b });
    }
  
    for (let y = 0; y < dst.rows; y++) {
      for (let x = 0; x < dst.cols; x++) {
        const pixel = dst.ucharPtr(y, x);
        const r = Math.round(pixel[0] / factor) * factor;
        const g = Math.round(pixel[1] / factor) * factor;
        const b = Math.round(pixel[2] / factor) * factor;
        const quantizedKey = `${r},${g},${b}`;
  
        let closestColor = colorMap.get(quantizedKey);
        if (!closestColor) {
          let minDist = Infinity;
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
  
        if (closestColor) {
          pixel[0] = closestColor.r;
          pixel[1] = closestColor.g;
          pixel[2] = closestColor.b;
        }
      }
    }
  
    processedSrc.delete();
    return dst;
  };
  
  export default colorReductionProcessor;
  