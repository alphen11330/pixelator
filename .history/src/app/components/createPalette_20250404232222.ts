function wuQuantize(pixels: number[], numColors: number): number[] {
  const colorSpace = pixels.map(pixel => {
    const r = pixel >> 16 & 0xFF;
    const g = pixel >> 8 & 0xFF;
    const b = pixel & 0xFF;
    return { r, g, b };
  });

  const calculateColorDistance = (color1: {r: number, g: number, b: number}, color2: {r: number, g: number, b: number}): number => {
    return Math.sqrt(
      (color1.r - color2.r) ** 2 +
      (color1.g - color2.g) ** 2 +
      (color1.b - color2.b) ** 2
    );
  };

  let clusters = [];
  
  // 初期化：最初にランダムに色を選んでクラスタの中心にする
  for (let i = 0; i < numColors; i++) {
    const randomIndex = Math.floor(Math.random() * colorSpace.length);
    clusters.push({
      r: colorSpace[randomIndex].r,
      g: colorSpace[randomIndex].g,
      b: colorSpace[randomIndex].b
    });
  }

  // 繰り返しクラスタリングを行う
  for (let iteration = 0; iteration < 10; iteration++) {
    let clusterAssignments = new Array(colorSpace.length).fill(-1);

    // 各ピクセルを最も近いクラスタに割り当て
    for (let i = 0; i < colorSpace.length; i++) {
      const pixel = colorSpace[i];
      let closestClusterIdx = -1;
      let minDistance = Infinity;

      // 最も近いクラスタを見つける
      for (let j = 0; j < clusters.length; j++) {
        const distance = calculateColorDistance(pixel, clusters[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestClusterIdx = j;
        }
      }
      clusterAssignments[i] = closestClusterIdx;
    }

    // クラスタごとに新しい中心を計算
    clusters = clusters.map((_, clusterIdx) => {
      let totalR = 0, totalG = 0, totalB = 0, count = 0;
      for (let i = 0; i < colorSpace.length; i++) {
        if (clusterAssignments[i] === clusterIdx) {
          totalR += colorSpace[i].r;
          totalG += colorSpace[i].g;
          totalB += colorSpace[i].b;
          count++;
        }
      }
      return count > 0 ? {
        r: Math.round(totalR / count),
        g: Math.round(totalG / count),
        b: Math.round(totalB / count)
      } : clusters[clusterIdx]; // countが0の場合は元の中心を維持
    });
  }

  // 最終的なクラスタの中心（代表色）をRGB形式に変換して返す
  return clusters.map(cluster => (cluster.r << 16) | (cluster.g << 8) | cluster.b);
}

// メイン関数: 画像からパレットを生成
const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject("Failed to get canvas context");

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixelData = Array.from(imageData.data);

      // RGB配列を生成（ピクセルごとのRGB値を取り出す）
      const pixels = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        const r = pixelData[i];
        const g = pixelData[i + 1];
        const b = pixelData[i + 2];
        const rgba = (r << 16) | (g << 8) | b;
        pixels.push(rgba);
      }

      // Wu Quantizationアルゴリズムを使用して色のパレットを生成
      const palette = wuQuantize(pixels, numColors);

      // 結果をRGB形式で返す
      const rgbPalette = palette.map(color => {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        return `rgb(${r}, ${g}, ${b})`;
      });

      resolve(rgbPalette);
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
};

export default createPalette;
