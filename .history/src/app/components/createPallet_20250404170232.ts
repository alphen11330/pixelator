// RGB to HSB (HSV) conversion
const rgbToHsb = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let v = max;

  let delta = max - min;
  if (max !== 0) {
    s = delta / max;
  }
  if (max !== min) {
    if (max === r) {
      h = (g - b) / delta;
    } else if (max === g) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, v };
};

// RGB色間の距離を計算する関数
const colorDistance = (color1: { r: number, g: number, b: number }, color2: { r: number, g: number, b: number }): number => {
  // 知覚的な色差の計算（ユークリッド距離に重み付け）
  const rMean = (color1.r + color2.r) / 2;
  const r = color1.r - color2.r;
  const g = color1.g - color2.g;
  const b = color1.b - color2.b;
  
  // 人間の目は緑色に対して最も敏感で、青色に対して最も鈍感
  // 赤色の感度は中間
  return Math.sqrt((2 + rMean/256) * r*r + 4 * g*g + (2 + (255-rMean)/256) * b*b);
};

const createPalette = (imageSrc: string, numColors: number = 8): string[] => {
  const img = new Image();
  img.src = imageSrc;

  if (!img.complete) {
    throw new Error('Image not loaded yet.');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // 処理速度向上のため、画像を縮小
  const maxDimension = 150;
  let width = img.width;
  let height = img.height;
  
  if (width > height && width > maxDimension) {
    height = Math.floor(height * (maxDimension / width));
    width = maxDimension;
  } else if (height > maxDimension) {
    width = Math.floor(width * (maxDimension / height));
    height = maxDimension;
  }
  
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // 色情報を格納する配列
  const colors: { r: number; g: number; b: number; count: number; hsv: { h: number; s: number; v: number } }[] = [];
  
  // 量子化して近似する色の数を減らす（処理速度の向上）
  const quantizationLevel = 8; // 色の精度レベル
  
  // ピクセルデータから色を集計
  for (let i = 0; i < pixels.length; i += 4) {
    // 透明度が低いピクセルはスキップ
    if (pixels[i + 3] < 128) continue;
    
    // 量子化（近似色に変換）
    const r = Math.floor(pixels[i] / quantizationLevel) * quantizationLevel;
    const g = Math.floor(pixels[i + 1] / quantizationLevel) * quantizationLevel;
    const b = Math.floor(pixels[i + 2] / quantizationLevel) * quantizationLevel;
    
    // 色キーを生成
    const colorKey = `${r},${g},${b}`;
    
    // 既存の色かどうかチェック
    let existingColor = colors.find(c => c.r === r && c.g === g && c.b === b);
    
    if (existingColor) {
      existingColor.count++;
    } else {
      const hsv = rgbToHsb(r, g, b);
      colors.push({ r, g, b, count: 1, hsv });
    }
  }
  
  // 出現頻度が少ない色を削除（ノイズ除去）
  const totalPixels = (width * height);
  const minThreshold = totalPixels * 0.001; // 全体の0.1%未満の色は除外
  
  let filteredColors = colors.filter(color => color.count >= minThreshold);
  
  // 出現頻度でソートして上位の色を取得
  filteredColors.sort((a, b) => b.count - a.count);
  
  // 出現頻度の高い色を基準として保存
  const dominantColors = filteredColors.slice(0, Math.min(5, filteredColors.length));
  
  // 特徴的な色を抽出する
  const significantColors: typeof colors = [...dominantColors];
  
  // 彩度と明度の条件を満たす色を探す
  const saturatedColors = filteredColors.filter(color => 
    color.hsv.s > 0.4 && color.hsv.v > 0.3 && color.hsv.v < 0.9
  );
  
  // 既に選択された色と十分に異なる色を追加
  for (const color of saturatedColors) {
    // 既存の色と十分に異なる色かチェック
    let isDistinct = true;
    for (const selectedColor of significantColors) {
      const distance = colorDistance(
        { r: color.r, g: color.g, b: color.b }, 
        { r: selectedColor.r, g: selectedColor.g, b: selectedColor.b }
      );
      
      // 色の距離が閾値以下なら似ている色とみなす
      if (distance < 60) {
        isDistinct = false;
        break;
      }
    }
    
    // 十分に異なる色であれば追加
    if (isDistinct) {
      significantColors.push(color);
      
      // 指定した色数に達したら終了
      if (significantColors.length >= numColors) {
        break;
      }
    }
  }
  
  // 最終的な色の配列を作成
  const result = significantColors.map(color => `rgb(${color.r},${color.g},${color.b})`);
  
  // 色相順にソート
  result.sort((a, b) => {
    const colorA = a.match(/rgb\((\d+),(\d+),(\d+)\)/)!;
    const colorB = b.match(/rgb\((\d+),(\d+),(\d+)\)/)!;
    
    const hsvA = rgbToHsb(parseInt(colorA[1]), parseInt(colorA[2]), parseInt(colorA[3]));
    const hsvB = rgbToHsb(parseInt(colorB[1]), parseInt(colorB[2]), parseInt(colorB[3]));
    
    return hsvA.h - hsvB.h;
  });
  
  return result;
};

export default createPalette;