import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RoleBadge from './RoleBadge'
import {
  QrCode, LogOut, User, Settings, ShieldCheck, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import './Navbar.css'

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to={isAuthenticated ? '/profile' : '/login'} className="navbar-logo">
          <div className="navbar-logo-icon">
            <QrCode size={20} strokeWidth={2.5} />
          </div>
          <span className="navbar-logo-text">
            QR<span className="gradient-text">Attend</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        {isAuthenticated && (
          <div className="navbar-links">
            <Link
              to="/profile"
              className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            >
              <User size={16} /> Profile
            </Link>
            {hasRole('admin') && (
              <Link
                to="/admin"
                className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
              >
                <ShieldCheck size={16} /> Admin
              </Link>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="navbar-right">
          {isAuthenticated && user ? (
            <>
              <div className="navbar-user">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.name} className="navbar-avatar" />
                  : <div className="navbar-avatar-placeholder">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                }
                <div className="navbar-user-info">
                  <span className="navbar-user-name">{user.name}</span>
                  <RoleBadge roles={user.roles} size="xs" />
                </div>
              </div>
              <button
                id="navbar-logout-btn"
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut size={16} />
                <span className="hide-sm">Sign out</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="btn btn-ghost btn-sm navbar-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && isAuthenticated && (
        <div className="navbar-mobile-menu">
          <Link to="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            <User size={16} /> Profile
          </Link>
          {hasRole('admin') && (
            <Link to="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              <ShieldCheck size={16} /> Admin
            </Link>
          )}
          <button className="mobile-nav-link danger" onClick={handleLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </nav>
  )
}
