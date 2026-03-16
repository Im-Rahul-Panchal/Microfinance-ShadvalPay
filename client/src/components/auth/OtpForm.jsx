import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

function OtpForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  
  const toastShown = useRef(false);

  useEffect(() => {
    if ((location.state?.type === 'password' || location.state?.type === 'mpin') && !toastShown.current) {
      toast.success("OTP sent successfully ✅");
      toastShown.current = true; 
    }
  }, [location.state?.type]);  

  const validateOtp = (value) => {
    if (!value) return "OTP is required";
    if (value.length !== 6) return "OTP must be 6 digits";
    if (!/^\d{6}$/.test(value)) return "OTP must be numeric";
    return "";
  };

  const handleOtpChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setOtp(value);
      setOtpError(validateOtp(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpErr = validateOtp(otp);
    setOtpError(otpErr);

    if (!otpErr) {
      setLoading(true);
      setApiError("");

        setTimeout(() => {
          setLoading(false);
          const type = location.state?.type;
          if (type === 'mpin') {
            navigate('/auth/forgot-mpin', { state: { fromOtp: true }, replace: true });
          } else {
            navigate('/auth/change-password', { state: { fromOtp: true }, replace: true });
          }
        }, 1000);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex justify-center items-center"
      style={{ backgroundImage: "url('/navratri.jpg')" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="rounded mr-4 cursor-pointer"
            aria-label="Back"
          >
            <img
              src="/back_button.png"
              alt="Back"
              className="h-9 w-9"
            />
          </button>
          <h2 className="text-2xl font-bold text-blue-500">Verify OTP</h2>
        </div>
        <label className="block text-gray-700" htmlFor="otp">
          Enter the OTP sent on your Mobile number
        </label>
        {location.state?.type === 'password' && (
          <div className="mb-2 text-sm text-gray-600 font-semibold text-center">
            (ending with ....{location.state?.mobileLast4 || 'XXXX'} to reset Password)
          </div>
        )}
        {location.state?.type === 'mpin' && (
          <div className="mb-2 text-sm text-gray-600 font-semibold text-center">
            (ending with ....{location.state?.mobileLast4 || 'XXXX'} to reset MPIN)
          </div>
        )}
        
        {apiError && (
          <p className="text-red-500 text-sm mt-1">{apiError}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              id="otp"
              name="otp"
              value={otp}
              onChange={handleOtpChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter OTP"
              maxLength={6}
            />
            {otpError && (
              <p className="text-red-500 text-sm mt-1">{otpError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md cursor-pointer disabled:opacity-50"
          >
            {loading ? "Verifying..." : "VERIFY OTP"}
          </button>
        </form>
        <div className="text-center text-sm mt-4 text-gray-500">
          <a href="/" className="text-black">
            Powered by <span className="text-blue-800 font-bold cursor-pointer">ShadvalPay</span>. All rights reserved.
          </a>
        </div>
      </div>
    </div>
  );
}

export default OtpForm;
