import localFont from 'next/font/local';

const myFont = localFont({
  src: `pupupu-free.otf`,
  display: 'swap', // フォントの表示方法を指定
});

export { myFont };