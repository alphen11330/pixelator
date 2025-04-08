// 色空間の量子化（Wu Quantization）を手動で実装する
// RGBピクセル配列を元にバランスの良いパレットを生成する関数

type RGB = [number, number, number];
type HSL = [number, number, number];

function wuQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) return pixels;
  let clusters: RGB[] = pixels.slice(0, numColors);
  let prevClusters: RGB[] = [];
  let iterationCount = 0;
  const maxIterations = 10;

  while (iterationCount < maxIterations && !arraysAreEqual(clusters, prevClusters)) {
    let clusterAssignments: number[] = [];
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      let assignedCluster = 0;
      for (let j = 0; j < clusters.length; j++) {
        const dist = colorDistance(pixels[i], clusters[j]);
        if (dist < minDist) {
          minDist = dist;
          assignedCluster = j;
        }
      }
      clusterAssignments[i] = assignedCluster;
    }

    prevClusters = [...clusters];
    clusters = clusters.map((_, idx) => {
      const clusterPixels = pixels.filter((_, i) => clusterAssignments[i] === idx);
      return averageColor(clusterPixels);
    });

    iterationCount++;
  }

  return clusters;
}

function arraysAreEqual(arr1: RGB[], arr2: RGB[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v.every((c, j) => c === arr2[i][j]));
}

function colorDistance(color1: RGB, color2: RGB): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
}

function averageColor(colors: RGB[]): RGB {
  const total = colors.reduce(
    (acc, [r, g, b]) => {
      acc[0] += r;
      acc[1] += g;
      acc[2] += b;
      return acc;
    },
    [0, 0, 0]
  );
  const len = colors.length;
  return [Math.round(total[0] / len), Math.round(total[1] / len), Math.round(total[2] / len)];
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

const createPalette = (imageSrc: string, numColors: number = 16): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 128;
      let { width, height } = img;
      const aspectRatio = width / height;

      if (width > height && width > MAX_SIZE) {
        width = MAX_SIZE;
        height = Math.round(MAX_SIZE / aspectRatio);
      } else if (height > width && height > MAX_SIZE) {
        height = MAX_SIZE;
        width = Math.round(MAX_SIZE * aspectRatio);
      } else if (width > MAX_SIZE) {
        width = height = MAX_SIZE;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: RGB[] = [];

      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        if (a >= 125) {
          pixels.push([r, g, b]);
        }
      }

      if (pixels.length === 0) {
        return reject('No valid pixels found');
      }

      const reduced = wuQuantization(pixels, 128);
      const hslMap = reduced.map(rgb => ({ rgb, hsl: rgbToHsl(...rgb) }));

      const hueBins = 12;
      const grouped = Array.from({ length: hueBins }, () => [] as typeof hslMap);

      for (const entry of hslMap) {
        const bin = Math.floor(entry.hsl[0] / (360 / hueBins)) % hueBins;
        grouped[bin].push(entry);
      }

      let palette = grouped
        .map(bin => bin.sort((a, b) => (b.hsl[1] + b.hsl[2]) - (a.hsl[1] + a.hsl[2]))[0])
        .filter(Boolean)
        .map(entry => entry.rgb);

      const blacks = hslMap.filter(({ hsl }) => hsl[2] < 0.1);
      const whites = hslMap.filter(({ hsl }) => hsl[2] > 0.9);

      if (blacks.length) palette.push(blacks[0].rgb);
      if (whites.length) palette.push(whites[0].rgb);

      palette = palette
        .map(rgb => ({ rgb, hsl: rgbToHsl(...rgb) }))
        .sort((a, b) => (b.hsl[1] + b.hsl[2]) - (a.hsl[1] + a.hsl[2]))
        .slice(0, 20)
        .map(entry => entry.rgb);

      resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

export default createPalette;
