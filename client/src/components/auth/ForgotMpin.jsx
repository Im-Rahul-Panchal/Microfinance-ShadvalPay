import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

const FORGOT_MPIN_API = '';

const ForgotMpin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [newMpinError, setNewMpinError] = useState("");
  const [confirmMpinError, setConfirmMpinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

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

  const validateNewMpin = (value) => {
    if (!value) return "New MPIN is required";
    const mpinRegex = /^[0-9]{6,}$/;
    if (!mpinRegex.test(value)) return "MPIN must be at least 6 digits";
    return "";
  };

  const validateConfirmMpin = (value) => {
    if (!value) return "Confirm MPIN is required";
    if (value !== newMpin) return "MPINs do not match";
    return "";
  };

  const handleNewMpinChange = (e) => {
    const value = e.target.value;
    setNewMpin(value);
    setNewMpinError(validateNewMpin(value));
    if (confirmMpin) {
      setConfirmMpinError(validateConfirmMpin(confirmMpin));
    }
  };

  const handleConfirmMpinChange = (e) => {
    const value = e.target.value;
    setConfirmMpin(value);
    setConfirmMpinError(validateConfirmMpin(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newMpinErr = validateNewMpin(newMpin);
    const confirmMpinErr = validateConfirmMpin(confirmMpin);
    setNewMpinError(newMpinErr);
    setConfirmMpinError(confirmMpinErr);

    if (!newMpinErr && !confirmMpinErr) {
      setLoading(true);
      setApiError("");
      /*
      try {
        const response = await fetch(FORGOT_MPIN_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newMpin })
        });
        const data = await response.json();
        if (data.success) {
          setSuccessMessage("MPIN changed successfully");
          navigate('/mpin');
        } else {
          setApiError(data.message || "Failed to change MPIN");
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
        toast.success("MPIN changed successfully ✅");
        navigate('/auth/mpin', { replace: true });
      }, 1000);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex justify-center items-center"
      style={{ backgroundImage: "url('/navratri.jpg')" }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg md:w-96 lg:w-100">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/auth/mpin')}
            className="rounded mr-4 cursor-pointer"
            aria-label="Back"
          >
            <img
              src="/back_button.png"
              alt="Back"
              className="h-9 w-9"
            />
          </button>
          <h2 className="font-bold text-blue-500">FORGOT MPIN? Reset Now</h2>
        </div>
       
        {apiError && (
          <p className="text-red-500 text-sm mt-1">{apiError}</p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="newMpin">
              New Mpin *
            </label>
            <input
              type="password"
              id="newMpin"
              name="newMpin"
              value={newMpin}
              onChange={handleNewMpinChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your new MPIN"
              maxLength={6}
            />
            {newMpinError && (
              <p className="text-red-500 text-sm mt-1">{newMpinError}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700" htmlFor="confirmMpin">
              Confirm Mpin *
            </label>
            <input
              type="password"
              id="confirmMpin"
              name="confirmMpin"
              value={confirmMpin}
              onChange={handleConfirmMpinChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Confirm your new MPIN"
              maxLength={6}
            />
            {confirmMpinError && (
              <p className="text-red-500 text-sm mt-1">{confirmMpinError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md cursor-pointer disabled:opacity-50"
          >
            {loading ? "Changing MPIN..." : "CHANGE MPIN"}
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

export default ForgotMpin;
