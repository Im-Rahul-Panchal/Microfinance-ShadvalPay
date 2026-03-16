import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const FlowRoute = ({ children, requiredFlow, redirectTo = '/' }) => {
  const { authFlow, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cover bg-center flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is in the required flow
  let isInRequiredFlow = false;

  switch (requiredFlow) {
    case 'login':
      isInRequiredFlow = authFlow.isInLoginFlow;
      break;
    case 'otp':
      isInRequiredFlow = authFlow.isInOtpFlow;
      break;
    case 'registration':
      isInRequiredFlow = authFlow.isInRegistrationFlow;
      break;
    case 'changePassword':
      isInRequiredFlow = authFlow.isInOtpFlow && authFlow.otpType === 'password';
      break;
    case 'forgotMpin':
      isInRequiredFlow = authFlow.isInOtpFlow && authFlow.otpType === 'mpin';
      break;
    default:
      isInRequiredFlow = true;
  }

  if (!isInRequiredFlow) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
};

export default FlowRoute;
