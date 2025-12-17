import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Vote, LogOut, User, Shield, Home, BarChart3 } from 'lucide-react'

export default function Navbar() {
  const { currentUser, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.container}>
        <Link to="/" style={styles.logo}>
          <Vote size={28} />
          <span>Voting System</span>
        </Link>

        <div style={styles.menu}>
          {currentUser ? (
            <>
              <Link to="/dashboard" style={styles.link}>
                <Home size={18} />
                Dashboard
              </Link>
              <Link to="/elections" style={styles.link}>
                <BarChart3 size={18} />
                Elections
              </Link>
              <Link to="/profile" style={styles.link}>
                <User size={18} />
                Profile
              </Link>
              {isAdmin && (
                <Link to="/admin" style={styles.adminLink}>
                  <Shield size={18} />
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={18} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={styles.registerBtn}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    backgroundColor: 'var(--bg-primary)',
    borderBottom: '1px solid var(--border-color)',
    padding: '1rem 0',
    boxShadow: 'var(--shadow-sm)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    textDecoration: 'none'
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s'
  },
  adminLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--warning-color)',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'color 0.2s'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.5rem',
    backgroundColor: 'transparent',
    color: 'var(--danger-color)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  registerBtn: {
    marginLeft: '0.5rem'
  }
}

