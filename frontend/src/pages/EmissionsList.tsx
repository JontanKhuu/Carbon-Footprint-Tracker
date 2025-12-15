import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { getEmissions, deleteEmission, getEmissionHistory } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Emission, EmissionFilters, EmissionHistoryEntry } from '../types';

type SortField = 'date' | 'amount' | 'co2_equivalent';
type SortDirection = 'asc' | 'desc';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'transport', label: 'Transport' },
  { value: 'energy', label: 'Energy' },
  { value: 'food', label: 'Food' },
  { value: 'waste', label: 'Waste' },
  { value: 'other', label: 'Other' },
];

function EmissionsList() {
  const { user } = useAuth();
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [filteredEmissions, setFilteredEmissions] = useState<Emission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [expandedEmissionId, setExpandedEmissionId] = useState<number | null>(null);
  
  // Filter states (actual applied filters)
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Input states for filter fields (what user is typing/selecting)
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');
  
  // Sort states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Delete confirmation
  const [emissionToDelete, setEmissionToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // History modal
  const [emissionHistoryId, setEmissionHistoryId] = useState<number | null>(null);
  const [history, setHistory] = useState<EmissionHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch emissions
  useEffect(() => {
    const fetchEmissions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        setIsInitialLoad(false);
        return;
      }

      try {
        // Only show full loading screen on initial load (when no emissions exist yet)
        if (isInitialLoad && emissions.length === 0) {
          setIsLoading(true);
        }
        setError('');

        // user_id comes from JWT token automatically, no need to send it
        const filters: EmissionFilters = {};
        if (selectedCategory) {
          filters.category = selectedCategory;
        }
        if (startDate) {
          filters.start_date = startDate;
        }
        if (endDate) {
          filters.end_date = endDate;
        }

        const response = await getEmissions(filters);
        setEmissions(response.data);
      } catch (err) {
        console.error('Error fetching emissions:', err);
        setError('Failed to load emissions. Please try again.');
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchEmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCategory, startDate, endDate]);

  // Apply sorting
  useEffect(() => {
    const sorted = [...emissions].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'date':
          aValue = a.date;
          bValue = b.date;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'co2_equivalent':
          aValue = a.co2_equivalent;
          bValue = b.co2_equivalent;
          break;
        default:
          return 0;
      }

      if (sortField === 'date') {
        // Date comparison
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        // Numeric comparison
        const comparison = (aValue as number) - (bValue as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });

    setFilteredEmissions(sorted);
  }, [emissions, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDelete = async () => {
    if (!emissionToDelete) return;

    try {
      setIsDeleting(true);
      await deleteEmission(emissionToDelete);
      
      // Remove from local state
      setEmissions(prev => prev.filter(e => e.id !== emissionToDelete));
      setEmissionToDelete(null);
    } catch (err) {
      console.error('Error deleting emission:', err);
      setError('Failed to delete emission. Please try again.');
      setEmissionToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewHistory = async (emissionId: number) => {
    try {
      setIsLoadingHistory(true);
      setEmissionHistoryId(emissionId);
      const response = await getEmissionHistory(emissionId);
      setHistory(response.data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load emission history. Please try again.');
      setEmissionHistoryId(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatDate = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const isEmissionEdited = (emission: Emission): boolean => {
    if (!emission.created_at || !emission.updated_at) return false;
    // Check if updated_at is significantly later than created_at (more than 1 second difference)
    // This accounts for potential microsecond differences on creation
    const created = new Date(emission.created_at).getTime();
    const updated = new Date(emission.updated_at).getTime();
    return updated - created > 1000; // More than 1 second difference indicates an edit
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setCategoryInput('');
    setStartDateInput('');
    setEndDateInput('');
  };
  
  // Apply all filters when button is clicked
  const applyFilters = () => {
    // Validate date range
    if (startDateInput && endDateInput && endDateInput < startDateInput) {
      // If invalid, clear end date
      setEndDateInput('');
      setEndDate('');
      setStartDate(startDateInput);
      setSelectedCategory(categoryInput);
    } else {
      // Apply all filters
      setStartDate(startDateInput);
      setEndDate(endDateInput);
      setSelectedCategory(categoryInput);
    }
  };
  
  // Sync input values with filter values on mount and when filters are cleared
  useEffect(() => {
    setCategoryInput(selectedCategory);
  }, [selectedCategory]);
  
  useEffect(() => {
    setStartDateInput(startDate);
  }, [startDate]);
  
  useEffect(() => {
    setEndDateInput(endDate);
  }, [endDate]);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading emissions...</p>
      </div>
    );
  }

  if (error && !emissions.length) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fee', 
          color: '#c33', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Please log in to view your emissions.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 15px 0' }}>My Emissions</h1>
        <Link 
          to="/add-emission" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          + Add New Emission
        </Link>
        <Link 
          to="/dashboard" 
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#212529' }}>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label htmlFor="category" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>
              Category
            </label>
            <select
              id="category"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters();
                  e.currentTarget.blur();
                }
              }}
              max={endDateInput || undefined}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
          <div>
            <label htmlFor="endDate" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFilters();
                  e.currentTarget.blur();
                }
              }}
              min={startDateInput || undefined}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={applyFilters}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fee', 
          color: '#c33', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Emissions Table */}
      {filteredEmissions.length === 0 ? (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>No emissions found</p>
          <p style={{ marginBottom: '20px' }}>Try adjusting your filters or add a new emission.</p>
          <Link 
            to="/add-emission" 
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            Add Your First Emission
          </Link>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Showing {filteredEmissions.length} emission{filteredEmissions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th 
                  style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529', cursor: 'pointer' }}
                  onClick={() => handleSort('date')}
                >
                  Date <span style={{ fontWeight: 'normal' }}>{getSortIcon('date')}</span>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>
                  Category
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>
                  Activity
                </th>
                <th 
                  style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529', cursor: 'pointer' }}
                  onClick={() => handleSort('amount')}
                >
                  Amount <span style={{ fontWeight: 'normal' }}>{getSortIcon('amount')}</span>
                </th>
                <th 
                  style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529', cursor: 'pointer' }}
                  onClick={() => handleSort('co2_equivalent')}
                >
                  CO₂ (kg) <span style={{ fontWeight: 'normal' }}>{getSortIcon('co2_equivalent')}</span>
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmissions.map((emission, index) => {
                const isExpanded = expandedEmissionId === emission.id;
                const isLastRow = index === filteredEmissions.length - 1;
                return (
                  <Fragment key={emission.id}>
                    <tr 
                      onClick={() => setExpandedEmissionId(isExpanded ? null : emission.id)}
                      style={{ 
                        borderBottom: isExpanded ? 'none' : (!isLastRow ? '1px solid #dee2e6' : 'none'),
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e9ecef';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                      }}
                    >
                  <td style={{ padding: '12px', fontSize: '14px', color: '#212529' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {formatDate(emission.date)}
                      {isEmissionEdited(emission) && (
                        <span 
                          style={{
                            fontSize: '10px',
                            color: '#6c757d',
                            backgroundColor: '#e9ecef',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontWeight: 'normal'
                          }}
                          title="This emission was edited"
                        >
                          Edited
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#212529' }}>
                    {capitalize(emission.category)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#212529' }}>
                    {capitalize(emission.activity.replace(/_/g, ' '))}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#212529' }}>
                    {formatNumber(emission.amount)} {emission.unit}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#212529' }}>
                    {formatNumber(emission.co2_equivalent)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/add-emission?edit=${emission.id}`}
                        style={{
                          color: '#007bff',
                          textDecoration: 'none',
                          fontSize: '14px',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleViewHistory(emission.id)}
                        style={{
                          color: '#6c757d',
                          border: 'none',
                          background: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        History
                      </button>
                      <button
                        onClick={() => setEmissionToDelete(emission.id)}
                        style={{
                          color: '#dc3545',
                          border: 'none',
                          background: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${emission.id}-expanded`}>
                    <td 
                      colSpan={6} 
                      style={{ 
                        padding: '15px 12px', 
                        backgroundColor: '#f8f9fa',
                        borderBottom: index < filteredEmissions.length - 1 ? '1px solid #dee2e6' : 'none'
                      }}
                    >
                      <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#666' }}>
                        Description:
                      </div>
                      <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                        {emission.description || (
                          <span style={{ fontStyle: 'italic', color: '#999' }}>No description provided</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* History Modal */}
      {emissionHistoryId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#212529' }}>Edit History</h3>
            {isLoadingHistory ? (
              <p style={{ color: '#212529' }}>Loading history...</p>
            ) : history.length === 0 ? (
              <p style={{ color: '#212529' }}>No edit history available for this emission.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {history.map((entry) => (
                  <div key={entry.id} style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#212529' }}>
                      {formatDate(new Date(entry.changed_at).toISOString().split('T')[0])} at {new Date(entry.changed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {entry.changes.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {entry.changes.map((change, changeIndex) => {
                          const fieldName = change.field.replace(/_/g, ' ');
                          const oldValue = change.old_value !== null && change.old_value !== undefined ? String(change.old_value) : '(empty)';
                          const newValue = change.new_value !== null && change.new_value !== undefined ? String(change.new_value) : '(empty)';
                          return (
                            <div key={changeIndex} style={{ fontSize: '14px', color: '#212529' }}>
                              <strong>{fieldName}:</strong>{' '}
                              <span style={{ color: '#dc3545' }}>{oldValue}</span>
                              {' -> '}
                              <span style={{ color: '#28a745' }}>{newValue}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: '#212529', fontStyle: 'italic' }}>
                        No changes detected
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setEmissionHistoryId(null);
                  setHistory([]);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {emissionToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '20px' }}>Confirm Delete</h3>
            <p style={{ margin: '0 0 20px 0', color: '#666' }}>
              Are you sure you want to delete this emission? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEmissionToDelete(null)}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmissionsList;

