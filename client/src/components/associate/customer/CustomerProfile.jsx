import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MenuItems from "../../dashboard/MenuItems";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import { useAuth } from "../../../contexts/AuthContext";
import useLocationHook from "../../../hooks/useLocation";
import { BASE_URL, CUSTOMER_FOLDER } from "../../../config";
import api from "../../../api/api";
import ImageModal from "../../common/ImageModal";

const CustomerProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authFlow } = useAuth();
  const loc = useLocationHook();

  const { latitude, longitude, error: locationError, loading: locationLoading } = loc;

  const [profile, setProfile] = useState(null);
  const [loanAccounts, setLoanAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasFetchedData = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const urlParams = new URLSearchParams(location.search);
  const tokenFromUrl = urlParams.get("token") || urlParams.get("Token");

  const derivedCustomerKey =
    tokenFromUrl ||
    authFlow?.registrationData?.customerId ||
    location.state?.customerKey ||
    null;

  useEffect(() => {
    hasFetchedData.current = false;
  }, [tokenFromUrl]);

  useEffect(() => {
    if (!derivedCustomerKey) {
      navigate("/associate/customer/Registration", { replace: true });
      return;
    }
    if (!tokenFromUrl) {
      navigate(`/associate/customer/CustomerProfile?token=${derivedCustomerKey}`, { replace: true });
    }
  }, [tokenFromUrl, derivedCustomerKey, navigate]);

  useEffect(() => {
    if (locationLoading || locationError || !derivedCustomerKey || !user?.userId) return;
    if (hasFetchedData.current) return;
    hasFetchedData.current = true;

    const fetchData = async () => {
      try {
        const finalKey = tokenFromUrl || derivedCustomerKey;

        const [profileRes, docsRes, loanRes] = await Promise.all([
          api.post(`${BASE_URL}/api/customerProfile`, {
            customerKey: finalKey,
            latitude: latitude || 0,
            longitude: longitude || 0,
            userId: user?.userId,
          }),
          api.post(`${BASE_URL}/api/customerDocuments`, {
            customerKey: finalKey,
            latitude: latitude || 0,
            longitude: longitude || 0,
            userId: user?.userId,
          }),
          api.post(`${BASE_URL}/api/customerLoanAccounts`, {
            customerKey: finalKey,
            latitude: latitude || 0,
            longitude: longitude || 0,
            userId: user?.userId,
          }),
        ]);

        if (profileRes.data.resCode !== "100") throw new Error("Profile fetch failed");
        if (docsRes.data.resCode !== "100") throw new Error("Documents fetch failed");

        const profileInfo = profileRes.data.data;
        const docs = docsRes.data.data || [];
        const loans = loanRes.data.resCode === "100" ? loanRes.data.data || [] : [];

        const photoDoc = docs.find((d) => d.DocumentType === "Photo");
        const photoUrl = photoDoc ? `${CUSTOMER_FOLDER}/${photoDoc.ImagePath}` : "/user.svg";

        setProfile({
          photo: photoUrl,
          name: profileInfo.name || "N/A",
          customerCode: profileInfo.customerCode || "N/A",
          phone: profileInfo.mobile || "N/A",
          personalDetails: {
            fullName: profileInfo.name,
            motherName: profileInfo.motherName || "N/A",
            fatherName: profileInfo.fatherName || "N/A",
            dob: profileInfo.dob || "N/A",
            gender: profileInfo.gender || "N/A",
            email: profileInfo.email || "N/A",
            customerStatus: profileInfo.isBlock === "UnBlock" ? "Active" : "Blocked",
            panNumber: profileInfo.panNum || "N/A",
            aadharNumber: profileInfo.aadhaarNumber || "N/A",
            address: profileInfo.comuAddress || "N/A",
            pinCode: profileInfo.pinCode || "N/A",
            district: profileInfo.district || "N/A",
            state: profileInfo.state || "N/A",
          },
          kycDocuments: docs.map((d) => ({
            label: d.DocumentType,
            fileUrl: `${CUSTOMER_FOLDER}/${d.ImagePath}`,
          })),
        });

        setLoanAccounts(loans);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tokenFromUrl, derivedCustomerKey, user?.userId, latitude, longitude, locationLoading, locationError]);

  const handleViewDocument = (url) => {
    if (url.toLowerCase().endsWith(".pdf")) {
      window.open(url, "_blank");
    } else {
      setSelectedImage(url);
      setModalOpen(true);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage("");
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <MenuItems />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-6xl text-indigo-600 mb-6"></i>
            <p className="text-xl text-gray-700">Loading customer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        <MenuItems />
        <div className="flex-1 flex flex-col overflow-auto">
          <Search />
          <div className="mt-5 mb-8 px-5 flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center max-w-md">
              <i className="fa-solid fa-exclamation-triangle text-red-600 text-6xl mb-6"></i>
              <h3 className="text-2xl font-bold text-red-700 mb-4">Error Loading Profile</h3>
              <p className="text-gray-700">{error || "No data available"}</p>
              <button
                onClick={() => navigate(-1)}
                className="mt-6 px-8 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition"
              >
                Go Back
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  return (
  <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
    <MenuItems />
    <div className="flex-1 flex flex-col overflow-auto">
      <Search />
      <div className="p-3">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 p-1 mb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left"></i> Back
            </button>

            <div className="flex items-center gap-7">
              <img
                src={profile.photo}
                alt="Customer"
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-200 shadow-xl"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {profile.name}
                </h1>
                <p className="text-lg text-indigo-700 font-semibold">
                  {profile.customerCode}
                </p>
                <p className="text-md text-gray-600">
                  Mobile: {profile.phone}
                </p>
              </div>
            </div>

            <div
              className={`px-6 py-3 rounded-2xl font-bold text-white shadow-lg ${
                profile.personalDetails.customerStatus === "Active"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                  : "bg-gradient-to-r from-red-500 to-pink-600"
              }`}
            >
              {profile.personalDetails.customerStatus}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PERSONAL DETAILS */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 px-8">
            <h2 className="text-xl font-bold text-indigo-800 my-4 flex items-center gap-3 justify-center">
              <i className="fa-solid fa-user-circle text-2xl"></i>
              Personal Details
            </h2>

            <div className="text-md">
              {Object.entries(profile.personalDetails).map(([key, value]) => {
                const labels = {
                  fullName: "Full Name",
                  fatherName: "Father's Name",
                  motherName: "Mother's Name",
                  dob: "Date of Birth",
                  gender: "Gender",
                  email: "Email",
                  panNumber: "PAN Card",
                  aadharNumber: "Aadhaar",
                  address: "Address",
                  pinCode: "Pin Code",
                  district: "District",
                  state: "State",
                };

                return (
                  <div
                    key={key}
                    className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-semibold text-gray-700">
                      {labels[key] || key}:
                    </span>
                    <span className="text-gray-900 font-medium text-right">
                      {value || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/*KYC DOCUMENTS*/}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6">
            <h2 className="text-xl font-bold text-indigo-800 mb-6 flex items-center gap-3 justify-center">
              <i className="fa-solid fa-file-shield text-2xl"></i>
              KYC Documents
            </h2>

            <div className="grid grid-cols-1 gap-2">
              {profile.kycDocuments.map((doc, i) => (
                <button
                  key={i}
                  className="group flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl hover:from-indigo-100 hover:to-purple-100 transition-all shadow-md hover:shadow-xl border border-indigo-100"
                >
                  <div className="flex items-center gap-4">
                    <i className="fa-solid fa-file-contract text-xl text-indigo-600"></i>
                    <span className="font-semibold text-gray-800">
                      {doc.label}
                    </span>
                  </div>
                  <i
                    className="fa-solid fa-eye text-indigo-600 cursor-pointer"
                    onClick={() => handleViewDocument(doc.fileUrl)}
                  ></i>
                </button>
              ))}
            </div>
          </div>

          {/* LOAN ACCOUNTS */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-8 text-center">
              <h2 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-4 justify-center">
                <i className="fa-solid fa-credit-card text-2xl"></i>
                Loan Accounts
              </h2>
              {loanAccounts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                  {loanAccounts.map((acc, i) => (
                    <div
                      key={acc.loanId || i}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                    >
                      <h3 className="text-xl font-bold text-indigo-700 mb-4 text-center">
                        Loan Account #{i + 1}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-md">
                        <div>
                          <span className="font-semibold text-gray-700">Account No:</span>
                          <p className="text-indigo-900 font-semibold">
                            {acc.loanAccountNumber || "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-700">Loan Type:</span>
                          <p className="text-indigo-900">
                            {acc.loanType || "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-700">Loan Amount:</span>
                          <p className="text-indigo-900 font-semibold">
                            ₹{parseFloat(acc.loanAmount || 0).toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-700">Status:</span>
                          <span
                            className={`ml-2 px-3 py-1 rounded-full text-white font-bold text-sm ${
                              acc.loanStatus?.toLowerCase() === "active"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          >
                            {acc.loanStatus || "N/A"}
                          </span>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-700">EMI Amount:</span>
                          <p className="text-indigo-900">
                            {acc.emiAmount === "N/A"
                              ? "N/A"
                              : `₹${parseFloat(acc.emiAmount).toLocaleString()}`}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-gray-700">EMI Due Date:</span>
                          <p className="text-indigo-900">
                            {acc.emiDueDate || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <i className="fa-solid fa-inbox text-8xl text-gray-300 mb-6"></i>
                  <p className="text-2xl text-gray-600 font-semibold">
                    No Loan Records Found
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>

    <ImageModal
      isOpen={modalOpen}
      imageUrl={selectedImage}
      onClose={closeModal}
    />
  </div>
);
};

export default CustomerProfile;