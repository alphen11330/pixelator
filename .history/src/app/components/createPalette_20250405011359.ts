type RGB = [number, number, number];
type HSL = [number, number, number];

// RGB → HSL 変換
function rgbToHsl([r, g, b]: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h: number = 0, s: number = 0, l: number = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }

  return [h, s, l];
}

// HSL空間で色相を均等に分布させて代表色を選ぶ
function selectRepresentativeColors(palette: RGB[], numColors: number): RGB[] {
  const hslPalette = palette.map(rgbToHsl);

  // 彩度・明度のしきい値を決めて "地味すぎる色" を除外
  const filtered = palette.filter((color, i) => {
    const [h, s, l] = hslPalette[i];
    return s > 0.15 && l > 0.1 && l < 0.9; // 彩度・明度が適度なもの
  });

  // 色相でソートして、等間隔に色を抜き出す
  const sorted = filtered
    .map((color, i) => ({ color, h: hslPalette[i][0] }))
    .sort((a, b) => a.h - b.h);

  const step = Math.floor(sorted.length / numColors);
  const result: RGB[] = [];

  for (let i = 0; i < numColors; i++) {
    const index = Math.min(i * step, sorted.length - 1);
    result.push(sorted[index].color);
  }

  return result;
}
