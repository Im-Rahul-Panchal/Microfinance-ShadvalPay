import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const CHANGE_PASSWORD_API = '';

const ChangePassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const [apiError, setApiError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const toastShown = useRef(false);

  useEffect(() => {
    if (location.state?.fromOtp && !toastShown.current) {
      toast.success("OTP verified ✅");
      toastShown.current = true;
    }
    if (location.state?.fromOtp) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [location.state?.fromOtp]);

  const validateNewPassword = (value) => {
    if (!value) return "New Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    // const hasUppercase = /[A-Z]/.test(value);
    // const hasLowercase = /[a-z]/.test(value);
    // const hasDigit = /[0-9]/.test(value);
    // const hasSpecialChar = /[^A-Za-z0-9]/.test(value);
    // if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecialChar) {
    //   return "Password must contain a mix of Alpha-numeric and Special Character";
    // }
    return "";
  };

  const validateConfirmPassword = (value) => {
    if (!value) return "Confirm Password is required";
    if (value !== newPassword) return "Passwords do not match";
    return "";
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setNewPasswordError(validateNewPassword(value));
    if (confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(validateConfirmPassword(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPassErr = validateNewPassword(newPassword);
    const confirmPassErr = validateConfirmPassword(confirmPassword);
    setNewPasswordError(newPassErr);
    setConfirmPasswordError(confirmPassErr);

    if (!newPassErr && !confirmPassErr) {
      setLoading(true);
      setApiError("");
      /*
      try {
        const response = await fetch(CHANGE_PASSWORD_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword, confirmPassword })
        });
        const data = await response.json();
        if (data.success) {
          setSuccessMessage("Password changed successfully");
          navigate('/');
        } else {
          setApiError(data.message || "Failed to change password");
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
        toast.success("Password Changed Successfully ✅");
        navigate('/', { replace: true });
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
          <h2 className="text-2xl font-bold text-blue-500">Change Password</h2>
        </div>

        {apiError && (
          <p className="text-red-500 text-sm mt-1">{apiError}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className="block text-gray-700" htmlFor="newPassword">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                autoComplete="off"
                spellCheck="false"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md"
                placeholder="Enter new password"
              />
              <img
                src={showPassword ? "/hide_eye.png" : "/show_eye.png"}
                alt="Toggle password visibility"
                className="absolute right-2 top-1/2 translate-y-[-50%] cursor-pointer h-5 w-5"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
              />
            </div>
            {newPasswordError && (
              <p className="text-red-500 text-sm mt-1">{newPasswordError}</p>
            )}
          </div>
          <div className="mb-4 relative">
            <label className="block text-gray-700" htmlFor="confirmPassword">
              Confirm New Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="off"
              spellCheck="false"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Confirm new password"
            />
            {confirmPasswordError && (
              <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md cursor-pointer disabled:opacity-50"
          >
            {loading ? "Changing Password..." : "Change Password"}
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

export default ChangePassword;
