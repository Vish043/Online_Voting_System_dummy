import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { electionsAPI } from '../services/api'
import { Calendar, Clock, TrendingUp, Award, Filter, ArrowLeft } from 'lucide-react'
import { INDIAN_STATES_AND_UTS } from '../constants/indianStates'
import { getDistrictsByState, getConstituenciesByDistrict, hasVidhanSabhaData } from '../constants/constituencies'

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

export default function Elections() {
  const navigate = useNavigate()
  const [activeElections, setActiveElections] = useState([])
  const [upcomingElections, setUpcomingElections] = useState([])
  const [completedElections, setCompletedElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    constituency: ''
  })
  const [availableDistricts, setAvailableDistricts] = useState([])
  const [availableConstituencies, setAvailableConstituencies] = useState([])

  useEffect(() => {
    fetchElections()
  }, [])

  // Update districts when state changes
  useEffect(() => {
    if (filters.state && hasVidhanSabhaData(filters.state)) {
      const districts = getDistrictsByState(filters.state)
      setAvailableDistricts(districts)
      if (filters.district && !districts.includes(filters.district)) {
        setFilters(prev => ({ ...prev, district: '', constituency: '' }))
      }
    } else {
      setAvailableDistricts([])
      setFilters(prev => ({ ...prev, district: '', constituency: '' }))
    }
  }, [filters.state])

  // Update constituencies when district changes
  useEffect(() => {
    if (filters.state && filters.district && hasVidhanSabhaData(filters.state)) {
      const constituencies = getConstituenciesByDistrict(filters.state, filters.district)
      setAvailableConstituencies(constituencies)
      if (filters.constituency && !constituencies.includes(filters.constituency)) {
        setFilters(prev => ({ ...prev, constituency: '' }))
      }
    } else {
      setAvailableConstituencies([])
      setFilters(prev => ({ ...prev, constituency: '' }))
    }
  }, [filters.state, filters.district])

  async function fetchElections() {
    try {
      setLoading(true)
      const [activeRes, upcomingRes, completedRes] = await Promise.all([
        electionsAPI.getActive(),
        electionsAPI.getUpcoming(),
        electionsAPI.getCompleted().catch(() => ({ data: { elections: [] } }))
      ])
      setActiveElections(activeRes.data.elections)
      setUpcomingElections(upcomingRes.data.elections)
      setCompletedElections(completedRes.data.elections)
    } catch (error) {
      console.error('Fetch elections error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  // Filter completed elections based on filters
  const filteredCompletedElections = tab === 'completed' ? completedElections.filter(election => {
    if (filters.state && election.allowedRegions && !election.allowedRegions.includes(filters.state)) {
      return false
    }
    if (filters.constituency && election.constituency !== filters.constituency) {
      return false
    }
    // District filter can match regionHierarchy or allowedRegions
    if (filters.district) {
      const hasDistrict = election.regionHierarchy?.district === filters.district ||
                         election.allowedRegions?.includes(filters.district)
      if (!hasDistrict) return false
    }
    return true
  }) : []

  const elections = tab === 'active' ? activeElections : 
                   tab === 'upcoming' ? upcomingElections : 
                   filteredCompletedElections

  return (
    <div className="container" style={styles.container}>
      <button onClick={() => navigate('/dashboard')} className="btn btn-outline" style={styles.backBtn}>
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>
      <h1 style={styles.pageTitle}>Elections</h1>
      <p style={styles.subtitle}>Browse and participate in elections</p>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{...styles.tab, ...(tab === 'active' ? styles.activeTab : {})}}
          onClick={() => setTab('active')}
        >
          <TrendingUp size={18} />
          Active ({activeElections.length})
        </button>
        <button
          style={{...styles.tab, ...(tab === 'upcoming' ? styles.activeTab : {})}}
          onClick={() => setTab('upcoming')}
        >
          <Clock size={18} />
          Upcoming ({upcomingElections.length})
        </button>
        <button
          style={{...styles.tab, ...(tab === 'completed' ? styles.activeTab : {})}}
          onClick={() => setTab('completed')}
        >
          <Award size={18} />
          Results ({filteredCompletedElections.length})
        </button>
      </div>

      {/* Filters for Results tab */}
      {tab === 'completed' && (
        <div className="card" style={styles.filtersCard}>
          <div style={styles.filtersHeader}>
            <Filter size={20} />
            <h3 style={styles.filtersTitle}>Filter Results</h3>
          </div>
          <div style={styles.filtersGrid}>
            <div className="input-group">
              <label>State</label>
              <select
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value, district: '', constituency: '' })}
                style={styles.filterSelect}
              >
                <option value="">All States</option>
                {INDIAN_STATES_AND_UTS.map((state) => (
                  <option key={state.name} value={state.name}>
                    {state.name} {state.type === 'ut' ? '(UT)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>District</label>
              {filters.state && hasVidhanSabhaData(filters.state) && availableDistricts.length > 0 ? (
                <select
                  value={filters.district}
                  onChange={(e) => setFilters({ ...filters, district: e.target.value, constituency: '' })}
                  style={styles.filterSelect}
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters.district}
                  onChange={(e) => setFilters({ ...filters, district: e.target.value, constituency: '' })}
                  placeholder="Enter district"
                  style={styles.filterInput}
                />
              )}
            </div>
            {filters.state && filters.district && hasVidhanSabhaData(filters.state) && availableConstituencies.length > 0 && (
              <div className="input-group">
                <label>Constituency</label>
                <select
                  value={filters.constituency}
                  onChange={(e) => setFilters({ ...filters, constituency: e.target.value })}
                  style={styles.filterSelect}
                >
                  <option value="">All Constituencies</option>
                  {availableConstituencies.map((constituency) => (
                    <option key={constituency} value={constituency}>
                      {constituency}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(filters.state || filters.district || filters.constituency) && (
              <div className="input-group" style={styles.clearFilter}>
                <button
                  onClick={() => setFilters({ state: '', district: '', constituency: '' })}
                  className="btn btn-outline"
                  style={styles.clearBtn}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Elections Grid */}
      {elections.length === 0 ? (
        <div className="card" style={styles.emptyState}>
          <Calendar size={48} style={styles.emptyIcon} />
          <h3>No {tab} Elections</h3>
          <p>
            {tab === 'completed' && (filters.state || filters.district || filters.constituency)
              ? 'No elections found matching your filters.'
              : `There are currently no ${tab} elections.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {elections.map((election) => (
            <ElectionCard 
              key={election.id} 
              election={election} 
              isActive={tab === 'active'} 
              isCompleted={tab === 'completed'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function formatElectionType(type) {
  const typeMap = {
    'national': 'National (Lok Sabha)',
    'state': 'State (Vidhan Sabha)',
    'local': 'Zilla Parishad'
  };
  return typeMap[type] || type;
}

function ElectionCard({ election, isActive, isCompleted }) {
  const startDate = convertTimestampToDate(election.startDate);
  const endDate = convertTimestampToDate(election.endDate);

  return (
    <div className="card" style={styles.electionCard}>
      <div style={styles.cardHeader}>
        <span className={`badge ${isActive ? 'badge-success' : isCompleted ? 'badge-info' : 'badge-info'}`}>
          {isActive ? 'Active' : isCompleted ? 'Completed' : 'Upcoming'}
        </span>
        <span style={styles.electionType}>{formatElectionType(election.type)}</span>
      </div>

      <h3 style={styles.electionTitle}>{election.title}</h3>
      <p style={styles.electionDesc}>{election.description}</p>
      {election.constituency && (
        <div style={styles.constituencyInfo}>
          <strong>Constituency:</strong> {election.constituency}
        </div>
      )}
      {election.regionHierarchy && (
        <div style={styles.regionInfo}>
          {election.regionHierarchy.state && <span>State: {election.regionHierarchy.state}</span>}
          {election.regionHierarchy.district && <span>District: {election.regionHierarchy.district}</span>}
        </div>
      )}

      <div style={styles.dates}>
        <div style={styles.date}>
          <Calendar size={16} />
          <div>
            <small style={styles.dateLabel}>Start Date</small>
            <div>{startDate ? startDate.toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
        <div style={styles.date}>
          <Calendar size={16} />
          <div>
            <small style={styles.dateLabel}>End Date</small>
            <div>{endDate ? endDate.toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <Link 
          to={`/elections/${election.id}`} 
          className="btn btn-outline" 
          style={styles.viewBtn}
        >
          View Details
        </Link>
        {isCompleted && election.resultsApproved && (
          <Link 
            to={`/results/${election.id}`} 
            className="btn btn-primary" 
            style={styles.resultsBtn}
          >
            <Award size={16} />
            View Results
          </Link>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '2rem 1rem',
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
    marginBottom: '0.5rem'
  },
  subtitle: {
    color: 'var(--text-secondary)',
    marginBottom: '2rem'
  },
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    borderBottom: '2px solid var(--border-color)'
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s'
  },
  activeTab: {
    color: 'var(--primary-color)',
    borderBottom: '3px solid var(--primary-color)'
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem'
  },
  emptyIcon: {
    color: 'var(--text-secondary)',
    marginBottom: '1rem'
  },
  electionCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  electionType: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    textTransform: 'capitalize'
  },
  electionTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.75rem'
  },
  electionDesc: {
    color: 'var(--text-secondary)',
    marginBottom: '1.5rem',
    flex: 1
  },
  dates: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem'
  },
  date: {
    display: 'flex',
    alignItems: 'start',
    gap: '0.5rem'
  },
  dateLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem'
  },
  viewBtn: {
    flex: 1
  },
  footer: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto'
  },
  resultsBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1
  },
  filtersCard: {
    marginBottom: '2rem',
    padding: '1.5rem'
  },
  filtersHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  filtersTitle: {
    fontSize: '1.125rem',
    margin: 0
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    alignItems: 'end'
  },
  filterSelect: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    cursor: 'pointer'
  },
  filterInput: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '0.375rem',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)'
  },
  clearFilter: {
    display: 'flex',
    alignItems: 'end'
  },
  clearBtn: {
    width: '100%'
  },
  constituencyInfo: {
    fontSize: '0.875rem',
    color: 'var(--primary-color)',
    marginBottom: '0.5rem',
    fontWeight: 600
  },
  regionInfo: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  }
}

