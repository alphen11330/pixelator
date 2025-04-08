// createPallet.ts
const createPallet = (imageSrc: string): string[] => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  let colors: string[] = [];

  // 同期的に画像読み込みが完了するように処理を変更
  image.src = imageSrc;

  // 画像読み込みが完了する前に処理を開始しない
  const loadImage = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();  // 画像の読み込みが完了した時にresolve
    image.onerror = (e) => reject(e); // エラー処理
  });

  // 読み込みが完了するまで待機
  loadImage.then(() => {
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
  }).catch((e) => {
    console.error("Image loading error:", e);
  });

  // 画像がロードされてから色を返すようにする
  return colors;
};

export default createPallet;
