import React, { useState } from "react"
import { useNavigate } from "react-router-dom";

const FORGOT_PASSWORD_API = '';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [mobileNumberError, setMobileNumberError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validateUsername = (value) => {
    if (!value) return "Username is required";
    if (value.length === 0) return "Username is required";
    if (value.length < 6) return "Username must be at least 6 characters";
    const isLowercase = value === value.toLowerCase();
    const isAlphanumeric = /^[a-z0-9]+$/.test(value);
    const hasAlphabet = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    if (!isLowercase || !isAlphanumeric) {
      return "Incorrect username";
    }
    if (!hasAlphabet || !hasNumber) {
      return "Username must contain a mix of alpha-numeric";
    }
    return "";
  };

  const validateMobileNumber = (value) => {
    if (!value) return "Mobile Number is required";
    const phoneFormat = /^[6-9][0-9]{9}$/;
    if (!phoneFormat.test(value)) return "Mobile Number must be 10 digits"; 
    return "";
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameError(validateUsername(value));
  };

  const handleMobileNumberChange = (e) => {
    let value = e.target.value;
    if (value.length === 1 && /^[0-5]$/.test(value)) {
      setMobileNumberError("Mobile number should start with 6-9");
      return;
    } else if (value.length === 0) {
      setMobileNumber("");
      setMobileNumberError("");
    } else if (/^\d{1,10}$/.test(value)) {
      setMobileNumber(value);
      if (/^[6-9]/.test(value)) {
        setMobileNumberError("");
      } else {
        setMobileNumberError("Mobile number should start with 6-9");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const usernameErr = validateUsername(username);
    const mobileErr = validateMobileNumber(mobileNumber);
    setUsernameError(usernameErr);
    setMobileNumberError(mobileErr);

    if (!usernameErr && !mobileErr) {
      setLoading(true);
      setApiError("");
      /*
      try {
        const response = await fetch(FORGOT_PASSWORD_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, mobileNumber })
        });
        const data = await response.json();
        if (data.success) {
          setSuccessMessage("OTP sent successfully");
          navigate('/otp', { state: { type: 'password' } });
        } else {
          setApiError(data.message || "Failed to send OTP");
        }
      } catch {
        setApiError("Network error");
      } finally {
        setLoading(false);
      }
      */
      // Tempo
      setTimeout(() => {
        setLoading(false);
        const mobileLast4 = mobileNumber.slice(-4);
        navigate('/auth/otp', { state: { type: 'password', mobileLast4 }, replace: true });
      }, 1000);
    }
  };

  return (
    <div
      className = "min-h-screen bg-cover bg-center flex justify-center items-center"
      style = {{ backgroundImage: "url('/navratri.jpg')" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg md:w-96 lg:w-100">
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
          <h2 className=" font-bold text-blue-500">FORGOT PASSWORD? Reset Now</h2>
        </div>
       
        {apiError && (
          <p className="text-red-500 text-sm mt-1">{apiError}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              autoComplete="off"
              spellCheck="false"
              value={username}
              onChange={handleUsernameChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Username"
            />
            {usernameError && (
              <p className="text-red-500 text-sm mt-1">{usernameError}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="mobileNumber">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              autoComplete="off"
              spellCheck="false"
              value={mobileNumber}
              onChange={handleMobileNumberChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Mobile Number"
              maxLength={10}
            />
            {mobileNumberError && (
              <p className="text-red-500 text-sm mt-1">{mobileNumberError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md cursor-pointer disabled:opacity-50"
          >
            {loading ? "Sending OTP..." : "SEND OTP"}
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
};

export default ForgotPassword;
