// createPallet.ts
const createPallet = (imageSrc: string): string[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  let colors: string[] = [];

  image.src = imageSrc;

  // 画像が読み込まれる前に処理を始めないようにする
  image.onload = () => {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx?.drawImage(image, 0, 0);

    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
    if (!imageData) return;

    const colorCount: { [key: string]: number } = {};

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      const rgb = `rgb(${r},${g},${b})`;
      colorCount[rgb] = (colorCount[rgb] || 0) + 1;
    }

    // 頻度順にソートし、上位8つを選出
    colors = Object.entries(colorCount)
      .sort((a, b) => b[1] - a[1]) // 頻度で降順にソート
      .slice(0, 8) // 上位8色を取得
      .map(([color]) => color); // RGB文字列のみを取得
  };

  // 同期的に取得するために返す
  // ただし、この実装は画像のロードが非同期のため、返される色パレットはロード後に取得される
  return colors;
};

export default createPallet;
