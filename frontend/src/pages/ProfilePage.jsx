import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import RoleBadge from '../components/RoleBadge'
import { Edit3, Mail, Calendar, Globe, Fingerprint, Shield } from 'lucide-react'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  return (
    <div className="profile-page page-wrapper">
      <div className="container">
        <div className="profile-grid fade-in">

          {/* ── Left: identity card ──────────────────────── */}
          <div className="profile-identity glass-card">
            {/* Avatar */}
            <div className="profile-avatar-wrap">
              {user.avatar_url
                ? <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="profile-avatar"
                  />
                : <div className="profile-avatar-placeholder">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
              }
              <div className="profile-avatar-ring" />
            </div>

            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-email">
              <Mail size={14} style={{ display:'inline', marginRight:5 }} />
              {user.email}
            </p>

            {/* Badges */}
            <div className="profile-badges">
              <span className={`badge ${user.is_verified ? 'badge-verified' : 'badge-unverified'}`}>
                {user.is_verified ? '✅ Verified' : '⏳ Unverified'}
              </span>
              <RoleBadge roles={user.roles} />
            </div>

            {/* Stats */}
            <div className="profile-stats">
              <div className="profile-stat">
                <Globe size={16} />
                <span>{user.domains?.length ?? 0} Domains</span>
              </div>
              <div className="profile-stat">
                <Fingerprint size={16} />
                <span>{user.face_registered ? 'Face Registered' : 'No Face Data'}</span>
              </div>
              <div className="profile-stat">
                <Calendar size={16} />
                <span>Joined {joinDate}</span>
              </div>
            </div>

            {/* Edit button */}
            <Link
              id="edit-profile-btn"
              to="/profile/edit"
              className="btn btn-primary btn-full"
              style={{ marginTop: 8 }}
            >
              <Edit3 size={16} /> Edit Profile
            </Link>
          </div>

          {/* ── Right: details ───────────────────────────── */}
          <div className="profile-details">

            {/* Domains */}
            <section className="profile-section glass-card">
              <h2 className="section-title">
                <Globe size={18} /> My Domains
              </h2>
              {user.domains?.length > 0 ? (
                <div className="profile-domain-tags">
                  {user.domains.map(d => (
                    <span key={d.id} className="domain-tag">
                      <span>{d.icon}</span> {d.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="profile-empty">
                  <p>No domains selected yet.</p>
                  <Link to="/profile/edit" className="btn btn-secondary btn-sm">
                    Select Domains
                  </Link>
                </div>
              )}
            </section>

            {/* Roles */}
            <section className="profile-section glass-card">
              <h2 className="section-title">
                <Shield size={18} /> Permissions
              </h2>
              <div className="profile-roles-list">
                {user.roles?.length > 0
                  ? user.roles.map(r => (
                      <div key={r} className="profile-role-row">
                        <RoleBadge roles={[r]} size="md" />
                        <span className="profile-role-desc">
                          {r === 'admin'
                            ? 'Full system access — can manage users and roles'
                            : r === 'domain_lead'
                            ? 'Domain leadership — can manage domain members'
                            : 'Standard club member access'}
                        </span>
                      </div>
                    ))
                  : <p style={{ color: 'var(--text-muted)' }}>No roles assigned.</p>
                }
              </div>
            </section>

            {/* Account security */}
            <section className="profile-section glass-card">
              <h2 className="section-title">🔐 Account Security</h2>
              <div className="profile-security-grid">
                <div className={`security-item ${user.is_verified ? 'ok' : 'warn'}`}>
                  <span className="security-icon">{user.is_verified ? '✅' : '⚠️'}</span>
                  <div>
                    <strong>Email Verification</strong>
                    <p>{user.is_verified ? 'Verified' : 'Pending verification'}</p>
                  </div>
                </div>
                <div className={`security-item ${user.face_registered ? 'ok' : 'neutral'}`}>
                  <span className="security-icon">{user.face_registered ? '🔒' : '👤'}</span>
                  <div>
                    <strong>Facial Recognition</strong>
                    <p>{user.face_registered ? 'Registered (immutable)' : 'Not registered'}</p>
                  </div>
                </div>
                <div className="security-item ok">
                  <span className="security-icon">🔑</span>
                  <div>
                    <strong>Google OAuth 2.0</strong>
                    <p>Connected via Google Sign-In</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
