type RGB = [number, number, number];

// Wu Quantizationによる色空間の量子化
function wuQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels; // ピクセルが十分でない場合はそのまま返す
  }

  // 初期クラスタの設定
  let clusters: RGB[] = pixels.slice(0, numColors);

  // クラスタリングの繰り返し
  let prevClusters: RGB[] = [];
  let iterationCount = 0;
  const maxIterations = 10;

  while (iterationCount < maxIterations && !arraysAreEqual(clusters, prevClusters)) {
    let clusterAssignments: number[] = [];

    // 各ピクセルを最寄りのクラスタに割り当て
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

    // 各クラスタの平均色を再計算
    clusters = clusters.map((_, idx) => {
      const clusterPixels = pixels.filter((_, i) => clusterAssignments[i] === idx);
      
      // クラスタにピクセルが含まれていない場合は、他のクラスタの色を引き継ぐ
      if (clusterPixels.length === 0) {
        return clusters[idx > 0 ? idx - 1 : idx + 1]; // 空のクラスタには隣接クラスタの色を使う
      }

      // 平均色を計算
      return averageColor(clusterPixels);
    });

    iterationCount++;
  }

  return clusters;
}

// RGBピクセルの平均色を計算
function averageColor(colors: RGB[]): RGB {
  if (colors.length === 0) {
    // 空のリストに対してデフォルト値を返す
    return [0, 0, 0];
  }

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

// RGB色を色相、彩度、明度に変換
function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (delta !== 0) {
    s = (max - min) / (1 - Math.abs(2 * l - 1));
    if (max === rNorm) {
      h = (gNorm - bNorm) / delta;
    } else if (max === gNorm) {
      h = (bNorm - rNorm) / delta + 2;
    } else {
      h = (rNorm - gNorm) / delta + 4;
    }
    h = (h / 6) % 1;
    if (h < 0) h += 1;
  }

  return [h * 360, s, l];
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

      // Wu Quantizationによる色のクラスタリング
      let palette = wuQuantization(pixels, 256);

      // 黒と白を含める処理（必要に応じて）
      const hasBlack = palette.some(([r, g, b]) => r < 30 && g < 30 && b < 30);
      const hasWhite = palette.some(([r, g, b]) => r > 220 && g > 220 && b > 220);

      if (!hasBlack && palette.length < numColors) {
        palette.push([0, 0, 0]); // 黒を追加
      }

      if (!hasWhite && palette.length < numColors) {
        palette.push([255, 255, 255]); // 白を追加
      }

      // 254色からnumColors-2色を選出
      const colorGroups: RGB[][] = Array(12).fill([]).map(() => []);
      
      palette.forEach(([r, g, b]) => {
        const [h, s, l] = rgbToHsl([r, g, b]);
        const groupIndex = Math.floor(h / 30);
        if (!hasBlack || !hasWhite || !isBlackOrWhite([r, g, b])) {
          colorGroups[groupIndex].push([r, g, b]);
        }
      });

      // 各グループから代表色を選ぶ
      const selectedColors: RGB[] = [];
      colorGroups.forEach(group => {
        if (group.length > 0) {
          selectedColors.push(averageColor(group)); // 代表色として平均色を選択
        }
      });

      // パレットの最終選定
      selectedColors.splice(0, 0, ...palette.filter(([r, g, b]) => isBlackOrWhite([r, g, b])));
      
      // 最終的なパレットの色をRGB文字列に変換
      resolve(selectedColors.slice(0, numColors).map(([r, g, b]) => `rgb(${r}, ${g}, ${b})`));
    };

    img.onerror = (e) => reject(`Failed to load image: ${e}`);
  });
};

// 黒や白に近い色を判定
function isBlackOrWhite([r, g, b]: RGB): boolean {
  return (r < 30 && g < 30 && b < 30) || (r > 220 && g > 220 && b > 220);
}

export default createPalette;
