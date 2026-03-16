import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import useLocationHook from "../../hooks/useLocation";
import { BASE_URL, ASSOCIATE_FOLDER } from "../../config";
import api from "../../api/api";
import debounce from "lodash.debounce";

const options = ["Customer List", "Loan Report", "Collection Report"];

function Search() {
  const { logout, user } = useAuth();
  const { latitude, longitude } = useLocationHook();
  const navigate = useNavigate();

  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleDropdownOpen, setModuleDropdownOpen] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [moduleData, setModuleData] = useState({});
  const [searchResults, setSearchResults] = useState([]);
  const [resultsDropdownOpen, setResultsDropdownOpen] = useState(false);

  const [loadingResults, setLoadingResults] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState("/user.svg");

  const searchRef = useRef(null);
  const userIconRef = useRef(null);
  const userMenuRef = useRef(null);

  // profile image fetch
  useEffect(() => {
    if (!user?.userId || !latitude || !longitude) return;

    (async () => {
      try {
        const res = await api.post(`${BASE_URL}/api/associateProfile`, {
          userId: user.userId,
          latitude: latitude,
          longitude: longitude,
        });

        const kycs = res?.data?.data?.kyc;
        const photo = kycs?.find((d) => d.documentID === 1);

        if (photo?.imagePath) {
          setProfileImage(`${ASSOCIATE_FOLDER}/${photo.imagePath}`);
        }
      } catch {
        console.log("Profile image load failed");
      }
    })();
  }, [user?.userId, latitude, longitude]);

  // Utility — recent 4
  const getRecentFive = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 4);
  };

  // Fetch module data
  const fetchModuleData = async (module) => {
    if (moduleData[module]?.length) return;

    setLoadingResults(true);

    const startDate = new Date(2025, 0, 1);
    const endDate = new Date()
    const format = (date) => date.toISOString().split("T")[0];

    const body = {
      userId: user?.userId,
      latitude: latitude || "0",
      longitude: longitude || "0",
      startDate: format(startDate),
      endDate: format(endDate),
    };
    try {
      let res;

      if (module === "Customer List") {
        res = await api.post(`${BASE_URL}/api/customerList`, body);

        const list =
          res.data?.data
            ?.filter((c) => c.status === "Success")
            .map((c) => ({
              name: c.name,
              customerCode: c.customerCode,
              customerKey: c.customerKey,
            })) || [];

        setModuleData((prev) => ({ ...prev, [module]: list }));
      }

      if (module === "Loan Report") {
        res = await api.post(`${BASE_URL}/api/loanReport`, body);

        const list =
          res.data?.data?.map((l) => ({
            name: l.customerName,
            loanCode: l.loanCode,
            loanId: l.loanId,
            customerKey: l.customerKey,
          })) || [];

        setModuleData((prev) => ({ ...prev, [module]: list }));
      }

      if (module === "Collection Report") {
        res = await api.post(`${BASE_URL}/api/collectionReport`, body);

        const list =
          res.data?.data?.map((c) => ({
            name: c.customerName,
            loanCode: c.loanCode,
            loanId: c.loanId,
          })) || [];

        setModuleData((prev) => ({ ...prev, [module]: list }));
      }
    } catch (e) {
      console.log("Module fetch error", e);
    }

    setLoadingResults(false);
  };

  // Search function
  const performSearch = useCallback(
  debounce((text, module) => {
    if (!module) return;
    if (!text.trim()) {
      setSearchResults([]);
      setResultsDropdownOpen(false);
      return;
    }

    const all = moduleData[module] || [];
    if (!all.length) return;

    const q = text.toLowerCase();

    const filtered = all.filter((i) =>
      i.name?.toLowerCase().startsWith(q) ||
      i.customerCode?.toLowerCase().startsWith(q) ||
      i.loanCode?.toLowerCase().startsWith(q)
    );

    setSearchResults(filtered);
    setResultsDropdownOpen(true);
  }, 200),
  [moduleData]
);

  useEffect(() => {
  if (!selectedModule) return;
  if (!searchText.trim()) {
    setSearchResults([]);
    setResultsDropdownOpen(false);
    return;
  }

  performSearch(searchText, selectedModule);

  return () => performSearch.cancel();
}, [searchText, selectedModule]);


  // Click outside handler
  const handleClickOutside = useCallback((e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setResultsDropdownOpen(false);
      setModuleDropdownOpen(false);
    }

    if (
      userMenuRef.current &&
      !userMenuRef.current.contains(e.target) &&
      userIconRef.current &&
      !userIconRef.current.contains(e.target)
    ) {
      setUserMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle result click
  const handleResultClick = (item) => {
    setResultsDropdownOpen(false);
    setSearchText("");

    if (selectedModule === "Customer List") {
      navigate(
        `/associate/customer/CustomerProfile?token=${item.customerKey}`,
        {
          state: { customerKey: item.customerKey },
        }
      );
    } else if (
      selectedModule === "Loan Report" ||
      selectedModule === "Collection Report"
    ) {
      navigate(`/associate/loan/loan_details?token=${item.loanId}`, {
        state: {
          loanId: item.loanId,
          customerKey: item.customerKey,
        },
      });
    }
  };

  // Get module icon
  const getModuleIcon = (module) => {
    const icons = {
      "Customer List": "fa-users",
      "Loan Report": "fa-file-invoice-dollar",
      "Collection Report": "fa-hand-holding-dollar",
    };
    return icons[module] || "fa-search";
  };

  return (
    <div className="sticky top-0 left-0 w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 z-30 border-b border-white/20 shadow-lg backdrop-blur-sm">
      <div className="ml-1 md:ml-10 flex justify-between px-3 py-2 gap-2 md:gap-4 lg:gap-12 items-center">
        {/* SEARCH BAR */}
        <div className="flex-1 relative min-w-0" ref={searchRef}>
          <div
            className={`flex items-center bg-white/80 backdrop-blur-sm border border-white/20 rounded-4xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-400 ease-out hover:scale-[1.02] overflow-hidden group`}
            onClick={() => {
              if (!selectedModule) {
                setModuleDropdownOpen(!moduleDropdownOpen);
              } else if (moduleData[selectedModule]?.length) {
                const recent = getRecentFive(moduleData[selectedModule]);
                setSearchResults(recent);
                setResultsDropdownOpen(true);
              }
            }}
          >
            {selectedModule ? (
              <>
                <div
                  className="px-4 py-3 text-gray-600 flex items-center gap-3 cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 border-r border-white/20 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModuleDropdownOpen(!moduleDropdownOpen);
                  }}
                >
                  <i className={`fa-solid ${getModuleIcon(selectedModule)} text-blue-500 text-lg`}></i>
                  <span className="font-medium text-gray-700">{selectedModule}</span>
                  <i className="fa-solid fa-caret-down text-gray-400 transition-transform duration-300 group-hover:rotate-180"></i>
                </div>

                <input
                  className="flex-1 px-4 py-3 outline-none text-gray-700 placeholder-gray-500 rounded-r-2xl w-full min-w-0 bg-transparent focus:bg-white/50 transition-all duration-300"
                  value={searchText}
                  placeholder={`Search in ${selectedModule}...`}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                {loadingResults && (
                  <div className="absolute right-3">
                    <i className="fa-solid fa-spinner fa-spin text-blue-500"></i>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="px-4 py-3 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50">
                  <i className="fa-solid fa-magnifying-glass text-purple-500 text-lg"></i>
                  <span className="text-gray-500 font-medium">Select an option to search...</span>
                </div>
              </>
            )}
          </div>

          {/* MODULE SELECT DROPDOWN */}
          {moduleDropdownOpen && (
            <div className="absolute top-full left-0 w-full max-w-full bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl mt-2 rounded-2xl z-50 overflow-hidden animate-fade-in-down">
              {options.map((opt, index) => (
                <div
                  key={opt}
                  className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 group flex items-center gap-3"
                  onClick={() => {
                    setSelectedModule(opt);
                    setModuleDropdownOpen(false);
                    fetchModuleData(opt);
                    setSearchText("");
                    setSearchResults([]);
                  }}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <i className={`fa-solid ${getModuleIcon(opt)} text-blue-500 text-lg`}></i>
                  <span className="font-medium text-gray-700 group-hover:text-blue-600">{opt}</span>
                </div>
              ))}
            </div>
          )}

          {/* SEARCH RESULTS DROPDOWN */}
          {resultsDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full max-w-full bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl mt-2 max-h-80 overflow-y-auto rounded-2xl z-50 animate-fade-in-down">
              {searchResults.map((item, idx) => {
                const display =
                  selectedModule === "Customer List"
                    ? `${item.name} - ${item.customerCode}`
                    : `${item.name} - ${item.loanCode}`;
                return (
                  <div
                    key={idx}
                    className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-300 group flex items-center gap-3 border-b border-white/10 last:border-b-0"
                    onClick={() => handleResultClick(item)}
                  >
                    <i className="fa-solid fa-search text-blue-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    <div className="flex-1">
                      <div className="font-medium text-gray-700 group-hover:text-blue-600 truncate">{display}</div>
                      <div className="text-xs text-gray-500">Tap to view details</div>
                    </div>
                    <i className="fa-solid fa-arrow-right text-gray-400 group-hover:text-blue-500 transition-all"></i>
                  </div>
                );
              })}
              {searchResults.length === 4 && (
                <div className="px-4 py-3 text-center text-sm text-gray-500 bg-gradient-to-r from-blue-50 to-indigo-50">
                  Showing recent 4 results...
                </div>
              )}
            </div>
          )}
        </div>

        {/* USER MENU */}
        <div className="relative" ref={userIconRef}>
          <div className="group relative">
            <img
              src={profileImage}
              className="h-12 w-12 rounded-3xl cursor-pointer object-cover shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105 border-2 border-white/20"
              alt="Profile"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-1 border-white"></div>
          </div>
          {userMenuOpen && (
            <div
              ref={userMenuRef}
              className="absolute right-0 bg-white/95 backdrop-blur-sm border border-white/20 shadow-2xl p-2 w-56 mt-2 rounded-2xl z-50 animate-fade-in-up overflow-hidden"
            >
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-white/20">
                <p className="text-sm font-semibold text-gray-700">Account</p>
              </div>
              <Link
                to={`/associate/profile?pid=${user?.userId || ""}`}
                className="block px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-3 group"
                onClick={() => setUserMenuOpen(false)}
              >
                <i className="fa-solid fa-user text-blue-500 text-lg"></i>
                <span className="font-medium text-gray-700 group-hover:text-blue-600">Profile</span>
              </Link>
              <button className="w-full px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-3 group text-left">
                <i className="fa-solid fa-key text-purple-500 text-lg"></i>
                <span className="font-medium text-gray-700 group-hover:text-purple-600">Change Password</span>
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-xl cursor-pointer transition-all duration-300 flex items-center gap-3 group text-left mt-1"
              >
                <i className="fa-solid fa-sign-out-alt text-red-500 text-lg"></i>
                <span className="font-medium text-gray-700 group-hover:text-red-600">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;