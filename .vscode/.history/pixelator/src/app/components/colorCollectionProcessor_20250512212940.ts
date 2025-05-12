// ImageProcessorComponent.tsx (仮のコンポーネント名)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useThrottle } from './useThrottle'; // 提供されたフックをインポート
import colorCollectionProcessor from './colorCollectionProcessor'; // 前回作成した関数

// OpenCV.jsの型定義は適宜用意するか、anyで回避
// declare var cv: any;

interface ImageProcessingParams {
    isHue: boolean;
    hue: number;
    isLuminance: boolean;
    luminance: number;
    isSaturation: boolean;
    saturation: number;
    contrast: boolean;
    contrastLevel: number;
    brightness: boolean;
    brightnessLevel: number;
}

interface Props {
    srcImage: HTMLImageElement | null; // or cv.Mat if already loaded
    cv: any; // OpenCV object
}

const ImageProcessorComponent: React.FC<Props> = ({ srcImage, cv }) => {
    const [processedImage, setProcessedImage] = useState<string | null>(null); // 加工後の画像URLなど
    const outputCanvasRef = useRef<HTMLCanvasElement>(null);

    // UIから変更されるパラメータの例
    const [hue, setHue] = useState(0);
    const [isHueEnabled, setIsHueEnabled] = useState(false);
    const [luminance, setLuminance] = useState(0);
    const [isLuminanceEnabled, setIsLuminanceEnabled] = useState(false);
    // ... 他のパラメータも同様に useState で管理
    const [contrastLevel, setContrastLevel] = useState(1.0);
    const [isContrastEnabled, setIsContrastEnabled] = useState(false);
    const [brightnessLevel, setBrightnessLevel] = useState(0);
    const [isBrightnessEnabled, setIsBrightnessEnabled] = useState(false);
    // saturationも同様

    const currentParamsRef = useRef<ImageProcessingParams>({
        isHue: isHueEnabled, hue,
        isLuminance: isLuminanceEnabled, luminance,
        isSaturation: false, saturation: 0, // 仮
        contrast: isContrastEnabled, contrastLevel,
        brightness: isBrightnessEnabled, brightnessLevel,
    });

    useEffect(() => {
        currentParamsRef.current = {
            isHue: isHueEnabled, hue,
            isLuminance: isLuminanceEnabled, luminance,
            isSaturation: false, saturation: 0, // 仮。実際の値に置き換える
            contrast: isContrastEnabled, contrastLevel,
            brightness: isBrightnessEnabled, brightnessLevel,
        };
    }, [isHueEnabled, hue, isLuminanceEnabled, luminance, /*他の依存パラメータ*/ isContrastEnabled, contrastLevel, isBrightnessEnabled, brightnessLevel]);

    // スロットリングするパラメータをオブジェクトにまとめる
    const processingParams: ImageProcessingParams = {
        isHue: isHueEnabled,
        hue: hue,
        isLuminance: isLuminanceEnabled,
        luminance: luminance,
        isSaturation: false, // 仮。実際にはuseStateで管理された値を使う
        saturation: 0,      // 仮
        contrast: isContrastEnabled,
        contrastLevel: contrastLevel,
        brightness: isBrightnessEnabled,
        brightnessLevel: brightnessLevel,
    };

    // useThrottleフックを適用。ディレイは例えば300ms
    const throttledParams = useThrottle(processingParams, 300);

    // useCallbackでcolorCollectionProcessorの呼び出しをメモ化
    // これは必須ではないが、大きなオブジェクトを扱う際の慣習
    const processImageCallback = useCallback(() => {
        if (!srcImage || !cv || !cv.imread) {
            console.log("Source image or OpenCV not ready.");
            return;
        }

        console.log("Processing with params:", throttledParams);
        let srcMat;
        try {
            if (srcImage instanceof HTMLImageElement) {
                srcMat = cv.imread(srcImage);
            } else {
                // もしsrcImageが既にcv.Matならそのまま使う (型ガードが必要)
                // srcMat = srcImage;
                console.error("srcImage is not an HTMLImageElement. Handling for cv.Mat direct input needs implementation.");
                return;
            }

            if (srcMat.empty()) {
                console.error("Failed to read source image into Mat.");
                srcMat.delete();
                return;
            }

            // colorCollectionProcessor をスロットリングされたパラメータで呼び出す
            const dstMat = colorCollectionProcessor(
                cv,
                srcMat,
                throttledParams.isHue,
                throttledParams.hue,
                throttledParams.isLuminance,
                throttledParams.luminance,
                throttledParams.isSaturation,
                throttledParams.saturation,
                throttledParams.contrast,
                throttledParams.contrastLevel,
                throttledParams.brightness,
                throttledParams.brightnessLevel
            );

            // 結果をCanvasに表示
            if (outputCanvasRef.current) {
                cv.imshow(outputCanvasRef.current, dstMat);
            }
            // または画像URLとして設定
            // const dataUrl = outputCanvasRef.current?.toDataURL();
            // setProcessedImage(dataUrl);


            // メモリ解放
            srcMat.delete();
            dstMat.delete();
        } catch (error) {
            console.error("Error during image processing:", error);
            if (srcMat && !srcMat.isDeleted()) srcMat.delete();
        }
    }, [cv, srcImage, throttledParams]); // throttledParamsが変更されたら再生成

    // throttledParamsが変更されたら画像処理を実行
    useEffect(() => {
        // srcImageやcvが利用可能になってから処理を実行
        if (srcImage && cv) {
            console.log("Throttled params changed, triggering processing:", throttledParams);
            processImageCallback();
        }
    }, [processImageCallback, srcImage, cv]); // srcImageとcvも依存に追加

    // UI部分の例 (スライダーなど)
    return (
        <div>
        <div>
        <label>
        Hue Enabled:
    <input type="checkbox" checked = { isHueEnabled } onChange = {(e) => setIsHueEnabled(e.target.checked)} />
        </label>
{
    isHueEnabled && (
        <input
            type="range"
    min = "-180"
    max = "180"
    value = { hue }
    onChange = {(e) => setHue(parseInt(e.target.value, 10))
}
          />
        )}
<span>{ hue } </span>
    </div>
    < div >
    <label>
    Luminance Enabled:
<input type="checkbox" checked = { isLuminanceEnabled } onChange = {(e) => setIsLuminanceEnabled(e.target.checked)} />
    </label>
{
    isLuminanceEnabled && (
        <input
            type="range"
    min = "-255"
    max = "255"
    value = { luminance }
    onChange = {(e) => setLuminance(parseInt(e.target.value, 10))
}
          />
        )}
<span>{ luminance } </span>
    </div>
{/* 他のコントロール（Saturation, Contrast, Brightness）も同様に作成 */ }
<div>
    <label>
    Contrast Enabled:
<input type="checkbox" checked = { isContrastEnabled } onChange = {(e) => setIsContrastEnabled(e.target.checked)} />
    </label>
{
    isContrastEnabled && (
        <input
            type="range"
    min = "0.1" // 適切な範囲を設定
    max = "3.0" // 適切な範囲を設定
    step = "0.1"
    value = { contrastLevel }
    onChange = {(e) => setContrastLevel(parseFloat(e.target.value))
}
          />
        )}
<span>{ contrastLevel.toFixed(1) } </span>
    </div>
    < div >
    <label>
    Brightness Enabled:
<input type="checkbox" checked = { isBrightnessEnabled } onChange = {(e) => setIsBrightnessEnabled(e.target.checked)} />
    </label>
{
    isBrightnessEnabled && (
        <input
            type="range"
    min = "-100" // 適切な範囲を設定
    max = "100"  // 適切な範囲を設定
    value = { brightnessLevel }
    onChange = {(e) => setBrightnessLevel(parseInt(e.target.value, 10))
}
          />
        )}
<span>{ brightnessLevel } </span>
    </div>


    < canvas ref = { outputCanvasRef } > </canvas>
{/* processedImage がデータURLなら <img> で表示可能
        {processedImage && <img src={processedImage} alt="Processed" />}
      */}
</div>
  );
};

// export default ImageProcessorComponent;