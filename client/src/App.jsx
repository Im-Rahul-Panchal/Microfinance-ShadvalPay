import React from "react";
import "./index.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import 'react-image-crop/dist/ReactCrop.css';

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import FlowRoute from "./components/auth/FlowRoute";

import LoginForm from "./components/auth/LoginForm";
import MpinForm from "./components/auth/MpinForm";
import ForgotPassword from "./components/auth/ForgotPassword";
import ForgotMpin from "./components/auth/ForgotMpin";
import OtpForm from "./components/auth/OtpForm";
import ChangePassword from "./components/auth/ChangePassword";

import Home from "./components/dashboard/Home";
import Profile from "./components/associate/Profile";
import Registration from "./components/associate/customer/Registration";

import VerifyOtp from "./components/associate/customer/VerifyOtp";
import ManualDetails from "./components/associate/customer/ManualDetails";
import UploadDocument from "./components/associate/customer/UploadDocument";
import CustomerProfile from "./components/associate/customer/CustomerProfile";
import ClientList from "./components/associate/customer/ClientList";

import ApplyNewLoan from "./components/associate/loan/ApplyNewLoan";
import LoanReport from "./components/associate/loan/LoanReport";
import LoanDues from "./components/associate/loan/LoanDues";
import LoanProfile from "./components/associate/loan/LoanProfile";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
            <Route
              path="/auth/forgot-mpin"
              element={
                <PublicRoute>
                  <ForgotMpin />
                </PublicRoute>
              }
            />

            {/* Flow Routes - Require specific authentication flow */}
            <Route
              path="/auth/mpin"
              element={
                <FlowRoute requiredFlow="login" redirectTo="/">
                  <MpinForm />
                </FlowRoute>
              }
            />
            <Route
              path="/auth/otp"
              element={
                <FlowRoute requiredFlow="otp" redirectTo="/">
                  <OtpForm />
                </FlowRoute>
              }
            />
            <Route
              path="/auth/change-password"
              element={
                <FlowRoute requiredFlow="changePassword" redirectTo="/">
                  <ChangePassword />
                </FlowRoute>
              }
            />

            {/* Protected Routes - Require authentication */}
            <Route
              path="/dashboard/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Customer Routes - Require authentication */}
            <Route
              path="/associate/customer/registration"
              element={
                <ProtectedRoute>
                  <Registration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/customer/clientList"
              element={
                <ProtectedRoute>
                  <ClientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/customer/ManualDetails"
              element={
                <ProtectedRoute>
                  <ManualDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/customer/VerifyOtp"
              element={
                <ProtectedRoute>
                  <FlowRoute
                    requiredFlow="registration"
                    redirectTo="/associate/customer/registration"
                  >
                    <VerifyOtp />
                  </FlowRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/customer/UploadDocument"
              element={
                <ProtectedRoute>
                  <UploadDocument />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/customer/CustomerProfile"
              element={
                <ProtectedRoute>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />

            {/* Loan Routes - Require authentication */}
            <Route
              path="/associate/loan/apply_new_loan"
              element={
                <ProtectedRoute>
                  <ApplyNewLoan />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/loan/loan_report"
              element={
                <ProtectedRoute>
                  <LoanReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/loan/collection_report"
              element={
                <ProtectedRoute>
                  <LoanDues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/associate/loan/loan_details"
              element={
                <ProtectedRoute>
                  <LoanProfile />
                </ProtectedRoute>
              }
            />
          </Routes>

          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={12}
            containerStyle={{
              top: 20,
              zIndex: 999999999,
            }}
            toastOptions={{
              duration: 2000,
              style: {
                background: "#333",
                color: "#fff",
                zIndex: 999999999,
                borderRadius: "8px",
                padding: "10px 14px",
              },
              success: {
                style: {
                  background: "#0a923cff",
                },
              },
              error: {
                style: {
                  background: "#dc2626", // red
                },
              },
              loading: {
                style: {
                  background: "#759cf0ff", // blue
                },
              },
            }}
          />

        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
