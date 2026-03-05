import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./header";
import ClientRedirect from "./ClientRedirect"; // リダイレクトコンポーネント

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ドット絵風変換｜ぴくせれーたー｜Pixelator",
  description:
    "リアルタイム処理でイラストからドット絵風の画像を作成するサイトです",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="canonical" href="https://pixelator.net/" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3477348561793734" // あなたのクライアントIDに置き換えてください
          crossOrigin="anonymous"
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <Header /> */}
        <ClientRedirect /> {/* pages.dev からのアクセスを強制リダイレクト */}
        {children}
      </body>
    </html>
  );
}
