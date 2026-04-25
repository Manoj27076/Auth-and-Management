import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

/**
 * ProtectedRoute
 *
 * Props:
 *   requireVerified  – redirect to /verify-email if user.is_verified is false
 *   requireRole      – redirect to /profile if user doesn't have this role
 *   children         – the protected component to render
 */
export default function ProtectedRoute({
  children,
  requireVerified = false,
  requireRole     = null,
}) {
  const { isAuthenticated, isVerified, hasRole, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner fullscreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireVerified && !isVerified) {
    return <Navigate to="/verify-email" replace />
  }

  if (requireRole && !hasRole(requireRole)) {
    return <Navigate to="/profile" replace />
  }

  return children
}
