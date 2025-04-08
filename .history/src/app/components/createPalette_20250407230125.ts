type RGB = [number, number, number];

// RGB → HSV変換
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;

  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = ((b - r) / d + 2);
    else h = ((r - g) / d + 4);
    h *= 60;
  }

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return [h, s, v];
}

// 色相ごとにグループ分け
function groupByHue(pixels: RGB[], numGroups: number): RGB[][] {
  const hueGroups: RGB[][] = Array.from({ length: numGroups }, () => []);
  
  for (const [r, g, b] of pixels) {
    const [h] = rgbToHsv(r, g, b);
    const groupIdx = Math.floor(h / 360 * numGroups);
    hueGroups[groupIdx].push([r, g, b]);
  }

  return hueGroups;
}

// 平均色
function averageColor(colors: RGB[]): RGB {
  const len = colors.length;
  if (len === 0) return [0, 0, 0];

  const total = colors.reduce((acc, [r, g, b]) => {
    acc[0] += r;
    acc[1] += g;
    acc[2] += b;
    return acc;
  }, [0, 0, 0]);

  return [
    Math.round(total[0] / len),
    Math.round(total[1] / len),
    Math.round(total[2] / len)
  ];
}

// 色距離
function colorDistance(color1: RGB, color2: RGB): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
}

// クラスタ比較
function arraysAreEqual(arr1: RGB[], arr2: RGB[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v.every((c, j) => c === arr2[i][j]));
}

// Wu Quantization
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
    clusters = clusters.map((prevCluster, idx) => {
      const clusterPixels = pixels.filter((_, i) => clusterAssignments[i] === idx);
      return clusterPixels.length > 0 ? averageColor(clusterPixels) : prevCluster;
    });

    iterationCount++;
  }

  return clusters;
}

// バランスの取れたカラーパレット生成
function generateBalancedPalette(pixels: RGB[], numColors: number): RGB[] {
  const numGroups = Math.min(numColors, 6);
  const hueGroups = groupByHue(pixels, numGroups);

  const base = Math.floor(numColors / numGroups);
  let palette: RGB[] = [];

  for (const group of hueGroups) {
    if (group.length > 0) {
      const n = base || 1;
      const groupPalette = wuQuantization(group, n);
      palette.push(...groupPalette);
    }
  }

  while (palette.length < numColors) {
    const extra = wuQuantization(pixels, 1);
    palette.push(...extra);
  }

  return palette.slice(0, numColors);
}

// メイン関数
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

      if (pixels.length === 0) return reject('No valid pixels found');

      let palette = generateBalancedPalette(pixels, numColors);

      const hasBlack = palette.some(([r, g, b]) => r < 20 && g < 20 && b < 20);
      const hasWhite = palette.some(([r, g, b]) => r > 230 && g > 230 && b > 230);
      if (!hasBlack && palette.length < numColors) palette.push([0, 0, 0]);
      if (!hasWhite && palette.length < numColors) palette.push([255, 255, 255]);

      while (palette.length < numColors) {
        palette.push(...wuQuantization(pixels, 1));
      }

      resolve(palette.slice(0, numColors).map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

export default createPalette;
