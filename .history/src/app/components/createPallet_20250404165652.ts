// RGB to HSB (HSV) conversion
const rgbToHsb = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let v = max;

  let delta = max - min;
  if (max !== 0) {
    s = delta / max;
  }
  if (max !== min) {
    if (max === r) {
      h = (g - b) / delta;
    } else if (max === g) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, v };
};

const createPallet = (imageSrc: string): string[] => {
  const img = new Image();
  img.src = imageSrc;

  if (!img.complete) {
    throw new Error('Image not loaded yet.');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const colorCount: { [key: string]: number } = {};

  // 色相ごとに色を分類するためのデータ
  const hueBuckets: { [key: string]: { count: number; r: number; g: number; b: number }[] } = {};

  // ピクセルデータから色を集計
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const { h } = rgbToHsb(r, g, b); // RGBから色相を取得

    // 色をRGB形式で文字列に
    const color = `rgb(${r},${g},${b})`;

    // 色相に基づいて色を分類
    const hueKey = Math.floor(h / 30); // 色相を30度ごとに分類（12分割）
    if (!hueBuckets[hueKey]) {
      hueBuckets[hueKey] = [];
    }
    hueBuckets[hueKey].push({ count: 1, r, g, b });
  }

  // 色相ごとに最も頻出する色を選ぶ
  const selectedColors: string[] = [];
  for (const hueKey in hueBuckets) {
    const colors = hueBuckets[hueKey];
    // 色を出現頻度でソートし、最も頻出する色を選択
    const sortedColors = colors.sort((a, b) => b.count - a.count);
    const dominantColor = sortedColors[0];
    selectedColors.push(`rgb(${dominantColor.r},${dominantColor.g},${dominantColor.b})`);
  }

  // 取得した色を色相を考慮して並べ替える
  return selectedColors;
};

export default createPallet;
