import { useEffect } from "react";

const OpenCVComponent = () => {
  useEffect(() => {
    const loadOpenCV = async () => {
      // opencv.jsのスクリプトを動的に読み込む
      const script = document.createElement("script");
      script.src = "/opencv.js"; // publicフォルダから読み込む
      script.onload = () => {
        if (window.cv) {
          console.log("OpenCV loaded successfully!");
          // OpenCVの処理をここで実行
          const mat = new cv.Mat(); // 例: 空の行列を作成
          console.log(mat);
        } else {
          console.error("Failed to load OpenCV");
        }
      };
      document.body.appendChild(script);
    };

    loadOpenCV();
  }, []);

  return <div>OpenCVを利用するコンポーネントです。</div>;
};

export default OpenCVComponent;
