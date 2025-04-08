// Wu Quantizationを使用して色をクラスタリングする関数
function wuQuantize(pixels: number[], numColors: number): number[] {
  // 色をRGBの3次元座標空間に変換
  const colorSpace = pixels.map(pixel => {
    const r = pixel >> 16 & 0xFF;
    const g = pixel >> 8 & 0xFF;
    const b = pixel & 0xFF;
    return { r, g, b };
  });

  // クラスタリングのための関数（簡易版）
  function calculateColorDistance(color1: {r: number, g: number, b: number}, color2: {r: number, g: number, b: number}): number {
    return Math.sqrt(
      (color1.r - color2.r) ** 2 +
      (color1.g - color2.g) ** 2 +
      (color1.b - color2.b) ** 2
    );
  }

  // 初期色として最も頻繁に出現する色を選択
  let clusters = [];
  let minDistance = Infinity;
  let clusterCenter = null;

  // 一定の回数だけクラスタリングを繰り返す
  for (let iteration = 0; iteration < 10; iteration++) {
    clusters = [];

    // すべての色をクラスタに割り当て
    colorSpace.forEach(pixel => {
      // 最も近いクラスタを見つける
      let closestCluster = null;
      let closestDistance = Infinity;

      clusters.forEach((cluster, idx) => {
        const distance = calculateColorDistance(pixel, cluster);
        if (distance < closestDistance) {
          closestCluster = idx;
          closestDistance = distance;
        }
      });

      // 近いクラスタがなければ新しいクラスタを作成
      if (closestDistance > 5) {
        clusters.push({ r: pixel.r, g: pixel.g, b: pixel.b });
      } else {
        const cluster = clusters[closestCluster];
        cluster.r = (cluster.r + pixel.r) / 2;
        cluster.g = (cluster.g + pixel.g) / 2;
        cluster.b = (cluster.b + pixel.b) / 2;
      }
    });

    // 上位のnumColors色を選出
    clusters = clusters.sort((a, b) => {
      return calculateColorDistance(a, clusterCenter) - calculateColorDistance(b, clusterCenter);
    }).slice(0, numColors);
  }

  // 色をRGB形式に戻す
  return clusters.map(cluster => (cluster.r << 16) | (cluster.g << 8) | cluster.b);
}

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
