import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import MenuItems from "../../dashboard/MenuItems";
import Search from "../../dashboard/Search";
import Footer from "../../dashboard/Footer";
import useLocationHook from "../../../hooks/useLocation";
import { BASE_URL, CUSTOMER_FOLDER } from "../../../config";
import { useAuth } from "../../../contexts/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const LoanProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const loc = useLocationHook();
  const { user } = useAuth();
  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
  } = loc;

  const [loanProfile, setLoanProfile] = useState(null);
  const [ledgerData, setLedgerData] = useState([]);
  const [customerPhoto, setCustomerPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Get loan ID from URL params
  const urlParams = new URLSearchParams(location.search);
  const loanId = urlParams.get("token");

  // Set default dates on component mount
  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    setStartDate(firstDayOfMonth);
    setEndDate(today);
  }, []);

  // Fetch loan profile data
  useEffect(() => {
    if (locationLoading) {
      return;
    }
    if (locationError) {
      setError(`Location error: ${locationError}`);
      setLoading(false);
      return;
    }

    const fetchLoanProfileData = async () => {
      if (!loanId || loanId === "undefined" || loanId === "") {
        setError("Invalid Loan ID");
        setLoading(false);
        return;
      }

      try {
        const payload = {
          userId: user?.userId,
          loanId: loanId,
          latitude: latitude || "0",
          longitude: longitude || "0",
        };

        const response = await api.post(
          `${BASE_URL}/api/loanProfile`,
          payload,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data && response.data.resCode === "100") {
          setLoanProfile(response.data.data);
        } else {
          setError(response.data?.msg || "Failed to load loan profile");
        }
      } catch (err) {
        console.error("Error fetching loan profile data:", err);
        setError("Failed to load loan profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchLoanProfileData();
  }, [
    loanId,
    locationLoading,
    locationError,
    latitude,
    longitude,
    user?.userId,
  ]);

  // Fetch customer photo when loan profile is loaded
  useEffect(() => {
    if (loanProfile?.customerKey) {
      fetchCustomerPhoto();
    }
  }, [loanProfile]);

  // Fetch ledger data when loan profile is loaded
  useEffect(() => {
    if (loanProfile) {
      fetchLedgerData();
    }
  }, [loanProfile, startDate, endDate]);

  // Fetch customer photo
  const fetchCustomerPhoto = async () => {
    if (!loanProfile?.customerKey) return;

    try {
      const payload = {
        userId: user?.userId,
        latitude: latitude || "26.8467",
        longitude: longitude || "80.9462",
        customerKey: loanProfile.customerKey,
      };

      const response = await api.post(
        `${BASE_URL}/api/customerDocuments`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data?.resCode === "100") {
        const documents = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        const photoDoc = documents.find((doc) => doc.DocumentType === "Photo");

        if (photoDoc?.ImagePath) {
          setCustomerPhoto(`${CUSTOMER_FOLDER}/${photoDoc.ImagePath}`);
        } else {
          console.warn("No photo document found for this customer.");
        }
      } else {
        console.warn("Customer documents fetch failed:", response.data?.msg);
      }
    } catch (err) {
      console.error("Error fetching customer photo:", err);
    }
  };

  // Fetch ledger data
  const fetchLedgerData = async () => {
    if (!loanId) return;

    setLedgerLoading(true);
    try {
      const payload = {
        userId: user?.userId,
        loanId: loanId,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        latitude: latitude || "0",
        longitude: longitude || "0",
      };

      const response = await api.post(`${BASE_URL}/api/loanLedger`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data && response.data.resCode === "100") {
        setLedgerData(response.data.data || []);
      } else {
        console.warn("Failed to load ledger data:", response.data);
        setLedgerData([]);
      }
    } catch (err) {
      console.error("Error fetching ledger data:", err);
      setLedgerData([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLedgerData();
  };

  const handleEntriesPerPageChange = (value) => {
    setEntriesPerPage(value === "All" ? ledgerData.length : parseInt(value));
    setCurrentPage(1);
  };

  const filteredLedger = ledgerData.filter(
    (entry) =>
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.transDate?.includes(searchTerm) ||
      entry.uniqueId?.toString().includes(searchTerm)
  );

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredLedger.slice(
    indexOfFirstEntry,
    indexOfLastEntry
  );
  const totalPages = Math.ceil(filteredLedger.length / entriesPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      // Handle DD-MM-YYYY HH:MM:SS AM/PM format
      const parts = dateStr.split(" ");
      if (parts.length >= 1) {
        return parts[0]; // Return just the date part
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "disburse":
        return "bg-gradient-to-r from-emerald-500 to-teal-600";
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-orange-600";
      case "approve":
        return "bg-gradient-to-r from-blue-500 to-indigo-600";
      case "reject":
        return "bg-gradient-to-r from-red-500 to-pink-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <MenuItems />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-6xl text-indigo-600 mb-6"></i>
            <p className="text-xl text-gray-700">Loading loan profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !loanProfile) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
        <MenuItems />
        <div className="flex-1 flex flex-col overflow-auto">
          <Search />
          <div className="mt-5 mb-8 px-5 flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-3xl p-10 text-center max-w-md">
              <i className="fa-solid fa-exclamation-triangle text-red-600 text-6xl mb-6"></i>
              <h3 className="text-2xl font-bold text-red-700 mb-4">
                Error Loading Profile
              </h3>
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
        <div className="justify-center p-3">
          <div>
            {/* Header Card */}
            <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-1 mb-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <button
                  onClick={() => {
                    sessionStorage.setItem("skipToast", "true");
                    navigate(-1);
                  }}
                  className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl hover:scale-105 transition-all shadow-lg cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>

                <div className="flex items-center gap-7">
                  <img
                    src={customerPhoto || "/user.svg"}
                    alt="Customer"
                    className="w-16 h-16 rounded-2xl object-cover ring-3 ring-indigo-200 shadow-xl"
                  />
                  <div className="text-center md:text-left">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {loanProfile.customerName}
                    </h1>
                    <p className="text-lg text-indigo-700 font-semibold">
                      {loanProfile.customerCode}
                    </p>
                    <p className="text-md text-gray-600">
                      Loan: {loanProfile.loanCode}
                    </p>
                  </div>
                </div>

                <div
                  className={`px-4 py-3 rounded-2xl font-bold text-white shadow-lg ${getStatusBadgeClass(
                    loanProfile.status
                  )}`}
                >
                  {loanProfile.status || "N/A"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left: Profile + Details */}
              <div className="lg:col-span-1 space-y-3">
                {/* Profile Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-4">
                  <h2 className="text-xl font-bold text-indigo-800 my-4 flex items-center gap-3 text-center justify-center">
                    <i className="fa-solid fa-user-circle text-2xl"></i>
                    Profile
                  </h2>
                  <div className="flex flex-col items-center gap-4">
                    <img
                      src={customerPhoto || "/user.svg"}
                      alt="Profile"
                      className="w-30 h-30 rounded-2xl object-cover ring-4 ring-indigo-200 shadow-xl"
                    />
                    <div className="w-full flex flex-col gap-3 text-sm">
                      <div className="flex justify-between w-full">
                        <p className="font-semibold text-gray-700">Name:</p>
                        <p className="text-indigo-900 font-semibold">
                          {loanProfile.customerName}
                        </p>
                      </div>
                      <div className="flex justify-between w-full">
                        <p className="font-semibold text-gray-700">
                          Loan Code:
                        </p>
                        <p className="text-indigo-900">
                          {loanProfile.loanCode}
                        </p>
                      </div>
                      <div className="flex justify-between w-full">
                        <p className="font-semibold text-gray-700">
                          Loan Name:
                        </p>
                        <p className="text-indigo-900">
                          {loanProfile.loanName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loan Details Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 px-4">
                  <h2 className="text-xl font-bold text-indigo-800 mx-10 my-4 flex items-center gap-3 text-center justify-center">
                    <i className="fa-solid fa-credit-card text-2xl"></i>
                    Loan Details
                  </h2>
                  <div className="text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        Customer:
                      </span>
                      <span className="text-gray-900 font-medium text-right">
                        {loanProfile.customerName} ({loanProfile.customerCode})
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        Loan Amount:
                      </span>
                      <span className="text-indigo-900 font-semibold text-right">
                        {formatCurrency(loanProfile.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        EMI Amount:
                      </span>
                      <span className="text-indigo-900 font-semibold text-right">
                        {formatCurrency(loanProfile.emiAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">ROI:</span>
                      <span className="text-indigo-900 text-right">
                        {loanProfile.roi}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        Opening Date:
                      </span>
                      <span className="text-indigo-900 text-right">
                        {loanProfile.openingDate}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-700">
                        Account No:
                      </span>
                      <span className="text-indigo-900 text-right">
                        {loanProfile.accountNo || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Loan Guarantor Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 px-4">
                  <h2 className="text-xl font-bold text-indigo-800 mx-10 my-4 flex items-center gap-3 text-center justify-center">
                    <i className="fa-solid fa-users text-2xl"></i>
                    Loan Guarantor
                  </h2>
                  <div className="text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        First Guarantor:
                      </span>
                      <span className="text-gray-900 font-medium text-right">
                        {loanProfile.firstGuarantorName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-700">
                        Second Guarantor:
                      </span>
                      <span className="text-gray-900 font-medium text-right">
                        {loanProfile.secondGuarantorName || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Loan Disbursement Details Card */}
                <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 px-4">
                  <h2 className="text-xl font-bold text-indigo-800 mx-10 my-4 flex items-center gap-3 text-center justify-center">
                    <i className="fa-solid fa-exchange-alt text-2xl"></i>
                    Disbursement Details
                  </h2>
                  <div className="text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        Status:
                      </span>
                      <span className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-white font-bold text-sm ${getStatusBadgeClass(
                            loanProfile.status
                          )}`}
                        >
                          {loanProfile.status}
                        </span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        Approve Date:
                      </span>
                      <span className="text-indigo-900 text-right">
                        {loanProfile.approveDate || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        Disburse Date:
                      </span>
                      <span className="text-indigo-900 text-right">
                        {loanProfile.disburseDate || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-semibold text-gray-700">
                        Reject Date:
                      </span>
                      <span className="text-indigo-900 text-right">
                        {loanProfile.rejectDate || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <span className="font-semibold text-gray-700">
                        Branch:
                      </span>
                      <span className="text-indigo-900 text-right">
                        {loanProfile.branchName || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Account Ledger */}
              <div className="lg:col-span-2">
                <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 p-4">
                  <h2 className="text-xl font-bold text-indigo-800 mb-6 flex items-center gap-4 text-center justify-center">
                    <i className="fa-solid fa-book-open text-2xl"></i>
                    Account Ledger
                  </h2>

                  {/* Date Range Filter */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-2 mb-3 border border-indigo-100">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          From:
                        </label>
                        <DatePicker
                          selected={startDate}
                          onChange={setStartDate}
                          dateFormat="MM/dd/yyyy"
                          maxDate={new Date()}
                          className="w-40 border border-gray-300 rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          To:
                        </label>
                        <DatePicker
                          selected={endDate}
                          onChange={setEndDate}
                          dateFormat="MM/dd/yyyy"
                          maxDate={new Date()}
                          className="w-40 border border-gray-300 rounded-xl px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                      <button
                        onClick={handleSearch}
                        disabled={ledgerLoading}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                      >
                        <i className="fa-solid fa-search"></i>
                        {ledgerLoading ? "Loading..." : "Search"}
                      </button>
                    </div>
                  </div>

                  {/* Table Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Show
                      </label>
                      <select
                        value={
                          entriesPerPage === ledgerData.length
                            ? "All"
                            : entriesPerPage
                        }
                        onChange={(e) =>
                          handleEntriesPerPageChange(e.target.value)
                        }
                        className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="All">All Rows</option>
                      </select>
                      <label className="text-sm font-semibold text-gray-700">
                        Entries
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Search:
                      </label>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search records..."
                        className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Transaction Table */}
                  <div className="overflow-x-auto rounded-2xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-indigo-600 to-purple-600">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Trans Date
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Debit (₹)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Credit (₹)
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            Balance (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ledgerLoading ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-12 text-center text-gray-500"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <i className="fa-solid fa-spinner fa-spin text-indigo-600"></i>
                                Loading ledger data...
                              </div>
                            </td>
                          </tr>
                        ) : currentEntries.length === 0 ? (
                          <tr>
                            <td
                              colSpan="5"
                              className="px-6 py-12 text-center text-gray-500"
                            >
                              <div className="flex flex-col items-center gap-3">
                                <i className="fa-solid fa-inbox text-6xl text-gray-300"></i>
                                <p className="text-lg font-semibold">
                                  {ledgerData.length === 0
                                    ? "No ledger data available"
                                    : "No matching records found"}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          currentEntries.map((entry, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all"
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatDate(entry.transDate)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">
                                {entry.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                                {formatCurrency(entry.debit)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                {formatCurrency(entry.credit)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-900">
                                {formatCurrency(entry.balance)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
                      <div className="text-sm text-gray-700">
                        Showing{" "}
                        {filteredLedger.length === 0
                          ? 0
                          : indexOfFirstEntry + 1}{" "}
                        to{" "}
                        {indexOfLastEntry > filteredLedger.length
                          ? filteredLedger.length
                          : indexOfLastEntry}{" "}
                        of {filteredLedger.length} entries
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white border border-indigo-300 rounded-xl text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                          <i className="fa-solid fa-chevron-left"></i> Previous
                        </button>
                        <span className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold">
                          {currentPage}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white border border-indigo-300 rounded-xl text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        >
                          Next <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default LoanProfile;
