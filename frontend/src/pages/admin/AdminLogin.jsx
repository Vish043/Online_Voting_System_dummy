import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Shield, LogIn, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAdmin, currentUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!authLoading && currentUser && isAdmin) {
      navigate('/admin')
    }
  }, [currentUser, isAdmin, navigate, authLoading])

  // Check admin status after login
  useEffect(() => {
    if (!authLoading && currentUser && !isAdmin && !loading) {
      // User logged in but not admin
      setError('Access denied. This account does not have admin privileges. Please use the regular login page.')
    }
  }, [currentUser, isAdmin, authLoading, loading])

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setError('')
      setLoading(true)
      const userCredential = await login(email, password)
      
      // Force token refresh to get latest claims
      await userCredential.user.getIdToken(true)
      
      // Check admin status
      const idTokenResult = await userCredential.user.getIdTokenResult()
      
      if (idTokenResult.claims.role === 'admin') {
        navigate('/admin')
      } else {
        setError('Access denied. This account does not have admin privileges. Please use the regular login page.')
        setLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.')
      } else {
        setError('Failed to sign in. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div className="card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Shield size={48} style={styles.icon} />
          </div>
          <h1 style={styles.title}>Admin Login</h1>
          <p style={styles.subtitle}>Access the administration panel</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Admin Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={styles.submitBtn}
            disabled={loading}
          >
            <LogIn size={18} style={{ marginRight: '0.5rem' }} />
            {loading ? 'Signing In...' : 'Sign In as Admin'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Regular user?{' '}
            <Link to="/login" style={styles.link}>
              Voter Login
            </Link>
          </p>
          <p style={styles.footerText}>
            <Link to="/" style={styles.link}>
              ← Back to Home
            </Link>
          </p>
        </div>

        <div style={styles.infoBox}>
          <AlertCircle size={16} />
          <p style={styles.infoText}>
            Only users with admin role can access this page. 
            Contact your system administrator if you need admin access.
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
    padding: '2rem 1rem',
    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
    backgroundSize: 'cover'
  },
  card: {
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  icon: {
    color: 'var(--primary-color)',
    padding: '1rem',
    backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)',
    borderRadius: '50%'
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
    fontWeight: 700
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem'
  },
  submitBtn: {
    width: '100%',
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  footer: {
    marginTop: '2rem',
    textAlign: 'center',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--border-color)'
  },
  footerText: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    margin: '0.5rem 0'
  },
  link: {
    color: 'var(--primary-color)',
    textDecoration: 'none',
    fontWeight: 600
  },
  infoBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(var(--primary-color-rgb), 0.05)',
    borderRadius: '0.5rem',
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'start'
  },
  infoText: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: '1.5'
  }
}

