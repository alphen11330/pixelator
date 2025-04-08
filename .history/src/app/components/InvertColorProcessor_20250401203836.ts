const invertColorProcessor = (cv: any, src: any): any => {
  let dst = new cv.Mat();

  if (src.channels() === 4) {
    // RGBA画像ならアルファチャンネルを保持しつつRGBを色反転
    const rgbaChannels = new cv.MatVector();
    cv.split(src, rgbaChannels);

    const r = rgbaChannels.get(0);
    const g = rgbaChannels.get(1);
    const b = rgbaChannels.get(2);
    const a = rgbaChannels.get(3); // アルファチャンネル

    // RGB部分を色反転


    // 4チャンネルに戻す
    const mergedChannels = new cv.MatVector();
    mergedChannels.push_back(r);
    mergedChannels.push_back(g);
    mergedChannels.push_back(b);
    mergedChannels.push_back(a); // アルファチャンネルを戻す

    cv.merge(mergedChannels, dst);

    // メモリ解放
    r.delete();
    g.delete();
    b.delete();
    a.delete();
    rgbaChannels.delete();
    mergedChannels.delete();
  } else {
    // RGB画像ならそのまま色反転
    cv.bitwise_not(src, dst);
  }

  return dst;
};

export default invertColorProcessor;