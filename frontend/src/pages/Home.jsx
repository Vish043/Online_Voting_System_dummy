import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Lock, CheckCircle, Users, Vote, BarChart } from 'lucide-react'

export default function Home() {
  const { currentUser } = useAuth()

  return (
    <div style={styles.home}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div className="container" style={styles.heroContent}>
          <h1 style={styles.title}>Secure Digital Voting Platform</h1>
          <p style={styles.subtitle}>
            Experience democracy in the digital age with our government-grade online voting system.
            Secure, transparent, and accessible to all.
          </p>
          <div style={styles.heroButtons}>
            {currentUser ? (
              <>
                <Link to="/dashboard" className="btn btn-primary" style={styles.heroBtn}>
                  Go to Dashboard
                </Link>
                <Link to="/elections" className="btn btn-outline" style={styles.heroBtn}>
                  View Elections
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={styles.heroBtn}>
                  Register to Vote
                </Link>
                <Link to="/login" className="btn btn-outline" style={styles.heroBtn}>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div className="container">
          <h2 style={styles.sectionTitle}>Why Choose Our Voting System?</h2>
          <div className="grid grid-3">
            <FeatureCard
              icon={<Shield size={40} />}
              title="Military-Grade Security"
              description="End-to-end encryption, multi-factor authentication, and blockchain-inspired audit trails ensure your vote is protected."
            />
            <FeatureCard
              icon={<Lock size={40} />}
              title="Anonymous Voting"
              description="Your vote is completely anonymous. We ensure voter privacy while maintaining vote integrity."
            />
            <FeatureCard
              icon={<CheckCircle size={40} />}
              title="Verified Identity"
              description="Rigorous identity verification ensures only eligible voters can participate in elections."
            />
            <FeatureCard
              icon={<Users size={40} />}
              title="Accessible to All"
              description="Vote from anywhere, at any time. Democracy should be accessible to everyone."
            />
            <FeatureCard
              icon={<Vote size={40} />}
              title="One Person, One Vote"
              description="Our system prevents duplicate voting and ensures the integrity of every election."
            />
            <FeatureCard
              icon={<BarChart size={40} />}
              title="Real-Time Results"
              description="View election results instantly after polls close. Complete transparency in the democratic process."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section style={styles.howItWorks}>
        <div className="container">
          <h2 style={styles.sectionTitle}>How It Works</h2>
          <div style={styles.steps}>
            <Step
              number="1"
              title="Register & Verify"
              description="Create an account and complete identity verification with your national ID."
            />
            <Step
              number="2"
              title="Browse Elections"
              description="View active and upcoming elections you're eligible to vote in."
            />
            <Step
              number="3"
              title="Cast Your Vote"
              description="Securely cast your vote for your preferred candidate or option."
            />
            <Step
              number="4"
              title="Verify & Track"
              description="Receive confirmation and track your voting history."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div className="container" style={styles.ctaContent}>
          <h2 style={styles.ctaTitle}>Ready to Exercise Your Democratic Right?</h2>
          <p style={styles.ctaText}>
            Join thousands of citizens who have already registered to vote online.
          </p>
          {!currentUser && (
            <Link to="/register" className="btn btn-secondary" style={styles.ctaBtn}>
              Get Started Today
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div className="container">
          <p>&copy; 2024 Online Voting System. All rights reserved.</p>
          <p style={styles.footerText}>
            Securing democracy through technology.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card" style={styles.featureCard}>
      <div style={styles.featureIcon}>{icon}</div>
      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDescription}>{description}</p>
    </div>
  )
}

function Step({ number, title, description }) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNumber}>{number}</div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepDescription}>{description}</p>
    </div>
  )
}

const styles = {
  home: {
    minHeight: '100vh'
  },
  hero: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '6rem 0',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  title: {
    fontSize: '3rem',
    marginBottom: '1.5rem',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '1.25rem',
    marginBottom: '2rem',
    opacity: 0.95
  },
  heroButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  heroBtn: {
    fontSize: '1rem'
  },
  features: {
    padding: '5rem 0',
    backgroundColor: 'var(--bg-primary)'
  },
  sectionTitle: {
    fontSize: '2.5rem',
    textAlign: 'center',
    marginBottom: '3rem',
    color: 'var(--text-primary)'
  },
  featureCard: {
    textAlign: 'center',
    transition: 'transform 0.3s',
    cursor: 'pointer'
  },
  featureIcon: {
    color: 'var(--primary-color)',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'center'
  },
  featureTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem',
    color: 'var(--text-primary)'
  },
  featureDescription: {
    color: 'var(--text-secondary)',
    lineHeight: '1.6'
  },
  howItWorks: {
    padding: '5rem 0',
    backgroundColor: 'var(--bg-secondary)'
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '2rem',
    maxWidth: '1000px',
    margin: '0 auto'
  },
  step: {
    textAlign: 'center'
  },
  stepNumber: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: '0 auto 1rem'
  },
  stepTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem',
    color: 'var(--text-primary)'
  },
  stepDescription: {
    color: 'var(--text-secondary)',
    lineHeight: '1.6'
  },
  cta: {
    padding: '5rem 0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textAlign: 'center'
  },
  ctaContent: {
    maxWidth: '700px',
    margin: '0 auto'
  },
  ctaTitle: {
    fontSize: '2.5rem',
    marginBottom: '1rem'
  },
  ctaText: {
    fontSize: '1.125rem',
    marginBottom: '2rem',
    opacity: 0.95
  },
  ctaBtn: {
    fontSize: '1rem'
  },
  footer: {
    padding: '2rem 0',
    backgroundColor: 'var(--text-primary)',
    color: 'white',
    textAlign: 'center'
  },
  footerText: {
    marginTop: '0.5rem',
    opacity: 0.8
  }
}

