import Lottie from "lottie-react";
import React from "react";
import animationLoad1 from "../../../public/animationLoad4.json";
import animationtext from "../../../public/animationLoadingText3.json";

function LoadingConor() {
  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="w-1/2 sm:w-1/3">
          <Lottie animationData={animationLoad1} loop={true} />
          <Lottie animationData={animationtext} loop={true} />
        </div>
      </div>
    </>
  );
}

export default LoadingConor;
