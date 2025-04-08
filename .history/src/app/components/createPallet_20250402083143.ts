const createPallet = (imageElement: HTMLImageElement, numColors: number = 8) => {
    const cv = window.cv;

    if (!cv) {
        console.error("OpenCV.js is not loaded.");
        return [];
    }

    // 画像をcv.Matとして読み込む
    let src = cv.imread(imageElement);

    // 画像をRGBの配列に変換
    let samples = [];
    for (let y = 0; y < src.rows; y++) {
        for (let x = 0; x < src.cols; x++) {
            let pixel = src.ucharPtr(y, x); // ピクセルのRGB値を取得
            samples.push([pixel[0], pixel[1], pixel[2]]);
        }
    }

    // 配列をcv.Matに変換
    let samplesMat = cv.matFromArray(samples.length, 1, cv.CV_32FC3, samples.flat());

    let labels = new cv.Mat();
    let centers = new cv.Mat();

    // k-meansクラスタリングの条件設定
    let criteria = new cv.TermCriteria(cv.TERM_CRITERIA_EPS + cv.TERM_CRITERIA_MAX_ITER, 10, 1.0);
    let attempts = 10;
    let flags = cv.KMEANS_PP_CENTERS; // 初期クラスタをKMEANS++で設定

    // k-means実行
    cv.kmeans(samplesMat, numColors, labels, criteria, attempts, flags, centers);

    // 代表色を取得（整数に変換）
    let extractedColors: string[] = [];
    for (let i = 0; i < numColors; i++) {
        let r = Math.round(centers.floatAt(i, 0));
        let g = Math.round(centers.floatAt(i, 1));
        let b = Math.round(centers.floatAt(i, 2));
        extractedColors.push(`#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`);
    }

    // メモリ解放
    src.delete();
    samplesMat.delete();
    labels.delete();
    centers.delete();

    return extractedColors;
};

export default createPallet;
