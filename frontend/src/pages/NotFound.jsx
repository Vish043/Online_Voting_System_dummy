import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <AlertTriangle size={64} style={styles.icon} />
        <h1 style={styles.title}>404</h1>
        <h2 style={styles.subtitle}>Page Not Found</h2>
        <p style={styles.text}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary" style={styles.button}>
          Go to Home
        </Link>
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
    padding: '2rem'
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px'
  },
  icon: {
    color: 'var(--warning-color)',
    marginBottom: '1rem'
  },
  title: {
    fontSize: '4rem',
    fontWeight: 'bold',
    color: 'var(--primary-color)',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '1.5rem',
    marginBottom: '1rem'
  },
  text: {
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
    fontSize: '1.125rem'
  },
  button: {
    fontSize: '1rem'
  }
}

