import localFont from 'next/font/local';

const myFont = localFont({
  src: './fonts/my-font.otf',
  display: 'swap', // フォントの表示方法を指定
});

export { myFont };