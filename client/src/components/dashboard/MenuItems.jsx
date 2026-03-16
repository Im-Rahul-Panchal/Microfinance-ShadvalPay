import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import useLocationHook from "../../hooks/useLocation";
import { BASE_URL } from "../../config";
import api from "../../api/api";

function MenuItems() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    latitude,
    longitude,
    error: locationError,
    loading: locationLoading,
  } = useLocationHook();

  const routeMap = {
    Dashboard: "/dashboard/home",
    "My Profile": `/associate/profile?pid=${user?.userId || ""}`,
    "Add Customer": "/associate/customer/registration",
    "Customer List": "/associate/customer/clientList",
    "Add New Loan": "/associate/loan/apply_new_loan",
    "Apply Loan Report": "/associate/loan/loan_report",
    "Collection Report": "/associate/loan/collection_report",
  };

  const handleNavigation = (menuName, subMenuName) => {
    const route = routeMap[subMenuName || menuName];
    if (route) navigate(route);
    else console.warn(`No route found for: ${subMenuName || menuName}`);
  };

  useEffect(() => {
  if (locationLoading || locationError) {
    if (locationError) console.error("Location error:", locationError);
    return;
  }

  const fetchMenuData = async () => {
    try {
      const userId = user?.userId;
      if (!userId) return;

      const { data } = await api.post(
        `${BASE_URL}/api/menu`,
        { latitude, longitude, userId: userId },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (data?.data) setMenuItems(data.data);
    } catch (err) {
      console.error("Error fetching menu:", err);
    }
  };

  fetchMenuData();
}, [user, locationLoading, locationError, latitude, longitude]);


  useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth < 768;
      setIsSmallScreen(small);
      setSidebarOpen(!small);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      if (!next) setExpandedMenu(null);
      return next;
    });
  };

  const toggleMenu = (name) => {
    setExpandedMenu((prev) => (prev === name ? null : name));
  };

  const onMenuItemClick = (item) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setTimeout(() => {
        if (item.list && item.list.length > 0) {
          setExpandedMenu(item.headerName);
        } else {
          handleNavigation(item.headerName);
        }
      }, 0);
      return;
    }

    if (item.list && item.list.length > 0) {
      toggleMenu(item.headerName);
    } else {
      handleNavigation(item.headerName);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-x-hidden">
      <div
        className={`
          bg-gradient-to-b from-gray-50 to-white shadow-2xl border-r border-gray-200/50
          h-full z-50 transition-all duration-300 ease-out
          ${sidebarOpen ? "w-72" : "w-16"}
          flex flex-col
          ${sidebarOpen && isSmallScreen ? "fixed inset-y-0 left-0" : ""}
          text-[14px] sm:text-[14px] md:text-[14px] lg:text-[16px]
          overflow-x-hidden backdrop-blur-sm`
          
        }
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            {sidebarOpen && (
              <div
                onClick={() => navigate("/dashboard/home")}
                className="cursor-pointer group"
              >
                <img
                  src="/shadval-logo.png"
                  alt="Logo Text"
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
            className="p-2 rounded-lg bg-gray-100/50 hover:bg-gray-200/50 transition-all duration-300 ease-in-out text-gray-600 hover:text-gray-800 shadow-sm hover:shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-bars-staggered fa-lg transition-transform duration-300 hover:rotate-12" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-1 py-4">
          {(Array.isArray(menuItems) ? menuItems : []).map((item) => (
            <div key={item.headerId} className="mb-1">
              <button
                onClick={() => onMenuItemClick(item)}
                className={`group relative flex items-center w-full rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-3 cursor-pointer transition-all duration-300 ease-out shadow-sm hover:shadow-lg border border-transparent hover:border-blue-200/50 text-left ${
                  sidebarOpen ? "justify-between space-x-4" : "justify-center"
                }`}
              >
                <div
                  className={`flex items-center ${
                    sidebarOpen ? "space-x-4" : "justify-center w-full"
                  }`}
                >
                  <div className="relative">
                    <i
                      className={`fa ${item.icon || "fa-folder"} text-gray-500 group-hover:text-blue-600 transition-all duration-300 ease-out text-xl`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>

                  {sidebarOpen ? (
                    <span className="text-gray-700 font-medium group-hover:text-blue-700 transition-colors duration-300">
                      {item.headerName}
                    </span>
                  ) : (
                    <span className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out shadow-lg whitespace-nowrap border border-gray-700/50 z-50">
                      {item.headerName}
                    </span>
                  )}
                </div>

                {sidebarOpen && item.list && item.list.length > 0 && (
                  <i
                    className={`fa-solid fa-chevron-down text-gray-400 group-hover:text-blue-500 transition-all duration-300 ease-out text-lg`}
                    style={{ transform: expandedMenu === item.headerName ? 'rotate(180deg)' : 'rotate(0deg)', transformOrigin: 'center' }}
                  />
                )}
              </button>

              {sidebarOpen && item.list && item.list.length > 0 && (
                <ul
                  className={`pl-8 text-gray-700 transition-all duration-700 ease-in-out overflow-hidden ${
                    expandedMenu === item.headerName
                      ? "max-h-[500px] opacity-100 mt-2"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  {item.list.map((subItem) => (
                    <li
                      key={subItem.id}
                      className={`py-2 px-2 cursor-pointer text-left rounded-lg hover:bg-gray-100/50 hover:text-blue-600 transition-all duration-300 ease-in-out ${
                        subItem.isActive ? "" : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (subItem.isActive)
                          handleNavigation(item.headerName, subItem.name);
                      }}
                    >
                      {subItem.icon && (
                        <i className={`fa ${subItem.icon} mr-3 text-sm transition-colors duration-300`} />
                      )}
                      <span className="font-medium">{subItem.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </div>

      {sidebarOpen && isSmallScreen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default MenuItems;