import React from "react";
import peach1 from "../assets/images/peach1.png";
import peach2 from "../assets/images/peach2.png";
import peach3 from "../assets/images/peach3.png";
import peach4 from "../assets/images/peach4.png";
import peach5 from "../assets/images/peach5.png";
import peach11 from "../assets/images/pixel-peach1.png";
import peach12 from "../assets/images/pixel-peach2.png";
import peach13 from "../assets/images/pixel-peach3.png";
import peach14 from "../assets/images/pixel-peach4.png";
import peach15 from "../assets/images/pixel-peach5.png";

import logo from "../assets/images/logo-3.png";


const peaches = [
  { src: peach1, top: "15%", left: "5%", size: "4%", rotate: "-10deg", blurClass: "blur-large", animationDelay: "1s"},
  { src: peach2, top: "25%", left: "17%", size: "30%", rotate: "25deg", blurClass: "", animationDelay: "2s"},
  { src: peach5, bottom: "10%", left: "5%", size: "10%", rotate: "-5deg", blurClass: "blur-small", animationDelay: "4s"},
  { src: peach3, bottom: "4%", left: "35%", size: "3%", rotate: "-5deg", blurClass: "blur-small", animationDelay: "3s"},
  { src: peach4, bottom: "5%", right: "5%", size: "9%", rotate: "10deg", blurClass: "blur-medium", animationDelay: "1s"},
  { src: peach5, top: "8%", left: "45%", size: "11%", rotate: "-8deg", blurClass: "blur-medium", animationDelay: "2s"},
  { src: peach1, bottom: "27%", right: "20%", size: "18%", rotate: "12deg", blurClass: "blur-large", animationDelay: "2s"},
  { src: peach2, top: "9%", right: "13%", size: "10%", rotate: "15deg", blurClass: "blur-medium", animationDelay: "2s"},
  { src: peach5, top: "50%", right: "5%", size: "5%", rotate: "-5deg", blurClass: "blur-small", animationDelay: "3s"},
  { src: peach3, top: "45%", left: "45%", size: "7%", rotate: "20deg", blurClass: "blur-small", animationDelay: "1s"},
  { src: peach2, top: "0.05%", left: "25%", size: "5%", rotate: "20deg", blurClass: "", animationDelay: "3s"},
  { src: peach1, bottom: "25%", left: "50%", size: "5%", rotate: "20deg", blurClass: "", animationDelay: "3s"}
];

const Background = () => {
    return (
        <div className="peach-container">
            <img 
                src={logo} 
                alt="Logo"
                className="logo"
            />
        {peaches.map((peach, index) => (
          <img
                key={index}
                src={peach.src}
                alt={`Peach ${index + 1}`}
                /* this line applies 3 classes in one string */
                className={`peach ${peach.blurClass} animated`}
                style={{
                top: peach.top,
                left: peach.left,
                right: peach.right,
                bottom: peach.bottom,
                width: peach.size,
                transform: `rotate(${peach.rotate})`,
                animationDelay: peach.animationDelay
            }}
          />
        ))}
        </div>
    );
  };

export default Background;
