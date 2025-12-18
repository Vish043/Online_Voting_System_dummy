import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Elections from './pages/Elections'
import ElectionDetail from './pages/ElectionDetail'
import Vote from './pages/Vote'
import Results from './pages/Results'
import Profile from './pages/Profile'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVoters from './pages/admin/AdminVoters'
import AdminElections from './pages/admin/AdminElections'
import AdminCreateElection from './pages/admin/AdminCreateElection'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'
import NotFound from './pages/NotFound'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return currentUser ? children : <Navigate to="/login" />
}

// Admin Route Component
function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" />
  }

  return children
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections"
              element={
                <ProtectedRoute>
                  <Elections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/:id"
              element={
                <ProtectedRoute>
                  <ElectionDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vote/:electionId"
              element={
                <ProtectedRoute>
                  <Vote />
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/:electionId"
              element={
                <ProtectedRoute>
                  <Results />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/voters"
              element={
                <AdminRoute>
                  <AdminVoters />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/elections"
              element={
                <AdminRoute>
                  <AdminElections />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/elections/create"
              element={
                <AdminRoute>
                  <AdminCreateElection />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App

