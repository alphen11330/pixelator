// Octreeによる色のクォンタイズを使って画像から代表的な8色を抽出する関数
export const createPallet = async (imageSrc: string): Promise<number[][]> => {
  return new Promise<number[][]>((resolve) => {
    // 画像を読み込む
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      // canvas要素を作成して画像を描画
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      // 画像データを取得
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Octreeノードクラス
      class OctreeNode {
        children: (OctreeNode | null)[] = Array(8).fill(null);
        pixelCount: number = 0;
        red: number = 0;
        green: number = 0;
        blue: number = 0;
        isLeaf: boolean = false;
        index: number = 0;
        
        constructor(public level: number = 0) {}
        
        // 色の平均値を取得
        getColor(): number[] {
          if (this.pixelCount === 0) return [0, 0, 0];
          return [
            Math.round(this.red / this.pixelCount),
            Math.round(this.green / this.pixelCount),
            Math.round(this.blue / this.pixelCount)
          ];
        }
      }
      
      // Octreeクラス
      class Octree {
        root: OctreeNode = new OctreeNode();
        leafNodes: OctreeNode[] = [];
        leafCount: number = 0;
        maxLevel: number = 6;  // 深さの最大値（色の精度）
        maxColors: number = 8;  // 抽出する色の数
        
        constructor(maxColors: number = 8) {
          this.maxColors = maxColors;
        }
        
        // 色からインデックスを取得
        private getColorIndex(r: number, g: number, b: number, level: number): number {
          // 現在のレベルに対応するビット位置を取得
          const shift = 7 - level;
          // 各色のそのビット位置の値を取得 (0 or 1)
          const rBit = (r >> shift) & 1;
          const gBit = (g >> shift) & 1;
          const bBit = (b >> shift) & 1;
          // 8分割したうちのどのノードに属するかをインデックスで返す
          return (rBit << 2) | (gBit << 1) | bBit;
        }
        
        // ピクセルを追加
        addPixel(r: number, g: number, b: number): void {
          let current = this.root;
          
          // 最大レベルまで再帰的にノードを追加
          for (let level = 0; level < this.maxLevel; level++) {
            const index = this.getColorIndex(r, g, b, level);
            if (!current.children[index]) {
              current.children[index] = new OctreeNode(level + 1);
            }
            
            current = current.children[index]!;
            
            // 最後のレベルに到達したらリーフノードとして処理
            if (level === this.maxLevel - 1) {
              if (!current.isLeaf) {
                current.isLeaf = true;
                current.index = this.leafCount++;
                this.leafNodes.push(current);
              }
              current.pixelCount++;
              current.red += r;
              current.green += g;
              current.blue += b;
              
              // リーフノードが多すぎる場合は削減
              if (this.leafCount > this.maxColors) {
                this.reduceTree();
              }
            }
          }
        }
        
        // 最も重要度の低いノードを削減
        private reduceTree(): void {
          let minImportance = Number.MAX_VALUE;
          let leastImportantNode: OctreeNode | null = null;
          
          // 子ノードの葉を持つ深さ最大のノードを探す
          const findReducibleNode = (node: OctreeNode, level: number): void => {
            // すべての子ノードが葉かどうかチェック
            let allChildrenLeaves = true;
            for (let i = 0; i < 8; i++) {
              if (node.children[i] && !node.children[i]!.isLeaf) {
                allChildrenLeaves = false;
                break;
              }
            }
            
            // 全ての子が葉なら、このノードの重要度を計算
            if (allChildrenLeaves) {
              // 単純に葉ノードの数をカウント
              let leafCount = 0;
              for (let i = 0; i < 8; i++) {
                if (node.children[i] && node.children[i]!.isLeaf) {
                  leafCount++;
                }
              }
              
              const importance = leafCount * (this.maxLevel - level);
              if (importance < minImportance) {
                minImportance = importance;
                leastImportantNode = node;
              }
            } else {
              // 子ノードを再帰的に探索
              for (let i = 0; i < 8; i++) {
                if (node.children[i] && !node.children[i]!.isLeaf) {
                  findReducibleNode(node.children[i]!, level + 1);
                }
              }
            }
          };
          
          findReducibleNode(this.root, 0);
          
          // 最も重要度の低いノードの子を削減
          if (leastImportantNode) {
            // このノード自体を葉にする
            leastImportantNode.isLeaf = true;
            leastImportantNode.index = this.leafCount++;
            
            // 子ノードの情報を統合
            for (let i = 0; i < 8; i++) {
              const child = leastImportantNode.children[i];
              if (child && child.isLeaf) {
                leastImportantNode.pixelCount += child.pixelCount;
                leastImportantNode.red += child.red;
                leastImportantNode.green += child.green;
                leastImportantNode.blue += child.blue;
                
                // 葉ノードのリストから削除
                const index = this.leafNodes.findIndex(node => node === child);
                if (index !== -1) {
                  this.leafNodes.splice(index, 1);
                  this.leafCount--;
                }
              }
            }
            
            // 子ノードへの参照を削除
            leastImportantNode.children = Array(8).fill(null);
            
            // 葉ノードのリストに追加
            this.leafNodes.push(leastImportantNode);
          }
        }
        
        // パレットを取得
        getPalette(): number[][] {
          const palette: number[][] = [];
          
          for (const node of this.leafNodes) {
            palette.push(node.getColor());
          }
          
          // 最大色数まで埋める（足りない場合）
          while (palette.length < this.maxColors) {
            palette.push([0, 0, 0]);
          }
          
          return palette.slice(0, this.maxColors);
        }
      }
      
      // Octreeを使って色を抽出
      const octree = new Octree(8); // 8色を抽出
      const pixelStep = Math.max(1, Math.floor((pixels.length / 4) / 10000)); // パフォーマンス向上のためすべてのピクセルを処理しない
      
      for (let i = 0; i < pixels.length; i += 4 * pixelStep) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        octree.addPixel(r, g, b);
      }
      
      // RGB形式でパレットを取得
      const palette = octree.getPalette();
      
      // 結果を返す
      resolve(palette);
    };
    
    img.src = imageSrc;
  });
};

// 使用例:
/*
const [colorPalette, setColorPalette] = useState<string[]>([]);

useEffect(() => {
  if (imageSrc) {
    const fetchPalette = async () => {
      try {
        const rgbColors = await createPallet(imageSrc); // RGB形式で色を取得
        const stringPalette = rgbColors.map((color) => color.join(", "));
        setColorPalette(stringPalette);
      } catch (error) {
        console.error('カラーパレットの生成中にエラーが発生しました:', error);
      }
    };
    
    fetchPalette();
  }
}, [imageSrc]);
*/