import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import useLocationHook from "../../hooks/useLocation";
import { BASE_URL } from "../../config";

const MpinForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mpinLogin } = useAuth();
  const  username = location.state?.username;
  const password = location.state?.password;

  const { latitude, longitude, error: locationError, loading: locationLoading } = useLocationHook();

  const [mpin, setMpin] = useState("");
  const [mpinError, setMpinError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const validateMpin = (value) => {
    if (!value) return "MPIN is required";
    if (!/^\d{6}$/.test(value)) return "Enter exactly 6 digits";
    return "";
  };

  const handleMpinChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setMpin(value);
    setMpinError(validateMpin(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateMpin(mpin);
    setMpinError(err);
    setApiError("");

    if (err) return;
    if (locationLoading || !latitude || !longitude) {
      toast.error("Location access required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/verifyMpin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userName: username,
          password,
          tPin: mpin,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();

      if (data.resCode === "100" && data.msg?.toLowerCase() === "success") {
        const success = mpinLogin(data);
        if (success) {
          toast.success("Mpin verified successfuly!");
          navigate("/dashboard/home");
        } else {
          setApiError("Session error. Please login again.");
        }
      } else {
        setMpin("");
        setMpinError("Incorrect MPIN");
        toast.error("Wrong MPIN");
      }
    } catch (err) {
      console.error(err);
      setApiError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Left Side – Beautiful Gradient + Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        {/* <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 via-purple-400/20 to-pink-400/20" /> */}

        {/* Floating Orbs */}
        {/* <div className="absolute top-16 left-12 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" />
        <div className="absolute bottom-24 right-16 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse delay-2000" /> */}

        <div className="relative z-10 text-center px-12">
          <svg className="w-80 h-80 mx-auto mb-8 drop-shadow-2xl" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="url(#grad)" opacity="0.15" />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>

            {/* Shield + Lock */}
            <circle cx="200" cy="180" r="60" fill="#6366f1" opacity="0.9" />
            <path d="M200 140 L200 100 L160 120 L160 180 Z" fill="#4f46e5" />
            <rect x="160" y="180" width="80" height="100" rx="15" fill="#818cf8" />
            <circle cx="200" cy="230" r="15" fill="#fff" opacity="0.3" />
            <text x="200" y="245" textAnchor="middle" fill="white" fontSize="50" fontWeight="bold">Lock</text>

            {/* Secure Waves */}
            <path d="M100 320 Q200 280 300 320" stroke="#10b981" strokeWidth="8" fill="none" opacity="0.7" />
            <path d="M80 350 Q200 310 320 350" stroke="#3b82f6" strokeWidth="10" fill="none" opacity="0.6" />
          </svg>

          <h1 className="text-5xl font-bold text-indigo-900 mb-4">Secure Access</h1>
          <p className="text-3xl font-semibold text-purple-700">Your MPIN Keeps You Safe</p>
          <p className="text-xl text-indigo-700 mt-6 max-w-md mx-auto">
            Fast and secure verification with your 6-digit MPIN
          </p>
        </div>
      </div>

      {/* Right Side – MPIN Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-xl shadow-2xl px-10 py-3 border border-white/30">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-1 p-3 rounded-2xl bg-white/600 backdrop-blur hover:bg-white/80 transition-all hover:scale-110 shadow-lg justify-center items-center flex cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left text-indigo-600 text-2xl"></i>
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl mb-6">
                <i className="fa-solid fa-shield-halved text-white text-4xl"></i>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Enter MPIN
              </h2>
              <p className="text-gray-600 mt-2 text-lg">Verify your identity</p>
            </div>

            {(apiError || locationError) && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
                <i className="fa-solid fa-exclamation-circle text-red-600"></i>
                <p className="text-red-700 font-medium">{apiError || locationError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-lg font-semibold text-gray-700 text-center mb-3">
                  Enter your 6-digit MPIN
                </label>
                <div className="relative max-w-xs mx-auto border-2 border-gray-200 rounded-2xl">
                  <input
                    type={showMpin ? "text" : "password"}
                    value={mpin}
                    onChange={handleMpinChange}
                    maxLength={6}
                    className="w-full text-center text-4xl tracking-widest bg-white/70 border-2 border-white/40 rounded-2xl py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all shadow-inner"
                    placeholder="••••••"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowMpin(true)}
                    onMouseUp={() => setShowMpin(false)}
                    onMouseLeave={() => setShowMpin(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                  >
                    <i className={`fa-solid ${showMpin ? "fa-eye-slash" : "fa-eye"} text-xl`}></i>
                  </button>
                </div>

                {/* Dot Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full border-2 transition-all duration-300 shadow-md ${
                        mpin.length > i
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-700"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {mpinError && (
                  <p className="text-red-500 text-center mt-4 flex items-center justify-center gap-2 text-md">
                    <i className="fa-solid fa-circle-exclamation"></i> {mpinError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || locationLoading || mpin.length !== 6}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-3 cursor-pointer"
              >
                {loading || locationLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    VERIFY MPIN <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-8">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold text-lg hover:underline cursor-pointer flex items-center justify-center gap-2 mx-auto"
              >
                Forgot MPIN?
              </button>
            </div>

            <div className="text-center mt-8 text-sm text-gray-600">
              Powered by{" "}
              <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ShadvalPay
              </span>
              <br />
              <span className="text-xs">
                © {new Date().getFullYear()} All Rights Reserved
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-triangle-exclamation text-red-600 text-4xl"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Reset MPIN?</h3>
              <p className="text-gray-600 mb-8">
                This will log you out and send OTP to your mobile.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => navigate("/auth/otp", { state: { type: "mpin" } })}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:shadow-lg hover:scale-105 transition cursor-pointer flex items-center gap-2"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MpinForm;