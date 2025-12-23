import { useState, useEffect, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { getEmissions, getEmissionStats } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDateLocal } from '../utils/date';
import type { Emission, EmissionStats } from '../types';
import Charts from '../components/Charts';

function Dashboard() {
  const { user } = useAuth();
  const [emissions, setEmissions] = useState<Emission[]>([]);
  const [stats, setStats] = useState<EmissionStats | null>(null);
  const [monthStats, setMonthStats] = useState<EmissionStats | null>(null);
  const [previousMonthStats, setPreviousMonthStats] = useState<EmissionStats | null>(null);
  const [previousYearStats, setPreviousYearStats] = useState<EmissionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedEmissionId, setExpandedEmissionId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        // Get user's emissions (user_id comes from JWT token automatically)
        const emissionsResponse = await getEmissions();
        setEmissions(emissionsResponse.data);

        // Get overall statistics for user (user_id comes from JWT token automatically)
        const statsResponse = await getEmissionStats();
        setStats(statsResponse.data);

        // Get this month's statistics
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthStart = formatDateLocal(firstDayOfMonth);
        const monthEnd = formatDateLocal(lastDayOfMonth);

        const monthStatsResponse = await getEmissionStats({
          start_date: monthStart,
          end_date: monthEnd,
        });
        setMonthStats(monthStatsResponse.data);

        // Get previous month's statistics (for month-over-month comparison)
        const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const previousMonthStart = formatDateLocal(firstDayOfPreviousMonth);
        const previousMonthEnd = formatDateLocal(lastDayOfPreviousMonth);

        // Wrap in try-catch to prevent failures from breaking the dashboard
        try {
          const previousMonthStatsResponse = await getEmissionStats({
            start_date: previousMonthStart,
            end_date: previousMonthEnd,
          });
          setPreviousMonthStats(previousMonthStatsResponse.data);
        } catch (err) {
          console.warn('Failed to fetch previous month stats:', err);
          // Set to null so comparison card won't show
          setPreviousMonthStats(null);
        }

        // Get same month previous year's statistics (for year-over-year comparison)
        // Calculate dates outside try-catch
        const firstDayOfPreviousYearMonth = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        const lastDayOfPreviousYearMonth = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
        const previousYearMonthStart = formatDateLocal(firstDayOfPreviousYearMonth);
        const previousYearMonthEnd = formatDateLocal(lastDayOfPreviousYearMonth);
        
        // Wrap in try-catch to prevent failures from breaking the dashboard
        try {
          const previousYearStatsResponse = await getEmissionStats({
            start_date: previousYearMonthStart,
            end_date: previousYearMonthEnd,
          });
          setPreviousYearStats(previousYearStatsResponse.data);
        } catch (err) {
          console.warn('Failed to fetch previous year stats:', err);
          // Set to null so comparison card won't show
          setPreviousYearStats(null);
        }
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

  // Calculate percentage change between two values
  const calculatePercentageChange = (current: number, previous: number): number | null => {
    if (previous === 0) {
      // If previous is 0, we can't calculate percentage, return null or handle specially
      return current > 0 ? 100 : null; // 100% if current > 0, null if both are 0
    }
    return ((current - previous) / previous) * 100;
  };

  // Get trend indicator (↑ for increase, ↓ for decrease, → for no change)
  const getTrendIndicator = (percentageChange: number | null): { symbol: string; color: string } => {
    if (percentageChange === null) {
      return { symbol: '→', color: '#6c757d' }; // No change or no data
    }
    if (percentageChange > 0) {
      return { symbol: '↑', color: '#dc3545' }; // Increase (bad for emissions)
    } else if (percentageChange < 0) {
      return { symbol: '↓', color: '#28a745' }; // Decrease (good for emissions)
    } else {
      return { symbol: '→', color: '#6c757d' }; // No change
    }
  };

  // Format percentage change for display
  const formatPercentageChange = (percentageChange: number | null): string => {
    if (percentageChange === null) {
      return 'N/A';
    }
    const sign = percentageChange >= 0 ? '+' : '';
    return `${sign}${formatNumber(Math.abs(percentageChange))}%`;
  };

  // Check if emission was edited
  const isEmissionEdited = (emission: Emission): boolean => {
    if (!emission.created_at || !emission.updated_at) return false;
    // Check if updated_at is significantly later than created_at (more than 1 second difference)
    // This accounts for potential microsecond differences on creation
    const created = new Date(emission.created_at).getTime();
    const updated = new Date(emission.updated_at).getTime();
    return updated - created > 1000; // More than 1 second difference indicates an edit
  };

  // Pagination calculations
  const totalPages = Math.ceil(emissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmissions = emissions.slice(startIndex, endIndex);

  // Reset expanded emission when page changes
  useEffect(() => {
    setExpandedEmissionId(null);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Carbon Footprint Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
          <Link 
            to="/emissions" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#17a2b8',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            View All Emissions
          </Link>
        </div>
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

      {/* Comparison Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        {/* Month-over-Month Comparison */}
        {monthStats && previousMonthStats && (
          (() => {
            const currentValue = monthStats.total_co2_equivalent;
            const previousValue = previousMonthStats.total_co2_equivalent;
            const percentageChange = calculatePercentageChange(currentValue, previousValue);
            const trend = getTrendIndicator(percentageChange);
            return (
              <div style={{
                backgroundColor: '#fff',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333', fontWeight: 'bold' }}>
                  Month-over-Month
                </h3>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    This Month
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#17a2b8' }}>
                    {formatNumber(currentValue)} kg
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    Last Month
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'normal', color: '#6c757d' }}>
                    {formatNumber(previousValue)} kg
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: percentageChange && percentageChange < 0 ? '#d4edda' : percentageChange && percentageChange > 0 ? '#f8d7da' : '#e9ecef',
                  borderRadius: '4px',
                  border: `1px solid ${percentageChange && percentageChange < 0 ? '#c3e6cb' : percentageChange && percentageChange > 0 ? '#f5c6cb' : '#dee2e6'}`
                }}>
                  <span style={{ fontSize: '24px', color: trend.color, fontWeight: 'bold' }}>
                    {trend.symbol}
                  </span>
                  <div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '2px' }}>
                      Change
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: trend.color }}>
                      {formatPercentageChange(percentageChange)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Year-over-Year Comparison */}
        {monthStats && previousYearStats && (
          (() => {
            const currentValue = monthStats.total_co2_equivalent;
            const previousValue = previousYearStats.total_co2_equivalent;
            const percentageChange = calculatePercentageChange(currentValue, previousValue);
            const trend = getTrendIndicator(percentageChange);
            const now = new Date();
            const currentMonthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const previousYearMonthName = new Date(now.getFullYear() - 1, now.getMonth()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return (
              <div style={{
                backgroundColor: '#fff',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333', fontWeight: 'bold' }}>
                  Year-over-Year
                </h3>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    {currentMonthName}
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#17a2b8' }}>
                    {formatNumber(currentValue)} kg
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                    {previousYearMonthName}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'normal', color: '#6c757d' }}>
                    {formatNumber(previousValue)} kg
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: percentageChange && percentageChange < 0 ? '#d4edda' : percentageChange && percentageChange > 0 ? '#f8d7da' : '#e9ecef',
                  borderRadius: '4px',
                  border: `1px solid ${percentageChange && percentageChange < 0 ? '#c3e6cb' : percentageChange && percentageChange > 0 ? '#f5c6cb' : '#dee2e6'}`
                }}>
                  <span style={{ fontSize: '24px', color: trend.color, fontWeight: 'bold' }}>
                    {trend.symbol}
                  </span>
                  <div>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '2px' }}>
                      Change
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: trend.color }}>
                      {formatPercentageChange(percentageChange)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* Show message if no comparison data available */}
        {(!monthStats || !previousMonthStats || !previousYearStats) && (
          <div style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            gridColumn: '1 / -1'
          }}>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Comparison data will be available once you have emissions recorded for previous periods.
            </p>
          </div>
        )}
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

      {/* Data Visualization Charts */}
      {emissions.length > 0 && (
        <Charts emissions={emissions} />
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
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>Activity</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px', color: '#212529' }}>CO₂ (kg)</th>
                </tr>
              </thead>
              <tbody>
                {currentEmissions.map((emission, index) => {
                  const isExpanded = expandedEmissionId === emission.id;
                  const isLastRow = index === currentEmissions.length - 1;
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
                        <td style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#212529' }}>
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
                        <td style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#212529' }}>
                          {capitalize(emission.category)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#212529' }}>
                          {capitalize(emission.activity.replace(/_/g, ' '))}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#212529' }}>
                          {formatNumber(emission.amount)} {emission.unit}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'left', fontSize: '14px', color: '#212529' }}>
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
                              borderBottom: index < currentEmissions.length - 1 ? '1px solid #dee2e6' : 'none'
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
            {emissions.length > itemsPerPage && (
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    Showing {startIndex + 1} to {Math.min(endIndex, emissions.length)} of {emissions.length} emissions
                  </p>
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
                        color: currentPage === 1 ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ color: '#666', fontSize: '14px', padding: '0 10px' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff',
                        color: currentPage === totalPages ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
