import Image from "next/image";

export default function Home() {
  const cv = require("@techstark/opencv-js");

  cv.onRuntimeInitialized = () => {
    console.log("OpenCV is ready!");

    // 100x100 の黒い画像を作成
    let mat = new cv.Mat(100, 100, cv.CV_8UC3, new cv.Scalar(0, 0, 0));

    // 画像の中央に白い四角を描画
    let point1 = new cv.Point(30, 30);
    let point2 = new cv.Point(70, 70);
    let color = new cv.Scalar(255, 255, 255);
    cv.rectangle(mat, point1, point2, color, -1);

    console.log("画像処理テスト完了");
  };

  return (
    <>
      <div>hello</div>
    </>
  );
}
