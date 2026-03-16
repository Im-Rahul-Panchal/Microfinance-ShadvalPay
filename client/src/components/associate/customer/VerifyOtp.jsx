import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../../contexts/AuthContext";
import MenuItems from "../../dashboard/MenuItems";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import useLocationHook from "../../../hooks/useLocation";
import { BASE_URL } from "../../../config";
import api from "../../../api/api";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authFlow, user } = useAuth();

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
  } = useLocationHook();

  const toastShown = useRef(false);

  // Show OTP sent toast only once
  useEffect(() => {
    if (!toastShown.current) {
      toast.success(
        "OTP sent successfully to your registered mobile number ✅",
        {
          duration: 4000,
          position: "top-center",
        }
      );
      toastShown.current = true;
    }
  }, []);

  // Data from previous screen
  const aadhar = location.state?.aadhar;
  const mobile = location.state?.mobile;
  const AadhaarRef = location.state?.aadhaarRef;

  // Prevent direct access
  useEffect(() => {
    if (
      !authFlow.registrationData ||
      !aadhar ||
      !mobile ||
      !AadhaarRef 
    ) {
      toast.error("Invalid access. Please start registration again.");
      navigate("/associate/customer/Registration");
    }
  }, [authFlow.registrationData, aadhar, mobile, AadhaarRef, navigate]);

  const validateOtp = (value) => {
    if (!value) return "OTP is required";
    if (value.length !== 6) return "OTP must be exactly 6 digits";
    if (!/^\d{6}$/.test(value)) return "OTP must contain only numbers";
    return "";
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setOtpError(validateOtp(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateOtp(otp);
    setOtpError(err);

    if (err) return;
    if (locationLoading || locationError || !latitude || !longitude) {
      toast.error("Location access required. Please enable GPS.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userId: user?.userId,
        latitude,
        longitude,
        otp,
        AadhaarRef,
      };
      const res = await api.post(`${BASE_URL}/api/verifyAadhaarOtp`, payload);

      if (res.data.resCode === "100") {
        toast.success("OTP verified successfully! ✅", { duration: 3000 });

        const aadhaarData = res.data.data.aadhaarData;

        const prefilledData = {
          fullName: aadhaarData.fullName || "",
          gender: aadhaarData.gender || "",
          dob: aadhaarData.dob ? new Date(aadhaarData.dob) : null,
          fatherName: aadhaarData.careOf?.replace(/^C\/O\s+/i, "").trim() || "",
          pinCode: aadhaarData.zip || "",
          state: aadhaarData.address?.state || "",
          completeAddress: aadhaarData.address?.house || "",
        };

        navigate(
          "/associate/customer/ManualDetails?Token=" +
            res.data.data.customerKey,
          {
            state: {
              prefilledData,
              customerId: res.data.data.customerKey,
              aadhar,
              mobile,
            },
          }
        );
      } else {
        toast.error(res.data.msg || "Incorrect OTP ❌");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <MenuItems />
      <div className="flex-1 flex flex-col overflow-auto">
        <Search />
        <div className="flex-1 flex justify-center items-center p-6">
          <div className="bg-white/90 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/30 p-10 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-6 mb-3">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center">
                <i className="fa-solid fa-shield-halved text-white text-3xl"></i>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Verify OTP
                </h1>
                <p className="text-gray-600 text-md md:text-md mt-1">
                  Enter the OTP sent to your registered mobile number
                </p>
              </div>
            </div>

            {/* Aadhaar Summary */}
            {aadhar && mobile && (
              <div className="mb-5 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-start md:text-center">
                  <div>
                    <p className="text-sm font-semibold text-black-700">
                      Aadhaar
                    </p>
                    <p className="text-md text-indigo-900">
                      {aadhar}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black-700">
                      Mobile
                    </p>
                    <p className="text-md text-indigo-900">
                      {mobile}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-md font-semibold text-gray-700 mb-3">
                  Enter 6-digit OTP <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={handleOtpChange}
                    maxLength={6}
                    placeholder="Enter OTP"
                    className={`w-full px-2 py-2 text-center text-lg tracking-widest bg-white/60 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all ${
                      otpError ? "border-red-400" : "border-gray-200"
                    }`}
                    inputMode="numeric"
                  />
                </div>
                {otpError && (
                  <p className="text-red-500 text-center mt-4 flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-exclamation"></i>{" "}
                    {otpError}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6 || otpError}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-md rounded-2xl cursor-pointer shadow-2xl hover:shadow-purple-500/50 hover:scale-102 transition-all duration-300 disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    VERIFY OTP <i className="fa-solid fa-arrow-right"></i>
                  </>
                )}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() => navigate("/associate/customer/Registration")}
                className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 text-md rounded-2xl cursor-pointer hover:bg-indigo-50 hover:scale-102 transition-all duration-300 flex items-center justify-center gap-3"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Back
              </button>
            </form>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default VerifyOtp;
