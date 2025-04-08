export const createPallet = async (imageSrc: string): Promise<number[][]> => {
  return new Promise<number[][]>((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      class OctreeNode {
        children: (OctreeNode | null)[] = [];
        pixelCount = 0;
        red = 0;
        green = 0;
        blue = 0;
        isLeaf = false;
        index = 0;

        constructor(public level: number = 0) {
          this.children = Array(8).fill(null);
        }

        getColor(): number[] {
          if (this.pixelCount === 0) return [0, 0, 0];
          return [
            Math.round(this.red / this.pixelCount),
            Math.round(this.green / this.pixelCount),
            Math.round(this.blue / this.pixelCount)
          ];
        }
      }

      class Octree {
        root = new OctreeNode();
        leafNodes: OctreeNode[] = [];
        leafCount = 0;
        maxLevel = 6;
        maxColors = 8;

        constructor(maxColors: number = 8) {
          this.maxColors = maxColors;
        }

        private getColorIndex(r: number, g: number, b: number, level: number): number {
          const shift = 7 - level;
          return ((r >> shift) & 1) << 2 | ((g >> shift) & 1) << 1 | ((b >> shift) & 1);
        }

        addPixel(r: number, g: number, b: number): void {
          let current = this.root;

          for (let level = 0; level < this.maxLevel; level++) {
            const index = this.getColorIndex(r, g, b, level);
            if (!current.children[index]) {
              current.children[index] = new OctreeNode(level + 1);
            }

            current = current.children[index]!;
            current.pixelCount++;
            current.red += r;
            current.green += g;
            current.blue += b;

            if (level === this.maxLevel - 1) {
              if (!current.isLeaf) {
                current.isLeaf = true;
                current.index = this.leafCount++;
                this.leafNodes.push(current);
              }

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
            let leafChildren = node.children.filter(child => child?.isLeaf) as OctreeNode[];
            if (leafChildren.length > 0) {
              const importance = leafChildren.length * (this.maxLevel - level);
              if (importance < minImportance) {
                minImportance = importance;
                leastImportantNode = node;
              }
            }

            node.children.forEach(child => {
              if (child && !child.isLeaf) {
                findReducibleNode(child, level + 1);
              }
            });
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
            leastImportantNode.children = Array(8).fill(null);
            this.leafNodes.push(leastImportantNode);
          }
        }

        getPalette(): number[][] {
          return this.leafNodes
            .sort((a, b) => b.pixelCount - a.pixelCount)
            .slice(0, this.maxColors)
            .map(node => node.getColor());
        }
      }

      const octree = new Octree(8);
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== 0) { // アルファ値が0（透明）でないピクセルのみ処理
          octree.addPixel(pixels[i], pixels[i + 1], pixels[i + 2]);
        }
      }

      resolve(octree.getPalette());
    };

    img.src = imageSrc;
  });
};
