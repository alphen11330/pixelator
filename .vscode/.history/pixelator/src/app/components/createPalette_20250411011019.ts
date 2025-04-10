type RGB = [number, number, number];
type HSV = [number, number, number];

// 色空間のボックス（立方体）を表す
interface ColorBox {
  colors: RGB[];
  min: RGB;
  max: RGB;
  volume: number;
}

// ランベルト・ベールの法則に基づく輝度変換
function applyLambertBeerTransform(value: number): number {
  // 指数関数的な変換を適用（暗い部分を圧縮し、明るい部分を拡張）
  return Math.pow(value / 255, 10) * 255;
}

// 逆ランベルト・ベール変換（線形→非線形）
function inverseLambertBeerTransform(value: number): number {
  // 明るい値をより多く分布させる
  return Math.pow(value / 255, 1.3) * 255;
}

// MedianCutアルゴリズムによる色空間の量子化（ランベルト・ベール法則を考慮）
function medianCutQuantization(pixels: RGB[], numColors: number): RGB[] {
  if (pixels.length <= numColors) {
    return pixels;
  }

  // 画素値をランベルト・ベール空間に変換
  const transformedPixels = pixels.map(pixel => {
    return [
      applyLambertBeerTransform(pixel[0]),
      applyLambertBeerTransform(pixel[1]),
      applyLambertBeerTransform(pixel[2])
    ] as RGB;
  });

  // ボックスを作成して初期化
  const initialBox: ColorBox = createBox(transformedPixels);
  const boxes: ColorBox[] = [initialBox];

  // 必要なボックス数になるまで分割を続ける
  while (boxes.length < numColors) {
    // 最大ボリュームのボックスを見つける
    let maxVolumeIndex = 0;
    let maxVolume = 0;

    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].volume > maxVolume) {
        maxVolume = boxes[i].volume;
        maxVolumeIndex = i;
      }
    }

    // これ以上分割できない場合は終了
    if (maxVolume === 0 || boxes[maxVolumeIndex].colors.length < 2) {
      break;
    }

    // 最大ボリュームのボックスを分割
    const boxToSplit = boxes[maxVolumeIndex];
    const [box1, box2] = splitBox(boxToSplit);

    // 分割結果で置き換え
    boxes[maxVolumeIndex] = box1;
    boxes.push(box2);
  }

  // 各ボックスの平均色を計算し、元のRGB空間に戻す
  return boxes.map(box => {
    const avg = averageColor(box.colors);
    // 変換空間から元のRGB空間に戻す
    return [
      inverseLambertBeerTransform(avg[0]),
      inverseLambertBeerTransform(avg[1]),
      inverseLambertBeerTransform(avg[2])
    ] as RGB;
  });
}

// ボックスを作成
function createBox(colors: RGB[]): ColorBox {
  const min: RGB = [255, 255, 255];
  const max: RGB = [0, 0, 0];

  // 最小値と最大値を見つける
  colors.forEach(color => {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], color[i]);
      max[i] = Math.max(max[i], color[i]);
    }
  });

  // ボリュームを計算
  const volume = (max[0] - min[0]) * (max[1] - min[1]) * (max[2] - min[2]);

  return { colors, min, max, volume };
}

// ボックスを分割（ランベルト・ベール法則に基づく急激な変化を反映）
function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  // 最長軸を見つける
  const ranges: [number, number][] = [
    [box.max[0] - box.min[0], 0],
    [box.max[1] - box.min[1], 1],
    [box.max[2] - box.min[2], 2]
  ];

  // 最長の軸でソート（降順）
  ranges.sort((a, b) => b[0] - a[0]);
  const longestAxis = ranges[0][1];

  // その軸に沿ってピクセルをソート
  const sortedColors = [...box.colors];
  sortedColors.sort((a, b) => a[longestAxis] - b[longestAxis]);

  // ランベルト・ベール法則に基づいた非線形分割点を計算
  // 暗い色が少なく、明るい色が多くなるように調整
  const splitPosition = Math.floor(sortedColors.length * 0.7); // 70%地点で分割
  const colors1 = sortedColors.slice(0, splitPosition);
  const colors2 = sortedColors.slice(splitPosition);

  // 新しいボックスを作成
  const box1 = createBox(colors1);
  const box2 = createBox(colors2);

  return [box1, box2];
}

// RGBピクセルの平均色を計算
function averageColor(colors: RGB[]): RGB {
  const len = colors.length;
  if (len === 0) {
    return [0, 0, 0]; // 空の場合は黒を返す
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
  return [
    Math.round(total[0] / len),
    Math.round(total[1] / len),
    Math.round(total[2] / len)
  ];
}

// RGB値をHSV（色相、彩度、明度）に変換
// RGB値をHLS（色相、明度、彩度）に変換
function rgbToHls(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100]; // HLS形式で返す
}

// ランベルト・ベールの法則に基づいてパレットをHSVでソートする
// 明るい色が多く、暗い色は少なくなるようにする
// ランベルト・ベール法則に基づいてパレットをHLSでソートする
// 明るい色が多く、暗い色は少なくなるようにする
function sortPaletteByLambertBeerHls(palette: RGB[]): RGB[] {
  // HLSに変換
  const hlsPalette = palette.map(([r, g, b]) => {
    return {
      rgb: [r, g, b] as RGB,
      hls: rgbToHls(r, g, b)
    };
  });

  // ランベルト・ベール法則に基づくソート
  // 明度（L）を非線形に評価して、高明度の色がより多く分布するようにする
  return hlsPalette.sort((a, b) => {
    // 明度（L）を非線形に評価（高明度の差異を強調）
    const lA = Math.pow(a.hls[2] / 100, 0.5);
    const lB = Math.pow(b.hls[2] / 100, 0.5);

    if (Math.abs(lB - lA) > 0.05) return lB - lA; // 明度が異なる場合

    // 彩度の評価（高彩度を優先）
    const sA = a.hls[1];
    const sB = b.hls[1];
    if (Math.abs(sB - sA) > 5) return sB - sA;

    // 色相によるソート（円環上を移動）
    return a.hls[0] - b.hls[0];
  }).map(item => item.rgb);
}

// 画像から色パレットを生成する
const createLambertBeerPalette = (imageSrc: string, numColors: number = 16): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      const MAX_SIZE = 128; // サンプリングサイズを制限
      let { width, height } = img;

      const aspectRatio = width / height;

      if (width > height && width > MAX_SIZE) {
        width = MAX_SIZE;
        height = Math.round(MAX_SIZE / aspectRatio);
      } else if (height > width && height > MAX_SIZE) {
        height = MAX_SIZE;
        width = Math.round(MAX_SIZE * aspectRatio);
      } else if (width > MAX_SIZE || height > MAX_SIZE) {
        const scale = MAX_SIZE / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('キャンバスコンテキストの取得に失敗しました');

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels: RGB[] = [];

      // ピクセル情報を抽出（透明度の高いピクセルのみ）
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
        return reject('有効なピクセルが見つかりませんでした');
      }

      // ランベルト・ベール法則に基づくピクセルサンプリング
      // 明るいピクセルをより多くサンプリングする
      let sampledPixels = pixels;
      if (pixels.length > 10000) {
        const sampleSize = 10000;
        sampledPixels = [];
        
        // 輝度に基づいてソート（明るい順）
        const sortedByLuminance = [...pixels].sort((a, b) => {
          const lumA = 0.299 * a[0] + 0.587 * a[1] + 0.114 * a[2];
          const lumB = 0.299 * b[0] + 0.587 * b[1] + 0.114 * b[2];
          return lumB - lumA; // 明るい順
        });
        
        // 明るいピクセルを優先的にサンプリング
        for (let i = 0; i < sampleSize; i++) {
          // 非線形インデックス計算で明るいピクセルを多く選択
          const index = Math.floor(Math.pow(i / sampleSize, 2) * sortedByLuminance.length);
          sampledPixels.push(sortedByLuminance[index]);
        }
      }

      // MedianCutアルゴリズムでパレットを生成（ランベルト・ベール法則適用済み）
      let palette = medianCutQuantization(sampledPixels, numColors);

      // 黒と白が含まれているか確認
      const hasBlack = palette.some(([r, g, b]) => r < 20 && g < 20 && b < 20);
      const hasWhite = palette.some(([r, g, b]) => r > 230 && g > 230 && b > 230);

      // 必要に応じて黒と白を追加
      if (!hasBlack && palette.length < numColors) {
        palette.push([0, 0, 0]);
      }

      if (!hasWhite && palette.length < numColors) {
        palette.push([255, 255, 255]);
      }

      // 指定色数に合わせる
      if (palette.length > numColors) {
        palette = palette.slice(0, numColors);
      }
      
      // ランベルト・ベール法則に基づいてパレットをソート
      palette = sortPaletteByLambertBeerHls(palette);

      // RGB形式の文字列に変換
      resolve(palette.map(([r, g, b]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`));
    };

    img.onerror = (e) => reject(`画像の読み込みに失敗しました: ${e}`);
  });
};

export default createLambertBeerPalette;
