// 色空間の量子化（Wu Quantization）を手動で実装する
// RGBピクセル配列を元にパレットを生成する関数

type RGB = [number, number, number];

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

  // 各ピクセルを最も近いクラスタに割り当てるための頻度カウントを追加
  let pixelCounts: number[] = new Array(pixels.length).fill(0);

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
      pixelCounts[assignedCluster]++;
    }

    // 各クラスタの新しい代表色を計算
    prevClusters = [...clusters];
    clusters = clusters.map((_, idx) => {
      const clusterPixels = pixels.filter((_, i) => clusterAssignments[i] === idx);
      return averageColor(clusterPixels);
    });

    iterationCount++;
  }

  // 頻度の低い色を追加するために、ピクセル数が少ないクラスタを補う
  const totalClusters = clusters.length;

  // もし、十分な色が生成されていない場合は、頻度の低いクラスタを手動で追加
  if (totalClusters < numColors) {
    const remainingColors = pixels
      .filter((_, idx) => pixelCounts[idx] === 0) // 出現頻度が0のもの（使われていない色）
      .slice(0, numColors - totalClusters); // 残りの色数を補う
    clusters.push(...remainingColors);
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
