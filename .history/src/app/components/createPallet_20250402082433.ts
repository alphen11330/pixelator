const createPallet = (src: any, numColors: number = 8) => {
    const cv=window.cv
    
    let samples = new cv.Mat();
    let labels = new cv.Mat();
    let centers = new cv.Mat();

    // 画像を1次元に展開
    let samplesData = src.reshape(1, src.rows * src.cols);
    samplesData.convertTo(samples, cv.CV_32F);

    // k-meansクラスタリングの条件設定
    let criteria = new cv.TermCriteria(cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 10, 1.0);
    let attempts = 10;
    let flags = cv.KMEANS_PP_CENTERS; // 初期クラスタをKMEANS++で設定

    // k-means実行
    cv.kmeans(samples, numColors, labels, criteria, attempts, flags, centers);

    // 代表色を取得（整数に変換）
    let extractedColors = [];
    for (let i = 0; i < numColors; i++) {
        let color = [
            Math.round(centers.floatAt(i, 0)),
            Math.round(centers.floatAt(i, 1)),
            Math.round(centers.floatAt(i, 2)),
        ];
        extractedColors.push(color);
    }

    // メモリ解放
    samples.delete();
    labels.delete();
    centers.delete();

    return extractedColors;
};

export default createPallet;
