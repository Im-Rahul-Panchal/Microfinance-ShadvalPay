import React, { useState, useEffect } from "react";
import MenuItems from "../dashboard/MenuItems";
import Search from "../dashboard/Search";
import Footer from "../dashboard/Footer";
import { useAuth } from "../../contexts/AuthContext";
import useLocationHook from "../../hooks/useLocation";
import { BASE_URL, ASSOCIATE_FOLDER } from "../../config";
import api from "../../api/api";

// Import Recharts
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector,
} from "recharts";

function Profile() {
  const { user } = useAuth();
  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
  } = useLocationHook();

  const [profile, setProfile] = useState(null);
  const [accountAnalysis, setAccountAnalysis] = useState({
    totalCustomers: 0,
    totalLoan: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePieIndex, setActivePieIndex] = useState(0);

  useEffect(() => {
    if (locationLoading) return;
    if (locationError) {
      setError(`Location error: ${locationError}`);
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        // === Profile API ===
        const profileResponse = await api.post(
          `${BASE_URL}/api/associateProfile`,
          {
            latitude: latitude || "0",
            longitude: longitude || "0",
            userId: user?.userId,
          },
          {
            headers: { "Content-Type": "application/json" },
            // withCredentials: true
          }
        );

        const profileData = profileResponse.data;
        if (profileData.resCode !== "100")
          throw new Error(profileData.msg || "Failed to fetch profile data");

        // Dashboard API
        const dashboardResponse = await api.post(
          `${BASE_URL}/api/dashboardData`,
          {
            latitude: latitude || "0",
            longitude: longitude || "0",
            userId: user?.userId,
          },
          { headers: { "Content-Type": "application/json" } }
        );

        const dashboardData = dashboardResponse.data;

        // === Profile Mapping ===
        const profileInfo = profileData.data.profile;
        const kycDocs = profileData.data.kyc || [];

        const documentTypeMap = {
          1: "Photo",
          2: "ID Proof (PAN Card)",
          3: "Aadhar Card Front",
          4: "Aadhar Card Back",
          5: "Other Documents",
          6: "Shop Registration",
        };

        const kycDocuments = kycDocs.map((doc) => ({
          label:
            documentTypeMap[doc.documentID] || `Document ${doc.documentID}`,
          fileUrl: doc.imagePath,
          type: doc.documentID,
        }));

        const photoDoc = kycDocuments.find((doc) => doc.label === "Photo");

        setProfile({
          photo: photoDoc
            ? `${ASSOCIATE_FOLDER}/${photoDoc.fileUrl}`
            : "/user.svg",
          name: profileInfo.shopName || "",
          associateCode: profileInfo.associateCode || "",
          phone: profileInfo.phoneNo || "",
          personalDetails: {
            FullName: profileInfo.shopName || "",
            Email: profileInfo.email || "",
            Aadhar: profileInfo.aadhaarNumber || "",
            PAN: profileInfo.panNo || "",
            Pincode: profileInfo.pinCode || "",
            District: profileInfo.district || "",
            State: profileInfo.stateName || "",
            Address: profileInfo.address || "",
          },
          kycDocuments,
        });

        // === Account Analysis ===
        if (dashboardData.resCode === "100") {
          // Detect array safely
          const list = Array.isArray(dashboardData.data)
            ? dashboardData.data
            : Array.isArray(dashboardData.data?.Dashboard)
            ? dashboardData.data.Dashboard
            : [];

          const totalCustomersItem = list.find(
            (item) => item.name?.trim().toLowerCase() === "total customers"
          );
          const totalLoanItem = list.find(
            (item) => item.name?.trim().toLowerCase() === "total loans"
          );

          const customers = totalCustomersItem
            ? Number(totalCustomersItem.value?.toString().trim()) || 0
            : 0;
          const loan = totalLoanItem
            ? Number(totalLoanItem.value?.toString().trim()) || 0
            : 0;

          setAccountAnalysis({ totalCustomers: customers, totalLoan: loan });
        }
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.userId, locationLoading, locationError, latitude, longitude]);

  // === Pie Chart Data ===
  const pieData = [
    {
      name: "Total Customers",
      value: accountAnalysis.totalCustomers,
      color: "#10b981",
    },
    { name: "Total Loan", value: accountAnalysis.totalLoan, color: "#3b82f6" },
  ].filter((item) => item.value > 0);

  const onPieEnter = (data, index) => {
    setActivePieIndex(index);
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Calculate profile completion percentage (new feature)
  const calculateCompletion = () => {
    if (!profile) return 0;
    const details = profile.personalDetails;
    const totalFields = 8; // FullName, Email, Pincode, District, State, Address
    const filledFields = Object.values(details).filter(
      (val) => val && String(val).trim() !== ""
    ).length;
    return Math.round((filledFields / totalFields) * 100);
  };

  const completionPercentage = calculateCompletion();

  // Document viewer handler (new feature)
  const handleViewDocument = (fileUrl, label) => {
    window.open(`${ASSOCIATE_FOLDER}/${fileUrl}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <MenuItems />
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-md shadow-sm rounded-b-xl">
            <Search />
          </div>
          <div className="flex-1 flex justify-center items-center mt-18">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/40 animate-pulse">
              <div className="h-8 bg-gray-300/80 rounded w-64 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200/80 rounded w-full"></div>
                <div className="h-4 bg-gray-200/80 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200/80 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <MenuItems />
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-md shadow-sm rounded-b-xl">
            <Search />
          </div>
          <div className="flex-1 flex justify-center items-center mt-18">
            <div className="bg-red-50/80 backdrop-blur-xl border border-red-300 rounded-2xl p-8 text-center shadow-xl">
              <i className="fa-solid fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
              <p className="text-red-700 font-semibold text-lg mb-2">
                Oops! Something went wrong
              </p>
              <p className="text-red-600 text-sm">
                {error || "No profile data available"}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-xl 
              hover:opacity-90 transition-all duration-300 shadow-md font-semibold"
              >
                Retry
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
        <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-md shadow-sm rounded-b-xl">
          <Search />
        </div>
        <div className="flex-1 p-3">
          {/* Header */}
          <div className="mb-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 border border-white/20">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    My Profile
                  </h1>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                    Manage your account details and track your performance
                    metrics. Keep your information up-to-date for seamless
                    operations.
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg font-semibold">
                    <i className="fa-solid fa-chart-line mr-2"></i>
                    {completionPercentage}% Complete
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Column - Profile & Details */}
            <div className="w-full lg:w-1/3 space-y-6"> 
              {/* Profile Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20 overflow-hidden">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Profile Overview
                  </h2>
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 relative overflow-hidden shadow-lg group cursor-pointer hover:scale-105 transition-transform duration-300">
                    <img
                      src={profile.photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded-xl">
                    <span className="font-semibold text-gray-700">Name</span>
                    <span className="text-gray-800 font-medium">
                      {profile.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded-xl">
                    <span className="font-semibold text-gray-700">
                      Associate Code
                    </span>
                    <span className="text-gray-800 font-medium">
                      {profile.associateCode}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded-xl">
                    <span className="font-semibold text-gray-700">Phone</span>
                    <span className="text-gray-800 font-medium">
                      {profile.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <i className="fa-solid fa-user mr-2 text-blue-500"></i>
                  Personal Details
                </h3>
                <div className="space-y-3 text-sm">
                  {Object.entries(profile.personalDetails).map(
                    ([key, value]) => {
                      const label = key.replace(/([A-Z])/g, " $1").trim();
                      return (
                        <div
                          key={key}
                          className="flex justify-between items-center p-1 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                        >
                          <span className="font-semibold text-gray-700 min-w-[120px]">
                            {label}:
                          </span>
                          <span className="text-gray-800 font-medium text-right flex-1 truncate">
                            {value ?? "—"}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* KYC Documents - New Feature */}
              {/* {profile.kycDocuments.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <i className="fa-solid fa-file mr-2 text-green-500"></i>
                    KYC Documents
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {profile.kycDocuments.map((doc, index) => (
                      <button
                        key={index}
                        onClick={() => handleViewDocument(doc.fileUrl, doc.label)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
                      >
                        <div className="flex items-center space-x-3">
                          <i className={`fa-solid fa-file-image text-blue-500 text-lg`}></i>
                          <span className="font-medium text-gray-700">{doc.label}</span>
                        </div>
                        <i className="fa-solid fa-eye text-gray-400 group-hover:text-blue-500 transition-colors"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )} */}
            </div>

            {/* Right Column - Analytics */}
            <div className="w-full lg:w-2/3 space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center border border-white/20 hover:border-emerald-200/50 transition-all duration-500 hover:scale-105 cursor-default overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 from-emerald-500 to-teal-600"></div>
                  <div className="relative z-10">
                    <div className="text-emerald-500 text-4xl text-center mb-2 transition-transform duration-300 group-hover:rotate-12">
                      <i className="fa-solid fa-users"></i>
                    </div>
                    <div className="text-3xl text-center font-bold text-gray-800 mb-1">
                      {accountAnalysis.totalCustomers.toLocaleString()}
                    </div>
                    <div className="text-gray-600 font-medium">
                      Total Customers
                    </div>
                  </div>
                </div>
                <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center border border-white/20 hover:border-blue-200/50 transition-all duration-500 hover:scale-105 cursor-default overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 from-blue-500 to-indigo-600"></div>
                  <div className="relative z-10">
                    <div className="text-blue-500 text-4xl text-center mb-2 transition-transform duration-300 group-hover:rotate-12">
                      <i className="fa-solid fa-hand-holding-dollar"></i>
                    </div>
                    <div className="text-3xl text-center font-bold text-gray-800 mb-1">
                      ₹{accountAnalysis.totalLoan.toLocaleString()}
                    </div>
                    <div className="text-gray-600 font-medium">Total Loans</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Pie Chart */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 md:p-20 border border-white/20">
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center flex items-center justify-center">
                  <i className="fa-solid fa-chart-pie mr-2 text-purple-500"></i>
                  Performance Distribution
                </h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        activeIndex={activePieIndex}
                        activeShape={(props) => (
                          <Sector
                            {...props}
                            cornerRadius={10}
                            stroke="#fff"
                            strokeWidth={3}
                          />
                        )}
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={110}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        onMouseEnter={onPieEnter}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          name === "Total Loan"
                            ? `₹${value.toLocaleString()}`
                            : value.toLocaleString(),
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "rgba(255,255,255,0.9)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "14px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-chart-line text-gray-400 text-4xl mb-4"></i>
                    <p className="text-gray-500">
                      No analytics data available yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}

export default Profile;
