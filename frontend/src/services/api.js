import axios from 'axios'
import { auth } from '../config/firebase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser
    if (user) {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      let message = error.response.data?.error || 'An error occurred'
      
      // Handle rate limiting (429)
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60
        message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        console.warn('Rate limit exceeded. Waiting before retry...')
        
        // Wait and retry once for 429 errors
        await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000))
        return api.request(error.config)
      }
      
      console.error('API Error:', message)
      throw new Error(message)
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request)
      throw new Error('Network error. Please check your connection.')
    } else {
      // Something else happened
      console.error('Error:', error.message)
      throw error
    }
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getStatus: () => api.get('/auth/status')
}

// Elections API
export const electionsAPI = {
  getActive: () => api.get('/elections'),
  getUpcoming: () => api.get('/elections/upcoming'),
  getCompleted: () => api.get('/elections/completed'),
  getAll: () => api.get('/elections/all'), // Get all elections (for "Other Elections" view)
  getById: (id) => api.get(`/elections/${id}`),
  checkVoted: (id) => api.get(`/elections/${id}/voted`),
  getResults: (id) => api.get(`/elections/${id}/results`)
}

// Votes API
export const votesAPI = {
  cast: (data) => api.post('/votes', data),
  getHistory: () => api.get('/votes/history'),
  verify: (electionId) => api.post('/votes/verify', { electionId })
}

// Admin API
export const adminAPI = {
  getVoters: (status) => api.get(`/admin/voters?status=${status || 'all'}`),
  verifyVoter: (voterId, data) => api.post(`/admin/voters/${voterId}/verify`, data),
  bulkVerifyVoters: (voterIds, data) => api.post('/admin/voters/bulk-verify', { voterIds, ...data }),
  createElection: (data) => api.post('/admin/elections', data),
  updateElectionStatus: (electionId, status) => 
    api.patch(`/admin/elections/${electionId}/status`, { status }),
  addCandidate: (electionId, data) => 
    api.post(`/admin/elections/${electionId}/candidates`, data),
  getAllElections: () => api.get('/admin/elections'),
  getAuditLogs: (limit, action) => 
    api.get(`/admin/audit-logs?limit=${limit || 100}&action=${action || ''}`),
  getStatistics: () => api.get('/admin/statistics'),
  setAdmin: (userId) => api.post('/admin/set-admin', { userId }),
  approveResults: (electionId, approved) => 
    api.post(`/admin/elections/${electionId}/approve-results`, { approved }),
  // Candidate Templates
  getCandidateTemplates: () => api.get('/admin/candidate-templates'),
  createCandidateTemplate: (data) => api.post('/admin/candidate-templates', data),
  updateCandidateTemplate: (templateId, data) => 
    api.put(`/admin/candidate-templates/${templateId}`, data),
  deleteCandidateTemplate: (templateId) => 
    api.delete(`/admin/candidate-templates/${templateId}`),
  // Party Templates
  getPartyTemplates: () => api.get('/admin/party-templates'),
  createPartyTemplate: (data) => api.post('/admin/party-templates', data),
  updatePartyTemplate: (templateId, data) => 
    api.put(`/admin/party-templates/${templateId}`, data),
  deletePartyTemplate: (templateId) => 
    api.delete(`/admin/party-templates/${templateId}`)
}

export default api

