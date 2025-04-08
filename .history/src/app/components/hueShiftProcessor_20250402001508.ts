const colorCollectionProcessor = (cv: any, src: any): any => {
    let hsv = new cv.Mat();
    let rgba = new cv.Mat();
    let alpha = new cv.Mat();
    
    // RGBA画像をHSVに変換（アルファチャンネルを分離）
    if (src.channels() === 4) {
        let channels = new cv.MatVector();
        cv.split(src, channels);
        let bgr = new cv.Mat();
        let merged = new cv.MatVector();
        
        // BGR部分のみHSVに変換
        merged.push_back(channels.get(0));
        merged.push_back(channels.get(1));
        merged.push_back(channels.get(2));
        cv.merge(merged, bgr);
        cv.cvtColor(bgr, hsv, cv.COLOR_RGB2HSV);
        
        // アルファチャンネルを保持
        alpha = channels.get(3);
        
        // メモリ解放
        bgr.delete();
        channels.delete();
        merged.delete();
    } else {
        cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV);
    }
    
    // Hチャンネルを60に統一
    for (let y = 0; y < hsv.rows; y++) {
        for (let x = 0; x < hsv.cols; x++) {
            let pixel = hsv.ucharPtr(y, x);
            pixel[0] = 60; // 色相(H)を60に固定（黄色寄りの緑）
        }
    }
    
    // HSVをRGBに戻す
    let dst = new cv.Mat();
    cv.cvtColor(hsv, dst, cv.COLOR_HSV2RGB);
    
    // アルファチャンネルを統合
    if (src.channels() === 4) {
        let channels = new cv.MatVector();
        let output = new cv.Mat();
        cv.split(dst, channels);
        channels.push_back(alpha);
        cv.merge(channels, output);
        dst.delete();
        dst = output;
        
        // メモリ解放
        channels.delete();
        alpha.delete();
    }
    
    // メモリ解放
    hsv.delete();
    
    return dst;
};
  
export default colorCollectionProcessor;
