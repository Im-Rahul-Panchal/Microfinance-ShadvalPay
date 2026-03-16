import React, { useState, useEffect } from "react";
import { useNavigate, useLocation as useRouterLocation } from "react-router-dom";
import toast from "react-hot-toast";
import MenuItems from "../../dashboard/MenuItems";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import ImageModal from "../../common/ImageModal";
import CropModal from "../../common/CropModal";
import { useAuth } from "../../../contexts/AuthContext";
import useLocation from "../../../hooks/useLocation";
import { BASE_URL } from "../../../config";
import api from "../../../api/api";

function UploadDocument() {
  const navigate = useNavigate();
  const location = useRouterLocation();
  const { authFlow, user } = useAuth();
  const { latitude, longitude } = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [cropFieldName, setCropFieldName] = useState("");
  const [originalFile, setOriginalFile] = useState(null);

  const params = new URLSearchParams(location.search);
  const tokenFromUrl = params.get("Token");

  const customerId =
    tokenFromUrl ||
    authFlow?.registrationData?.customerId ||
    location.state?.customerId ||
    null;

  useEffect(() => {
    if (customerId && !tokenFromUrl) {
      navigate(`/associate/customer/UploadDocument?Token=${customerId}`, {
        replace: true,
      });
    }
    if (!customerId) {
      navigate("/associate/customer/Registration", { replace: true });
    }
  }, [customerId, tokenFromUrl, navigate]);

  const [documents, setDocuments] = useState({
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    photo: null,
    signature: null,
    fatherMotherAadhaar: null,
    otherDocuments: null,
  });

  const [fileNames, setFileNames] = useState({
    aadhaarFront: "No file chosen",
    aadhaarBack: "No file chosen",
    panCard: "No file chosen",
    photo: "No file chosen",
    signature: "No file chosen",
    fatherMotherAadhaar: "No file chosen",
    otherDocuments: "No file chosen",
  });

  const [errors, setErrors] = useState({});

  const MAX_FILE_SIZE = 300 * 1024;
  const OTHER_DOC_MAX = 500 * 1024;
  const MAX_TOTAL_SIZE = 3 * 1024 * 1024;

  const allowedTypes = {
    aadhaarFront: ["image/jpeg", "image/png", "application/pdf"],
    aadhaarBack: ["image/jpeg", "image/png", "application/pdf"],
    panCard: ["image/jpeg", "image/png", "application/pdf"],
    photo: ["image/jpeg", "image/png"],
    signature: ["image/jpeg", "image/png"],
    fatherMotherAadhaar: ["image/jpeg", "image/png", "application/pdf"],
    otherDocuments: ["image/jpeg", "image/png", "application/pdf"],
  };

  const validateFile = (file, fieldName, label) => {
    if (!allowedTypes[fieldName].includes(file.type)) {
      return fieldName === "photo"
        ? `${label} must be JPG/PNG only`
        : `${label} must be JPG/PNG/PDF only`;
    }
    const limit =
      fieldName === "otherDocuments" ? OTHER_DOC_MAX : MAX_FILE_SIZE;
    if (file.size > limit) {
      return `${label} must be under ${
        limit === OTHER_DOC_MAX ? "500 KB" : "300 KB"
      }`;
    }
    return null;
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setTempImage(url);
      setCropFieldName(fieldName);
      setOriginalFile(file);
      setCropModalOpen(true);
      return;
    }
    handleFinalFile(file, fieldName);
  };

  const handleFinalFile = (file, fieldName) => {
    const labels = {
      aadhaarFront: "Aadhaar Front",
      aadhaarBack: "Aadhaar Back",
      panCard: "Pan Card",
      photo: "Photo",
      signature: "Signature",
      fatherMotherAadhaar: "Father/Mother Aadhaar",
      otherDocuments: "Other Documents",
    };

    const err = validateFile(file, fieldName, labels[fieldName]);

    if (err) {
      setErrors((p) => ({ ...p, [fieldName]: err }));
      toast.error(err);
      return;
    }

    setDocuments((p) => ({ ...p, [fieldName]: file }));
    setFileNames((p) => ({ ...p, [fieldName]: file.name }));
    setErrors((p) => ({ ...p, [fieldName]: null }));
    toast.success(`${labels[fieldName]} uploaded`);
  };

  const handleViewFile = (fieldName) => {
    const file = documents[fieldName];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (file.type === "application/pdf") {
      window.open(url, "_blank");
    } else {
      setSelectedImage(url);
      setModalOpen(true);
    }
  };

  const calculateTotalSize = () => {
    return Object.values(documents).reduce((acc, f) => acc + (f?.size || 0), 0);
  };

  const validateForm = () => {
    const required = [
      "aadhaarFront",
      "aadhaarBack",
      "photo",
      "signature",
      "fatherMotherAadhaar",
      "panCard",
      "otherDocuments",
    ];
    const newErrors = {};

    required.forEach((key) => {
      if (!documents[key]) {
        const label = {
          aadhaarFront: "Aadhaar Front",
          aadhaarBack: "Aadhaar Back",
          photo: "Photo",
          signature: "Signature",
          fatherMotherAadhaar: "Father/Mother Aadhaar",
          panCard: "Pan Card",
          otherDocuments: "Other Documents",
        }[key];
        newErrors[key] = `${label} is required`;
      }
    });

    const total = calculateTotalSize();
    if (total > MAX_TOTAL_SIZE) {
      toast.error("Total file size exceeds 3MB");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) return toast.error("Customer ID missing");
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append("latitude", latitude || "0");
    formData.append("longitude", longitude || "0");
    formData.append("customerKey", customerId);
    formData.append("userId", user?.userId || "");

    const fieldMap = {
      aadhaarFront: "aadharFront",
      aadhaarBack: "aadharBack",
      panCard: "panCard",
      photo: "photo",
      signature: "signature",
      fatherMotherAadhaar: "fatherMotherAadhar",
      otherDocuments: "otherDocuments",
    };

    Object.keys(documents).forEach((key) => {
      if (documents[key]) {
        formData.append(fieldMap[key], documents[key]);
      }
    });

    try {
      const res = await api.post(`${BASE_URL}/api/uploadDocuments`, formData);
      if (res.data.resCode === "100") {
        toast.success("Documents uploaded successfully!");
        navigate(`/associate/customer/CustomerProfile?Token=${customerId}`);
      } else {
        toast.error(res.data.msg || "Upload failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage("");
  };

  const renderFileInput = (fieldName, label, required = false) => (
    <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <label className="text-md font-semibold text-gray-800">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {documents[fieldName] && (
          <span className="text-green-600 text-sm font-medium flex items-center gap-2">
            <i className="fa-solid fa-check-circle"></i> Ready
          </span>
        )}
      </div>

      <input
        type="file"
        id={fieldName}
        className="hidden"
        onChange={(e) => handleFileChange(e, fieldName)}
        accept="image/*,.pdf"
      />

      <label htmlFor={fieldName} className="block w-full cursor-pointer">
        <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300">
          <i className="fa-solid fa-cloud-upload-alt text-5xl text-indigo-400 mb-4"></i>
          <p className="text-gray-600 font-medium">
            Click to upload {label.toLowerCase()}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {fieldName === "photo" ? "JPG/PNG only" : "JPG, PNG or PDF"} • Max{" "}
            {fieldName === "otherDocuments" ? "500 KB" : "300 KB"}
          </p>
        </div>
      </label>

      {/* File Name Display */}
      {fileNames[fieldName] !== "No file chosen" && (
        <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
          <p className="text-sm font-medium text-indigo-800 truncate">
            {fileNames[fieldName]}
          </p>
        </div>
      )}

      {/* Error */}
      {errors[fieldName] && (
        <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
          <i className="fa-solid fa-exclamation-circle"></i>
          {errors[fieldName]}
        </p>
      )}

      {/* View Button */}
      {documents[fieldName] && (
        <button
          type="button"
          onClick={() => handleViewFile(fieldName)}
          className="mt-4 w-full py-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:scale-105 transition-all shadow-lg cursor-pointer"
        >
          View File
        </button>
      )}
    </div>
  );

  const totalSizeMB = (calculateTotalSize() / (1024 * 1024)).toFixed(2);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <MenuItems />
      <div className="flex-1 flex flex-col overflow-auto">
        <Search />
        <div className="mb-6 flex justify-center">
          <div className="px-5  mt-4">
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/30 p-10">
              {/* Header */}
              <div className="flex items-center mb-4 gap-3">
                <div className="flex-shrink-0 w-13 h-13 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center">
                  <i className="fa-solid fa-folder-open text-white text-3xl"></i>
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Upload Documents
                  </h1>
                  <p className="text-gray-600 text-md md:text-lg">
                    Please upload clear copies of all required documents
                  </p>
                </div>
              </div>

              {/* File Upload Grid */}
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                  {renderFileInput("aadhaarFront", "Aadhaar Front", true)}
                  {renderFileInput("aadhaarBack", "Aadhaar Back", true)}
                  {renderFileInput("panCard", "Pan Card")}
                  {renderFileInput("photo", "Photo", true)}
                  {renderFileInput("signature", "Signature", true)}
                  {renderFileInput(
                    "fatherMotherAadhaar",
                    "Father/Mother Aadhaar",
                    true
                  )}
                  {renderFileInput("otherDocuments", "Other Documents")}
                </div>

                {/* Summary Card */}
                <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
                  <h3 className="text-xl font-bold text-indigo-800 mb-4">
                    Upload Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-white rounded-xl p-4 shadow">
                      <p className="text-xl font-bold text-indigo-600">
                        {totalSizeMB} MB
                      </p>
                      <p className="text-sm text-gray-600">Total Size</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow">
                      <p className="text-xl font-bold text-emerald-600">
                        {Object.values(documents).filter(Boolean).length}
                      </p>
                      <p className="text-sm text-gray-600">Files Selected</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow">
                      <p className="text-xl font-bold text-purple-600">7</p>
                      <p className="text-sm text-gray-600">Total Required</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow">
                      <p className="text-xl font-bold text-orange-600">
                        {7 - Object.values(documents).filter(Boolean).length}
                      </p>
                      <p className="text-sm text-gray-600">Remaining</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-4">
                    <i className="fa-solid fa-circle-info text-indigo-600 mr-1"></i>
                    Max total size: 3MB • Individual files: 300KB (500KB for
                    others)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="text-center mt-10">
                  <button
                    type="submit"
                    className="px-4 md:px-3 py-2 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-md md:text-lg rounded-2xl shadow-2xl hover:scale-103 transition-all duration-300 flex items-center gap-1 md:gap-4 mx-auto cursor-pointer"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
                    UPLOAD ALL DOCUMENTS
                  </button>
                </div>
              </form>
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

      <CropModal
        isOpen={cropModalOpen}
        imageSrc={tempImage}
        originalName={originalFile?.name}
        onCancel={() => setCropModalOpen(false)}
        onCropComplete={(croppedFile) => {
          handleFinalFile(croppedFile, cropFieldName);
          setCropModalOpen(false);
        }}
      />
    </div>
  );
}

export default UploadDocument;
