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
        children: (OctreeNode | null)[];
        pixelCount: number = 0;
        red: number = 0;
        green: number = 0;
        blue: number = 0;
        isLeaf: boolean = false;
        index: number = 0;
        
        constructor(public level: number = 0) {
          this.children = Array.from({ length: 8 }, () => null);
        }
        
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
        maxLevel: number = 6;
        maxColors: number = 8;
        
        constructor(maxColors: number = 8) {
          this.maxColors = maxColors;
        }
        
        private getColorIndex(r: number, g: number, b: number, level: number): number {
          const shift = 7 - level;
          const rBit = (r >> shift) & 1;
          const gBit = (g >> shift) & 1;
          const bBit = (b >> shift) & 1;
          return (rBit << 2) | (gBit << 1) | bBit;
        }
        
        addPixel(r: number, g: number, b: number): void {
          let current = this.root;
          
          for (let level = 0; level < this.maxLevel; level++) {
            const index = this.getColorIndex(r, g, b, level);
            if (!current.children[index]) {
              current.children[index] = new OctreeNode(level + 1);
            }
            
            current = current.children[index]!;
            
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
              
              if (this.leafCount > this.maxColors) {
                this.reduceTree();
              }
            }
          }
        }
        
        private reduceTree(): void {
          let minImportance = Number.MAX_VALUE;
          let leastImportantNode: OctreeNode | null = null;
          
          const findReducibleNode = (node: OctreeNode, level: number): void => {
            let allChildrenLeaves = true;
            for (let i = 0; i < 8; i++) {
              if (node.children[i] && !node.children[i]!.isLeaf) {
                allChildrenLeaves = false;
                break;
              }
            }
            
            if (allChildrenLeaves) {
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
              for (let i = 0; i < 8; i++) {
                if (node.children[i] && !node.children[i]!.isLeaf) {
                  findReducibleNode(node.children[i]!, level + 1);
                }
              }
            }
          };
          
          findReducibleNode(this.root, 0);
          
          if (leastImportantNode) {
            leastImportantNode.isLeaf = true;
            leastImportantNode.index = this.leafCount++;
            
            for (let i = 0; i < 8; i++) {
              const child = leastImportantNode.children[i];
              if (child && child.isLeaf) {
                leastImportantNode.pixelCount += child.pixelCount;
                leastImportantNode.red += child.red;
                leastImportantNode.green += child.green;
                leastImportantNode.blue += child.blue;
                
                const index = this.leafNodes.indexOf(child);
                if (index !== -1) {
                  this.leafNodes.splice(index, 1);
                  this.leafCount--;
                }
              }
            }
            leastImportantNode.children = Array.from({ length: 8 }, () => null);
            this.leafNodes.push(leastImportantNode);
          }
        }
        
        getPalette(): number[][] {
          return this.leafNodes.map(node => node.getColor()).slice(0, this.maxColors);
        }
      }
      
      const octree = new Octree(8);
      for (let i = 0; i < pixels.length; i += 4) {
        octree.addPixel(pixels[i], pixels[i + 1], pixels[i + 2]);
      }
      
      resolve(octree.getPalette());
    };
    
    img.src = imageSrc;
  });
};
