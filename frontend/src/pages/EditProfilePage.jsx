import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DomainSelector from '../components/DomainSelector'
import api from '../api/axios'
import { ArrowLeft, Save } from 'lucide-react'
import './EditProfilePage.css'

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [name,       setName]       = useState(user?.name ?? '')
  const [domains,    setDomains]    = useState([])
  const [selected,   setSelected]   = useState([])
  const [loading,    setLoading]    = useState(false)
  const [fetchingD,  setFetchingD]  = useState(true)
  const [error,      setError]      = useState('')
  const [saved,      setSaved]      = useState(false)

  // Load all available domains
  useEffect(() => {
    api.get('/profile/domains/all')
      .then(r => {
        setDomains(r.data.domains)
        setSelected(user?.domains?.map(d => d.id) ?? [])
      })
      .catch(() => setError('Failed to load domains.'))
      .finally(() => setFetchingD(false))
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name cannot be empty.'); return }
    setLoading(true)
    setError('')
    try {
      await api.put('/profile/edit',    { name: name.trim() })
      await api.put('/profile/domains', { domain_ids: selected })
      await refreshUser()
      setSaved(true)
      setTimeout(() => navigate('/profile'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="edit-page page-wrapper">
      <div className="container">
        <div className="edit-wrap fade-in">

          {/* Back */}
          <Link to="/profile" className="btn btn-ghost btn-sm edit-back">
            <ArrowLeft size={16} /> Back to Profile
          </Link>

          <div className="edit-card glass-card">
            <h1 className="edit-title">Edit Profile</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
              Update your display name and select your domains of interest.
            </p>

            <form onSubmit={handleSave} id="edit-profile-form">
              {/* ── Name ─────────────────────── */}
              <section className="edit-section">
                <h2 className="section-title">👤 Personal Info</h2>
                <div className="edit-field-row">
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label" htmlFor="edit-name">Full Name</label>
                    <input
                      id="edit-name"
                      className="input-field"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={255}
                      placeholder="Your display name"
                      required
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Email (from Google)</label>
                    <input
                      className="input-field"
                      value={user?.email ?? ''}
                      disabled
                      readOnly
                      title="Email is sourced from Google and cannot be changed."
                    />
                  </div>
                </div>
              </section>

              {/* ── Domains ──────────────────── */}
              <section className="edit-section">
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <h2 className="section-title" style={{ marginBottom:0 }}>🌐 Select Your Domains</h2>
                  <span className="domain-count-badge">
                    {selected.length} / 10 selected
                  </span>
                </div>

                {fetchingD ? (
                  <div className="domain-grid-shimmer">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="shimmer" style={{ height: 96 }} />
                    ))}
                  </div>
                ) : (
                  <DomainSelector
                    domains={domains}
                    selected={selected}
                    onChange={setSelected}
                    disabled={loading}
                  />
                )}
              </section>

              {/* ── Errors / Success ─────────── */}
              {error && (
                <div className="alert alert-error" role="alert">⚠️ {error}</div>
              )}
              {saved && (
                <div className="alert alert-success">✅ Profile saved! Redirecting…</div>
              )}

              {/* ── Actions ──────────────────── */}
              <div className="edit-actions">
                <Link to="/profile" className="btn btn-secondary">Cancel</Link>
                <button
                  id="save-profile-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || saved}
                >
                  {loading
                    ? <><span className="spin">⟳</span> Saving…</>
                    : <><Save size={16} /> Save Changes</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
