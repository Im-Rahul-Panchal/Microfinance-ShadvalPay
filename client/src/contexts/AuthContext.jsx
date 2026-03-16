import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../api/api";
import { BASE_URL } from "../config";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Base64 Decoder for UserID
const decodeBase64 = (str) => {
  try {
    return atob(str);
  } catch {
    return null;
  }
};

// JWT Decode Function
const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("jwtToken") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [isLoading, setIsLoading] = useState(true);

  const [authFlow, setAuthFlow] = useState({
    isInLoginFlow: false,
    isInOtpFlow: false,
    otpType: null,
    registrationData: null,
    isInRegistrationFlow: false,
    expectedPath: null
  });

  // IDLE LOGOUT TIMER (15 MINS)
  const idleTimeoutRef = useRef(null);
  const IDLE_TIMEOUT = 15 * 60 * 1000; 

  // ---------------------------------------------
  // AUTO REFRESH TOKEN
  // ---------------------------------------------
  const refreshToken = async () => {
    try {
      const response = await api.post(`${BASE_URL}/api/refresh-token`);
      const newToken = response.data.token;

      if (newToken) {
        sessionStorage.setItem("jwtToken", newToken);
        setToken(newToken);
      }
    } catch (err) {
      console.warn("Token refresh failed:", err);
    }
  };

  // ---------------------------------------------
  // RESET IDLE TIMER ON USER ACTIVITY
  // ---------------------------------------------
  const resetIdleTimer = () => {
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    if (isAuthenticated) {
      idleTimeoutRef.current = setTimeout(() => logout(), IDLE_TIMEOUT);
      refreshToken(); // Refresh token on user activity
    }
  };

  // ---------------------------------------------
  // RESTORE TOKEN ON PAGE LOAD
  // ---------------------------------------------
  useEffect(() => {
    const savedToken = sessionStorage.getItem("jwtToken");

    if (savedToken) {
      const decoded = decodeToken(savedToken);
      if (decoded?.userId) {
        setUser({ userId: decoded.userId });
      }
      setToken(savedToken);
      setIsAuthenticated(true);
      resetIdleTimer();
    }

    setIsLoading(false);
  }, []);

  // ---------------------------------------------
  // LISTEN TO USER ACTIVITY
  // ---------------------------------------------
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();

    window.addEventListener("click", handleActivity);

    return () => {
      window.removeEventListener("click", handleActivity);
    };
  }, [isAuthenticated]);

  // ---------------------------------------------
  // LOGIN FLOW FUNCTIONS
  // ---------------------------------------------
  const startLoginFlow = () => {
    setAuthFlow(prev => ({ ...prev, isInLoginFlow: true }));
  };

  const startOtpFlow = (type, additionalData = {}) => {
    setAuthFlow(prev => ({
      ...prev,
      isInOtpFlow: true,
      otpType: type,
      otpData: additionalData,
      expectedPath: window.location.pathname
    }));
  };

  const startRegistrationFlow = (registrationData) => {
    setAuthFlow(prev => ({
      ...prev,
      registrationData,
      isInRegistrationFlow: true
    }));
  };

  const completeOtpFlow = () => {
    setAuthFlow(prev => ({
      ...prev,
      isInOtpFlow: false,
      otpType: null,
      otpData: null
    }));
  };

  // ---------------------------------------------
  // MPIN LOGIN — SAVE TOKEN + USER ID
  // ---------------------------------------------
  const mpinLogin = (apiResponse) => {
    const jwtToken = apiResponse.token;
    const apiUserId = apiResponse.data?.userId;

    if (!jwtToken || !apiUserId) return false;

    sessionStorage.setItem("jwtToken", jwtToken);
    setToken(jwtToken);

    const decoded = decodeToken(jwtToken);

    setUser({ userId: decoded?.userId });
    setIsAuthenticated(true);
    resetIdleTimer();

    return true;
  };

  // ---------------------------------------------
  // LOGOUT
  // ---------------------------------------------
  const logout = () => {
    sessionStorage.removeItem("jwtToken");
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    setAuthFlow({
      isInLoginFlow: false,
      isInOtpFlow: false,
      otpType: null,
      registrationData: null,
      isInRegistrationFlow: false,
      expectedPath: null
    });

    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    window.location.href = "/";
  };

  // ---------------------------------------------
  // ROUTE ACCESS CONTROL
  // ---------------------------------------------
  const canAccessRoute = (route) => {
    const publicRoutes = ['/', '/auth/forgot-password', '/auth/forgot-mpin'];
    if (publicRoutes.includes(route)) return true;

    const authRoutes = ['/auth/mpin', '/auth/otp', '/auth/change-password'];
    if (authRoutes.includes(route)) {
      if (!isAuthenticated && route === '/auth/mpin') return authFlow.isInLoginFlow;
      if (route === '/auth/otp') return authFlow.isInOtpFlow;
      if (route === '/auth/change-password') return authFlow.isInOtpFlow && authFlow.otpType === 'password';
      return !isAuthenticated;
    }

    if (!isAuthenticated) return false;

    const registrationRoutes = [
      '/associate/customer/registration',
      '/associate/customer/VerifyOtp',
      '/associate/customer/ManualDetails',
      '/associate/customer/UploadDocument'
    ];

    if (registrationRoutes.includes(route)) {
      if (route === '/associate/customer/VerifyOtp') {
        return authFlow.isInRegistrationFlow && authFlow.registrationData;
      }
      return true;
    }

    return true;
  };

  // ---------------------------------------------
  // PROVIDER RETURN
  // ---------------------------------------------
  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,

      authFlow,
      startLoginFlow,
      startOtpFlow,
      startRegistrationFlow,
      completeOtpFlow,
      mpinLogin,
      logout,
      canAccessRoute,

      setUserId: (id) => setUser({ userId: id })
    }}>
      {children}
    </AuthContext.Provider>
  );
};
