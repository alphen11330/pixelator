type RGB = [number, number, number];

// Wu Quantizationによる色空間の量子化（似た色が少ない場合に選ばれやすくする）
function wuQuantization(pixels: RGB[], numColors: number): RGB[] {
  // ピクセルが十分でない場合はそのまま返す
  if (pixels.length <= numColors) {
    return pixels;
  }

  // まず、各色の重みを計算（初期状態では重みを全て1とする）
  const weightedPixels: { color: RGB, weight: number }[] = pixels.map(color => ({
    color,
    weight: 1
  }));

  // 各ピクセルに似た色との距離を計算し、重みを調整
  for (let i = 0; i < weightedPixels.length; i++) {
    let weight = 1;
    for (let j = 0; j < weightedPixels.length; j++) {
      if (i !== j) {
        const dist = colorDistance(weightedPixels[i].color, weightedPixels[j].color);
        // 色が似ているほど重みを小さく、似ていないほど重みを大きくする
        weight += 1 / (dist + 1); // 距離が近いほど重みが小さくなる
      }
    }
    weightedPixels[i].weight = weight;
  }

  // 以下、簡略化したWu Quantizationの擬似コード（k-meansを使用）
  let clusters: { color: RGB, weight: number }[] = weightedPixels.slice(0, numColors); // 初期クラスタ
  let prevClusters: { color: RGB, weight: number }[] = [];
  let iterationCount = 0;
  const maxIterations = 10;

  // 初期化されたクラスタで色空間を反復処理
  while (iterationCount < maxIterations && !arraysAreEqual(clusters, prevClusters)) {
    let clusterAssignments: number[] = [];
    
    // 各ピクセルを最も近いクラスタに割り当てる
    for (let i = 0; i < weightedPixels.length; i++) {
      let minDist = Infinity;
      let assignedCluster = 0;
      
      // 重み付けを行いながら最も近いクラスタを選ぶ
      for (let j = 0; j < clusters.length; j++) {
        const dist = colorDistance(weightedPixels[i].color, clusters[j].color);
        const weightedDist = dist / weightedPixels[i].weight; // 重みを考慮した距離
        if (weightedDist < minDist) {
          minDist = weightedDist;
          assignedCluster = j;
        }
      }
      clusterAssignments[i] = assignedCluster;
    }

    prevClusters = [...clusters];
    clusters = clusters.map((_, idx) => {
      const clusterPixels = weightedPixels.filter((_, i) => clusterAssignments[i] === idx);
      
      // クラスタごとに新しい色を計算（平均色を求める）
      return { color: averageColorWithWeights(clusterPixels), weight: 0 };
    });

    iterationCount++;
  }

  // 最終的にRGB配列として返す
  return clusters.map(cluster => cluster.color);
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
function arraysAreEqual(arr1: { color: RGB, weight: number }[], arr2: { color: RGB, weight: number }[]): boolean {
  return arr1.length === arr2.length && arr1.every((v, i) => v.color.every((c, j) => c === arr2[i].color[j]));
}

// 似た色が少ない場合に重みを大きくするため、色の平均を計算
function averageColorWithWeights(colors: { color: RGB, weight: number }[]): RGB {
  const total = colors.reduce(
    (acc, { color, weight }) => {
      acc[0] += color[0] * weight;
      acc[1] += color[1] * weight;
      acc[2] += color[2] * weight;
      return acc;
    },
    [0, 0, 0]
  );
  const totalWeight = colors.reduce((acc, { weight }) => acc + weight, 0);
  return [
    Math.round(total[0] / totalWeight),
    Math.round(total[1] / totalWeight),
    Math.round(total[2] / totalWeight)
  ];
}

// 画像から色パレットを生成する
const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // クロスドメイン対応
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 128; // 最大の幅・高さを128pxに制限
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

      // 似た色が少ない場合に重みを大きくする方法で色パレットを生成
      const palette = wuQuantization(pixels, numColors);

      // 必要に応じて黒・白を追加
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
