import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import useLocation from "../../hooks/useLocation";
import { BASE_URL } from "../../config";

const LoginForm = () => {
  const navigate = useNavigate();
  const { startLoginFlow } = useAuth();
  const {
    latitude,
    longitude,
    loading: locationLoading,
    error: locationError,
    permission,
    refresh,
  } = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateUsername = (v) =>
    !v ? "Username is required" : v.length < 6 ? "Minimum 6 characters" : "";
  const validatePassword = (v) =>
    !v ? "Password is required" : v.length < 6 ? "Minimum 6 characters" : "";

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    setUsernameError(validateUsername(val));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordError(validatePassword(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const uErr = validateUsername(username);
    const pErr = validatePassword(password);

    setUsernameError(uErr);
    setPasswordError(pErr);
    setApiError("");

    if (uErr || pErr) return;

    // LOCATION BLOCK – LOGIN PAGE ONLY
    if (!latitude || !longitude) {
      setApiError(
        locationError ||
          "Unable to detect location. Please enable GPS or network location."
      );
      refresh(); // retry once
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include",
        body: JSON.stringify({
          userName: username,
          password,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();

      if (data.resCode === "100") {
        startLoginFlow(username, password);

        navigate("/auth/mpin", {
          state: { username, password, latitude, longitude },
        });
      } else {
        setApiError("Invalid credentials");
      }
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Left Side – Beautiful Gradient + SVG Illustration */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        {/* Animated Gradient Background */}
        {/* <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/30 via-purple-400/30 to-pink-400/30 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 via-transparent to-purple-400/20 animate-ping"></div>
        </div> */}

        {/* Floating Orbs */}
        {/* <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-bounce"></div>
        <div className="absolute bottom-32 right-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-bounce animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div> */}

        {/* SVG Microfinance Illustration */}
        <div className="relative z-10 text-center px-12">
          <svg
            className="w-80 h-80 mx-auto mb-8 drop-shadow-2xl"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="200"
              cy="200"
              r="180"
              fill="url(#grad1)"
              opacity="0.1"
            />
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Person Receiving Money */}
            <circle cx="200" cy="140" r="40" fill="#6366f1" opacity="0.9" />
            <path
              d="M200 180 L180 240 L170 300 L230 300 L220 240 Z"
              fill="#818cf8"
            />
            <circle cx="180" cy="130" r="10" fill="#fff" />
            <circle cx="220" cy="130" r="10" fill="#fff" />

            {/* Money Bag */}
            <rect
              x="160"
              y="260"
              width="80"
              height="60"
              rx="10"
              fill="#10b981"
              opacity="0.9"
            />
            <text
              x="200"
              y="300"
              textAnchor="middle"
              fill="white"
              fontSize="40"
              fontWeight="bold"
            >
              ₹
            </text>

            {/* Flying Coins */}
            {/* <circle cx="120" cy="200" r="20" fill="#fbbf24" className="animate-bounce">
              <animate attributeName="cy" values="200;180;200" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="280" cy="220" r="18" fill="#f59e0b" className="animate-bounce animation-delay-1000">
              <animate attributeName="cy" values="220;200;220" dur="2.5s" repeatCount="indefinite"/>
            </circle> */}
          </svg>

          <h1 className="text-5xl font-bold text-indigo-900 mb-4">
            Empowering Dreams
          </h1>
          <p className="text-3xl font-semibold text-purple-700">
            One Loan at a Time
          </p>
          <p className="text-xl text-indigo-700 mt-6 max-w-md mx-auto">
            Fast, secure, and transparent microfinance solutions for India.
          </p>
        </div>
      </div>

      {/* Right Side – Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 lg:px-16">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-2xl rounded-xl shadow-2xl p-10 border border-white/30">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl mb-4">
                <i className="fa-solid fa-building-columns text-white text-4xl"></i>
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent pb-1">
                Associate Login
              </h2>
            </div>

            {apiError && (
              <div className="mb-1 p-1 flex items-center gap-2">
                <i className="fa-solid fa-exclamation-circle text-red-600"></i>
                <p className="text-red-700 font-medium">{apiError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative border-2 border-gray-200 rounded-2xl ">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"></i>
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className={`w-full pl-12 pr-4 py-4 bg-white/60 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all ${
                      usernameError ? "border-red-400" : "border-white/30"
                    }`}
                    placeholder="Enter your username"
                  />
                </div>
                {usernameError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i>{" "}
                    {usernameError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative border-2 border-gray-200 rounded-2xl">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full pl-12 pr-12 py-4 bg-white/60 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all ${
                      passwordError ? "border-red-400" : "border-white/30"
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onMouseDown={() => setShowPassword(true)}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
                  >
                    <i
                      className={`fa-solid ${
                        showPassword ? "fa-eye-slash" : "fa-eye"
                      } text-lg`}
                    ></i>
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <i className="fa-solid fa-circle-exclamation"></i>{" "}
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/auth/forgot-password")}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || locationLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-3 cursor-pointer"
              >
                {loading || locationLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    {locationLoading
                      ? "Detecting Location..."
                      : "Logging in..."}
                  </>
                ) : (
                  <>
                    PROCEED <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

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
    </div>
  );
};

export default LoginForm;
