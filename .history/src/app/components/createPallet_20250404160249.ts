import { useState, useEffect } from 'react';

const [colorPalette, setColorPalette] = useState<string[]>([]);

// カラーパレットを作成する関数
function createPallet(imageSrc: string): string[] {
  const img = new Image();
  const colorPalette: string[] = [];

  img.src = imageSrc;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    // 画像をキャンバスに描画
    ctx?.drawImage(img, 0, 0, img.width, img.height);

    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    if (!imageData) return;

    const pixels = imageData.data;
    const colorCounts: { [key: string]: number } = {};

    // ピクセルデータをループして色の頻度を計算
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const rgb = `rgb(${r},${g},${b})`;

      colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
    }

    // 頻度が高い色を取り出してパレットに追加（8色まで）
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8) // 8色に制限
      .map(entry => entry[0]);

    colorPalette.push(...sortedColors);
  };

  // 画像の読み込みが非同期なので、最終的に色のパレットを返す
  return colorPalette;
}

