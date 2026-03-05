const colorCollectionProcessor = (
    cv: any,
    src: any,
    isHue: boolean,
    hue: number,
    isLuminance: boolean,
    luminance: number,
    isSaturation: boolean,
    saturation: number,
    contrast: boolean,
    contrastLevel: number,
    brightness: boolean,
    brightnessLevel: number
) => {
    let hls = new cv.Mat();
    let alpha = new cv.Mat();
    let hasAlpha = false;

    // RGBA画像をHLSに変換（アルファチャンネルを分離）
    if (src.channels() === 4) {
        hasAlpha = true;
        const channels = new cv.MatVector();
        cv.split(src, channels);
        const bgr = new cv.Mat();
        const merged = new cv.MatVector();

        // BGR部分のみHLSに変換
        merged.push_back(channels.get(0));
        merged.push_back(channels.get(1));
        merged.push_back(channels.get(2));
        cv.merge(merged, bgr);
        cv.cvtColor(bgr, hls, cv.COLOR_RGB2HLS);

        // アルファチャンネルを保持
        alpha = channels.get(3).clone();

        // メモリ解放
        bgr.delete();
        channels.delete();
        merged.delete();
    } else {
        cv.cvtColor(src, hls, cv.COLOR_RGB2HLS);
    }

    // LUTを使用してHLSチャンネルを加工
    // JSのピクセルループ（width×height回）の代わりに256要素のLUTを作り
    // cv.LUT()でネイティブコードに処理を委ねる
    if (isHue || isLuminance || isSaturation) {
        const hlsChannels = new cv.MatVector();
        cv.split(hls, hlsChannels);

        let hCh = hlsChannels.get(0).clone();
        let lCh = hlsChannels.get(1).clone();
        let sCh = hlsChannels.get(2).clone();
        hlsChannels.delete();

        if (isHue) {
            // 色相LUT: モジュロ180の加算（負値も正しく処理）
            const lutArr = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                lutArr[i] = ((i + hue) % 180 + 180) % 180;
            }
            const lutMat = cv.matFromArray(1, 256, cv.CV_8UC1, lutArr);
            const result = new cv.Mat();
            cv.LUT(hCh, lutMat, result);
            hCh.delete();
            lutMat.delete();
            hCh = result;
        }

        if (isLuminance) {
            // 輝度LUT: クランプ付き加算
            const lutArr = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                lutArr[i] = Math.max(0, Math.min(255, i + luminance));
            }
            const lutMat = cv.matFromArray(1, 256, cv.CV_8UC1, lutArr);
            const result = new cv.Mat();
            cv.LUT(lCh, lutMat, result);
            lCh.delete();
            lutMat.delete();
            lCh = result;
        }

        if (isSaturation) {
            // 彩度LUT: クランプ付き加算
            const lutArr = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                lutArr[i] = Math.max(0, Math.min(255, i + saturation));
            }
            const lutMat = cv.matFromArray(1, 256, cv.CV_8UC1, lutArr);
            const result = new cv.Mat();
            cv.LUT(sCh, lutMat, result);
            sCh.delete();
            lutMat.delete();
            sCh = result;
        }

        // チャンネルを結合して新しいhlsを生成
        const mergedChannels = new cv.MatVector();
        mergedChannels.push_back(hCh);
        mergedChannels.push_back(lCh);
        mergedChannels.push_back(sCh);
        const newHls = new cv.Mat();
        cv.merge(mergedChannels, newHls);
        mergedChannels.delete();
        hCh.delete();
        lCh.delete();
        sCh.delete();

        hls.delete();
        hls = newHls;
    }

    // HLSをRGBに戻す
    let dst = new cv.Mat();
    cv.cvtColor(hls, dst, cv.COLOR_HLS2RGB);

    // アルファチャンネルを統合
    if (hasAlpha) {
        const channels = new cv.MatVector();
        const output = new cv.Mat();
        cv.split(dst, channels);
        channels.push_back(alpha); // この時点でalphaはまだ有効
        cv.merge(channels, output);
        dst.delete();
        dst = output;

        // メモリ解放
        channels.delete();
        // alphaはこの時点では削除しない - コントラスト調整で使用するため
    }

    // メモリ解放
    hls.delete();

    // コントラストと明度の調整（convertScaleAbs()を使用）
    if (contrast || brightness) {
        const adjustedImage = new cv.Mat();

        // コントラストと明度の調整値を設定
        const contrastFactor = contrast ? contrastLevel : 1.0;
        const brightnessFactor = brightness ? brightnessLevel : 0;

        if (hasAlpha) {
            // アルファチャンネルを分離
            const rgbaChannels = new cv.MatVector();
            cv.split(dst, rgbaChannels);

            // RGB部分のみを取得
            const rgbOnly = new cv.Mat();
            const tempChannels = new cv.MatVector();
            tempChannels.push_back(rgbaChannels.get(0));
            tempChannels.push_back(rgbaChannels.get(1));
            tempChannels.push_back(rgbaChannels.get(2));
            cv.merge(tempChannels, rgbOnly);

            // RGBにコントラスト・明度調整適用
            cv.convertScaleAbs(rgbOnly, adjustedImage, contrastFactor, brightnessFactor);

            // 調整されたRGBとアルファを再統合
            const output = new cv.Mat();
            const finalChannels = new cv.MatVector();
            const finalRgbChannels = new cv.MatVector();
            cv.split(adjustedImage, finalRgbChannels);

            finalChannels.push_back(finalRgbChannels.get(0));
            finalChannels.push_back(finalRgbChannels.get(1));
            finalChannels.push_back(finalRgbChannels.get(2));
            finalChannels.push_back(alpha); // ここでalphaを使用

            cv.merge(finalChannels, output);

            // メモリ解放
            rgbaChannels.delete();
            tempChannels.delete();
            rgbOnly.delete();
            finalChannels.delete();
            finalRgbChannels.delete();
            adjustedImage.delete();
            dst.delete();

            dst = output;
        } else {
            // アルファなしの場合は単純にコントラスト・明度調整
            cv.convertScaleAbs(dst, adjustedImage, contrastFactor, brightnessFactor);
            dst.delete();
            dst = adjustedImage;
        }
    }

    // 最後にアルファをクリーンアップ
    if (hasAlpha) {
        alpha.delete();
    }

    return dst;
};

export default colorCollectionProcessor;