const createPalette = (imageSrc: string, numColors: number = 8): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // OpenCVのグローバルオブジェクトを取得
    const cv = window.cv;

    if (!cv) {
      return reject('OpenCV.js is not loaded yet. Please ensure it is loaded before calling this function.');
    }

    // 画像の読み込み
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
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

      // キャンバスの作成と画像の描画
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject("Failed to get canvas context");
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // キャンバスから画像データを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // OpenCVのMatに変換
      const src = cv.matFromImageData(imageData);
      
      // RGB形式に変換（OpenCVはデフォルトでBGR形式を使用するため）
      const rgbImg = new cv.Mat();
      cv.cvtColor(src, rgbImg, cv.COLOR_RGBA2RGB);
      
      // 画像を1次元の配列に変換（Octree用）
      const pixelCount = rgbImg.rows * rgbImg.cols;
      const samples: number[] = [];

      // ピクセルデータをサンプルに変換
      for (let y = 0; y < rgbImg.rows; y++) {
        for (let x = 0; x < rgbImg.cols; x++) {
          const pixel = rgbImg.ucharPtr(y, x);
          samples.push(pixel[0]);
          samples.push(pixel[1]);
          samples.push(pixel[2]);
        }
      }

      // Octree量子化のインスタンス作成
      const octree = new Octree(samples, numColors);

      // カラーパレットを生成
      const palette = octree.generatePalette();

      // メモリ解放
      src.delete();
      rgbImg.delete();

      // 最終的なカラーパレットを生成
      const selectedColors = palette.map(color => {
        // RGB値を文字列形式に変換
        return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
      });

      resolve(selectedColors);
    };

    img.onerror = (error) => {
      reject(`Failed to load image: ${error}`);
    };
  });
};

// Octree量子化のクラス
class Octree {
  private tree: any;
  private numColors: number;

  constructor(samples: number[], numColors: number) {
    this.numColors = numColors;
    this.tree = this.buildTree(samples);
  }

  // Octreeツリーの構築
  private buildTree(samples: number[]): any {
    // サンプルデータを使用してOctreeを構築
    const root = new OctreeNode();
    for (let i = 0; i < samples.length; i += 3) {
      root.insert(samples[i], samples[i+1], samples[i+2]);
    }
    return root;
  }

  // パレットを生成
  generatePalette(): number[][] {
    const colors: number[][] = [];
    this.tree.getColors(colors, this.numColors);
    return colors;
  }
}

// Octreeノードクラス
class OctreeNode {
  private children: OctreeNode[] = [];
  private colors: number[] = [];

  // サンプルを挿入
  insert(r: number, g: number, b: number): void {
    // 色を挿入するロジック
    // 色を8分割して子ノードに挿入
  }

  // 色を取り出す
  getColors(colors: number[][], numColors: number): void {
    // 代表的な色を選んで返すロジック
  }
}

export default createPalette;
