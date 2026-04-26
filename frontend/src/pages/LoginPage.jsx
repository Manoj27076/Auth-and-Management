import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
  const { isAuthenticated, isVerified } = useAuth()
  const navigate = useNavigate()

  // Already logged in → redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isVerified ? '/profile' : '/verify-email', { replace: true })
    }
  }, [isAuthenticated, isVerified, navigate])

  const handleGoogleLogin = () => {
    // Navigate directly to Flask OAuth endpoint.
    // Vite proxies /api → Flask, so cookies stay same-origin.
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-grid" />
      </div>

      <div className="login-card glass-card fade-in">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/logo.png" alt="TechVayana Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px' }} />
          </div>
          <h1 className="login-title">
            Welcome to <span className="gradient-text">TechVayana</span>
          </h1>
          <p className="login-subtitle">
            Secure attendance management with Google Sign-In
          </p>
        </div>

        {/* Features preview */}
        <div className="login-features">
          {[
            { icon: '🔒', text: 'Secure OAuth 2.0 Login' },
            { icon: '✅', text: 'Email OTP Verification' },
            { icon: '🏷️', text: 'Role-Based Access Control' },
            { icon: '📊', text: 'QR-Based Attendance' },
          ].map(f => (
            <div key={f.text} className="login-feature-chip">
              <span>{f.icon}</span> {f.text}
            </div>
          ))}
        </div>

        <div className="divider">or continue with</div>

        {/* Google Sign-In */}
        <button
          id="google-signin-btn"
          className="btn btn-google btn-full"
          onClick={handleGoogleLogin}
        >
          {/* Official Google "G" logo as inline SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="login-terms">
          By signing in, you agree to our{' '}
          <a href="#terms">Terms of Service</a> and{' '}
          <a href="#privacy">Privacy Policy</a>.
          Your email will be verified via OTP after sign-in.
        </p>
      </div>

      {/* Footer */}
      <p className="login-footer">
        QR Attendance System &copy; {new Date().getFullYear()} &bull; Built for clubs &amp; events
      </p>
    </div>
  )
}
