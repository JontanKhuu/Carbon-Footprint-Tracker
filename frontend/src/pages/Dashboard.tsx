import { useState, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { getEmissions, getEmissionStats } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import type { Emission, EmissionStats } from '../types'

// Helper function to format date in local timezone as YYYY-MM-DD
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function Dashboard() {
  const { user } = useAuth();
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [stats, setStats] = useState<EmissionStats | null>(null);
  const [monthStats, setMonthStats] = useState<EmissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEmissionId, setExpandedEmissionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        // Get user's emissions (filtered by user_id)
        const emissionsResponse = await getEmissions({ user_id: user.id });
        setEmissions(emissionsResponse.data);

        // Get overall statistics for user
        const statsResponse = await getEmissionStats({ user_id: user.id });
        setStats(statsResponse.data);

        // Get this month's statistics
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthStart = formatDateLocal(firstDayOfMonth);
        const monthEnd = formatDateLocal(lastDayOfMonth);

        const monthStatsResponse = await getEmissionStats({
          user_id: user.id,
          start_date: monthStart,
          end_date: monthEnd,
        });
        setMonthStats(monthStatsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Format number with commas and 2 decimal places
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Parse date string in local timezone (YYYY-MM-DD format)
  const parseDateLocal = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    // month is 1-12 in the string, but Date constructor expects 0-11
    return new Date(year, month - 1, day);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = parseDateLocal(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Capitalize first letter
  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
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
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Carbon Footprint Dashboard</h1>
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
            fontSize: '16px'
          }}
        >
          + Add New Emission
        </Link>
      </div>

      {/* Total CO2 Equivalent - Prominent Display */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '2px solid #28a745',
        borderRadius: '8px',
        padding: '30px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '18px', fontWeight: 'normal' }}>
          Your Total Carbon Footprint
        </h2>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#28a745', marginBottom: '10px' }}>
          {stats ? formatNumber(stats.total_co2_equivalent) : '0.00'} kg CO₂
        </div>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Equivalent to {stats ? formatNumber(stats.total_co2_equivalent * 2.20462) : '0.00'} lbs CO₂
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Total Emissions Count */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
            Total Emissions
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#007bff' }}>
            {stats?.total_records || 0}
          </div>
        </div>

        {/* This Month's Total */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
            This Month
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>
            {monthStats ? formatNumber(monthStats.total_co2_equivalent) : '0.00'} kg
          </div>
        </div>

        {/* This Month's Count */}
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
            This Month's Records
          </h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#6c757d' }}>
            {monthStats?.total_records || 0}
          </div>
        </div>
      </div>

      {/* Emissions by Category */}
      {stats && stats.by_category.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '15px' }}>Emissions by Category</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {stats.by_category.map((cat) => (
              <div 
                key={cat.category}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '15px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
                  {capitalize(cat.category)}
                </h3>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                  {formatNumber(cat.total_co2_equivalent)} kg
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {cat.count} {cat.count === 1 ? 'record' : 'records'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Emissions Table */}
      <div>
        <h2 style={{ marginBottom: '15px' }}>Recent Emissions</h2>
        {emissions.length === 0 ? (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>No emissions recorded yet</p>
            <p style={{ marginBottom: '20px' }}>Start tracking your carbon footprint by adding your first emission!</p>
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
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Activity</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>CO₂ (kg)</th>
                </tr>
              </thead>
              <tbody>
                {emissions.slice(0, 10).map((emission, index) => {
                  const isExpanded = expandedEmissionId === emission.id;
                  return (
                    <Fragment key={emission.id}>
                      <tr 
                        onClick={() => setExpandedEmissionId(isExpanded ? null : emission.id)}
                        style={{ 
                          borderBottom: isExpanded ? 'none' : (index < Math.min(emissions.length, 10) - 1 ? '1px solid #dee2e6' : 'none'),
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
                          {formatDate(emission.date)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#212529' }}>
                          {capitalize(emission.category)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#212529' }}>
                          {capitalize(emission.activity.replace(/_/g, ' '))}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#212529' }}>
                          {formatNumber(emission.amount)} {emission.unit}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#28a745' }}>
                          {formatNumber(emission.co2_equivalent)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${emission.id}-expanded`}>
                          <td 
                            colSpan={5} 
                            style={{ 
                              padding: '15px 12px', 
                              backgroundColor: '#f8f9fa',
                              borderBottom: index < Math.min(emissions.length, 10) - 1 ? '1px solid #dee2e6' : 'none'
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
            {emissions.length > 10 && (
              <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Showing 10 of {emissions.length} emissions
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard
