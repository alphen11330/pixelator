import chroma from 'chroma-js';

const createPalette = (imageSrc, numColors = 8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      // 画像をキャンバスに描画
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // 画像データを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = [];
      
      // ピクセルデータをRGB形式で取得
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        pixels.push([r, g, b]);
      }

      // Chroma.jsを使って、k-meansによるクラスタリングを行う
      const colorScale = chroma.scale(pixels)
        .mode('rgb') // RGBモードで色をスケール
        .colors(numColors); // 色の数を指定

      // 結果を返す
      resolve(colorScale);
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
};

// 使用例
createPalette('path_to_your_image.jpg', 8).then((palette) => {
  console.log(palette); // 代表的な8色を表示
}).catch((error) => {
  console.error(error);
});
