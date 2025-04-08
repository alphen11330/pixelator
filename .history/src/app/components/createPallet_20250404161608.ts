// createPallet.ts
const createPallet = async (imageSrc: string): Promise<string[]> => {
  const img = new Image();
  img.src = imageSrc;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas rendering context is not available");

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  const colors: { [key: string]: number } = {};

  // RGB値を抽出してカウントする
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const color = `rgb(${r},${g},${b})`;
    colors[color] = (colors[color] || 0) + 1;
  }

  // 最も頻度の高い8色を選出
  const sortedColors = Object.entries(colors)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 8)
    .map(([color]) => color);

  return sortedColors;
};

export default createPallet;
