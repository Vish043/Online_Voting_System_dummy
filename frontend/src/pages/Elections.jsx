import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { electionsAPI } from '../services/api'
import { Calendar, Clock, TrendingUp, Award, Filter, ArrowLeft } from 'lucide-react'
import { INDIAN_STATES_AND_UTS } from '../constants/indianStates'
import { getDistrictsByState, getConstituenciesByDistrict, getConstituenciesByState, hasVidhanSabhaData } from '../constants/constituencies'

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
  const [otherElections, setOtherElections] = useState([])
  const [otherResults, setOtherResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [resultFilters, setResultFilters] = useState({
    state: '',
    district: '',
    constituency: ''
  })
  const [filters, setFilters] = useState({
    electionType: '', // 'national', 'state', 'local', or ''
    status: '', // 'active', 'scheduled', 'completed', 'cancelled', or ''
    state: '', // For constituency filtering
    district: '', // For state/local elections
    constituency: '' // Based on election type
  })
  const [availableDistricts, setAvailableDistricts] = useState([])
  const [availableConstituencies, setAvailableConstituencies] = useState([])

  useEffect(() => {
    fetchElections()
  }, [])

  // Reset filters when switching tabs
  useEffect(() => {
    if (tab !== 'completed' && tab !== 'other' && tab !== 'otherResults') {
      setFilters({ electionType: '', status: '', state: '', district: '', constituency: '' })
      setResultFilters({ state: '', district: '', constituency: '' })
    }
  }, [tab])

  // Update districts/constituencies for result filters (Other Results tab)
  useEffect(() => {
    if (tab === 'otherResults') {
      if (resultFilters.state && hasVidhanSabhaData(resultFilters.state)) {
        const districts = getDistrictsByState(resultFilters.state)
        setAvailableDistricts(districts)
        if (resultFilters.district && !districts.includes(resultFilters.district)) {
          setResultFilters(prev => ({ ...prev, district: '', constituency: '' }))
        }
        if (resultFilters.district) {
          const constituencies = getConstituenciesByDistrict(resultFilters.state, resultFilters.district)
          setAvailableConstituencies(constituencies)
          if (resultFilters.constituency && !constituencies.includes(resultFilters.constituency)) {
            setResultFilters(prev => ({ ...prev, constituency: '' }))
          }
        } else {
          setAvailableConstituencies([])
        }
      } else {
        setAvailableDistricts([])
        setAvailableConstituencies([])
      }
    }
  }, [tab, resultFilters.state, resultFilters.district])

  // Update constituencies based on election type and state/district
  useEffect(() => {
    if (tab === 'otherResults') return // Skip for otherResults tab
    
    if (!filters.electionType || !filters.state) {
      setAvailableConstituencies([])
      setAvailableDistricts([])
      return
    }

    if (filters.electionType === 'national') {
      // For national elections, show Lok Sabha constituencies
      const constituencies = getConstituenciesByState(filters.state)
      setAvailableConstituencies(constituencies)
      setAvailableDistricts([])
      if (filters.constituency && !constituencies.includes(filters.constituency)) {
        setFilters(prev => ({ ...prev, constituency: '' }))
      }
    } else if (filters.electionType === 'state') {
      // For state elections, show districts first, then Vidhan Sabha constituencies
      if (hasVidhanSabhaData(filters.state)) {
        const districts = getDistrictsByState(filters.state)
        setAvailableDistricts(districts)
        if (filters.district && !districts.includes(filters.district)) {
          setFilters(prev => ({ ...prev, district: '', constituency: '' }))
        }
        if (filters.district) {
          const constituencies = getConstituenciesByDistrict(filters.state, filters.district)
          setAvailableConstituencies(constituencies)
          if (filters.constituency && !constituencies.includes(filters.constituency)) {
            setFilters(prev => ({ ...prev, constituency: '' }))
          }
        } else {
          setAvailableConstituencies([])
        }
      } else {
        setAvailableDistricts([])
        setAvailableConstituencies([])
      }
    } else if (filters.electionType === 'local') {
      // For local elections, show districts
      if (hasVidhanSabhaData(filters.state)) {
        const districts = getDistrictsByState(filters.state)
        setAvailableDistricts(districts)
        setAvailableConstituencies([])
        if (filters.district && !districts.includes(filters.district)) {
          setFilters(prev => ({ ...prev, district: '', constituency: '' }))
        }
      } else {
        setAvailableDistricts([])
        setAvailableConstituencies([])
      }
    }
  }, [filters.electionType, filters.state, filters.district])

  async function fetchElections() {
    try {
      setLoading(true)
      const [activeRes, upcomingRes, completedRes, allRes] = await Promise.all([
        electionsAPI.getActive(),
        electionsAPI.getUpcoming(),
        electionsAPI.getCompleted().catch(() => ({ data: { elections: [] } })),
        electionsAPI.getAll().catch(() => ({ data: { elections: [] } }))
      ])
      setActiveElections(activeRes.data.elections)
      setUpcomingElections(upcomingRes.data.elections)
      setCompletedElections(completedRes.data.elections)
      setOtherElections(allRes.data.elections)
      
      // Filter for completed elections for Other Results (regardless of approval status)
      const completedOnly = allRes.data.elections.filter(election => {
        const status = election.currentStatus || election.status || 'scheduled'
        return status === 'completed'
      })
      setOtherResults(completedOnly)
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

  // No filtering for completed elections - show all
  const filteredCompletedElections = tab === 'completed' ? completedElections : []

  // Filter Other Results based on place filters
  const filteredOtherResults = tab === 'otherResults' ? otherResults.filter(election => {
    // State filter
    if (resultFilters.state) {
      const stateMatch = election.allowedRegions?.some(region => 
        region.toLowerCase() === resultFilters.state.toLowerCase()
      ) || election.regionHierarchy?.state?.toLowerCase() === resultFilters.state.toLowerCase()
      if (!stateMatch) return false
    }
    
    // District filter
    if (resultFilters.district) {
      const districtMatch = election.regionHierarchy?.district?.toLowerCase() === resultFilters.district.toLowerCase() ||
                           election.allowedRegions?.some(region => 
                             region.toLowerCase() === resultFilters.district.toLowerCase()
                           )
      if (!districtMatch) return false
    }
    
    // Constituency filter
    if (resultFilters.constituency) {
      const constituencyMatch = election.constituency?.toLowerCase() === resultFilters.constituency.toLowerCase() ||
                               election.regionHierarchy?.lokSabhaConstituency?.toLowerCase() === resultFilters.constituency.toLowerCase()
      if (!constituencyMatch) return false
    }
    
    return true
  }) : []

  // Filter Other Elections based on election type, status, and constituency
  const filteredOtherElections = tab === 'other' ? otherElections.filter(election => {
    // Election type filter
    if (filters.electionType && election.type !== filters.electionType) {
      return false
    }
    
    // Status filter
    if (filters.status) {
      const electionStatus = election.currentStatus || election.status || 'scheduled'
      if (electionStatus.toLowerCase() !== filters.status.toLowerCase()) {
        return false
      }
    }
    
    // Constituency filter based on election type
    if (filters.constituency) {
      if (filters.electionType === 'national') {
        // For national elections, check Lok Sabha constituency
        const constituencyMatch = election.constituency?.toLowerCase() === filters.constituency.toLowerCase() ||
                                  election.regionHierarchy?.lokSabhaConstituency?.toLowerCase() === filters.constituency.toLowerCase()
        if (!constituencyMatch) return false
      } else if (filters.electionType === 'state') {
        // For state elections, check Vidhan Sabha constituency
        const constituencyMatch = election.constituency?.toLowerCase() === filters.constituency.toLowerCase()
        if (!constituencyMatch) return false
      } else if (filters.electionType === 'local') {
        // For local elections, check district
        const districtMatch = election.regionHierarchy?.district?.toLowerCase() === filters.district.toLowerCase() ||
                             election.allowedRegions?.some(region => 
                               region.toLowerCase() === filters.district.toLowerCase()
                             )
        if (!districtMatch) return false
      }
    }
    
    // State filter (if state is selected but no constituency)
    if (filters.state && !filters.constituency) {
      const stateMatch = election.allowedRegions?.some(region => 
        region.toLowerCase() === filters.state.toLowerCase()
      ) || election.regionHierarchy?.state?.toLowerCase() === filters.state.toLowerCase()
      if (!stateMatch) return false
    }
    
    return true
  }) : []

  const elections = tab === 'active' ? activeElections : 
                   tab === 'upcoming' ? upcomingElections : 
                   tab === 'completed' ? filteredCompletedElections :
                   tab === 'other' ? filteredOtherElections :
                   tab === 'otherResults' ? filteredOtherResults :
                   otherElections

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
        <button
          style={{...styles.tab, ...(tab === 'other' ? styles.activeTab : {})}}
          onClick={() => setTab('other')}
        >
          <Calendar size={18} />
          Other Elections ({tab === 'other' ? filteredOtherElections.length : otherElections.length})
        </button>
      </div>

      {/* Unified Filter for Other Elections tab */}
      {/* Filter for Other Results tab */}
      {tab === 'otherResults' && (
        <div className="card" style={styles.filtersCard}>
          <div style={styles.filtersHeader}>
            <Filter size={20} />
            <h3 style={styles.filtersTitle}>Filter Results</h3>
          </div>
          <div style={styles.filtersGrid}>
            <div className="input-group">
              <label>State</label>
              <select
                value={resultFilters.state}
                onChange={(e) => setResultFilters({ ...resultFilters, state: e.target.value, district: '', constituency: '' })}
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
              {resultFilters.state && hasVidhanSabhaData(resultFilters.state) && availableDistricts.length > 0 ? (
                <select
                  value={resultFilters.district}
                  onChange={(e) => setResultFilters({ ...resultFilters, district: e.target.value, constituency: '' })}
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
                  value={resultFilters.district}
                  onChange={(e) => setResultFilters({ ...resultFilters, district: e.target.value, constituency: '' })}
                  placeholder="Enter district"
                  style={styles.filterInput}
                />
              )}
            </div>
            {resultFilters.state && resultFilters.district && hasVidhanSabhaData(resultFilters.state) && availableConstituencies.length > 0 && (
              <div className="input-group">
                <label>Constituency</label>
                <select
                  value={resultFilters.constituency}
                  onChange={(e) => setResultFilters({ ...resultFilters, constituency: e.target.value })}
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
            {(resultFilters.state || resultFilters.district || resultFilters.constituency) && (
              <div className="input-group" style={styles.clearFilter}>
                <button
                  onClick={() => setResultFilters({ state: '', district: '', constituency: '' })}
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

      {/* Unified Filter for Other Elections tab */}
      {tab === 'other' && (
        <div className="card" style={styles.filtersCard}>
          <div style={styles.filtersHeader}>
            <Filter size={20} />
            <h3 style={styles.filtersTitle}>Filter Other Elections</h3>
          </div>
          <div style={styles.filtersGrid}>
            {/* Election Type Filter */}
            <div className="input-group">
              <label>Election Type</label>
              <select
                value={filters.electionType}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  electionType: e.target.value, 
                  state: '', 
                  district: '', 
                  constituency: '' 
                })}
                style={styles.filterSelect}
              >
                <option value="">All Types</option>
                <option value="national">National (Lok Sabha)</option>
                <option value="state">State (Vidhan Sabha)</option>
                <option value="local">Local (Zilla Parishad)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="input-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={styles.filterSelect}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* State Filter - shown when election type is selected */}
            {filters.electionType && (
              <div className="input-group">
                <label>State</label>
                <select
                  value={filters.state}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    state: e.target.value, 
                    district: '', 
                    constituency: '' 
                  })}
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
            )}

            {/* District Filter - shown for state and local elections */}
            {filters.electionType && (filters.electionType === 'state' || filters.electionType === 'local') && 
             filters.state && availableDistricts.length > 0 && (
              <div className="input-group">
                <label>{filters.electionType === 'local' ? 'District' : 'District (for Vidhan Sabha)'}</label>
                <select
                  value={filters.district}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    district: e.target.value, 
                    constituency: '' 
                  })}
                  style={styles.filterSelect}
                >
                  <option value="">All Districts</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Constituency Filter - shown based on election type */}
            {filters.electionType === 'national' && filters.state && availableConstituencies.length > 0 && (
              <div className="input-group">
                <label>Lok Sabha Constituency</label>
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

            {filters.electionType === 'state' && filters.state && filters.district && availableConstituencies.length > 0 && (
              <div className="input-group">
                <label>Vidhan Sabha Constituency</label>
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

            {/* Clear Filters Button */}
            {(filters.electionType || filters.status || filters.state || filters.district || filters.constituency) && (
              <div className="input-group" style={styles.clearFilter}>
                <button
                  onClick={() => setFilters({ 
                    electionType: '', 
                    status: '', 
                    state: '', 
                    district: '', 
                    constituency: '' 
                  })}
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
          <h3>No {tab === 'other' ? 'Other' : tab === 'otherResults' ? 'Other Results' : tab} {tab === 'otherResults' ? '' : 'Elections'}</h3>
          <p>
            {tab === 'other' && (filters.electionType || filters.status || filters.state || filters.district || filters.constituency)
              ? 'No elections found matching your filters.'
              : tab === 'otherResults' && (resultFilters.state || resultFilters.district || resultFilters.constituency)
              ? 'No results found matching your filters.'
              : tab === 'other'
              ? 'There are currently no other elections available to view.'
              : tab === 'otherResults'
              ? 'There are currently no other results available to view.'
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
              isCompleted={tab === 'completed' || tab === 'otherResults'}
              isOtherElections={tab === 'other'}
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

function ElectionCard({ election, isActive, isCompleted, isOtherElections }) {
  const startDate = convertTimestampToDate(election.startDate);
  const endDate = convertTimestampToDate(election.endDate);
  
  // Determine status badge for Other Elections
  const getStatusBadge = () => {
    if (isOtherElections) {
      const status = election.currentStatus || election.status || 'scheduled';
      const statusMap = {
        'active': { class: 'badge-success', text: 'Active' },
        'completed': { class: 'badge-info', text: 'Completed' },
        'scheduled': { class: 'badge-warning', text: 'Scheduled' },
        'cancelled': { class: 'badge-danger', text: 'Cancelled' }
      };
      const statusInfo = statusMap[status] || { class: 'badge-info', text: status };
      return { class: statusInfo.class, text: statusInfo.text };
    }
    return {
      class: isActive ? 'badge-success' : isCompleted ? 'badge-info' : 'badge-info',
      text: isActive ? 'Active' : isCompleted ? 'Completed' : 'Upcoming'
    };
  };
  
  const statusBadge = getStatusBadge();

  return (
    <div className="card" style={styles.electionCard}>
      <div style={styles.cardHeader}>
        <span className={`badge ${statusBadge.class}`}>
          {statusBadge.text}
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
        {!isOtherElections && isCompleted && election.resultsApproved && (
          <Link 
            to={`/results/${election.id}`} 
            className="btn btn-primary" 
            style={styles.resultsBtn}
          >
            <Award size={16} />
            View Results
          </Link>
        )}
        {isOtherElections && election.currentStatus === 'completed' && election.resultsApproved && (
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

