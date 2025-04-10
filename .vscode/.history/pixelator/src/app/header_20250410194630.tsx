"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import DeviceChecker from "./deviceChecker";
import { pupupuFont } from "./fonts/pupupuFonr";

const Header = () => {
  const isPC = DeviceChecker();

  const header: React.CSSProperties = {
    position: "relative",
    top: "0",
    width: "100%",
    height: "50px",
    backgroundColor: "rgb(255, 255, 255)",
    borderBottom: "solid 1px rgb(167, 167, 167)",
    userSelect: "none",
    zIndex: 10,
  };

  const headerTextStyle: React.CSSProperties = {
    fontSize: "1.8rem",
    color: " rgb(176, 200, 255)",
    WebkitTextStroke: "3px rgb(203, 172, 172)",
    textShadow: "3px 2px  rgb(255, 146, 146)",
  };

  const title: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: isPC ? "64px" : "50%",
    transform: isPC ? "translate(0%,-50%)" : "translate(-50%,-50%)",
    fontSize: "1.5rem",
    color: "rgb(0,0,0)",
  };

  const logobox: React.CSSProperties = {
    position: "absolute",
    left: "-48px",
    width: "36px",
    height: "36px",
  };

  const pinkCircle: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "rgb(255, 184, 198)",
    width: "28px",
    height: "28px",
    borderRadius: "100%",
    overflow: "hidden",
  };

  const blueSquare: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "rgb(100, 195, 246)",
    left: "12px",
    top: "12px",
    width: "24px",
    height: "24px",
    borderRadius: "20%",
    zIndex: "-1",
  };

  const yellowLight: React.CSSProperties = {
    position: "absolute",
    backgroundColor: "rgb(253, 255, 184)",
    left: "12px",
    top: "12px",
    width: "24px",
    height: "24px",
    borderRadius: "20%",
  };

  const [clickHamburger, setClickHamburger] = useState(false);
  useEffect(() => {
    if (isPC) setClickHamburger(false);
  }, [isPC]);

  const hamburgerFrame: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "100%",
    transform: "translate(calc(-100% - 1rem),-50%)",
    width: "24px",
    aspectRatio: "4/3",
    backgroundColor: "rgb(255, 255, 255)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    cursor: "pointer",
  };
  const line1: React.CSSProperties = {
    width: clickHamburger ? "100%" : "100%",
    height: "1.5px",
    backgroundColor: "rgb(0, 0, 0)",
    transform: clickHamburger
      ? "translate(0,8.25px) rotate(45deg)"
      : " translate(0,0) rotate(0deg)",
    transition: "all 0.5s ease",
  };
  const line2: React.CSSProperties = {
    width: clickHamburger ? "0%" : "60%",
    height: "1.5px",
    backgroundColor: "rgb(0, 0, 0)",
    transition: "all 0.5s ease",
  };
  const line3: React.CSSProperties = {
    width: clickHamburger ? "100%" : "100%",
    height: "1.5px",
    backgroundColor: "rgb(0, 0, 0)",
    transform: clickHamburger
      ? "translate(0,-8.25px) rotate(-45deg)"
      : " translate(0,0) rotate(0deg)",
    transition: "all 0.5s ease",
  };
  const hamburgerBoad: React.CSSProperties = {
    position: "fixed",
    top: "50px",
    right: isPC ? "-50%" : clickHamburger ? "0%" : "-50%",
    width: "50%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.84)",
    transition: "all 0.5s ease",

    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  };
  const hamburgerContent: React.CSSProperties = {
    width: "80%",
    color: "rgb(255,255,255)",
    fontSize: "1.5rem",
    margin: "1rem",
  };
  return (
    <>
      <div style={header}>
        <div style={title}>
          <div style={logobox}>
            <div style={pinkCircle}>
              <div style={yellowLight} />
            </div>
            <div style={blueSquare} />
          </div>
          <Link href="/">
            <span className={pupupuFont.className} style={headerTextStyle}>
              ぴくせれーたー
            </span>
          </Link>
        </div>
        {!isPC && (
          <div
            style={hamburgerFrame}
            onClick={() => setClickHamburger(!clickHamburger)}
          >
            <div style={line1} />
            <div style={line2} />
            <div style={line3} />
          </div>
        )}
        <div style={hamburgerBoad}>
          <p style={hamburgerContent}>このサイトについて</p>
          <p style={hamburgerContent}>使い方</p>
          <p style={hamburgerContent}>コンタクト</p>
        </div>
      </div>
    </>
  );
};

export default Header;
