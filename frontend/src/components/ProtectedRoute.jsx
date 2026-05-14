import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute V6
 * Guards routes based on authentication and roles
 */
const ProtectedRoute = ({ children, requiredRole = null, user }) => {
  const token = localStorage.getItem('authToken');

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role ? user.role.toLowerCase() : '';
  const reqRole = requiredRole ? requiredRole.toLowerCase() : null;

  // Check role if required (Admin bypasses most checks)
  if (reqRole && role !== reqRole && role !== 'admin' && role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
