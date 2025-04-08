type RGB = [number, number, number];

// Wu Quantizationによる色空間の量子化
function wuQuantization(pixels: RGB[], numColors: number): RGB[] {
  // ピクセルが十分でない場合はそのまま返す
  if (pixels.length <= numColors) {
    return pixels;
  }

  // ピクセルの分布を3次元空間（RGB）で考える
  let clusters: RGB[] = pixels.slice(0, numColors);

  // 以下、簡略化したWu Quantizationの擬似コード
  // 本来は精緻な分割を行うが、ここでは簡易的にk-meansを適用

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

// RGB色の距離を計算
function colorDistance(color1: RGB, color2: RGB): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
}

// 2色のRGB配列が等しいかを比較
function arraysAreEqual(arr1: RGB[], arr2: RGB[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v.every((c, j) => c === arr2[i][j]));
}

// 画像から色パレットを生成する
const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // クロスドメイン対応
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 256; // 最大の幅・高さを128pxに制限
      let { width, height } = img;

      const aspectRatio = width / height;

      // サイズ縮小（縦長・横長いずれも考慮）
      if (width > height && width > MAX_SIZE) {
        width = MAX_SIZE;
        height = Math.round(MAX_SIZE / aspectRatio);
      } else if (height > width && height > MAX_SIZE) {
        height = MAX_SIZE;
        width = Math.round(MAX_SIZE * aspectRatio);
      } else if (width > MAX_SIZE) {
        width = height = MAX_SIZE; // 正方形画像も縮小
      }

      // Canvasへ描画
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: RGB[] = [];

      // RGBデータ抽出（透明度チェックあり）
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

      // Wu Quantizationによる色のクラスタリング
      let palette = wuQuantization(pixels, numColors);

      // 黒と白を含める処理（必要に応じて）
      const hasBlack = palette.some(([r, g, b]) => r < 20 && g < 20 && b < 20);
      const hasWhite = palette.some(([r, g, b]) => r > 230 && g > 230 && b > 230);

      if (!hasBlack && palette.length < numColors) {
        palette.push([0, 0, 0]); // 黒を追加
      }

      if (!hasWhite && palette.length < numColors) {
        palette.push([255, 255, 255]); // 白を追加
      }

      // 足りない色を補完（ランダムな色で埋めるなど）
      while (palette.length < numColors) {
        palette.push(randomColor());
      }

      // 最終的なパレットの色をRGB文字列に変換
      resolve(palette.map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

// ランダムなRGB色を生成
function randomColor(): RGB {
  return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)];
}

export default createPalette;
