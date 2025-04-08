const createPalette = (imageSrc: string, numColors: number = 8): string[] => {
  const cv = window.cv;
  
  if (!cv) {
    throw new Error('OpenCV.js is not loaded yet. Please ensure it is loaded before calling this function.');
  }

  const img = new Image();
  img.src = imageSrc;

  if (!img.complete) {
    throw new Error('Image not loaded yet. Please ensure it is loaded before calling this function.');
  }

  // 画像サイズの調整（処理速度向上のため）
  const maxDimension = 200;
  let width = img.width;
  let height = img.height;
  
  if (width > height && width > maxDimension) {
    height = Math.floor(height * (maxDimension / width));
    width = maxDimension;
  } else if (height > maxDimension) {
    width = Math.floor(width * (maxDimension / height));
    height = maxDimension;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const src = cv.matFromImageData(imageData);
  
  const rgbImg = new cv.Mat();
  cv.cvtColor(src, rgbImg, cv.COLOR_RGBA2RGB);

  const pixels = [];
  for (let y = 0; y < rgbImg.rows; y++) {
    for (let x = 0; x < rgbImg.cols; x++) {
      const pixel = rgbImg.ucharPtr(y, x);
      pixels.push([pixel[0], pixel[1], pixel[2]]);
    }
  }

  // Median Cutアルゴリズムの実装
  const medianCut = (pixels: number[][], numColors: number) => {
    let boxes = [[Math.min(...pixels.map(p => p[0])), Math.max(...pixels.map(p => p[0]))],
                 [Math.min(...pixels.map(p => p[1])), Math.max(...pixels.map(p => p[1]))],
                 [Math.min(...pixels.map(p => p[2])), Math.max(...pixels.map(p => p[2]))]];

    let regions = [pixels];

    while (regions.length < numColors) {
      let maxRangeAxis = [0, 1, 2].reduce((maxAxis, axis) => {
        return (boxes[axis][1] - boxes[axis][0]) > (boxes[maxAxis][1] - boxes[maxAxis][0]) ? axis : maxAxis;
      }, 0);

      const regionToSplit = regions.sort((a, b) => b.length - a.length)[0];

      const median = (arr: number[], axis: number) => {
        return arr.sort((a, b) => a[axis] - b[axis])[Math.floor(arr.length / 2)][axis];
      };
      
      const splitValue = median(regionToSplit, maxRangeAxis);
      const lessThanSplit = regionToSplit.filter(p => p[maxRangeAxis] <= splitValue);
      const greaterThanSplit = regionToSplit.filter(p => p[maxRangeAxis] > splitValue);

      regions = regions.filter(r => r !== regionToSplit);
      regions.push(lessThanSplit);
      regions.push(greaterThanSplit);

      boxes[maxRangeAxis] = [Math.min(...regions[regions.length - 2].map(p => p[maxRangeAxis])),
                             Math.max(...regions[regions.length - 2].map(p => p[maxRangeAxis]))];
    }

    return regions.map(region => {
      const avgColor = region.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]);
      return [
        Math.round(avgColor[0] / region.length),
        Math.round(avgColor[1] / region.length),
        Math.round(avgColor[2] / region.length),
      ];
    });
  };

  const palette = medianCut(pixels, numColors);

  // RGBを文字列形式に変換
  const colorStrings = palette.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`);

  // メモリ解放
  src.delete();
  rgbImg.delete();

  return colorStrings;
};

export default createPalette;
