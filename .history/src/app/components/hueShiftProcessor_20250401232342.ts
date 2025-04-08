const hueShiftProcessor = (cv: any, src: any): any => {
    let dst = new cv.Mat();
    
    // RGB画像をHSVに変換
    cv.cvtColor(src, dst, cv.COLOR_RGB2HSV);
    
    // Hチャンネルを60に統一
    for (let y = 0; y < dst.rows; y++) {
      for (let x = 0; x < dst.cols; x++) {
        let pixel = dst.ucharPtr(y, x);
        pixel[0] = 60; // 色相(H)を60に固定（黄色寄りの緑）
      }
    }
    
    // HSVをRGBに戻す
    cv.cvtColor(dst, dst, cv.COLOR_HSV2RGB);
    
    return dst;
  };
  
  export default hueShiftProcessor;
  