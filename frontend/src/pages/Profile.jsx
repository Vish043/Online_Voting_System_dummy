import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { User, Mail, Phone, MapPin, Calendar, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { INDIAN_STATES_AND_UTS } from '../constants/indianStates'
import { getDistrictsByState, getConstituenciesByDistrict, hasVidhanSabhaData, getConstituenciesByState } from '../constants/constituencies'

// Helper function to convert Firestore Timestamp to Date
function convertTimestampToDate(timestamp) {
  if (!timestamp) return null;
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it has toDate method (Firestore Timestamp object)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  
  // If it's a serialized Firestore Timestamp (from JSON)
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Try to parse as Date string
  return new Date(timestamp);
}

export default function Profile() {
  const { currentUser, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ 
    address: '', 
    phoneNumber: '', 
    state: '', 
    district: '', 
    ward: '', 
    constituency: '',
    lokSabhaConstituency: ''
  })
  const [availableDistricts, setAvailableDistricts] = useState([])
  const [availableConstituencies, setAvailableConstituencies] = useState([])
  const [availableLokSabhaConstituencies, setAvailableLokSabhaConstituencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    // Redirect admins away from profile page
    if (isAdmin) {
      navigate('/admin')
      return
    }
    fetchProfile()
  }, [isAdmin, navigate])

  // Update Lok Sabha constituencies when state changes
  useEffect(() => {
    if (formData.state) {
      const lokSabhaConstituencies = getConstituenciesByState(formData.state)
      setAvailableLokSabhaConstituencies(lokSabhaConstituencies)
    } else {
      setAvailableLokSabhaConstituencies([])
    }
  }, [formData.state])

  // Update districts and constituencies when state or district changes
  useEffect(() => {
    if (formData.state && hasVidhanSabhaData(formData.state)) {
      const districts = getDistrictsByState(formData.state)
      setAvailableDistricts(districts)
    } else {
      setAvailableDistricts([])
    }
  }, [formData.state])

  useEffect(() => {
    if (formData.state && formData.district && hasVidhanSabhaData(formData.state)) {
      const constituencies = getConstituenciesByDistrict(formData.state, formData.district)
      setAvailableConstituencies(constituencies)
    } else {
      setAvailableConstituencies([])
    }
  }, [formData.state, formData.district])

  // Don't render anything if admin (will redirect)
  if (isAdmin) {
    return null
  }

  async function fetchProfile() {
    try {
      setLoading(true)
      const res = await authAPI.getProfile()
      const voterData = res.data.voter || {}
      setProfile(voterData)
      setFormData({
        address: voterData.address || '',
        phoneNumber: voterData.phoneNumber || '',
        state: voterData.state || '',
        district: voterData.district || '',
        ward: voterData.ward || '',
        constituency: voterData.constituency || '',
        lokSabhaConstituency: voterData.lokSabhaConstituency || ''
      })
    } catch (error) {
      console.error('Fetch profile error:', error)
      // Set empty profile on error
      setProfile({
        registered: false,
        isVerified: false,
        isEligible: false
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setMessage({ type: '', text: '' })
      await authAPI.updateProfile(formData)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      await fetchProfile()
    } catch (error) {
      console.error('Update profile error:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="container" style={styles.container}>
      <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      <h1 style={styles.pageTitle}>My Profile</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="card" style={styles.profileCard}>
        <div style={styles.header}>
          <div style={styles.avatar}>
            <User size={48} />
          </div>
          <div>
            <h2 style={styles.name}>
              {profile?.firstName} {profile?.lastName}
            </h2>
            <p style={styles.email}>{currentUser?.email}</p>
          </div>
        </div>

        {/* Status Badges */}
        <div style={styles.badges}>
          <div className={`badge ${profile?.isVerified ? 'badge-success' : 'badge-warning'}`}>
            {profile?.isVerified ? '✓ Verified' : 'Pending Verification'}
          </div>
          <div className={`badge ${profile?.isEligible ? 'badge-success' : 'badge-danger'}`}>
            {profile?.isEligible ? 'Eligible to Vote' : 'Not Eligible'}
          </div>
        </div>

        {/* Profile Details */}
        <div style={styles.details}>
          <ProfileField
            icon={<Mail size={20} />}
            label="Email"
            value={currentUser?.email}
          />
          <ProfileField
            icon={<Calendar size={20} />}
            label="Date of Birth"
            value={profile?.dateOfBirth}
          />
          {isEditing ? (
            <>
              <div className="input-group" style={styles.editField}>
                <label>
                  <Phone size={16} style={styles.inlineIcon} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="input-group" style={styles.editField}>
                <label>
                  <MapPin size={16} style={styles.inlineIcon} /> Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  placeholder="House No. 123, Sector 5, New Delhi - 110001"
                />
              </div>
            </>
          ) : (
            <>
              <ProfileField
                icon={<Phone size={20} />}
                label="Phone Number"
                value={profile?.phoneNumber || 'Not provided'}
              />
              <ProfileField
                icon={<MapPin size={20} />}
                label="Address"
                value={profile?.address || 'Not provided'}
              />
              <ProfileField
                icon={<MapPin size={20} />}
                label="State"
                value={profile?.state || 'Not provided'}
              />
              <ProfileField
                icon={<MapPin size={20} />}
                label="District"
                value={profile?.district || 'Not provided'}
              />
              {profile?.constituency && (
                <ProfileField
                  icon={<MapPin size={20} />}
                  label="Constituency (Vidhan Sabha)"
                  value={profile?.constituency || 'Not provided'}
                />
              )}
              {profile?.lokSabhaConstituency && (
                <ProfileField
                  icon={<MapPin size={20} />}
                  label="Lok Sabha Constituency"
                  value={profile?.lokSabhaConstituency || 'Not provided'}
                />
              )}
              <ProfileField
                icon={<MapPin size={20} />}
                label="Ward/Locality/Panchayat"
                value={profile?.ward || 'Not provided'}
              />
            </>
          )}
          {isEditing && (
            <>
              <div className="input-group" style={styles.editField}>
                <label>
                  <MapPin size={16} style={styles.inlineIcon} /> State
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value, district: '', constituency: '', lokSabhaConstituency: '' })}
                  style={styles.stateSelect}
                >
                  <option value="">Select state...</option>
                  {INDIAN_STATES_AND_UTS.map((state) => (
                    <option key={state.name} value={state.name}>
                      {state.name} {state.type === 'ut' ? '(UT)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group" style={styles.editField}>
                <label>
                  <MapPin size={16} style={styles.inlineIcon} /> District
                </label>
                {formData.state && hasVidhanSabhaData(formData.state) && availableDistricts.length > 0 ? (
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value, constituency: '' })}
                    style={styles.stateSelect}
                  >
                    <option value="">Select district...</option>
                    {availableDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Enter district"
                  />
                )}
              </div>
              {formData.state && formData.district && hasVidhanSabhaData(formData.state) && availableConstituencies.length > 0 && (
                <div className="input-group" style={styles.editField}>
                  <label>
                    <MapPin size={16} style={styles.inlineIcon} /> Constituency (Vidhan Sabha)
                  </label>
                  <select
                    value={formData.constituency}
                    onChange={(e) => setFormData({ ...formData, constituency: e.target.value })}
                    style={styles.stateSelect}
                  >
                    <option value="">Select constituency...</option>
                    {availableConstituencies.map((constituency) => (
                      <option key={constituency} value={constituency}>
                        {constituency}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {formData.state && (
                <div className="input-group" style={styles.editField}>
                  <label>
                    <MapPin size={16} style={styles.inlineIcon} /> Lok Sabha Constituency
                  </label>
                  {availableLokSabhaConstituencies.length > 0 ? (
                    <select
                      value={formData.lokSabhaConstituency}
                      onChange={(e) => setFormData({ ...formData, lokSabhaConstituency: e.target.value })}
                      style={styles.stateSelect}
                    >
                      <option value="">Select Lok Sabha constituency...</option>
                      {availableLokSabhaConstituencies.map((constituency) => (
                        <option key={constituency} value={constituency}>
                          {constituency}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.lokSabhaConstituency}
                      onChange={(e) => setFormData({ ...formData, lokSabhaConstituency: e.target.value })}
                      placeholder="Enter Lok Sabha constituency"
                    />
                  )}
                </div>
              )}
              <div className="input-group" style={styles.editField}>
                <label>
                  <MapPin size={16} style={styles.inlineIcon} /> Ward/Locality/Panchayat
                </label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  placeholder="Enter ward/locality/panchayat"
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={styles.actions}>
          {isEditing ? (
            <>
              <button 
                onClick={handleSave} 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false)
                  setFormData({
                    address: profile?.address || '',
                    phoneNumber: profile?.phoneNumber || '',
                    state: profile?.state || '',
                    district: profile?.district || '',
                    ward: profile?.ward || '',
                    constituency: profile?.constituency || '',
                    lokSabhaConstituency: profile?.lokSabhaConstituency || ''
                  })
                }}
                className="btn btn-outline"
                disabled={saving}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="btn btn-primary"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Registration Info */}
      <div className="card" style={styles.infoCard}>
        <h3 style={styles.infoTitle}>Registration Information</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Registered</span>
            <span style={styles.infoValue}>
              {(() => {
                if (!profile?.registeredAt) return 'N/A';
                const date = convertTimestampToDate(profile.registeredAt);
                if (!date) return 'N/A';
                try {
                  const dateStr = date.toLocaleDateString();
                  return dateStr === 'Invalid Date' ? 'N/A' : dateStr;
                } catch (e) {
                  return 'N/A';
                }
              })()}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Verification Status</span>
            <span style={styles.infoValue}>
              {profile?.isVerified ? 'Verified' : 'Pending'}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Elections Participated</span>
            <span style={styles.infoValue}>
              {profile?.votingHistory?.length || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileField({ icon, label, value }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldIcon}>{icon}</div>
      <div>
        <div style={styles.fieldLabel}>{label}</div>
        <div style={styles.fieldValue}>{value}</div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem',
    maxWidth: '800px',
    margin: '0 auto',
    position: 'relative'
  },
  backBtn: {
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  pageTitle: {
    fontSize: '2rem',
    marginBottom: '2rem'
  },
  profileCard: {
    marginBottom: '2rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '1.5rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)'
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  name: {
    fontSize: '1.5rem',
    marginBottom: '0.25rem'
  },
  email: {
    color: 'var(--text-secondary)'
  },
  badges: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  field: {
    display: 'flex',
    alignItems: 'start',
    gap: '1rem'
  },
  fieldIcon: {
    color: 'var(--primary-color)',
    marginTop: '0.25rem'
  },
  fieldLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.25rem'
  },
  fieldValue: {
    fontSize: '1rem',
    color: 'var(--text-primary)'
  },
  editField: {
    marginBottom: '0'
  },
  inlineIcon: {
    display: 'inline',
    verticalAlign: 'middle',
    marginRight: '0.5rem'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-color)'
  },
  infoCard: {
    marginTop: '2rem'
  },
  infoTitle: {
    fontSize: '1.25rem',
    marginBottom: '1.5rem'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.5rem'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)'
  },
  infoValue: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--primary-color)'
  },
  stateSelect: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  }
}

