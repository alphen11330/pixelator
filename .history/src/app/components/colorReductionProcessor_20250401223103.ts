/**
 * 最適化された減色処理を行うユーティリティ関数
 */

/**
 * 画像の色数を減らす処理（最適化版）
 * @param cv OpenCVオブジェクト
 * @param src 処理する入力Mat
 * @param levels 各チャンネルの量子化レベル（デフォルト：4）
 * @returns 減色処理されたMat
 */
const colorReductionProcessor = (cv, src, levels = 4) => {
    const dst = src.clone();
    const factor = 255 / (levels - 1);

    // 画像をLab空間に変換
    let lab = new cv.Mat();
    cv.cvtColor(src, lab, cv.COLOR_RGB2Lab);

    // 画像内の色データを取得
    let samples = [];
    for (let y = 0; y < lab.rows; y++) {
        for (let x = 0; x < lab.cols; x++) {
            let pixel = lab.ucharPtr(y, x);
            samples.push([pixel[0], pixel[1], pixel[2]]); // L, a, b
        }
    }
    
    let samplesMat = cv.matFromArray(samples.length, 3, cv.CV_32F, samples.flat());
    let labels = new cv.Mat();
    let centers = new cv.Mat();

    // K-meansクラスタリングを実行
    cv.kmeans(samplesMat, levels, labels, 
        new cv.TermCriteria(cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 10, 1.0),
        3, cv.KMEANS_PP_CENTERS, centers);

    // クラスタ中心を取得（代表色）
    let palette = [];
    for (let i = 0; i < levels; i++) {
        palette.push([centers.data32F[i * 3], centers.data32F[i * 3 + 1], centers.data32F[i * 3 + 2]]);
    }

    // 各ピクセルを最も近いクラスタ色に変換
    for (let y = 0; y < dst.rows; y++) {
        for (let x = 0; x < dst.cols; x++) {
            let pixel = lab.ucharPtr(y, x);
            let minDist = Infinity;
            let closestColor = null;
            
            for (let color of palette) {
                let dist = Math.pow(color[0] - pixel[0], 2) + 
                           Math.pow(color[1] - pixel[1], 2) + 
                           Math.pow(color[2] - pixel[2], 2);
                if (dist < minDist) {
                    minDist = dist;
                    closestColor = color;
                }
            }
            
            pixel[0] = closestColor[0];
            pixel[1] = closestColor[1];
            pixel[2] = closestColor[2];
        }
    }
    
    // LabからRGBに変換
    cv.cvtColor(lab, dst, cv.COLOR_Lab2RGB);
    
    samplesMat.delete();
    labels.delete();
    centers.delete();
    lab.delete();
    
    return dst;
};

export default colorReductionProcessor;
