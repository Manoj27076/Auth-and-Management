import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DomainSelector from '../components/DomainSelector'
import api from '../api/axios'
import { ArrowLeft, Save, Clock, CheckCircle, XCircle } from 'lucide-react'
import './EditProfilePage.css'

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [name,           setName]           = useState(user?.name ?? '')
  const [allDomains,     setAllDomains]     = useState([])
  const [selected,       setSelected]       = useState([])
  const [pendingRequests,setPendingRequests] = useState([])
  const [loading,        setLoading]        = useState(false)
  const [fetchingD,      setFetchingD]      = useState(true)
  const [error,          setError]          = useState('')
  const [saved,          setSaved]          = useState(false)

  // Load all available domains + user's pending requests
  useEffect(() => {
    Promise.all([
      api.get('/profile/domains/all'),
      api.get('/profile/requests')
    ])
      .then(([domainsRes, reqRes]) => {
        setAllDomains(domainsRes.data.domains)
        // Pre-select current domains + pending-request domains (so UX doesn't look broken)
        const currentIds = user?.domains?.map(d => d.id) ?? []
        const pendingIds = (reqRes.data.requests ?? []).map(r => r.domain_id)
        setSelected([...new Set([...currentIds, ...pendingIds])])
        setPendingRequests(reqRes.data.requests ?? [])
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
      const domRes = await api.put('/profile/domains', { domain_ids: selected })
      // Refresh pending requests from the response
      setPendingRequests(domRes.data.pending_requests ?? [])
      await refreshUser()
      setSaved(true)
      setTimeout(() => navigate('/profile'), 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // IDs the user is already a full member of (not pending)
  const memberDomainIds = new Set(user?.domains?.map(d => d.id) ?? [])
  const pendingDomainIds = new Set(pendingRequests.map(r => r.domain_id))
  // Lead domains (cannot leave)
  const ledDomainIds = new Set(user?.led_domains?.map(d => d.id) ?? [])

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
              Update your display name and request to join domains of interest.
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
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <h2 className="section-title" style={{ marginBottom:0 }}>🌐 Domains</h2>
                  <span className="domain-count-badge">{selected.length} / 10 selected</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Selecting a new domain sends a <strong>join request</strong> to the domain lead.
                  You will be added once a lead or admin approves your request.
                  Domains you lead cannot be removed.
                </p>

                {fetchingD ? (
                  <div className="domain-grid-shimmer">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="shimmer" style={{ height: 96 }} />
                    ))}
                  </div>
                ) : (
                  <DomainSelector
                    domains={allDomains}
                    selected={selected}
                    onChange={(newSelected) => {
                      // Prevent deselecting led domains
                      const protected_ = [...ledDomainIds].filter(id => newSelected.includes(id) || !newSelected.includes(id))
                      const final = [...new Set([...newSelected, ...ledDomainIds])]
                      setSelected(final)
                    }}
                    disabled={loading}
                    lockedIds={[...ledDomainIds]}      // locked = always selected, cannot deselect
                    pendingIds={[...pendingDomainIds]}  // show "pending" badges
                  />
                )}
              </section>

              {/* ── Pending Requests Info ─── */}
              {pendingRequests.length > 0 && (
                <section className="edit-section">
                  <h2 className="section-title">⏳ Pending Join Requests</h2>
                  <div className="pending-requests-list">
                    {pendingRequests.map(r => (
                      <div key={r.id} className="pending-req-row">
                        <Clock size={14} />
                        <span className="pending-req-name">{r.domain_name}</span>
                        <span className="pending-req-status">Awaiting approval</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

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
