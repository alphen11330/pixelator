// components/createPallet.ts
const createPallet = (imageSrc: string): string[] => {
  // 画像の読み込み
  const img = new Image();
  img.src = imageSrc;

  // 画像の読み込み完了を待つ
  if (!img.complete) {
    // 画像が読み込まれていない場合は強制的に終了
    throw new Error('Image not loaded yet.');
  }

  // Canvasを作成して、画像のピクセルデータを取得
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // ピクセルデータを取得
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const colorCount: { [key: string]: number } = {};

  // ピクセルデータから色を集計
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // 色をRGB形式で文字列に
    const color = `rgb(${r},${g},${b})`;

    // 色の出現回数をカウント
    colorCount[color] = (colorCount[color] || 0) + 1;
  }

  // 色の出現頻度でソートし、最も頻出する8色を選択
  const sortedColors = Object.entries(colorCount)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 8)
    .map(([color]) => color);

  return sortedColors;
};

export default createPallet;
