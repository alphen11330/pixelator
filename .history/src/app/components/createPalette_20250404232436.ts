// 色空間での距離を計算（HSV空間での距離）
function hsvDistance(color1: { h: number, s: number, v: number }, color2: { h: number, s: number, v: number }): number {
  const hDiff = Math.min(Math.abs(color1.h - color2.h), 1 - Math.abs(color1.h - color2.h)) * 2; // 色相は循環するため
  const sDiff = Math.abs(color1.s - color2.s);
  const vDiff = Math.abs(color1.v - color2.v);

  return (hDiff * 0.5 + sDiff * 0.25 + vDiff * 0.25); // 色相を重視
}

// RGBをHSVに変換する関数
function rgbToHsv(r: number, g: number, b: number): { h: number, s: number, v: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const v = max;
  const s = max === 0 ? 0 : delta / max;

  let h = 0;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
      case g: h = (b - r) / delta + 2; break;
      case b: h = (r - g) / delta + 4; break;
    }
    h /= 6;
  }

  return { h, s, v };
}

// Wu Quantization法で色のパレットを作成
function wuQuantize(pixels: number[], numColors: number): number[] {
  const colorSpace = pixels.map(pixel => {
    const r = pixel >> 16 & 0xFF;
    const g = pixel >> 8 & 0xFF;
    const b = pixel & 0xFF;
    const hsv = rgbToHsv(r, g, b);
    return { r, g, b, hsv };
  });

  // 初期クラスタの選定
  let clusters = [];
  for (let i = 0; i < numColors; i++) {
    const randomIndex = Math.floor(Math.random() * colorSpace.length);
    clusters.push({ ...colorSpace[randomIndex].hsv });
  }

  // クラスタリング
  for (let iteration = 0; iteration < 10; iteration++) {
    let clusterAssignments = new Array(colorSpace.length).fill(-1);

    // ピクセルを最も近いクラスタに割り当て
    for (let i = 0; i < colorSpace.length; i++) {
      const pixel = colorSpace[i];
      let closestClusterIdx = -1;
      let minDistance = Infinity;

      // 最も近いクラスタを見つける
      for (let j = 0; j < clusters.length; j++) {
        const distance = hsvDistance(pixel.hsv, clusters[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestClusterIdx = j;
        }
      }
      clusterAssignments[i] = closestClusterIdx;
    }

    // 各クラスタの新しい中心を計算
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
        b: Math.round(totalB / count),
        hsv: rgbToHsv(totalR / count, totalG / count, totalB / count)
      } : clusters[clusterIdx];
    });
  }

  // 色の多様性を確保するため、似ている色を排除
  const resultColors = [];
  for (let i = 0; i < clusters.length; i++) {
    let isDistinct = true;
    for (let j = 0; j < resultColors.length; j++) {
      if (hsvDistance(clusters[i].hsv, resultColors[j].hsv) < 0.1) {
        isDistinct = false;
        break;
      }
    }
    if (isDistinct) {
      resultColors.push(clusters[i]);
    }
    if (resultColors.length >= numColors) break;
  }

  // 最終的に選ばれた色をRGB形式で返す
  return resultColors.map(cluster => `rgb(${cluster.r}, ${cluster.g}, ${cluster.b})`);
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

      resolve(palette);
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
};

export default createPalette;
