import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MenuItems from "../../dashboard/MenuItems";
import api from "../../../api/api.js";
import useLocation from "../../../hooks/useLocation.js";
import { BASE_URL } from "../../../config";
import { useAuth } from "../../../contexts/AuthContext";

const ApplyNewLoan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const { latitude, longitude, loading: locationLoading } = location;

  const tenureTypes = ["Daily", "Weekly", "Monthly"];

  const [formData, setFormData] = useState({
    applyDate: new Date(),
    clientCode: "",
    clientName: "",
    clientId: "",
    branchId: "",
    associateStaff: "",
    centerId: "",
    associateId: "",
    groupId: "",
    itemType: "",
    itemName: "",
    loanTypeId: "",
    loanSchemeId: "",
    loanRequestAmount: "",
    tenureType: "",
    tenureTime: "",
    payMode: "Other Bank",
    memberName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    bankBranch: "",
    guarantor1: "",
    guarantor2: "",
    documents: null,
  });

  const [errors, setErrors] = useState({});
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [branchList, setBranchList] = useState([]);
  const [centers, setCenters] = useState([]);
  const [groups, setGroups] = useState([]);
  const [guarantors, setGuarantors] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [loanSchemes, setLoanSchemes] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const clientRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all data
  useEffect(() => {
    if (locationLoading || !latitude || !longitude) return;

    const fetchAll = async () => {
      const endpoints = [
        { url: "/api/clients", setter: setCustomers },
        { url: "/api/branch", setter: setBranchList },
        { url: "/api/center", setter: setCenters },
        { url: "/api/group", setter: setGroups },
        { url: "/api/guarantor", setter: setGuarantors },
        {
          url: "/api/guarantor",
          setter: (data) =>
            setGuarantors(data.filter((g) => g.status === "Success")),
        },
        { url: "/api/loanType", setter: setLoanTypes },
        { url: "/api/scheme", setter: setLoanSchemes },
      ];

      for (const { url, setter } of endpoints) {
        try {
          const res = await api.post(`${BASE_URL}${url}`, {
            userId: user?.userId,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          });
          if (res.data?.resCode === "100") setter(res.data.data || []);
        } catch (err) {
          console.error(`Failed: ${url}`, err);
        }
      }
    };

    fetchAll();
  }, [latitude, longitude, locationLoading, user?.userId]);

  useEffect(() => {
    if (customers.length > 0) {
      const successClients = customers.filter((c) => c.status === "Success");
      setFilteredCustomers(successClients);
    }
  }, [customers]);

  // Client Search
  const handleClientSearch = (value) => {
    setShowClientDropdown(true);
    const filtered = customers.filter(
      (c) =>
        c.code?.toLowerCase().includes(value.toLowerCase()) ||
        c.name?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  const selectCustomer = (customer) => {
    setFormData((prev) => ({
      ...prev,
      clientCode: customer.code || "",
      clientName: customer.name || "",
      clientId: customer.customerId || customer.id || "",
      guarantor1: "",
      guarantor2: "",
    }));
    setShowClientDropdown(false);
    setErrors((prev) => ({ ...prev, clientCode: "" }));
  };

  // IFSC Fetch
  const fetchIfscDetails = async (ifsc) => {
    if (ifsc.length !== 11) {
      setFormData((p) => ({ ...p, bankName: "", bankBranch: "" }));
      setErrors((prev) => ({ ...prev, ifscCode: "", bankName: "" }));
      return;
    }
    try {
      const res = await api.post(`${BASE_URL}/api/ifsc`, {
        userId: user?.userId,
        ifsc,
        latitude: latitude || "0",
        longitude: longitude || "0",
      });

      if (res.data?.resCode === "100" && res.data.data) {
        setFormData((p) => ({
          ...p,
          bankName: res.data.data.bank || "",
          bankBranch: res.data.data.branch || "",
        }));
        setErrors((prev) => ({
          ...prev,
          ifscCode: "",
          bankName: "",
        }));
      } else {
        setFormData((p) => ({ ...p, bankName: "", bankBranch: "" }));
        setErrors((prev) => ({
          ...prev,
          bankName: "Invalid IFSC or bank not found",
        }));
      }
    } catch {
      setFormData((p) => ({ ...p, bankName: "", bankBranch: "" }));
      setErrors((prev) => ({
        ...prev,
        bankName: "Invalid IFSC or bank not found",
      }));
    }
  };

  // Validation
  const validate = () => {
    const err = {};
    if (!formData.clientId) err.clientCode = "Please select a client";
    if (!formData.branchId) err.branchId = "Branch is required";
    if (!formData.centerId) err.centerId = "Center is required";
    if (!formData.groupId) err.groupId = "Group is required";
    if (!formData.loanTypeId) err.loanTypeId = "Loan type is required";
    if (!formData.loanSchemeId) err.loanSchemeId = "Loan scheme is required";
    if (!formData.loanRequestAmount || formData.loanRequestAmount < 1000)
      err.loanRequestAmount = "Minimum loan amount is ₹1,000";
    if (!formData.tenureType) err.tenureType = "Tenure type is required";
    if (!formData.tenureTime || formData.tenureTime < 1)
      err.tenureTime = "Tenure must be at least 1";

    // Item Type & Item Name pair validation
    const hasItemType = formData.itemType?.trim();
    const hasItemName = formData.itemName?.trim();

    if ((hasItemType && !hasItemName) || (!hasItemType && hasItemName)) {
      err.itemType = "Item Type and Item Name must be filled together";
      err.itemName = "Item Type and Item Name must be filled together";
    }

    if (!formData.guarantor1) err.guarantor1 = "Guarantor 1 is required";
    if (!formData.guarantor2) err.guarantor2 = "Guarantor 2 is required";
    if (
      formData.guarantor1 &&
      formData.guarantor2 &&
      formData.guarantor1 === formData.guarantor2
    ) {
      err.guarantor2 = "Both guarantors cannot be the same person";
    }
    if (formData.payMode === "Other Bank") {
      if (!formData.memberName?.trim())
        err.memberName = "Account holder name is required";
      if (!formData.accountNumber?.trim())
        err.accountNumber = "Account number is required";
      if (!formData.ifscCode || formData.ifscCode.length !== 11)
        err.ifscCode = "Enter valid 11-digit IFSC code";
      if (!formData.bankName) err.bankName = "Invalid IFSC or bank not found";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newVal = value;

    if (name === "clientCode") {
      handleClientSearch(value);
      setFormData((p) => ({ ...p, clientCode: value }));
    } else if (name === "branchId") {
      const b = branchList.find((x) => x.branchId == value);
      setFormData((p) => ({
        ...p,
        branchId: value,
        associateStaff: b?.associateName || "",
        associateId: b?.associateId || "",
      }));
    } else if (name === "centerId") {
      const c = centers.find((x) => x.centerId == value);
      setFormData((p) => ({
        ...p,
        centerId: value,
      }));
    } else if (name === "groupId") {
      const g = groups.find((x) => x.id == value);
      setFormData((p) => ({
        ...p,
        groupId: value,
      }));
    } else if (name === "loanTypeId") {
      const t = loanTypes.find((x) => x.id == value);
      setFormData((p) => ({
        ...p,
        loanTypeId: value,
      }));
    } else if (name === "loanSchemeId") {
      const s = loanSchemes.find((x) => x.id == value);
      setFormData((p) => ({
        ...p,
        loanSchemeId: value,
      }));
    } else if (name === "ifscCode") {
      newVal = value
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase()
        .slice(0, 11);
      setFormData((p) => ({ ...p, ifscCode: newVal }));
      fetchIfscDetails(newVal);
    } else {
      setFormData((p) => ({ ...p, [name]: newVal }));
    }
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpg", "image/jpeg", "application/pdf"];
    if (!allowed.includes(file.type))
      return toast.error("Only JPG/PNG or PDF allowed");
    if (file.size > 500 * 1024) return toast.error("File must be under 500 KB");
    setFormData((p) => ({ ...p, documents: file }));
    toast.success("Document ready");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      (formData.itemType && !formData.itemName) ||
      (!formData.itemType && formData.itemName)
    ) {
      toast.error("Please enter both Item Type and Item Name");
      return;
    }
    if (!validate()) {
      toast.error("Please fill all required mandatory fields");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleReset = () => {
    setFormData({
      applyDate: new Date(),
      clientCode: "",
      clientName: "",
      clientId: "",
      branchId: "",
      associateStaff: "",
      centerId: "",
      associateId: "",
      groupId: "",
      itemType: "",
      itemName: "",
      loanTypeId: "",
      loanSchemeId: "",
      loanRequestAmount: "",
      tenureType: "",
      tenureTime: "",
      payMode: "Other Bank",
      memberName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      bankBranch: "",
      guarantor1: "",
      guarantor2: "",
      documents: null,
    });
    setErrors({});
    toast.success("Form reset");
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const confirmSubmit = async () => {
    const fd = new FormData();
    fd.append("userId", user?.userId || "");
    fd.append("latitude", latitude || "0");
    fd.append("longitude", longitude || "0");
    fd.append("applyDate", formData.applyDate.toISOString().split("T")[0]);
    fd.append("clientId", btoa(formData.clientId));
    fd.append("clientName", formData.clientName);
    fd.append("clientCode", formData.clientCode);
    fd.append("branchId", formData.branchId);
    fd.append("centerId", formData.centerId);
    fd.append("associateId", formData.associateId);
    fd.append("groupId", formData.groupId);
    fd.append("itemType", formData.itemType);
    fd.append("itemName", formData.itemName);
    fd.append("loanType", formData.loanTypeId);
    fd.append("loanScheme", formData.loanSchemeId);
    fd.append("loanRequestAmount", formData.loanRequestAmount);
    fd.append("tenureType", formData.tenureType);
    fd.append("tenureTime", formData.tenureTime);
    fd.append("payMode", formData.payMode);
    fd.append("memberName", formData.memberName);
    fd.append("accountNumber", formData.accountNumber);
    fd.append("ifscCode", formData.ifscCode);
    fd.append("bankName", formData.bankName);
    fd.append("guarantor1", formData.guarantor1);
    fd.append("guarantor2", formData.guarantor2);
    if (formData.documents) fd.append("documents", formData.documents);

    try {
      const res = await api.post(`${BASE_URL}/api/applyNewLoan`, fd);
      console.log("API RESPONSE =>", res.data);
      if (res.data?.resCode === "100") {
        toast.success("Loan application submitted successfully!");
        navigate("/associate/loan/loan_report");
      } else {
        toast.error(res.data?.msg || "Submission failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <MenuItems />
      <div className="flex-1 flex flex-col overflow-auto">
        <Search />
        <div className="mt-5 mb-8 px-5 flex justify-center">
          <div className="w-full max-w-7xl">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10">
              <div className="flex items-start gap-4 mb-8">
                <div className="flex-shrink-0 w-13 h-13 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl flex items-center justify-center">
                  <i className="fa-solid fa-handshake-angle text-white text-3xl"></i>
                </div>
                <div>
                  <h1 className="text-xl md:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Apply New Loan
                  </h1>
                  <p className="text-gray-600 text-md md:text-lg">
                    Complete the form to submit loan application
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Client Search */}
                <div ref={clientRef} className="relative">
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Search Client <span className="text-red-600">*</span>
                  </label>

                  <input
                    type="text"
                    name="clientCode"
                    value={formData.clientCode}
                    autoComplete="off"
                    onChange={handleChange}
                    onClick={() => setShowClientDropdown(true)}
                    onFocus={() => setShowClientDropdown(true)}
                    placeholder="Type client code or name..."
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />

                  {/* Dropdown */}
                  {showClientDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-64 overflow-auto z-50">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.customerId || c.id}
                          onClick={() => selectCustomer(c)}
                          className="px-3 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition"
                        >
                          {c.code} - {c.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.clientCode && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.clientCode}
                    </p>
                  )}
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    autoComplete="off"
                    readOnly
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-gray-100 backdrop-blur-sm transition-all focus:outline-none border-gray-200 cursor-not-allowed"
                  />
                </div>

                {/* Apply Date */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Apply Date
                  </label>
                  <DatePicker
                    selected={formData.applyDate}
                    readOnly
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-gray-100 backdrop-blur-sm transition-all focus:outline-none border-gray-200 cursor-not-allowed"
                  />
                </div>

                {/* Branch */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Branch <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="branchId"
                    value={formData.branchId}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Branch</option>
                    {branchList.map((b) => (
                      <option key={b.branchId} value={b.branchId}>
                        {b.branchCode} - {b.branchName}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.branchId}
                    </p>
                  )}
                </div>

                {/* Associate Staff */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Associate / Staff
                  </label>
                  <input
                    type="text"
                    value={formData.associateStaff}
                    autoComplete="off"
                    readOnly
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-gray-100 backdrop-blur-sm transition-all focus:outline-none border-gray-200 cursor-not-allowed"
                  />
                </div>

                {/* Center */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Center <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="centerId"
                    value={formData.centerId}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Center</option>
                    {centers.map((c) => (
                      <option key={c.centerId} value={c.centerId}>
                        {c.centerCode} - {c.centerName}
                      </option>
                    ))}
                  </select>
                  {errors.centerId && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.centerId}
                    </p>
                  )}
                </div>

                {/* Group */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Group <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="groupId"
                    value={formData.groupId}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Group</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.groupName}
                      </option>
                    ))}
                  </select>
                  {errors.groupId && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.groupId}
                    </p>
                  )}
                </div>

                {/* Item Type */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Item Type (Optional)
                  </label>
                  <input
                    type="text"
                    name="itemType"
                    value={formData.itemType}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="Enter item type"
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />
                  {errors.itemType && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.itemType}
                    </p>
                  )}
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Item Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="Enter item name"
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />
                  {errors.itemName && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.itemName}
                    </p>
                  )}
                </div>

                {/* Loan Type */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Loan Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="loanTypeId"
                    value={formData.loanTypeId}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Loan Type</option>
                    {loanTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.code} - {t.loanName}
                      </option>
                    ))}
                  </select>
                  {errors.loanTypeId && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.loanTypeId}
                    </p>
                  )}
                </div>

                {/* Loan Scheme */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Loan Scheme <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="loanSchemeId"
                    value={formData.loanSchemeId}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Scheme</option>
                    {loanSchemes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.loanCode} - {s.loanName}
                      </option>
                    ))}
                  </select>
                  {errors.loanSchemeId && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.loanSchemeId}
                    </p>
                  )}
                </div>

                {/* Loan Amount */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Loan Amount <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="loanRequestAmount"
                    value={formData.loanRequestAmount}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="Enter amount in ₹"
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />
                  {errors.loanRequestAmount && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.loanRequestAmount}
                    </p>
                  )}
                </div>

                {/* Tenure */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Tenure Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="tenureType"
                    value={formData.tenureType}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Type</option>
                    {tenureTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.tenureType && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.tenureType}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Tenure Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    name="tenureTime"
                    value={formData.tenureTime}
                    autoComplete="off"
                    onChange={handleChange}
                    placeholder="e.g. 12"
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />
                  {errors.tenureTime && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.tenureTime}
                    </p>
                  )}
                </div>

                {/* Guarantor 1 */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Reference 1 <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="guarantor1"
                    value={formData.guarantor1}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Reference 1</option>

                    {guarantors
                      .filter((g) => g.customerId !== formData.clientId)
                      .map((g) => (
                        <option key={g.customerId || g.id} value={g.customerId}>
                          {g.name} ({g.customerCode})
                        </option>
                      ))}
                  </select>

                  {errors.guarantor1 && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.guarantor1}
                    </p>
                  )}
                </div>

                {/* Guarantor 2 */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Reference 2 <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="guarantor2"
                    value={formData.guarantor2}
                    autoComplete="off"
                    onChange={handleChange}
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  >
                    <option value="">Select Reference 2</option>

                    {guarantors
                      .filter(
                        (g) =>
                          g.customerId !== formData.clientId &&
                          g.customerId !== formData.guarantor1
                      )
                      .map((g) => (
                        <option key={g.customerId || g.id} value={g.customerId}>
                          {g.name} ({g.customerCode})
                        </option>
                      ))}
                  </select>

                  {errors.guarantor2 && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.guarantor2}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <h2 className="text-lg md:text-xl font-bold text-gray-600 border-b-2 border-gray-400 pb-2">
                    Disbursement Details
                  </h2>
                </div>

                {/* Member Name */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Member Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="memberName"
                    value={formData.memberName}
                    autoComplete="off"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[A-Za-z ]*$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    placeholder="Enter name of customer"
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />
                  {errors.memberName && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.memberName}
                    </p>
                  )}
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Account Number <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    autoComplete="off"
                    maxLength={18}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^[0-9]*$/.test(value)) {
                        handleChange(e);
                      }
                    }}
                    placeholder="Enter account number"
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />
                  {errors.accountNumber && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    IFSC Code <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    autoComplete="off"
                    onChange={handleChange}
                    maxLength={11}
                    placeholder="Enter IFSC code"
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-white/60 backdrop-blur-sm transition-all focus:outline-none focus:ring-3 focus:ring-indigo-200 border-gray-200 hover:border-indigo-200"
                  />
                  {errors.ifscCode && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.ifscCode}
                    </p>
                  )}
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    autoComplete="off"
                    readOnly
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-gray-100 backdrop-blur-sm transition-all focus:outline-none border-gray-200 cursor-not-allowed"
                  />
                  {errors.bankName && (
                    <p className="text-red-500 text-sm mt-2">
                      {errors.bankName}
                    </p>
                  )}
                </div>

                {/* Bank Branch */}
                <div>
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    autoComplete="off"
                    readOnly
                    className="w-full px-2 py-2 rounded-2xl border-2 bg-gray-100 backdrop-blur-sm transition-all focus:outline-none border-gray-200 cursor-not-allowed"
                  />
                </div>

                {/* Document Upload */}
                <div className="md:col-span-2">
                  <label className="block text-md font-semibold text-gray-700 mb-2">
                    Upload Document (Optional)
                  </label>
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-5 text-center hover:border-indigo-500 hover:bg-indigo-50 transition">
                      <i className="fa-solid fa-cloud-upload-alt text-5xl text-indigo-400 mb-4"></i>
                      <p className="text-gray-600 font-medium">
                        Click to upload document
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        JPG, PNG, PDF only only • Max 500 KB
                      </p>
                      {formData.documents && (
                        <p className="text-green-600 mt-3 font-medium">
                          {formData.documents.name}
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mt-2 md:col-span-2 w-full">
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-base md:text-lg rounded-2xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300 disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    SUBMIT APPLICATION
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto flex-1 sm:flex-none px-4 py-2 bg-white border-2 border-indigo-600 text-indigo-600 font-bold text-base md:text-lg rounded-2xl hover:bg-indigo-50 hover:scale-105 transition-all duration-300 disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto flex-1 sm:flex-none px-4 py-2 bg-white border-2 border-orange-600 text-orange-600 font-bold text-base md:text-lg rounded-2xl hover:bg-orange-50 hover:scale-105 transition-all duration-300 disabled:opacity-60 flex justify-center items-center gap-2 cursor-pointer"
                  >
                    Reset Form
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-sm w-full">
            <div className="flex justify-center mb-4 sm:mb-6">
              <i className="fa-solid fa-circle-check text-indigo-600 text-6xl"></i>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-3 sm:mb-4">
              Confirm Submission
            </h3>
            <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
              Are you sure you want to submit this loan application?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 w-full">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto px-6 py-3 border-2 border-gray-300 rounded-2xl hover:bg-gray-100 transition cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:scale-105 transition cursor-pointer font-medium"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyNewLoan;
