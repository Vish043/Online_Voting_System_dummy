import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser
} from 'firebase/auth'
import { auth } from '../config/firebase'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sign up with email and password
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(userCredential.user, { displayName })
    }
    return userCredential
  }

  // Sign in with email and password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Sign out
  function logout() {
    return signOut(auth)
  }

  // Reset password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // Update user profile
  function updateUserProfile(data) {
    return updateProfile(auth.currentUser, data)
  }

  // Delete user account
  async function deleteUserAccount(user) {
    if (user) {
      return await deleteUser(user)
    }
    throw new Error('No user to delete')
  }

  // Get ID token
  async function getIdToken() {
    if (currentUser) {
      return await currentUser.getIdToken()
    }
    return null
  }

  // Check if user is admin
  async function checkAdminStatus(user) {
    try {
      const idTokenResult = await user.getIdTokenResult()
      setIsAdmin(idTokenResult.claims.role === 'admin')
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      if (user) {
        await checkAdminStatus(user)
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    isAdmin,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    deleteUserAccount,
    getIdToken,
    loading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

