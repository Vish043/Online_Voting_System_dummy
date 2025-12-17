import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

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
    phoneNumber: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

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
        phoneNumber: formData.phoneNumber
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
                placeholder="John"
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
                placeholder="Doe"
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
              placeholder="john.doe@example.com"
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
                placeholder="123456789"
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
              placeholder="+1 234 567 8900"
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
              placeholder="123 Main St, City, State, ZIP"
            />
          </div>

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
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem'
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
  }
}

