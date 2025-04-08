const grayscaleProcess = (cv: any, src: any): any => {
  let dst = new cv.Mat();

  if (src.channels() === 4) {
    // RGBA画像ならアルファチャンネルを保持しつつRGBをグレースケール化
    const rgbaChannels = new cv.MatVector();
    cv.split(src, rgbaChannels);

    const r = rgbaChannels.get(0);
    const g = rgbaChannels.get(1);
    const b = rgbaChannels.get(2);
    const a = rgbaChannels.get(3); // アルファチャンネル

    const gray = new cv.Mat();
    cv.addWeighted(r, 0.3, g, 0.59, 0, gray);
    cv.addWeighted(gray, 1, b, 0.11, 0, gray);

    // 4チャンネルに戻す
    const mergedChannels = new cv.MatVector();
    mergedChannels.push_back(gray);
    mergedChannels.push_back(gray);
    mergedChannels.push_back(gray);
    mergedChannels.push_back(a); // アルファチャンネルを戻す

    cv.merge(mergedChannels, dst);

    // メモリ解放
    r.delete();
    g.delete();
    b.delete();
    a.delete();
    gray.delete();
    rgbaChannels.delete();
    mergedChannels.delete();
  } else {
    // RGB画像ならそのままグレースケール化
    cv.cvtColor(src, dst, cv.COLOR_RGB2GRAY);
    cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGB);
  }

  return dst;
};

export default grayscaleProcess;