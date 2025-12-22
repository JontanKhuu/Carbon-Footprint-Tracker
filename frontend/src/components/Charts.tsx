import { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Emission, EmissionFilters } from '../types';

interface ChartsProps {
  emissions: Emission[];
  onCategoryFilter?: (category: string | null) => void;
  onDateRangeFilter?: (startDate: string | null, endDate: string | null) => void;
}

type TimeView = 'daily' | 'weekly' | 'monthly';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const CATEGORY_ORDER = ['transport', 'energy', 'food', 'waste', 'other'];

function Charts({ emissions, onCategoryFilter, onDateRangeFilter }: ChartsProps) {
  const [timeView, setTimeView] = useState<TimeView>('daily');
  const [barChartTimeView, setBarChartTimeView] = useState<TimeView>('daily');
  const [pieChartTimeView, setPieChartTimeView] = useState<TimeView>('daily');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [selectedPeriodDate, setSelectedPeriodDate] = useState<string>(''); // For direct period selection
  const [barChartSelectedPeriodDate, setBarChartSelectedPeriodDate] = useState<string>(''); // For bar chart period selection
  const [pieChartSelectedPeriodDate, setPieChartSelectedPeriodDate] = useState<string>(''); // For pie chart period selection
  const [dateSelectionStatus, setDateSelectionStatus] = useState<{ hasData: boolean; message: string } | null>(null);
  const [barChartDateSelectionStatus, setBarChartDateSelectionStatus] = useState<{ hasData: boolean; message: string } | null>(null);
  const [pieChartDateSelectionStatus, setPieChartDateSelectionStatus] = useState<{ hasData: boolean; message: string } | null>(null);

  // Filter emissions by date range
  const filteredEmissions = useMemo(() => {
    let filtered = [...emissions];

    if (startDate) {
      filtered = filtered.filter(e => e.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(e => e.date <= endDate);
    }
    if (selectedCategory) {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    return filtered;
  }, [emissions, startDate, endDate, selectedCategory]);

  // Get the reference date for the current period (most recent emission date)
  const referenceDate = useMemo(() => {
    if (filteredEmissions.length === 0) return new Date();
    const dates = filteredEmissions.map(e => {
      const [year, month, day] = e.date.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }, [filteredEmissions]);

  // Get all available periods with data
  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    
    filteredEmissions.forEach(emission => {
      const [year, month, day] = emission.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      let periodKey: string;

      if (timeView === 'daily') {
        // Week key (Sunday of that week)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      } else if (timeView === 'weekly') {
        // Month key
        periodKey = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        // Year key
        periodKey = `${year}`;
      }
      
      periods.add(periodKey);
    });
    
    return Array.from(periods).sort();
  }, [filteredEmissions, timeView]);

  // Calculate the period range based on selectedPeriodDate or referenceDate
  const periodRange = useMemo(() => {
    let targetDate: Date;
    
    if (selectedPeriodDate) {
      // Use selected period date
      if (timeView === 'daily' || timeView === 'weekly') {
        const [year, month, day] = selectedPeriodDate.split('-').map(Number);
        targetDate = new Date(year, month - 1, day || 1);
      } else {
        targetDate = new Date(parseInt(selectedPeriodDate), 0, 1);
      }
    } else {
      // Use reference date (most recent)
      targetDate = new Date(referenceDate);
    }
    
    if (timeView === 'daily') {
      // Show week (Sunday to Saturday)
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return { start: weekStart, end: weekEnd };
    } else if (timeView === 'weekly') {
      // Show month
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      return { start: monthStart, end: monthEnd };
    } else {
      // Show year
      const yearStart = new Date(targetDate.getFullYear(), 0, 1);
      yearStart.setHours(0, 0, 0, 0);
      
      const yearEnd = new Date(targetDate.getFullYear(), 11, 31);
      yearEnd.setHours(23, 59, 59, 999);
      
      return { start: yearStart, end: yearEnd };
    }
  }, [selectedPeriodDate, referenceDate, timeView]);

  // Get current period key
  const currentPeriodKey = useMemo(() => {
    if (timeView === 'daily') {
      return `${periodRange.start.getFullYear()}-${String(periodRange.start.getMonth() + 1).padStart(2, '0')}-${String(periodRange.start.getDate()).padStart(2, '0')}`;
    } else if (timeView === 'weekly') {
      return `${periodRange.start.getFullYear()}-${String(periodRange.start.getMonth() + 1).padStart(2, '0')}`;
    } else {
      return `${periodRange.start.getFullYear()}`;
    }
  }, [periodRange, timeView]);

  // Check if previous/next periods have data
  const hasPreviousPeriod = useMemo(() => {
    const currentIndex = availablePeriods.indexOf(currentPeriodKey);
    return currentIndex > 0;
  }, [availablePeriods, currentPeriodKey]);

  const hasNextPeriod = useMemo(() => {
    const currentIndex = availablePeriods.indexOf(currentPeriodKey);
    return currentIndex >= 0 && currentIndex < availablePeriods.length - 1;
  }, [availablePeriods, currentPeriodKey]);

  // Group emissions by time period, filtered to current period
  const timeSeriesData = useMemo(() => {
    const grouped: Record<string, number> = {};
    const { start, end } = periodRange;

    filteredEmissions.forEach(emission => {
      // Parse date string (YYYY-MM-DD) directly to avoid timezone issues
      const [year, month, day] = emission.date.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
      
      // Filter to only include dates within the current period
      if (date < start || date > end) {
        return;
      }

      let key: string;

      if (timeView === 'daily') {
        // Use the original date string directly to avoid timezone conversion
        key = emission.date; // Already in YYYY-MM-DD format
      } else if (timeView === 'weekly') {
        // Get week start (Sunday) and format as YYYY-MM-DD
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        // Format as YYYY-MM-DD using local date methods to avoid timezone issues
        const wsYear = weekStart.getFullYear();
        const wsMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
        const wsDay = String(weekStart.getDate()).padStart(2, '0');
        key = `${wsYear}-${wsMonth}-${wsDay}`;
      } else {
        // Monthly - use original date string parts
        key = `${year}-${String(month).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = 0;
      }
      grouped[key] += emission.co2_equivalent;
    });

    // Convert to array and sort
    const data = Object.entries(grouped)
      .map(([date, co2]) => ({
        date,
        co2: Number(co2.toFixed(2)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return data;
  }, [filteredEmissions, timeView, periodRange]);

  // Calculate bar chart period range
  const barChartPeriodRange = useMemo(() => {
    let targetDate: Date;
    
    if (barChartSelectedPeriodDate) {
      // Use selected period date
      if (barChartTimeView === 'daily' || barChartTimeView === 'weekly') {
        const [year, month, day] = barChartSelectedPeriodDate.split('-').map(Number);
        targetDate = new Date(year, month - 1, day || 1);
      } else {
        targetDate = new Date(parseInt(barChartSelectedPeriodDate), 0, 1);
      }
    } else {
      // Use reference date (most recent)
      targetDate = new Date(referenceDate);
    }
    
    if (barChartTimeView === 'daily') {
      // Show week (Sunday to Saturday)
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return { start: weekStart, end: weekEnd };
    } else if (barChartTimeView === 'weekly') {
      // Show month
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      return { start: monthStart, end: monthEnd };
    } else {
      // Show year
      const yearStart = new Date(targetDate.getFullYear(), 0, 1);
      yearStart.setHours(0, 0, 0, 0);
      
      const yearEnd = new Date(targetDate.getFullYear(), 11, 31);
      yearEnd.setHours(23, 59, 59, 999);
      
      return { start: yearStart, end: yearEnd };
    }
  }, [barChartSelectedPeriodDate, referenceDate, barChartTimeView]);

  // Get bar chart available periods
  const barChartAvailablePeriods = useMemo(() => {
    const periods = new Set<string>();
    
    filteredEmissions.forEach(emission => {
      const [year, month, day] = emission.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      let periodKey: string;
      if (barChartTimeView === 'daily') {
        // Week key (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      } else if (barChartTimeView === 'weekly') {
        // Month key
        periodKey = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        // Year key
        periodKey = `${year}`;
      }
      
      periods.add(periodKey);
    });
    
    return Array.from(periods).sort();
  }, [filteredEmissions, barChartTimeView]);

  // Filter emissions for bar chart based on period
  const barChartFilteredEmissions = useMemo(() => {
    return filteredEmissions.filter(emission => {
      const [year, month, day] = emission.date.split('-').map(Number);
      const emissionDate = new Date(year, month - 1, day);
      return emissionDate >= barChartPeriodRange.start && emissionDate <= barChartPeriodRange.end;
    });
  }, [filteredEmissions, barChartPeriodRange]);

  // Get all unique categories from all emissions (not just filtered)
  // Return categories in the desired order, plus any additional categories at the end
  const allCategories = useMemo(() => {
    const unique = new Set(emissions.map(e => e.category));
    const ordered = CATEGORY_ORDER.filter(cat => unique.has(cat));
    const additional = Array.from(unique).filter(cat => !CATEGORY_ORDER.includes(cat)).sort();
    return [...ordered, ...additional];
  }, [emissions]);

  // Calculate pie chart period range
  const pieChartPeriodRange = useMemo(() => {
    let targetDate: Date;
    
    if (pieChartSelectedPeriodDate) {
      if (pieChartTimeView === 'daily' || pieChartTimeView === 'weekly') {
        const [year, month, day] = pieChartSelectedPeriodDate.split('-').map(Number);
        targetDate = new Date(year, month - 1, day || 1);
      } else {
        targetDate = new Date(parseInt(pieChartSelectedPeriodDate), 0, 1);
      }
    } else {
      targetDate = new Date(referenceDate);
    }
    
    if (pieChartTimeView === 'daily') {
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };
    } else if (pieChartTimeView === 'weekly') {
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      return { start: monthStart, end: monthEnd };
    } else {
      const yearStart = new Date(targetDate.getFullYear(), 0, 1);
      yearStart.setHours(0, 0, 0, 0);
      const yearEnd = new Date(targetDate.getFullYear(), 11, 31);
      yearEnd.setHours(23, 59, 59, 999);
      return { start: yearStart, end: yearEnd };
    }
  }, [pieChartSelectedPeriodDate, referenceDate, pieChartTimeView]);

  // Get pie chart available periods
  const pieChartAvailablePeriods = useMemo(() => {
    const periods = new Set<string>();
    filteredEmissions.forEach(emission => {
      const [year, month, day] = emission.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      let periodKey: string;
      if (pieChartTimeView === 'daily') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
      } else if (pieChartTimeView === 'weekly') {
        periodKey = `${year}-${String(month).padStart(2, '0')}`;
      } else {
        periodKey = `${year}`;
      }
      periods.add(periodKey);
    });
    return Array.from(periods).sort();
  }, [filteredEmissions, pieChartTimeView]);

  // Filter emissions for pie chart based on period
  const pieChartFilteredEmissions = useMemo(() => {
    return filteredEmissions.filter(emission => {
      const [year, month, day] = emission.date.split('-').map(Number);
      const emissionDate = new Date(year, month - 1, day);
      return emissionDate >= pieChartPeriodRange.start && emissionDate <= pieChartPeriodRange.end;
    });
  }, [filteredEmissions, pieChartPeriodRange]);

  // Group emissions by category (filtered by bar chart period for bar chart, pie chart period for pie chart)
  // For bar chart: always include all categories, even if they have 0 emissions
  // For pie chart: only include categories with emissions > 0 to avoid overlapping labels
  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};

    // Initialize all categories with 0
    allCategories.forEach(category => {
      grouped[category] = 0;
    });

    // Use appropriate filtered emissions based on chart type
    const emissionsToUse = chartType === 'bar' ? barChartFilteredEmissions : pieChartFilteredEmissions;

    // Add emissions from the filtered period
    emissionsToUse.forEach(emission => {
      if (grouped[emission.category] !== undefined) {
        grouped[emission.category] += emission.co2_equivalent;
      }
    });

    // Return in the predefined order
    const data = allCategories.map(category => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      co2: Number((grouped[category] || 0).toFixed(2)),
    }));

    // For pie chart, filter out categories with very small values to prevent overlapping labels
    // Calculate total to determine percentage threshold
    if (chartType === 'pie') {
      const total = data.reduce((sum, item) => sum + item.co2, 0);
      // Filter out categories that are less than 0.5% of total to prevent tiny slices and overlapping labels
      return data.filter(item => {
        if (total === 0) return false;
        const percentage = (item.co2 / total) * 100;
        return percentage >= 0.5; // Only show slices that are at least 0.5% of total
      });
    }

    // For bar chart, return all categories
    return data;
  }, [barChartFilteredEmissions, pieChartFilteredEmissions, allCategories, chartType]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const unique = new Set(emissions.map(e => e.category));
    return Array.from(unique).sort();
  }, [emissions]);

  // Get date range from emissions
  const dateRange = useMemo(() => {
    if (emissions.length === 0) return { min: '', max: '' };
    const dates = emissions.map(e => e.date).sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [emissions]);

  const handleCategoryClick = (category: string | null) => {
    if (onCategoryFilter) {
      onCategoryFilter(category);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setSelectedPeriodDate('');
    if (onCategoryFilter) onCategoryFilter(null);
    if (onDateRangeFilter) onDateRangeFilter(null, null);
  };

  const handleApplyFilters = () => {
    if (onCategoryFilter) {
      onCategoryFilter(selectedCategory || null);
    }
    if (onDateRangeFilter) {
      onDateRangeFilter(startDate || null, endDate || null);
    }
  };

  const handlePreviousPeriod = () => {
    const currentIndex = availablePeriods.indexOf(currentPeriodKey);
    if (currentIndex > 0) {
      setSelectedPeriodDate(availablePeriods[currentIndex - 1]);
      setDateSelectionStatus(null); // Clear status message when navigating
    }
  };

  const handleNextPeriod = () => {
    const currentIndex = availablePeriods.indexOf(currentPeriodKey);
    if (currentIndex < availablePeriods.length - 1) {
      setSelectedPeriodDate(availablePeriods[currentIndex + 1]);
      setDateSelectionStatus(null); // Clear status message when navigating
    }
  };

  const handlePeriodSelect = (value: string) => {
    setSelectedPeriodDate(value);
  };

  // Bar chart period navigation handlers
  const barChartCurrentPeriodKey = useMemo(() => {
    if (barChartTimeView === 'daily') {
      return `${barChartPeriodRange.start.getFullYear()}-${String(barChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}-${String(barChartPeriodRange.start.getDate()).padStart(2, '0')}`;
    } else if (barChartTimeView === 'weekly') {
      return `${barChartPeriodRange.start.getFullYear()}-${String(barChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}`;
    } else {
      return `${barChartPeriodRange.start.getFullYear()}`;
    }
  }, [barChartPeriodRange, barChartTimeView]);

  const barChartHasPreviousPeriod = useMemo(() => {
    const currentIndex = barChartAvailablePeriods.indexOf(barChartCurrentPeriodKey);
    return currentIndex > 0;
  }, [barChartAvailablePeriods, barChartCurrentPeriodKey]);

  const barChartHasNextPeriod = useMemo(() => {
    const currentIndex = barChartAvailablePeriods.indexOf(barChartCurrentPeriodKey);
    return currentIndex >= 0 && currentIndex < barChartAvailablePeriods.length - 1;
  }, [barChartAvailablePeriods, barChartCurrentPeriodKey]);

  const handleBarChartPreviousPeriod = () => {
    const currentIndex = barChartAvailablePeriods.indexOf(barChartCurrentPeriodKey);
    if (currentIndex > 0) {
      setBarChartSelectedPeriodDate(barChartAvailablePeriods[currentIndex - 1]);
      setBarChartDateSelectionStatus(null);
    }
  };

  const handleBarChartNextPeriod = () => {
    const currentIndex = barChartAvailablePeriods.indexOf(barChartCurrentPeriodKey);
    if (currentIndex < barChartAvailablePeriods.length - 1) {
      setBarChartSelectedPeriodDate(barChartAvailablePeriods[currentIndex + 1]);
      setBarChartDateSelectionStatus(null);
    }
  };

  const handleBarChartDateSelect = (dateString: string) => {
    if (!dateString) {
      setBarChartSelectedPeriodDate('');
      setBarChartDateSelectionStatus(null);
      return;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    let periodKey: string;
    if (barChartTimeView === 'daily') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    } else if (barChartTimeView === 'weekly') {
      periodKey = `${year}-${String(month).padStart(2, '0')}`;
    } else {
      periodKey = `${year}`;
    }

    if (barChartAvailablePeriods.includes(periodKey)) {
      setBarChartSelectedPeriodDate(periodKey);
      setBarChartDateSelectionStatus({ 
        hasData: true, 
        message: barChartTimeView === 'daily' 
          ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : barChartTimeView === 'weekly'
          ? `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          : `${year}`
      });
    } else {
      const selectedDate = new Date(year, month - 1, day);
      let nearestPeriod: string | null = null;
      let minDiff = Infinity;

      barChartAvailablePeriods.forEach(period => {
        let periodDate: Date;
        if (barChartTimeView === 'daily') {
          const [pYear, pMonth, pDay] = period.split('-').map(Number);
          periodDate = new Date(pYear, pMonth - 1, pDay);
        } else if (barChartTimeView === 'weekly') {
          const [pYear, pMonth] = period.split('-').map(Number);
          periodDate = new Date(pYear, pMonth - 1, 15);
        } else {
          periodDate = new Date(parseInt(period), 6, 1);
        }

        const diff = Math.abs(selectedDate.getTime() - periodDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          nearestPeriod = period;
        }
      });

      if (nearestPeriod) {
        setBarChartSelectedPeriodDate(nearestPeriod);
        if (barChartTimeView === 'daily') {
          const [pYear, pMonth, pDay] = nearestPeriod.split('-').map(Number);
          const nearestDate = new Date(pYear, pMonth - 1, pDay);
          setBarChartDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected date. Showing nearest week: ${nearestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          });
        } else if (barChartTimeView === 'weekly') {
          const [pYear, pMonth] = nearestPeriod.split('-').map(Number);
          const nearestDate = new Date(pYear, pMonth - 1, 1);
          setBarChartDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected month. Showing nearest: ${nearestDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          });
        } else {
          setBarChartDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected year. Showing nearest: ${nearestPeriod}`
          });
        }
      }
    }
  };

  const getBarChartCurrentPeriodDate = () => {
    if (barChartTimeView === 'daily') {
      return `${barChartPeriodRange.start.getFullYear()}-${String(barChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}-${String(barChartPeriodRange.start.getDate()).padStart(2, '0')}`;
    } else if (barChartTimeView === 'weekly') {
      return `${barChartPeriodRange.start.getFullYear()}-${String(barChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      return `${barChartPeriodRange.start.getFullYear()}-01-01`;
    }
  };

  // Convert a selected date to the appropriate period key
  const handleDateSelect = (dateString: string) => {
    if (!dateString) {
      setSelectedPeriodDate('');
      setDateSelectionStatus(null);
      return;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    let periodKey: string;
    if (timeView === 'daily') {
      // Get the Sunday of that week
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    } else if (timeView === 'weekly') {
      // Get the month
      periodKey = `${year}-${String(month).padStart(2, '0')}`;
    } else {
      // Get the year
      periodKey = `${year}`;
    }

    // Check if this period has data
    if (availablePeriods.includes(periodKey)) {
      setSelectedPeriodDate(periodKey);
      setDateSelectionStatus({ 
        hasData: true, 
        message: timeView === 'daily' 
          ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} has data`
          : timeView === 'weekly'
          ? `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} has data`
          : `${year} has data`
      });
    } else {
      // Find the nearest period with data
      const selectedDate = new Date(year, month - 1, day);
      let nearestPeriod: string | null = null;
      let minDiff = Infinity;

      availablePeriods.forEach(period => {
        let periodDate: Date;
        if (timeView === 'daily') {
          const [pYear, pMonth, pDay] = period.split('-').map(Number);
          periodDate = new Date(pYear, pMonth - 1, pDay);
        } else if (timeView === 'weekly') {
          const [pYear, pMonth] = period.split('-').map(Number);
          periodDate = new Date(pYear, pMonth - 1, 15); // Use middle of month
        } else {
          periodDate = new Date(parseInt(period), 6, 1); // Use middle of year
        }

        const diff = Math.abs(selectedDate.getTime() - periodDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          nearestPeriod = period;
        }
      });

      if (nearestPeriod) {
        setSelectedPeriodDate(nearestPeriod);
        // Format the nearest period for the message
        let nearestDate: Date;
        if (timeView === 'daily') {
          const [pYear, pMonth, pDay] = nearestPeriod.split('-').map(Number);
          nearestDate = new Date(pYear, pMonth - 1, pDay);
          setDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected date. Showing nearest week: ${nearestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          });
        } else if (timeView === 'weekly') {
          const [pYear, pMonth] = nearestPeriod.split('-').map(Number);
          nearestDate = new Date(pYear, pMonth - 1, 1);
          setDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected month. Showing nearest: ${nearestDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          });
        } else {
          setDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected year. Showing nearest: ${nearestPeriod}`
          });
        }
      }
    }
  };

  // Update status when period changes via other means (Previous/Next buttons)
  useEffect(() => {
    if (selectedPeriodDate && availablePeriods.includes(selectedPeriodDate) && !dateSelectionStatus) {
      // Period is valid, show positive status
      if (timeView === 'daily') {
        const [year, month, day] = selectedPeriodDate.split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        setDateSelectionStatus({ 
          hasData: true, 
          message: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        });
      } else if (timeView === 'weekly') {
        const [year, month] = selectedPeriodDate.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        setDateSelectionStatus({ 
          hasData: true, 
          message: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
      } else {
        setDateSelectionStatus({ 
          hasData: true, 
          message: `Year ${selectedPeriodDate}`
        });
      }
    }
  }, [selectedPeriodDate, timeView, availablePeriods, dateSelectionStatus]);

  // Update bar chart status when period changes via other means
  useEffect(() => {
    if (barChartSelectedPeriodDate && barChartAvailablePeriods.includes(barChartSelectedPeriodDate) && !barChartDateSelectionStatus) {
      if (barChartTimeView === 'daily') {
        const [year, month, day] = barChartSelectedPeriodDate.split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        setBarChartDateSelectionStatus({ 
          hasData: true, 
          message: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        });
      } else if (barChartTimeView === 'weekly') {
        const [year, month] = barChartSelectedPeriodDate.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        setBarChartDateSelectionStatus({ 
          hasData: true, 
          message: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
      } else {
        setBarChartDateSelectionStatus({ 
          hasData: true, 
          message: `Year ${barChartSelectedPeriodDate}`
        });
      }
    }
  }, [barChartSelectedPeriodDate, barChartTimeView, barChartAvailablePeriods, barChartDateSelectionStatus]);

  // Clear bar chart selected period when time view changes
  useEffect(() => {
    setBarChartSelectedPeriodDate('');
    setBarChartDateSelectionStatus(null);
  }, [barChartTimeView]);

  // Pie chart period navigation handlers
  const pieChartCurrentPeriodKey = useMemo(() => {
    if (pieChartTimeView === 'daily') {
      return `${pieChartPeriodRange.start.getFullYear()}-${String(pieChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}-${String(pieChartPeriodRange.start.getDate()).padStart(2, '0')}`;
    } else if (pieChartTimeView === 'weekly') {
      return `${pieChartPeriodRange.start.getFullYear()}-${String(pieChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}`;
    } else {
      return `${pieChartPeriodRange.start.getFullYear()}`;
    }
  }, [pieChartPeriodRange, pieChartTimeView]);

  const pieChartHasPreviousPeriod = useMemo(() => {
    const currentIndex = pieChartAvailablePeriods.indexOf(pieChartCurrentPeriodKey);
    return currentIndex > 0;
  }, [pieChartAvailablePeriods, pieChartCurrentPeriodKey]);

  const pieChartHasNextPeriod = useMemo(() => {
    const currentIndex = pieChartAvailablePeriods.indexOf(pieChartCurrentPeriodKey);
    return currentIndex >= 0 && currentIndex < pieChartAvailablePeriods.length - 1;
  }, [pieChartAvailablePeriods, pieChartCurrentPeriodKey]);

  const handlePieChartPreviousPeriod = () => {
    const currentIndex = pieChartAvailablePeriods.indexOf(pieChartCurrentPeriodKey);
    if (currentIndex > 0) {
      setPieChartSelectedPeriodDate(pieChartAvailablePeriods[currentIndex - 1]);
      setPieChartDateSelectionStatus(null);
    }
  };

  const handlePieChartNextPeriod = () => {
    const currentIndex = pieChartAvailablePeriods.indexOf(pieChartCurrentPeriodKey);
    if (currentIndex < pieChartAvailablePeriods.length - 1) {
      setPieChartSelectedPeriodDate(pieChartAvailablePeriods[currentIndex + 1]);
      setPieChartDateSelectionStatus(null);
    }
  };

  const handlePieChartDateSelect = (dateString: string) => {
    if (!dateString) {
      setPieChartSelectedPeriodDate('');
      setPieChartDateSelectionStatus(null);
      return;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    let periodKey: string;
    if (pieChartTimeView === 'daily') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    } else if (pieChartTimeView === 'weekly') {
      periodKey = `${year}-${String(month).padStart(2, '0')}`;
    } else {
      periodKey = `${year}`;
    }

    if (pieChartAvailablePeriods.includes(periodKey)) {
      setPieChartSelectedPeriodDate(periodKey);
      setPieChartDateSelectionStatus({ 
        hasData: true, 
        message: pieChartTimeView === 'daily' 
          ? `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : pieChartTimeView === 'weekly'
          ? `${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          : `${year}`
      });
    } else {
      const selectedDate = new Date(year, month - 1, day);
      let nearestPeriod: string | null = null;
      let minDiff = Infinity;

      pieChartAvailablePeriods.forEach(period => {
        let periodDate: Date;
        if (pieChartTimeView === 'daily') {
          const [pYear, pMonth, pDay] = period.split('-').map(Number);
          periodDate = new Date(pYear, pMonth - 1, pDay);
        } else if (pieChartTimeView === 'weekly') {
          const [pYear, pMonth] = period.split('-').map(Number);
          periodDate = new Date(pYear, pMonth - 1, 15);
        } else {
          periodDate = new Date(parseInt(period), 6, 1);
        }

        const diff = Math.abs(selectedDate.getTime() - periodDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          nearestPeriod = period;
        }
      });

      if (nearestPeriod) {
        setPieChartSelectedPeriodDate(nearestPeriod);
        if (pieChartTimeView === 'daily') {
          const [pYear, pMonth, pDay] = nearestPeriod.split('-').map(Number);
          const nearestDate = new Date(pYear, pMonth - 1, pDay);
          setPieChartDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected date. Showing nearest week: ${nearestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          });
        } else if (pieChartTimeView === 'weekly') {
          const [pYear, pMonth] = nearestPeriod.split('-').map(Number);
          const nearestDate = new Date(pYear, pMonth - 1, 1);
          setPieChartDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected month. Showing nearest: ${nearestDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
          });
        } else {
          setPieChartDateSelectionStatus({ 
            hasData: false, 
            message: `No data for selected year. Showing nearest: ${nearestPeriod}`
          });
        }
      }
    }
  };

  const getPieChartCurrentPeriodDate = () => {
    if (pieChartTimeView === 'daily') {
      return `${pieChartPeriodRange.start.getFullYear()}-${String(pieChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}-${String(pieChartPeriodRange.start.getDate()).padStart(2, '0')}`;
    } else if (pieChartTimeView === 'weekly') {
      return `${pieChartPeriodRange.start.getFullYear()}-${String(pieChartPeriodRange.start.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      return `${pieChartPeriodRange.start.getFullYear()}-01-01`;
    }
  };

  // Update pie chart status when period changes via other means
  useEffect(() => {
    if (pieChartSelectedPeriodDate && pieChartAvailablePeriods.includes(pieChartSelectedPeriodDate) && !pieChartDateSelectionStatus) {
      if (pieChartTimeView === 'daily') {
        const [year, month, day] = pieChartSelectedPeriodDate.split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        setPieChartDateSelectionStatus({ 
          hasData: true, 
          message: `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        });
      } else if (pieChartTimeView === 'weekly') {
        const [year, month] = pieChartSelectedPeriodDate.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        setPieChartDateSelectionStatus({ 
          hasData: true, 
          message: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        });
      } else {
        setPieChartDateSelectionStatus({ 
          hasData: true, 
          message: `Year ${pieChartSelectedPeriodDate}`
        });
      }
    }
  }, [pieChartSelectedPeriodDate, pieChartTimeView, pieChartAvailablePeriods, pieChartDateSelectionStatus]);

  // Clear pie chart selected period when time view changes
  useEffect(() => {
    setPieChartSelectedPeriodDate('');
    setPieChartDateSelectionStatus(null);
  }, [pieChartTimeView]);

  // Get the current period's date for the date input
  const getCurrentPeriodDate = () => {
    if (timeView === 'daily') {
      // Return the Sunday of the current week
      return `${periodRange.start.getFullYear()}-${String(periodRange.start.getMonth() + 1).padStart(2, '0')}-${String(periodRange.start.getDate()).padStart(2, '0')}`;
    } else if (timeView === 'weekly') {
      // Return the first day of the current month
      return `${periodRange.start.getFullYear()}-${String(periodRange.start.getMonth() + 1).padStart(2, '0')}-01`;
    } else {
      // Return January 1st of the current year
      return `${periodRange.start.getFullYear()}-01-01`;
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (timeView === 'daily') {
      // Parse date string directly to avoid timezone issues
      const [, month, day] = dateStr.split('-').map(Number);
      // Use shorter format: "M/D" for more space
      return `${month}/${day}`;
    } else if (timeView === 'weekly') {
      // Parse date string directly to avoid timezone issues
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      // Use shorter format: "MMM D" instead of "Week of MMM D"
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      const [year, month] = dateStr.split('-');
      // Use shorter format: "MMM YY" instead of "MMM YYYY"
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
            {payload[0].payload.date ? formatDateLabel(payload[0].payload.date) : payload[0].payload.category}
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            CO₂: {payload[0].value.toFixed(2)} kg
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ marginBottom: '40px' }}>
      <style>{`
        .recharts-wrapper:focus,
        .recharts-wrapper *:focus,
        .recharts-active-shape,
        .recharts-active-shape *,
        .recharts-bar-rectangle:focus,
        .recharts-pie-sector:focus,
        .recharts-dot:focus {
          outline: none !important;
          border: none !important;
        }
      `}</style>
      <h2 style={{ marginBottom: '20px' }}>Data Visualization</h2>

      {/* Filter Controls */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Chart Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label htmlFor="chart-category" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Category
            </label>
            <select
              id="chart-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="chart-start-date" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              Start Date
            </label>
            <input
              type="date"
              id="chart-start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={dateRange.min}
              max={endDate || dateRange.max}
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
            <label htmlFor="chart-end-date" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
              End Date
            </label>
            <input
              type="date"
              id="chart-end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || dateRange.min}
              max={dateRange.max}
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
            onClick={handleApplyFilters}
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
            onClick={handleClearFilters}
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

      {/* Emissions Over Time Chart */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>Emissions Over Time</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              Carbon dioxide equivalent (CO₂) emissions tracked over time
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    setTimeView('daily');
                    setSelectedPeriodDate('');
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: timeView === 'daily' ? '#007bff' : '#e9ecef',
                    color: timeView === 'daily' ? 'white' : '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Daily
                </button>
                <button
                  onClick={() => {
                    setTimeView('weekly');
                    setSelectedPeriodDate('');
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: timeView === 'weekly' ? '#007bff' : '#e9ecef',
                    color: timeView === 'weekly' ? 'white' : '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Weekly
                </button>
                <button
                  onClick={() => {
                    setTimeView('monthly');
                    setSelectedPeriodDate('');
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: timeView === 'monthly' ? '#007bff' : '#e9ecef',
                    color: timeView === 'monthly' ? 'white' : '#212529',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Monthly
                </button>
              </div>
            {timeSeriesData.length > 0 && availablePeriods.length > 0 && (
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={handlePreviousPeriod}
                  disabled={!hasPreviousPeriod}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: hasPreviousPeriod ? '#6c757d' : '#e9ecef',
                    color: hasPreviousPeriod ? 'white' : '#6c757d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: hasPreviousPeriod ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  ← Previous
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                    {timeView === 'daily' ? 'Select Week' : timeView === 'weekly' ? 'Select Month' : 'Select Year'}
                  </label>
                  {timeView === 'monthly' ? (
                    <select
                      value={selectedPeriodDate || currentPeriodKey}
                      onChange={(e) => handlePeriodSelect(e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '100px'
                      }}
                    >
                      {availablePeriods.map(period => (
                        <option key={period} value={period}>
                          {period}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                      <input
                        type="date"
                        value={getCurrentPeriodDate()}
                        onChange={(e) => handleDateSelect(e.target.value)}
                        min={availablePeriods.length > 0 ? (() => {
                          const first = availablePeriods[0];
                          if (timeView === 'daily') {
                            return first; // Already in YYYY-MM-DD format
                          } else {
                            return `${first}-01`;
                          }
                        })() : undefined}
                        max={availablePeriods.length > 0 ? (() => {
                          const last = availablePeriods[availablePeriods.length - 1];
                          if (timeView === 'daily') {
                            const [year, month, day] = last.split('-').map(Number);
                            const weekEnd = new Date(year, month - 1, day);
                            weekEnd.setDate(weekEnd.getDate() + 6);
                            return `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
                          } else {
                            const [year, month] = last.split('-').map(Number);
                            const monthEnd = new Date(year, month, 0);
                            return `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
                          }
                        })() : undefined}
                        style={{
                          padding: '6px 8px',
                          fontSize: '14px',
                          border: dateSelectionStatus && !dateSelectionStatus.hasData ? '2px solid #ffc107' : '1px solid #ccc',
                          borderRadius: '4px',
                          width: '150px'
                        }}
                      />
                      {dateSelectionStatus && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: dateSelectionStatus.hasData ? '#28a745' : '#ffc107',
                          fontWeight: '500',
                          textAlign: 'center',
                          maxWidth: '200px'
                        }}>
                          {dateSelectionStatus.message}
                        </div>
                      )}
                      {!dateSelectionStatus && (
                        <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                          {timeView === 'daily' 
                            ? 'Select any date to view that week'
                            : 'Select any date to view that month'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleNextPeriod}
                  disabled={!hasNextPeriod}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: hasNextPeriod ? '#6c757d' : '#e9ecef',
                    color: hasNextPeriod ? 'white' : '#6c757d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: hasNextPeriod ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
        {timeSeriesData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>No data available for the selected filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData} margin={{ top: 5, right: 5, left: 35, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                type="category"
                tickFormatter={formatDateLabel}
                angle={-45}
                textAnchor="end"
                height={50}
                interval={0}
                tick={{ fill: '#999', fontSize: 12 }}
                label={{ value: 'Date', position: 'insideBottom', offset: -5, style: { fill: '#333', fontSize: 14, fontWeight: '600' } }}
              />
              <YAxis 
                label={{ value: 'CO₂ (kg)', angle: -90, position: 'left', offset: 5, style: { textAnchor: 'middle', fill: '#333', fontSize: 14, fontWeight: '600' } }} 
                tick={{ fill: '#999', fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format large numbers more concisely
                  if (value >= 1000) {
                    return `${(value / 1000).toFixed(1)}k`;
                  }
                  // Remove unnecessary decimal places
                  return value % 1 === 0 ? value.toString() : value.toFixed(1);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="co2"
                stroke="#0088FE"
                strokeWidth={2}
                dot={{ r: 4, style: { outline: 'none' } }}
                activeDot={{ r: 6, style: { outline: 'none' } }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Emissions by Category Chart */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Emissions by Category</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setChartType('bar')}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: chartType === 'bar' ? '#007bff' : '#e9ecef',
                color: chartType === 'bar' ? 'white' : '#212529',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setChartType('pie')}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                backgroundColor: chartType === 'pie' ? '#007bff' : '#e9ecef',
                color: chartType === 'pie' ? 'white' : '#212529',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Pie Chart
            </button>
          </div>
        </div>
        {categoryData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>No data available for the selected filters</p>
          </div>
        ) : chartType === 'bar' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>CO₂ Equivalent (kg)</h3>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                Carbon dioxide equivalent (CO₂) emissions by category
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setBarChartTimeView('daily')}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  backgroundColor: barChartTimeView === 'daily' ? '#007bff' : '#e9ecef',
                  color: barChartTimeView === 'daily' ? 'white' : '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Daily
              </button>
              <button
                onClick={() => setBarChartTimeView('weekly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  backgroundColor: barChartTimeView === 'weekly' ? '#007bff' : '#e9ecef',
                  color: barChartTimeView === 'weekly' ? 'white' : '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Weekly
              </button>
              <button
                onClick={() => setBarChartTimeView('monthly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  backgroundColor: barChartTimeView === 'monthly' ? '#007bff' : '#e9ecef',
                  color: barChartTimeView === 'monthly' ? 'white' : '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Monthly
              </button>
            </div>
            {categoryData.length > 0 && barChartAvailablePeriods.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleBarChartPreviousPeriod}
                  disabled={!barChartHasPreviousPeriod}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: barChartHasPreviousPeriod ? '#6c757d' : '#e9ecef',
                    color: barChartHasPreviousPeriod ? 'white' : '#6c757d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: barChartHasPreviousPeriod ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  ← Previous
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                    {barChartTimeView === 'daily' ? 'Select Week' : barChartTimeView === 'weekly' ? 'Select Month' : 'Select Year'}
                  </label>
                  {barChartTimeView === 'monthly' ? (
                    <select
                      value={barChartSelectedPeriodDate || barChartCurrentPeriodKey}
                      onChange={(e) => setBarChartSelectedPeriodDate(e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '100px'
                      }}
                    >
                      {barChartAvailablePeriods.map(period => (
                        <option key={period} value={period}>
                          {period}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                      <input
                        type="date"
                        value={getBarChartCurrentPeriodDate()}
                        onChange={(e) => handleBarChartDateSelect(e.target.value)}
                        min={barChartAvailablePeriods.length > 0 ? (() => {
                          const first = barChartAvailablePeriods[0];
                          if (barChartTimeView === 'daily') {
                            return first;
                          } else {
                            return `${first}-01`;
                          }
                        })() : undefined}
                        max={barChartAvailablePeriods.length > 0 ? (() => {
                          const last = barChartAvailablePeriods[barChartAvailablePeriods.length - 1];
                          if (barChartTimeView === 'daily') {
                            const [year, month, day] = last.split('-').map(Number);
                            const weekEnd = new Date(year, month - 1, day);
                            weekEnd.setDate(weekEnd.getDate() + 6);
                            return `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
                          } else {
                            const [year, month] = last.split('-').map(Number);
                            const monthEnd = new Date(year, month, 0);
                            return `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
                          }
                        })() : undefined}
                        style={{
                          padding: '6px 8px',
                          fontSize: '14px',
                          border: barChartDateSelectionStatus && !barChartDateSelectionStatus.hasData ? '2px solid #ffc107' : '1px solid #ccc',
                          borderRadius: '4px',
                          width: '150px'
                        }}
                      />
                      {barChartDateSelectionStatus && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: barChartDateSelectionStatus.hasData ? '#28a745' : '#ffc107',
                          fontWeight: '500',
                          textAlign: 'center',
                          maxWidth: '200px'
                        }}>
                          {barChartDateSelectionStatus.message}
                        </div>
                      )}
                      {!barChartDateSelectionStatus && (
                        <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                          {barChartTimeView === 'daily' 
                            ? 'Select any date to view that week'
                            : 'Select any date to view that month'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBarChartNextPeriod}
                  disabled={!barChartHasNextPeriod}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: barChartHasNextPeriod ? '#6c757d' : '#e9ecef',
                    color: barChartHasNextPeriod ? 'white' : '#6c757d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: barChartHasNextPeriod ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData} margin={{ top: 5, right: 5, left: 35, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  label={{ value: 'Category', position: 'insideBottom', offset: -5, style: { fill: '#333', fontSize: 14, fontWeight: '600' } }}
                  tick={{ fill: '#999', fontSize: 12 }}
                />
                <YAxis 
                  label={{ value: 'CO₂ (kg)', angle: -90, position: 'left', offset: 5, style: { textAnchor: 'middle', fill: '#333', fontSize: 14, fontWeight: '600' } }} 
                  tick={{ fill: '#999', fontSize: 12 }}
                  tickFormatter={(value) => {
                    // Format large numbers more concisely
                    if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}k`;
                    }
                    // Remove unnecessary decimal places
                    return value % 1 === 0 ? value.toString() : value.toFixed(1);
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="co2"
                  fill="#0088FE"
                  onClick={(data) => {
                    if (data && data.category) {
                      const category = data.category.toLowerCase();
                      handleCategoryClick(category);
                      setSelectedCategory(category);
                    }
                  }}
                  style={{ cursor: 'pointer', outline: 'none' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setPieChartTimeView('daily')}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  backgroundColor: pieChartTimeView === 'daily' ? '#007bff' : '#e9ecef',
                  color: pieChartTimeView === 'daily' ? 'white' : '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Daily
              </button>
              <button
                onClick={() => setPieChartTimeView('weekly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  backgroundColor: pieChartTimeView === 'weekly' ? '#007bff' : '#e9ecef',
                  color: pieChartTimeView === 'weekly' ? 'white' : '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Weekly
              </button>
              <button
                onClick={() => setPieChartTimeView('monthly')}
                style={{
                  padding: '6px 12px',
                  fontSize: '14px',
                  backgroundColor: pieChartTimeView === 'monthly' ? '#007bff' : '#e9ecef',
                  color: pieChartTimeView === 'monthly' ? 'white' : '#212529',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Monthly
              </button>
            </div>
            {categoryData.length > 0 && pieChartAvailablePeriods.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <button
                  onClick={handlePieChartPreviousPeriod}
                  disabled={!pieChartHasPreviousPeriod}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: pieChartHasPreviousPeriod ? '#6c757d' : '#e9ecef',
                    color: pieChartHasPreviousPeriod ? 'white' : '#6c757d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: pieChartHasPreviousPeriod ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  ← Previous
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                    {pieChartTimeView === 'daily' ? 'Select Week' : pieChartTimeView === 'weekly' ? 'Select Month' : 'Select Year'}
                  </label>
                  {pieChartTimeView === 'monthly' ? (
                    <select
                      value={pieChartSelectedPeriodDate || pieChartCurrentPeriodKey}
                      onChange={(e) => setPieChartSelectedPeriodDate(e.target.value)}
                      style={{
                        padding: '6px 8px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        width: '100px'
                      }}
                    >
                      {pieChartAvailablePeriods.map(period => (
                        <option key={period} value={period}>
                          {period}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                      <input
                        type="date"
                        value={getPieChartCurrentPeriodDate()}
                        onChange={(e) => handlePieChartDateSelect(e.target.value)}
                        min={pieChartAvailablePeriods.length > 0 ? (() => {
                          const first = pieChartAvailablePeriods[0];
                          if (pieChartTimeView === 'daily') {
                            return first;
                          } else {
                            return `${first}-01`;
                          }
                        })() : undefined}
                        max={pieChartAvailablePeriods.length > 0 ? (() => {
                          const last = pieChartAvailablePeriods[pieChartAvailablePeriods.length - 1];
                          if (pieChartTimeView === 'daily') {
                            const [year, month, day] = last.split('-').map(Number);
                            const weekEnd = new Date(year, month - 1, day);
                            weekEnd.setDate(weekEnd.getDate() + 6);
                            return `${weekEnd.getFullYear()}-${String(weekEnd.getMonth() + 1).padStart(2, '0')}-${String(weekEnd.getDate()).padStart(2, '0')}`;
                          } else {
                            const [year, month] = last.split('-').map(Number);
                            const monthEnd = new Date(year, month, 0);
                            return `${monthEnd.getFullYear()}-${String(monthEnd.getMonth() + 1).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`;
                          }
                        })() : undefined}
                        style={{
                          padding: '6px 8px',
                          fontSize: '14px',
                          border: pieChartDateSelectionStatus && !pieChartDateSelectionStatus.hasData ? '2px solid #ffc107' : '1px solid #ccc',
                          borderRadius: '4px',
                          width: '150px'
                        }}
                      />
                      {pieChartDateSelectionStatus && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: pieChartDateSelectionStatus.hasData ? '#28a745' : '#ffc107',
                          fontWeight: '500',
                          textAlign: 'center',
                          maxWidth: '200px'
                        }}>
                          {pieChartDateSelectionStatus.message}
                        </div>
                      )}
                      {!pieChartDateSelectionStatus && (
                        <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                          {pieChartTimeView === 'daily' 
                            ? 'Select any date to view that week'
                            : 'Select any date to view that month'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handlePieChartNextPeriod}
                  disabled={!pieChartHasNextPeriod}
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    backgroundColor: pieChartHasNextPeriod ? '#6c757d' : '#e9ecef',
                    color: pieChartHasNextPeriod ? 'white' : '#6c757d',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: pieChartHasNextPeriod ? 'pointer' : 'not-allowed',
                    fontWeight: '500'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => {
                    // Only show labels for slices with more than 0% to avoid overlap
                    if (percent && percent > 0) {
                      return `${category}: ${(percent * 100).toFixed(0)}%`;
                    }
                    return '';
                  }}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="co2"
                  nameKey="category"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ outline: 'none' }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default Charts;

