import React from "react";

const Footer = () => {
  return (
    <footer className="bg-transparent text-center text-gray-600 text-sm sm:text-base pt-5 pb-2">
      Copyright {new Date().getFullYear()} ©{" "}
      <span className="text-blue-600 font-semibold">ShadvalPay</span> All Rights Reserved.
    </footer>
  );
};

export default Footer;
