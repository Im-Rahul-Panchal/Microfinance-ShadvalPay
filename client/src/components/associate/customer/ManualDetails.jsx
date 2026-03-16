import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "../../../contexts/AuthContext";
import MenuItems from "../../dashboard/MenuItems";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import useLocationHook from "../../../hooks/useLocation";
import { BASE_URL } from "../../../config";
import api from "../../../api/api";

function ManualDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, authFlow } = useAuth();
  const { latitude, longitude } = useLocationHook();

  const params = new URLSearchParams(location.search);
  const tokenFromUrl = params.get("Token");

  const customerId =
    tokenFromUrl ||
    authFlow?.registrationData?.customerId ||
    location.state?.customerId ||
    null;

  useEffect(() => {
    if (customerId && !tokenFromUrl) {
      navigate(`/associate/customer/ManualDetails?Token=${customerId}`, {
        replace: true,
      });
    }
    if (!customerId) {
      navigate("/associate/customer/Registration", { replace: true });
    }
  }, [customerId, tokenFromUrl, navigate]);

  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    gender: "",
    email: "",
    pinCode: "",
    district: "",
    completeAddress: "",
    occupation: "",
    motherName: "",
    dob: null,
    panCard: "",
    cityArea: "",
    state: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [areas, setAreas] = useState([]);

  // Prefill from OTP flow
  useEffect(() => {
    if (location.state?.prefilledData) {
      const prefilled = location.state.prefilledData;
      setFormData((prev) => ({
        ...prev,
        fullName: prefilled.fullName || "",
        fatherName: prefilled.fatherName || "",
        gender: prefilled.gender || "",
        dob: prefilled.dob ? new Date(prefilled.dob) : null,
        pinCode: prefilled.pinCode || "",
        state: prefilled.state || "",
        completeAddress: prefilled.completeAddress || "",
      }));
    }
  }, [location.state]);

  const occupations = [
    "Salaried",
    "Self Employed",
    "Govt Employee",
    "Student",
    "Retired",
    "Unemployed",
    "Doctor",
    "Engineer",
    "Housewife or Homemaker",
    "Other",
  ];

  const genders = ["MALE", "FEMALE", "OTHER"];

  const minAgeDate = new Date();
  minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);

  // Pincode API
  useEffect(() => {
    const fetchPincode = async () => {
      if (formData.pinCode.length !== 6) return;

      try {
        const res = await api.post(`${BASE_URL}/api/pincode`, {
          userId: user?.userId,
          pinCode: formData.pinCode,
          latitude: latitude || "0",
          longitude: longitude || "0",
        });
        if (res.data?.resCode === "100" && res.data.data?.length > 0) {
          const d = res.data.data[0];
          setFormData((p) => ({
            ...p,
            cityArea: d.name,
            district: d.district,
            state: d.state,
          }));
          setAreas(res.data.data.map((a) => a.name));
        }
      } catch (err) {
        console.log("Pincode fetch failed");
      }
    };

    fetchPincode();
  }, [formData.pinCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "panCard") newValue = value.toUpperCase();
    if (name === "pinCode") newValue = value.replace(/\D/g, "").slice(0, 6);

    setFormData((p) => ({ ...p, [name]: newValue }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const err = {};
    const trim = (s) => (s || "").trim();

    if (!trim(formData.fullName)) err.fullName = "Full Name is required";
    else if (!/^[a-zA-Z\s]+$/.test(trim(formData.fullName)))
      err.fullName = "Only letters allowed";

    if (!trim(formData.fatherName)) err.fatherName = "Father's name required";
    if (!trim(formData.motherName)) err.motherName = "Mother's name required";

    if (!formData.gender) err.gender = "Select gender";

    if (!trim(formData.email)) err.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(trim(formData.email)))
      err.email = "Invalid email";

    if (!formData.pinCode || formData.pinCode.length !== 6)
      err.pinCode = "Valid 6-digit PIN required";

    if (!trim(formData.cityArea)) err.cityArea = "City/Area is required";
    if (!trim(formData.district)) err.district = "District is required";
    if (!trim(formData.state)) err.state = "State is required";

    if (!trim(formData.completeAddress) || formData.completeAddress.length < 10)
      err.completeAddress = "Complete address required (min 10 chars)";

    if (!formData.occupation) err.occupation = "Select occupation";

    if (!formData.dob) err.dob = "Date of birth required";
    else {
      const age = new Date().getFullYear() - formData.dob.getFullYear();
      if (age < 18) err.dob = "Must be 18+ years old";
    }

    if (!trim(formData.panCard)) err.panCard = "PAN required";
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(trim(formData.panCard)))
      err.panCard = "Invalid PAN (e.g. ABCDE1234F)";

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post(`${BASE_URL}/api/personalDetails`, {
        customerkey: customerId,
        fullName: formData.fullName.trim(),
        occupation: formData.occupation,
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName.trim(),
        gender: formData.gender,
        dob: formData.dob?.toISOString().split("T")[0],
        emailAddress: formData.email.trim(),
        panNo: formData.panCard.toUpperCase(),
        pinCode: formData.pinCode,
        city: formData.cityArea,
        district: formData.district,
        state: formData.state,
        fullAddress: formData.completeAddress.trim(),
        latitude: latitude || "0",
        longitude: longitude || "0",
        userId: user?.userId,
      });

      if (res.data.resCode === "100") {
        toast.success("Personal details saved!");
        navigate(`/associate/customer/UploadDocument?Token=${customerId}`, {
          state: { customerId },
        });
      } else {
        toast.error(res.data.msg || "Failed to save");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <MenuItems />
      <div className="flex-1 flex flex-col overflow-auto">
        <Search />
        {/* Main Form */}
        <div className="mt-5 mb-8 px-5 flex justify-center">
          <div className="w-full max-w-7xl">
            {/* Premium Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transition-all hover:shadow-indigo-200/50">
              <div className="flex items-start gap-4 mb-5">
                <div className="flex-shrink-0 w-13 h-13 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center">
                  <i className="fa-solid fa-id-card-clip text-white text-3xl"></i>
                </div>
                <div className="text-left">
                  <h1 className="text-xl md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Customer Personal Details
                  </h1>
                  <p className="text-gray-600 text-md md:text-lg">
                    Complete the profile to continue
                  </p>
                </div>
              </div>

              {/* API Error */}
              {apiError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-center font-medium">
                  {apiError}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Full Name */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 ${
                      errors.fullName ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Father's / Guardian Name{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="Enter father's name"
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.fatherName ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {errors.fatherName && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.fatherName}
                    </p>
                  )}
                </div>

                {/* Mother's Name */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Mother's Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="Enter mother's name"
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.motherName ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {errors.motherName && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.motherName}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Gender <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    autoComplete="off"
                    onChange={handleChange}
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.gender ? "border-red-200" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select Gender</option>
                    {genders.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-red-500 text-sm mt-2">{errors.gender}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Date of Birth <span className="text-red-600">*</span>
                  </label>
                  <DatePicker
                    autoComplete="off"
                    selected={formData.dob}
                    onChange={(date) =>
                      setFormData((p) => ({ ...p, dob: date }))
                    }
                    maxDate={minAgeDate}
                    dateFormat="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    placeholderText="Select DOB"
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.dob ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {errors.dob && (
                    <p className="text-red-500 text-sm mt-2">{errors.dob}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="example@domain.com"
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.email ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-2">{errors.email}</p>
                  )}
                </div>

                {/* PAN Card */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    PAN Card Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="panCard"
                    value={formData.panCard}
                    autoComplete="off"
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.panCard ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {errors.panCard && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.panCard}
                    </p>
                  )}
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Occupation <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="occupation"
                    value={formData.occupation}
                    autoComplete="off"
                    onChange={handleChange}
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.occupation ? "border-red-200" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select Occupation</option>
                    {occupations.map((occ) => (
                      <option key={occ} value={occ}>
                        {occ}
                      </option>
                    ))}
                  </select>
                  {errors.occupation && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.occupation}
                    </p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Pin Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    autoComplete="off"
                    onChange={handleChange}
                    maxLength={6}
                    placeholder="110001"
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.pinCode ? "border-red-200" : "border-gray-200"
                    }`}
                  />
                  {errors.pinCode && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.pinCode}
                    </p>
                  )}
                </div>

                {/* City/Area */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    City / Area <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="cityArea"
                    value={formData.cityArea}
                    onChange={handleChange}
                    className={`w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 ${
                      errors.cityArea ? "border-red-200" : "border-gray-200"
                    }`}
                  >
                    <option value="">Select City</option>
                    {areas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {errors.cityArea && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.cityArea}
                    </p>
                  )}
                </div>

                {/* District & State (Auto-filled) */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    District
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    autoComplete="off"
                    readOnly
                    className="w-full px-2 py-2 bg-gray-100 rounded-2xl focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    autoComplete="off"
                    readOnly
                    className="w-full px-2 py-2 bg-gray-100 rounded-2xl focus:outline-none cursor-not-allowed"
                  />
                </div>

                {/* Complete Address */}
                <div className="md:col-span-2">
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Complete Address <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    name="completeAddress"
                    value={formData.completeAddress}
                    autoComplete="off"
                    onChange={handleChange}
                    rows={4}
                    placeholder="House no, street, landmark..."
                    className={`w-full px-5 py-4 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200 resize-none ${
                      errors.completeAddress
                        ? "border-red-200"
                        : "border-gray-200"
                    }`}
                  />
                  {errors.completeAddress && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.completeAddress}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="md:col-span-2 flex justify-center mt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-3 md:px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-md md:text-lg rounded-2xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-60 flex items-center gap-3 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>{" "}
                        Saving...
                      </>
                    ) : (
                      <>
                        SAVE & CONTINUE{" "}
                        <i className="fa-solid fa-arrow-right"></i>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default ManualDetails;
