function rgbToHsv(r, g, b) {
    // RGBをHSVに変換
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    let h = (max + min) / 2;
    let s = max === min ? 0 : (max - min) / (1 - Math.abs(2 * h - 1));
    let v = max;
    return [h, s, v];
  }
  
  function hsvToRgb(h, s, v) {
    // HSVをRGBに変換
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
  
  function quantizeHsv(h, s, v, levels) {
    // 色相を優先した量子化
    const factor = 1 / levels;
    h = Math.round(h / factor) * factor;
    s = Math.round(s / factor) * factor;
    v = Math.round(v / factor) * factor;
    return hsvToRgb(h, s, v);
  }
  