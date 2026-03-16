import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import MenuItems from "../../dashboard/MenuItems";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import useLocationHook from "../../../hooks/useLocation";
import { BASE_URL } from "../../../config";
import api from "../../../api/api";

const Registration = () => {
  const navigate = useNavigate();
  const { startRegistrationFlow, user } = useAuth();
  const { latitude, longitude } = useLocationHook();

  const [formData, setFormData] = useState({ aadhar: "", mobile: "" });
  const [errors, setErrors] = useState({ aadhar: "", mobile: "" });
  const [otpLoading, setOtpLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  //  Validation functions
  const validateAadhar = (v) => {
    if (!v) return "Aadhaar number is required";
    if (!/^\d+$/.test(v)) return "Aadhaar number must contain only numbers";
    if (v.length !== 12) return "Aadhaar number must be exactly 12 digits";
    return "";
  };

  const validateMobile = (v) => {
    if (!v) return "Mobile number is required";
    if (!/^\d+$/.test(v)) return "Mobile number must contain only numbers";
    if (v.length !== 10) return "Mobile number must be exactly 10 digits";
    if (!/^[6-9]/.test(v)) return "Mobile number should start with 6-9";
    return "";
  };

  //  Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (!/^\d*$/.test(value)) return;

    setFormData((p) => ({ ...p, [name]: value }));
    const error =
      name === "aadhar" ? validateAadhar(value) : validateMobile(value);
    setErrors((p) => ({ ...p, [name]: error }));
  };

  const isFormValid = () => {
    return (
      !validateAadhar(formData.aadhar) &&
      !validateMobile(formData.mobile) &&
      formData.aadhar &&
      formData.mobile
    );
  };

  //  Shared function for both Verify and Manual
  const handleSubmit = async (verifyType) => {
    if (!isFormValid()) return;

    // Start specific loading
    if (verifyType === "otp") {
      setOtpLoading(true);
    } else {
      setManualLoading(true);
    }

    setApiError("");

    try {
      let apiEndpoint, requestBody;

      if (verifyType === "otp") {
        apiEndpoint = `${BASE_URL}/api/generateAadhaarOtp`;
        requestBody = {
          userId: user?.userId,
          aadharNumber: formData.aadhar,
          mobileNumber: formData.mobile,
          latitude: latitude || "0",
          longitude: longitude || "0",
        };
      } else {
        apiEndpoint = `${BASE_URL}/api/verification`;
        requestBody = {
          userId: user?.userId,
          latitude: latitude || "0",
          longitude: longitude || "0",
          aadharNumber: formData.aadhar,
          mobileNumber: formData.mobile,
          verifyType: verifyType,
        };
      }

      const response = await api.post(apiEndpoint, requestBody, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      if (data.resCode === "100" && data.msg.toLowerCase() === "success") {
        if (verifyType === "otp") {
          // OTP flow
          startRegistrationFlow({
            aadhar: formData.aadhar,
            mobile: formData.mobile,
            aadhaarRef: data.data.aadhaarRef,
          });

          navigate(
            `/associate/customer/VerifyOtp?tokenID=${data.data.aadhaarRef}`,
            {
              state: {
                aadhar: formData.aadhar,
                mobile: formData.mobile,
                aadhaarRef: data.data.aadhaarRef,
              },
            }
          );
        } else {
          // Manual flow
          startRegistrationFlow({
            aadhar: formData.aadhar,
            mobile: formData.mobile,
            customerId: data.data.customerKey,
          });

          navigate(
            `/associate/customer/ManualDetails?Token=${data.data.customerKey}`,
            {
              state: {
                aadhar: formData.aadhar,
                mobile: formData.mobile,
                customerId: data.data.customerKey,
              },
            }
          );
        }
      } else {
        if (data.resCode === "107") {
          setApiError(
            data.msg || "Invalid Aadhaar Number or OTP already sent."
          );
        } else {
          setApiError(data.msg || "Verification failed");
        }
      }
    } catch (err) {
      setApiError(`Network error: ${err.message}`);
    } finally {
      setOtpLoading(false);
      setManualLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden text-[13px] sm:text-[13px] md:text-[14px] lg:text-[16px]">
      <MenuItems />

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-md shadow-sm">
          <Search />
        </div>
        {/* Form Section */}
        <div className="flex flex-1 justify-center items-center p-6 md:p-1">
          {/* CARD */}
          <div
            className="w-full max-w-[500px] bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 
          transition-all duration-500 hover:shadow-2xl hover:border-indigo-200"
          >
            <h2
              className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 
            bg-clip-text text-transparent mb-6"
            >
              Client Enrollment
            </h2>

            <form className="space-y-6">
              {/* Aadhaar Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Aadhaar Number <span className="text-red-600">*</span>
                </label>

                <input
                  id="aadhar"
                  name="aadhar"
                  type="text"
                  value={formData.aadhar}
                  onChange={handleInputChange}
                  autoComplete="off"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhaar number"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm
                  outline-none"
                />

                {errors.aadhar && (
                  <p className="text-red-500 text-xs mt-1">{errors.aadhar}</p>
                )}
              </div>

              {/* Mobile Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mobile Number <span className="text-red-600">*</span>
                </label>

                <input
                  id="mobile"
                  name="mobile"
                  type="text"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  autoComplete="off"
                  maxLength={10}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white/60 backdrop-blur-sm
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition"
                />

                {errors.mobile && (
                  <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                )}
              </div>

              {/* API Error */}
              {apiError && (
                <p className="text-red-600 text-center text-sm font-medium bg-red-50 py-2 rounded-md">
                  {apiError}
                </p>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                {/* Verify & Proceed */}
                <button
                  type="button"
                  onClick={() => handleSubmit("otp")}
                  disabled={otpLoading || manualLoading || !isFormValid()}
                  className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 shadow-md
                    ${
                      isFormValid()
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 hover:scale-105 cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                >
                  {otpLoading ? "Processing..." : "Verify & Proceed"}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit("manual")}
                  disabled={otpLoading || manualLoading || !isFormValid()}
                  className={`px-6 py-2 rounded-xl font-semibold border transition-all duration-300 shadow-md
                  ${
                    isFormValid()
                      ? "bg-white border-indigo-500 text-indigo-600 hover:bg-indigo-50 hover:scale-105 cursor-pointer"
                      : "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                  }`}
                >
                  {manualLoading ? "Processing..." : "Manual Proceed"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Registration;
