import React from 'react';
import { Navigate } from 'react-router-dom';
import UnauthorizedPage from '../pages/UnauthorizedPage';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Get admin data from localStorage or wherever you store it
  const adminData = JSON.parse(localStorage.getItem('admin-data') || '{}');
  const isLoggedIn = Boolean(localStorage.getItem('admin-token'));
  
  // Check if user is logged in
  if (!isLoggedIn) {
    return <Navigate to="/admin-login" replace />;
  }
  
  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(adminData.role)) {
    return <UnauthorizedPage />;
  }
  
  // If user is logged in and has the correct role, render the children
  return children;
};

export default ProtectedRoute;