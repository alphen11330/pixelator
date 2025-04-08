type RGB = [number, number, number];

// RGB色の距離を計算
function colorDistance(color1: RGB, color2: RGB): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
}

// RGB色をHSLに変換（色相環分割に使用）
function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
  const diff = max - min;
  let h = 0, s = 0, l = (max + min) / 2;

  if (diff !== 0) {
    s = diff / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r1: h = (g1 - b1) / diff + (g1 < b1 ? 6 : 0); break;
      case g1: h = (b1 - r1) / diff + 2; break;
      case b1: h = (r1 - g1) / diff + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

// RGBをHSLに基づいて色相環で分割
function divideIntoHueGroups(colors: RGB[], numGroups: number): RGB[][] {
  const groups: RGB[][] = Array.from({ length: numGroups }, () => []);
  for (const color of colors) {
    const [hue] = rgbToHsl(color);
    const groupIndex = Math.floor(hue / (360 / numGroups));
    groups[groupIndex].push(color);
  }
  return groups;
}

// Wu Quantizationによる色空間の量子化（似た色が少ない場合に選ばれやすくする）
function wuQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels;
  }

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

  const weightedClusters = applyWeighting(clusters, pixels);
  return weightedClusters;
}

// 似た色が少ない場合に重みを付けて返す
function applyWeighting(clusters: RGB[], pixels: RGB[]): RGB[] {
  const clusterWeights: number[] = clusters.map(() => 0);

  for (const pixel of pixels) {
    let minDist = Infinity;
    let assignedCluster = -1;
    for (let i = 0; i < clusters.length; i++) {
      const dist = colorDistance(pixel, clusters[i]);
      if (dist < minDist) {
        minDist = dist;
        assignedCluster = i;
      }
    }
    clusterWeights[assignedCluster]++;
  }

  return clusters.map((cluster, idx) => {
    const weight = clusterWeights[idx];
    return weight > 0 ? cluster : randomColor();
  });
}

// ランダムなRGB色を生成
function randomColor(): RGB {
  return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
}

// RGBピクセルの平均色を計算
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

// 2色のRGB配列が等しいかを比較
function arraysAreEqual(arr1: RGB[], arr2: RGB[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v.every((c, j) => c === arr2[i][j]));
}

// 色相環を8分割し、順番に選出する
function selectColorsFromHueGroups(groups: RGB[][], numColors: number): RGB[] {
  const selectedColors: RGB[] = [];
  const usedColors: Set<string> = new Set();

  // 黒と白を必ず選出
  const black: RGB = [0, 0, 0];
  const white: RGB = [255, 255, 255];
  selectedColors.push(black, white);
  usedColors.add(black.toString());
  usedColors.add(white.toString());

  // 8分割された色相環のグループから選出
  for (let i = 0; i < numColors - 2; i++) {
    for (const group of groups) {
      if (group.length === 0) continue;

      // グループから代表色を選択
      const color = group[0];
      if (!usedColors.has(color.toString())) {
        selectedColors.push(color);
        usedColors.add(color.toString());
        break;
      }
    }
  }

  return selectedColors;
}

// 画像から色パレットを生成する
const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
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

      let clusters = wuQuantization(pixels, 256);
      const hueGroups = divideIntoHueGroups(clusters, 8);
      const palette = selectColorsFromHueGroups(hueGroups, numColors);

      resolve(clusters.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

export default createPalette;
