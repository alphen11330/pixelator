/**
 * 減色処理を行うためのユーティリティ関数
 */

/**
 * 画像の色数を減らす処理
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 各チャンネルの色のレベル数（デフォルト：4）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv: any, src: any, levels: number = 4): any => {
    let dst = new cv.Mat();
    
    // 量子化レベルの計算（0から255をlevels段階に分ける）
    const divideBy = 255 / (levels - 1);
    
    if (src.channels() === 4) {
      // RGBA画像ならアルファチャンネルを保持しつつRGBを減色
      const rgbaChannels = new cv.MatVector();
      cv.split(src, rgbaChannels);
      
      const r = rgbaChannels.get(0);
      const g = rgbaChannels.get(1);
      const b = rgbaChannels.get(2);
      const a = rgbaChannels.get(3); // アルファチャンネル
      
      // 各チャンネルに減色処理を適用
      let reducedR = new cv.Mat();
      let reducedG = new cv.Mat();
      let reducedB = new cv.Mat();
      
      // 量子化処理を実行
      // スカラーを使うときは new cv.Scalar([値]) ではなく、単に new cv.Scalar([値])
      cv.convertScaleAbs(r, reducedR, 1/divideBy, 0);
      cv.convertScaleAbs(reducedR, reducedR, divideBy, 0);
      
      cv.convertScaleAbs(g, reducedG, 1/divideBy, 0);
      cv.convertScaleAbs(reducedG, reducedG, divideBy, 0);
      
      cv.convertScaleAbs(b, reducedB, 1/divideBy, 0);
      cv.convertScaleAbs(reducedB, reducedB, divideBy, 0);
      
      // 4チャンネルに戻す
      const mergedChannels = new cv.MatVector();
      mergedChannels.push_back(reducedR);
      mergedChannels.push_back(reducedG);
      mergedChannels.push_back(reducedB);
      mergedChannels.push_back(a); // アルファチャンネルを戻す
      
      cv.merge(mergedChannels, dst);
      
      // メモリ解放
      r.delete();
      g.delete();
      b.delete();
      a.delete();
      reducedR.delete();
      reducedG.delete();
      reducedB.delete();
      rgbaChannels.delete();
      mergedChannels.delete();
    } else {
      // RGB画像の場合
      const rgbChannels = new cv.MatVector();
      cv.split(src, rgbChannels);
      
      const r = rgbChannels.get(0);
      const g = rgbChannels.get(1);
      const b = rgbChannels.get(2);
      
      // 各チャンネルに減色処理を適用
      let reducedR = new cv.Mat();
      let reducedG = new cv.Mat();
      let reducedB = new cv.Mat();
      
      // convertScaleAbsを使用して量子化する（より安全な方法）
      cv.convertScaleAbs(r, reducedR, 1/divideBy, 0);
      cv.floor(reducedR, reducedR);
      cv.convertScaleAbs(reducedR, reducedR, divideBy, 0);
      
      cv.convertScaleAbs(g, reducedG, 1/divideBy, 0);
      cv.floor(reducedG, reducedG);
      cv.convertScaleAbs(reducedG, reducedG, divideBy, 0);
      
      cv.convertScaleAbs(b, reducedB, 1/divideBy, 0);
      cv.floor(reducedB, reducedB);
      cv.convertScaleAbs(reducedB, reducedB, divideBy, 0);
      
      // 3チャンネルに戻す
      const mergedChannels = new cv.MatVector();
      mergedChannels.push_back(reducedR);
      mergedChannels.push_back(reducedG);
      mergedChannels.push_back(reducedB);
      
      cv.merge(mergedChannels, dst);
      
      // メモリ解放
      r.delete();
      g.delete();
      b.delete();
      reducedR.delete();
      reducedG.delete();
      reducedB.delete();
      rgbChannels.delete();
      mergedChannels.delete();
    }
    
    return dst;
  };
  
  export default colorReductionProcessor;