const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // CORS回避のため
    img.src = imageSrc;

    img.onload = () => {
      const maxDimension = 200;
      let { width, height } = img;

      if (width > height && width > maxDimension) {
        height = Math.floor(height * (maxDimension / width));
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.floor(width * (maxDimension / height));
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = [];

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        if (a >= 125) { // ある程度透明なピクセルは除外
          pixels.push([r, g, b]);
        }
      }

      if (pixels.length === 0) {
        return reject('No valid pixels found');
      }

      const palette = medianCut(pixels, numColors);
      resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

// ===== Median Cut Algorithm =====
type RGB = [number, number, number];

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (depth === 1 || pixels.length === 0) {
    const avgColor: RGB = [0, 0, 0];
    for (const [r, g, b] of pixels) {
      avgColor[0] += r;
      avgColor[1] += g;
      avgColor[2] += b;
    }
    const len = pixels.length || 1;
    return [[
      Math.round(avgColor[0] / len),
      Math.round(avgColor[1] / len),
      Math.round(avgColor[2] / len)
    ]];
  }

  const channel = findWidestChannel(pixels);
  pixels.sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(pixels.length / 2);

  const left = pixels.slice(0, mid);
  const right = pixels.slice(mid);

  return [
    ...medianCut(left, depth - 1),
    ...medianCut(right, depth - 1)
  ];
}

function findWidestChannel(pixels: RGB[]): 0 | 1 | 2 {
  let min = [255, 255, 255];
  let max = [0, 0, 0];

  for (const [r, g, b] of pixels) {
    if (r < min[0]) min[0] = r;
    if (g < min[1]) min[1] = g;
    if (b < min[2]) min[2] = b;

    if (r > max[0]) max[0] = r;
    if (g > max[1]) max[1] = g;
    if (b > max[2]) max[2] = b;
  }

  const ranges = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];

  const maxRange = Math.max(...ranges);
  return ranges.indexOf(maxRange) as 0 | 1 | 2;
}

export default createPalette;
