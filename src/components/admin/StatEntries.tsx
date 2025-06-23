import { useState, useEffect } from 'react'
import { adminService, type StatEntry } from '../../services/adminService'

export const StatEntries = () => {
  const [statEntries, setStatEntries] = useState<StatEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<StatEntry | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredEntries, setFilteredEntries] = useState<StatEntry[]>([])

  useEffect(() => {
    fetchStatEntries()
  }, [])

  useEffect(() => {
    filterEntries()
  }, [statEntries, searchQuery])

  const fetchStatEntries = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminService.fetchStatEntries()
      setStatEntries(data)
    } catch (err) {
      console.error('Error fetching stat entries:', err)
      setError('Failed to load stat entries')
    } finally {
      setLoading(false)
    }
  }

  const filterEntries = () => {
    let filtered = statEntries

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.trainer_name?.toLowerCase().includes(query) ||
        entry.trainer_code?.toLowerCase().includes(query)
      )
    }

    setFilteredEntries(filtered)
  }

  const handleEditClick = (entry: StatEntry) => {
    setEditingEntry(entry)
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setEditingEntry(null)
  }

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEntry) return

    try {
      setUpdateLoading(true)
      setError(null)
      
      const { error } = await adminService.updateStatEntry(editingEntry.id, editingEntry)
      
      if (error) {
        throw error
      }

      await fetchStatEntries()
      handleCloseModal()
    } catch (err: any) {
      console.error('❌ Error updating stat entry:', err)
      setError(`Failed to update stat entry: ${err?.message || 'Unknown error'}`)
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleFieldChange = (field: keyof StatEntry, value: string | number) => {
    if (!editingEntry) return
    
    setEditingEntry({
      ...editingEntry,
      [field]: value
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  // Calculate stats
  const totalXP = statEntries.reduce((sum, entry) => sum + entry.total_xp, 0)
  const totalPokemon = statEntries.reduce((sum, entry) => sum + entry.pokemon_caught, 0)
  const avgLevel = statEntries.length > 0 ? Math.round(statEntries.reduce((sum, entry) => sum + entry.trainer_level, 0) / statEntries.length) : 0

  if (loading) {
    return (
      <div className="admin-user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading stat entries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-user-management">
      {/* Header and Stats */}
      <div className="user-management-header">
        <div className="header-info">
          <h2>Stat Entries</h2>
          <p>All statistical entries recorded by trainers over time</p>
        </div>
        
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-number">{formatNumber(statEntries.length)}</span>
            <span className="stat-label">Total Entries</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {formatNumber(new Set(statEntries.map(entry => entry.user_id)).size)}
            </span>
            <span className="stat-label">Unique Trainers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{avgLevel}</span>
            <span className="stat-label">Avg Level</span>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="user-management-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by trainer name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>

        <button onClick={fetchStatEntries} className="btn btn-secondary">
          Refresh Data
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button onClick={() => setError(null)} className="error-dismiss">×</button>
        </div>
      )}

      {/* Stat Entries Table - Horizontal Scrollable */}
      <div className="users-table-container">
        <div className="stat-entries-table-scroll">
          <div className="stat-entries-table-wide">
            <div className="table-header">
              <div className="header-cell trainer-col">Trainer</div>
              <div className="header-cell code-col">Code</div>
              <div className="header-cell date-col">Entry Date</div>
              <div className="header-cell level-col">Level</div>
              <div className="header-cell xp-col">Total XP</div>
              <div className="header-cell pokemon-col">Pokémon</div>
              <div className="header-cell distance-col">Distance</div>
              <div className="header-cell stops-col">Pokéstops</div>
              <div className="header-cell pokedex-col">Pokédex</div>
              <div className="header-cell created-col">Created</div>
              <div className="header-cell actions-col">Actions</div>
            </div>

            <div className="table-body">
              {filteredEntries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3>No stat entries found</h3>
                  <p>
                    {searchQuery 
                      ? `No entries match "${searchQuery}"`
                      : 'No statistical entries have been recorded yet.'
                    }
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div key={entry.id} className="table-row">
                    <div className="table-cell trainer-col">
                      <div className="trainer-name">
                        {entry.trainer_name || 'Unknown Trainer'}
                      </div>
                    </div>
                    
                    <div className="table-cell code-col">
                      <div className="trainer-code">
                        {entry.trainer_code || 'No code'}
                      </div>
                    </div>
                    
                    <div className="table-cell date-col">
                      {formatDate(entry.entry_date)}
                    </div>
                    
                    <div className="table-cell level-col">
                      <span className="status-badge paid">{entry.trainer_level}</span>
                    </div>
                    
                    <div className="table-cell xp-col">
                      {formatNumber(entry.total_xp)}
                    </div>
                    
                    <div className="table-cell pokemon-col">
                      {formatNumber(entry.pokemon_caught)}
                    </div>
                    
                    <div className="table-cell distance-col">
                      {formatNumber(entry.distance_walked)} km
                    </div>
                    
                    <div className="table-cell stops-col">
                      {formatNumber(entry.pokestops_visited)}
                    </div>
                    
                    <div className="table-cell pokedex-col">
                      {entry.unique_pokedex_entries}
                    </div>
                    
                    <div className="table-cell created-col">
                      {formatDateTime(entry.created_at)}
                    </div>
                    
                    <div className="table-cell actions-col">
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEditClick(entry)}
                          className="action-btn upgrade-btn"
                          title="Edit stat entry"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingEntry && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Stat Entry</h3>
              <button 
                onClick={handleCloseModal}
                className="modal-close"
                type="button"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateEntry} className="edit-form">
              <div className="form-section">
                <h4>Trainer Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Trainer Name</label>
                    <input 
                      type="text" 
                      value={editingEntry.trainer_name || ''} 
                      disabled
                      className="form-input disabled"
                    />
                    <small>Read-only field</small>
                  </div>
                  <div className="form-group">
                    <label>Trainer Code</label>
                    <input 
                      type="text" 
                      value={editingEntry.trainer_code || ''} 
                      disabled
                      className="form-input disabled"
                    />
                    <small>Read-only field</small>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Game Statistics</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Entry Date</label>
                    <input 
                      type="date" 
                      value={editingEntry.entry_date} 
                      onChange={(e) => handleFieldChange('entry_date', e.target.value)}
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Trainer Level</label>
                    <input 
                      type="number" 
                      value={editingEntry.trainer_level} 
                      onChange={(e) => handleFieldChange('trainer_level', parseInt(e.target.value))}
                      className="form-input"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Total XP</label>
                    <input 
                      type="number" 
                      value={editingEntry.total_xp} 
                      onChange={(e) => handleFieldChange('total_xp', parseInt(e.target.value))}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Pokémon Caught</label>
                    <input 
                      type="number" 
                      value={editingEntry.pokemon_caught} 
                      onChange={(e) => handleFieldChange('pokemon_caught', parseInt(e.target.value))}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Distance Walked (km)</label>
                    <input 
                      type="number" 
                      value={editingEntry.distance_walked} 
                      onChange={(e) => handleFieldChange('distance_walked', parseFloat(e.target.value))}
                      className="form-input"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Pokéstops Visited</label>
                    <input 
                      type="number" 
                      value={editingEntry.pokestops_visited} 
                      onChange={(e) => handleFieldChange('pokestops_visited', parseInt(e.target.value))}
                      className="form-input"
                      min="0"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Unique Pokédex Entries</label>
                    <input 
                      type="number" 
                      value={editingEntry.unique_pokedex_entries} 
                      onChange={(e) => handleFieldChange('unique_pokedex_entries', parseInt(e.target.value))}
                      className="form-input"
                      min="0"
                      max="1000"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 