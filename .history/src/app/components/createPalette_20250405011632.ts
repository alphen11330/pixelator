// 色空間の量子化（Wu Quantization）を手動で実装する
// RGBピクセル配列を元にパレットを生成する関数

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


function wuQuantization(pixels: RGB[], numColors: number): RGB[] {
  // ピクセルが十分でない場合はそのまま返す
  if (pixels.length <= numColors) {
    return pixels;
  }

  // ピクセルの分布を3次元空間（RGB）で考える
  let clusters: RGB[] = pixels.slice(0, numColors);

  // 以下、簡略化したWu Quantizationの擬似コード
  // 本来は精緻な分割を行うが、ここでは簡易的にk-meansを適用

  // K-means クラスタリングの初期化
  let prevClusters: RGB[] = [];
  let iterationCount = 0;
  const maxIterations = 10;

  while (iterationCount < maxIterations && !arraysAreEqual(clusters, prevClusters)) {
    // 各ピクセルを最も近いクラスタに割り当てる
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

    // 各クラスタの新しい代表色を計算
    prevClusters = [...clusters];
    clusters = clusters.map((_, idx) => {
      const clusterPixels = pixels.filter((_, i) => clusterAssignments[i] === idx);
      return averageColor(clusterPixels);
    });

    iterationCount++;
  }

  return clusters;
}

// 2色のRGB配列が等しいかを比較
function arraysAreEqual(arr1: RGB[], arr2: RGB[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v.every((c, j) => c === arr2[i][j]));
}

// RGB色の距離を計算
function colorDistance(color1: RGB, color2: RGB): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
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

// 画像から色パレットを生成する
const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 100;
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

      const wuPalette = wuQuantization(pixels, 256); // まずは256色に圧縮
      const reducedPalette = selectRepresentativeColors(wuPalette, numColors); // 代表色抽出

      resolve(reducedPalette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

export default createPalette;