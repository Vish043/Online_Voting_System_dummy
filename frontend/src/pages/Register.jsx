import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { UserPlus, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { INDIAN_STATES_AND_UTS } from '../constants/indianStates'
import { getDistrictsByState, getConstituenciesByDistrict, hasVidhanSabhaData, getConstituenciesByState } from '../constants/constituencies'
import SearchableSelect from '../components/SearchableSelect'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationalId: '',
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  // Update Lok Sabha constituencies when state changes
  useEffect(() => {
    if (formData.state) {
      const lokSabhaConstituencies = getConstituenciesByState(formData.state)
      setAvailableLokSabhaConstituencies(lokSabhaConstituencies)
      // Reset Lok Sabha constituency when state changes
      if (formData.lokSabhaConstituency && !lokSabhaConstituencies.includes(formData.lokSabhaConstituency)) {
        setFormData(prev => ({ ...prev, lokSabhaConstituency: '' }))
      }
    } else {
      setAvailableLokSabhaConstituencies([])
      setFormData(prev => ({ ...prev, lokSabhaConstituency: '' }))
    }
  }, [formData.state])

  // Update districts and constituencies when state or district changes
  useEffect(() => {
    if (formData.state && hasVidhanSabhaData(formData.state)) {
      const districts = getDistrictsByState(formData.state)
      setAvailableDistricts(districts)
      // Reset district and constituency when state changes
      if (formData.district && !districts.includes(formData.district)) {
        setFormData(prev => ({ ...prev, district: '', constituency: '' }))
      }
    } else {
      setAvailableDistricts([])
      setFormData(prev => ({ ...prev, district: '', constituency: '' }))
    }
  }, [formData.state])

  useEffect(() => {
    if (formData.state && formData.district && hasVidhanSabhaData(formData.state)) {
      const constituencies = getConstituenciesByDistrict(formData.state, formData.district)
      setAvailableConstituencies(constituencies)
      // Reset constituency when district changes
      if (formData.constituency && !constituencies.includes(formData.constituency)) {
        setFormData(prev => ({ ...prev, constituency: '' }))
      }
    } else {
      setAvailableConstituencies([])
      setFormData(prev => ({ ...prev, constituency: '' }))
    }
  }, [formData.state, formData.district])

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match')
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    try {
      setError('')
      setSuccess('')
      setLoading(true)

      // Create Firebase auth account
      const displayName = `${formData.firstName} ${formData.lastName}`
      await signup(formData.email, formData.password, displayName)

      // Register voter in backend
      await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        nationalId: formData.nationalId,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        state: formData.state,
        district: formData.district,
        constituency: formData.constituency,
        lokSabhaConstituency: formData.lokSabhaConstituency
      })

      setSuccess('Registration successful! Your account is pending verification.')
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Registration error:', error)
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate('/')} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back to Home
      </button>
      <div className="card" style={styles.card}>
        <div style={styles.header}>
          <UserPlus size={40} style={styles.icon} />
          <h1 style={styles.title}>Voter Registration</h1>
          <p style={styles.subtitle}>Create your account to start voting</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.row}>
            <div className="input-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Rahul"
              />
            </div>

            <div className="input-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Sharma"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="rahul.sharma@example.com"
            />
          </div>

          <div style={styles.row}>
            <div className="input-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div className="input-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="nationalId">National ID *</label>
              <input
                type="text"
                id="nationalId"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                required
                placeholder="ABCDE1234F"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="input-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              placeholder="House No. 123, Sector 5, New Delhi - 110001"
            />
          </div>

          <div style={styles.sectionDivider}>
            <h3 style={styles.sectionTitle}>Region Information *</h3>
            <p style={styles.sectionSubtitle}>Required for election eligibility</p>
          </div>

          <div className="input-group">
            <label htmlFor="state">State / Union Territory *</label>
            <SearchableSelect
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              options={INDIAN_STATES_AND_UTS.map((state) => 
                `${state.name}${state.type === 'ut' ? ' (UT)' : ''} - ${state.seats} Lok Sabha seats`
              )}
              getOptionValue={(option) => {
                // Extract state name from formatted string
                const match = option.match(/^([^(]+?)(?:\s*\(UT\))?\s*-/)
                return match ? match[1].trim() : option
              }}
              placeholder="Select your state or union territory..."
              required
            />
          </div>

          {formData.state && (
            <div className="input-group">
              <label htmlFor="lokSabhaConstituency">Lok Sabha Constituency *</label>
              {availableLokSabhaConstituencies.length > 0 ? (
                <SearchableSelect
                  id="lokSabhaConstituency"
                  name="lokSabhaConstituency"
                  value={formData.lokSabhaConstituency}
                  onChange={handleChange}
                  options={availableLokSabhaConstituencies}
                  placeholder="Select your Lok Sabha constituency..."
                  required
                />
              ) : (
                <input
                  type="text"
                  id="lokSabhaConstituency"
                  name="lokSabhaConstituency"
                  value={formData.lokSabhaConstituency}
                  onChange={handleChange}
                  required
                  placeholder="Enter your Lok Sabha constituency"
                />
              )}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="district">District *</label>
            {formData.state && hasVidhanSabhaData(formData.state) && availableDistricts.length > 0 ? (
              <SearchableSelect
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                options={availableDistricts}
                placeholder="Select your district..."
                required
              />
            ) : (
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
                placeholder="e.g., Mumbai, Bangalore, New Delhi"
              />
            )}
          </div>

          {formData.state && formData.district && hasVidhanSabhaData(formData.state) && availableConstituencies.length > 0 && (
            <div className="input-group">
              <label htmlFor="constituency">Constituency (Vidhan Sabha) *</label>
              <SearchableSelect
                id="constituency"
                name="constituency"
                value={formData.constituency}
                onChange={handleChange}
                options={availableConstituencies}
                placeholder="Select your constituency..."
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 100px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    position: 'relative'
  },
  backBtn: {
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  card: {
    maxWidth: '600px',
    width: '100%'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  icon: {
    color: 'var(--primary-color)',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)'
  },
  subtitle: {
    color: 'var(--text-secondary)'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  },
  submitBtn: {
    width: '100%',
    marginTop: '1rem'
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  },
  link: {
    color: 'var(--primary-color)',
    textDecoration: 'none',
    fontWeight: 600
  },
  sectionDivider: {
    marginTop: '2rem',
    marginBottom: '1rem',
    paddingTop: '1.5rem',
    borderTop: '2px solid var(--border-color)'
  },
  sectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.25rem',
    color: 'var(--text-primary)'
  },
  sectionSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
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

