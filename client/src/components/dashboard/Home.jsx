import React, { useState, useEffect, useCallback, useMemo } from "react";
// import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import MenuItems from "./MenuItems";
import Search from "./Search";
import Footer from "./Footer";
import useLocationHook from "../../hooks/useLocation";
import { BASE_URL } from "../../config";
import api from "../../api/api";

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
  } = useLocationHook();

  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [greeting, setGreeting] = useState("");

  // Memoized date formatting
  const formattedDate = useMemo(() => {
    let hours = currentDate.getHours();
    let minutes = currentDate.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${currentDate.toLocaleDateString(
      "en-IN"
    )} ${hours}:${minutes} ${ampm}`;
  }, [currentDate]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Greeting Message
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let message = "";
      if (hour >= 5 && hour < 12) {
        message = "Good Morning ☀️";
      } else if (hour >= 12 && hour < 16) {
        message = "Good Afternoon 🌤️";
      } else {
        message = "Good Evening 🌙";
      }
      setGreeting(message);
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Username
  const fetchUsername = useCallback(async () => {
    try {
      const res = await api.post(
        `${BASE_URL}/api/associateProfile`,
        {
          latitude: latitude || 0,
          longitude: longitude || 0,
          userId: user?.userId,
        },
        {
          headers: { "Content-Type": "application/json" },
          // withCredentials: true,
        }
      );

      if (res.data?.resCode === "100" && res.data.data?.profile?.shopName) {
        setUsername(res.data.data.profile.shopName);
      }
    } catch (err) {
      console.error("Error fetching username:", err);
    }
  }, [latitude, longitude, user?.userId]);

  useEffect(() => {
    if (!locationLoading && !locationError && user?.userId) {
      fetchUsername();
    }
  }, [user, locationLoading, locationError, fetchUsername]);

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await api.post(
        `${BASE_URL}/api/dashboardData`,
        {
          latitude: latitude || 0,
          longitude: longitude || 0,
          userId: user?.userId,
        },
        {
          headers: { "Content-Type": "application/json" },
          // withCredentials: true,
        }
      );

      if (!res.data) throw new Error("No data received from server");
      if (res.data.resCode !== "100")
        throw new Error(res.data.msg || "Unknown error");
      if (!Array.isArray(res.data.data))
        throw new Error("Invalid data format: expected array");

      setDashboardData(res.data.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, user?.userId]);

  useEffect(() => {
    if (!locationLoading && !locationError) {
      fetchDashboardData();
    } else if (locationError) {
      setError(`Location error: ${locationError}`);
      setLoading(false);
    }
  }, [locationLoading, locationError, fetchDashboardData]);

  // Dashboard Card Component
  const DashboardCard = ({ item, index }) => {
    const getCardGradient = (name) => {
      const gradients = {
        "Total Customers": "from-emerald-500 to-teal-600",
        "Total Loans": "from-blue-500 to-indigo-600",
        "Disbursed Loans": "from-purple-500 to-pink-600",
      };
      return gradients[name] || "from-gray-500 to-gray-600";
    };

    const getIconColor = (name) => {
      const colors = {
        "Total Customers": "text-emerald-500",
        "Total Loans": "text-blue-500",
        "Disbursed Loans": "text-purple-500",
      };
      return colors[name] || "text-gray-500";
    };

    return (
      <div
        className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center transform transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl cursor-pointer overflow-hidden border border-white/20 hover:border-blue-200/50"
        onClick={() => {
          const routes = {
            "Total Customers": "/associate/customer/clientList",
            "Total Loans": "/associate/loan/loan_report",
            "Disbursed Loans": "/associate/loan/collection_report",
          };
          if (routes[item.name]) navigate(routes[item.name]);
        }}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${getCardGradient(
            item.name
          )}`}
        />
        <div className="relative z-10">
          <div
            className={`text-4xl text-center mb-4 transition-all duration-400 group-hover:rotate-12 group-hover:scale-120 ${getIconColor(
              item.name
            )}`}
          >
            <i className={`${item.icon || "fa-solid fa-question"}`}></i>
          </div>
          <div className="text-2xl font-bold text-center text-gray-800 mb-2 relative z-10">
            {item.value ?? "N/A"}
          </div>
          <div className="text-gray-600 text-center text-sm font-medium relative z-10">
            {item.name || "Unknown"}
          </div>
        </div>
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <i className="fa-solid fa-arrow-right text-xs text-white-100"></i>
        </div>
      </div>
    );
  };

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 animate-pulse"
        >
          <div className="h-12 w-12 bg-gray-300 rounded-full mb-4 mx-auto"></div>
          <div className="h-8 bg-gray-300 rounded mb-2 mx-auto w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <MenuItems />
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="sticky top-0 z-20 bg-white/60 backdrop-blur-md shadow-sm rounded-b-xl px-5">
            <Search />
            <div className="mt-18">
              <LoadingSkeleton />
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
        <div className="bg-white/60 backdrop-blur-md shadow-sm rounded-b-xl">
          <Search />

          {/* Header Section */}
          <div className="mt-5 mb-8 px-5">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4">
                {/* RIGHT SIDE → Date + Text */}
                <div className="flex-1 text-center md:text-right">
                  <div className="text-2xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    {formattedDate}
                  </div>
                  <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                    Let's make today count! ✨
                  </p>
                </div>

                {/* LEFT SIDE → Greeting + Name */}
                {username && (
                  <div className="text-left">
                    <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-1">
                      {greeting}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {username}
                    </p>
                    <p className="text-sm md:text-base text-gray-500 mt-1">
                      Your dashboard gives you views of key performance or
                      business processes. Stay on top of your metrics with
                      real-time insights.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dashboard Metrics */}
          <div className="mb-8 px-5">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <i className="fa-solid fa-chart-line mr-2 text-blue-500"></i>
              Quick Insights
            </h2>
            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <i className="fa-solid fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                <p className="text-red-600 font-semibold mb-2">
                  Oops! Something went wrong
                </p>
                <p className="text-red-500">{error}</p>
                <button
                  onClick={fetchDashboardData}
                  className="mt-4 bg-red-500 text-white px-6 py-2 rounded-xl hover:bg-red-600 transition-all duration-300 font-semibold"
                >
                  Retry
                </button>
              </div>
            ) : dashboardData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-300">
                {dashboardData.map((item, index) => (
                  <DashboardCard key={item.id} item={item} index={index} />
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-8 text-center">
                <i className="fa-solid fa-inbox text-yellow-500 text-4xl mb-4"></i>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  No data yet?
                </p>
                <p className="text-gray-600 mb-4">
                  Your dashboard will populate once activities begin.
                </p>
                <button
                  onClick={fetchDashboardData}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 font-semibold shadow-lg"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Section - New Feature */}
          <div className="mb-8 px-5">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <i className="fa-solid fa-bolt mr-2 text-green-500"></i>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: "fa-user-plus",
                  label: "Add Customer",
                  route: "/associate/customer/registration",
                  color: "from-emerald-500 to-teal-600",
                },
                {
                  icon: "fa-hand-holding-dollar",
                  label: "New Loan",
                  route: "/associate/loan/apply_new_loan",
                  color: "from-blue-500 to-indigo-600",
                },
                {
                  icon: "fa-file-invoice-dollar",
                  label: "Loan Report",
                  route: "/associate/loan/collection_report",
                  color: "from-purple-500 to-pink-600",
                },
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.route)}
                  className="group relative bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl border border-white/20 transition-all duration-500 ease-out hover:scale-105 flex items-center space-x-4 overflow-hidden cursor-pointer"
                >
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${action.color} text-white shadow-lg transition-transform duration-300 group-hover:rotate-6`}
                  >
                    <i className={`fa ${action.icon} text-xl`}></i>
                  </div>
                  <div className="relative z-10 flex-1">
                    <p className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      Get started in seconds
                    </p>
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${action.color}`}
                  />
                  <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-gray-600 transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"></i>
                </button>
              ))}
            </div>
          </div>

          {/* Tips Section - New Feature */}
          <div className="mx-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50 mb-2 shadow-inner">
            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <i className="fa-solid fa-lightbulb mr-2"></i>
              Pro Tip
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed ">
              Keep your location services enabled for accurate geo-tagging on
              loans and collections. This helps in better compliance and faster
              approvals!
            </p>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Home;
