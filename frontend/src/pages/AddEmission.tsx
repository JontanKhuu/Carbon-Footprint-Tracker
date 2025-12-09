import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createEmission, getActivities } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { CreateEmissionRequest, ActivitiesResponse } from '../types';

// Category options
const CATEGORIES = [
  { value: 'transport', label: 'Transport' },
  { value: 'energy', label: 'Energy' },
  { value: 'food', label: 'Food' },
  { value: 'waste', label: 'Waste' },
  { value: 'other', label: 'Other' },
];

// Activity options by category
const ACTIVITIES: Record<string, Array<{ value: string; label: string }>> = {
  transport: [
    { value: 'car_drive', label: 'Car Drive' },
    { value: 'plane_flight', label: 'Plane Flight' },
    { value: 'train_ride', label: 'Train Ride' },
    { value: 'bus_ride', label: 'Bus Ride' },
    { value: 'motorcycle_ride', label: 'Motorcycle Ride' },
  ],
  energy: [
    { value: 'electricity_usage', label: 'Electricity Usage' },
    { value: 'gas_usage', label: 'Gas Usage' },
    { value: 'heating', label: 'Heating' },
  ],
  food: [
    { value: 'beef', label: 'Beef' },
    { value: 'pork', label: 'Pork' },
    { value: 'chicken', label: 'Chicken' },
    { value: 'fish', label: 'Fish' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'vegetables', label: 'Vegetables' },
  ],
  waste: [
    { value: 'plastic', label: 'Plastic Waste' },
    { value: 'paper', label: 'Paper Waste' },
    { value: 'organic', label: 'Organic Waste' },
  ],
  other: [
    { value: 'other', label: 'Other Activity' },
  ],
};

// Unit options
const UNITS = [
  { value: 'km', label: 'Kilometers (km)' },
  { value: 'miles', label: 'Miles' },
  { value: 'kWh', label: 'Kilowatt-hours (kWh)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'm³', label: 'Cubic meters (m³)' },
  { value: 'L', label: 'Liters (L)' },
];

// Unit groups - defines which units are compatible with each other
const UNIT_GROUPS: Record<string, string[]> = {
  // Distance units
  distance: ['km', 'miles'],
  // Weight units
  weight: ['kg', 'g'],
  // Volume units
  volume: ['m³', 'L'],
  // Energy units
  energy: ['kWh'],
};

// Map each unit to its group
const UNIT_TO_GROUP: Record<string, string> = {
  'km': 'distance',
  'miles': 'distance',
  'kg': 'weight',
  'g': 'weight',
  'm³': 'volume',
  'L': 'volume',
  'kWh': 'energy',
};

// Get compatible units for a given unit
const getCompatibleUnits = (unit: string): string[] => {
  const group = UNIT_TO_GROUP[unit];
  if (!group) {
    // If unit not found, return all units (fallback)
    return UNITS.map(u => u.value);
  }
  return UNIT_GROUPS[group] || [];
};

// Helper function to format date in local timezone as YYYY-MM-DD
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Unit conversion factors for emission factors
// These convert emission factors (CO2 per unit) from one unit to another
// Note: For emission factors, we need inverse conversions compared to amount conversions
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  // Distance conversions (base: km)
  // If factor is per km, to get per mile: multiply by (km per mile) = 1.609344
  km: {
    miles: 1.609344, // 0.120 kg CO2/km → 0.120 × 1.609344 = 0.193 kg CO2/mile
  },
  miles: {
    km: 1 / 1.609344, // 0.193 kg CO2/mile → 0.193 / 1.609344 = 0.120 kg CO2/km
  },
  // Weight conversions (base: kg)
  // If factor is per kg, to get per g: divide by 1000 (since 1 kg = 1000 g, we need less per gram)
  // Example: 27.0 kg CO2/kg → 27.0 / 1000 = 0.027 kg CO2/g
  kg: {
    g: 1 / 1000, // 27.0 kg CO2/kg → 27.0 × (1/1000) = 0.027 kg CO2/g
  },
  g: {
    kg: 1000, // 0.027 kg CO2/g → 0.027 × 1000 = 27.0 kg CO2/kg
  },
  // Volume conversions (base: m³)
  // If factor is per m³, to get per L: divide by 1000 (since 1 m³ = 1000 L, we need less per liter)
  // Example: 1.96 kg CO2/m³ → 1.96 / 1000 = 0.00196 kg CO2/L
  'm³': {
    L: 1 / 1000, // 1.96 kg CO2/m³ → 1.96 × (1/1000) = 0.00196 kg CO2/L
  },
  L: {
    'm³': 1000, // 0.00196 kg CO2/L → 0.00196 × 1000 = 1.96 kg CO2/m³
  },
  // Energy (kWh is typically the base unit, no common conversions needed)
};

// Convert emission factor from one unit to another
const convertEmissionFactor = (factor: number, fromUnit: string, toUnit: string): number => {
  // If units are the same, no conversion needed
  if (fromUnit === toUnit) {
    return factor;
  }
  
  // Check if conversion exists
  if (UNIT_CONVERSIONS[fromUnit] && UNIT_CONVERSIONS[fromUnit][toUnit]) {
    return factor * UNIT_CONVERSIONS[fromUnit][toUnit];
  }
  
  // Try reverse conversion
  if (UNIT_CONVERSIONS[toUnit] && UNIT_CONVERSIONS[toUnit][fromUnit]) {
    return factor / UNIT_CONVERSIONS[toUnit][fromUnit];
  }
  
  // No conversion found, return original factor (user should be aware)
  return factor;
};

function AddEmission() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateEmissionRequest>({
    user_id: user?.id || 0,
    category: '',
    activity: '',
    amount: 0,
    unit: 'km',
    date: formatDateLocal(new Date()), // Today's date in YYYY-MM-DD format (local timezone)
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [emissionFactors, setEmissionFactors] = useState<Record<string, Record<string, number>>>({});
  const [expectedUnits, setExpectedUnits] = useState<Record<string, Record<string, string>>>({});
  const [isLoadingFactors, setIsLoadingFactors] = useState(false);
  const [manualCO2Edit, setManualCO2Edit] = useState(false);

  // Fetch emission factors and expected units on component mount
  useEffect(() => {
    const fetchEmissionFactors = async () => {
      try {
        setIsLoadingFactors(true);
        const response = await getActivities();
        const factors: Record<string, Record<string, number>> = {};
        const units: Record<string, Record<string, string>> = {};
        
        // Transform response into easier-to-use format
        Object.keys(response.data).forEach(category => {
          factors[category] = response.data[category].emission_factors;
          units[category] = response.data[category].expected_units;
        });
        
        setEmissionFactors(factors);
        setExpectedUnits(units);
      } catch (err) {
        console.error('Error fetching emission factors:', err);
        // Don't show error to user - form will still work with manual entry
      } finally {
        setIsLoadingFactors(false);
      }
    };

    fetchEmissionFactors();
  }, []);

  // Get available activities for selected category
  const availableActivities = formData.category ? ACTIVITIES[formData.category] || [] : [];

  // Get compatible units based on selected activity's expected unit
  const getAvailableUnits = () => {
    if (!formData.category || !formData.activity || Object.keys(expectedUnits).length === 0) {
      // No activity selected, return all units
      return UNITS;
    }
    
    const expectedUnit = expectedUnits[formData.category]?.[formData.activity];
    if (!expectedUnit) {
      // No expected unit found, return all units
      return UNITS;
    }
    
    // Get compatible units for the expected unit
    const compatibleUnitValues = getCompatibleUnits(expectedUnit);
    
    // Filter UNITS to only include compatible units
    return UNITS.filter(unit => compatibleUnitValues.includes(unit.value));
  };

  const availableUnits = getAvailableUnits();

  // Check if current activity is supported (has emission factor)
  // Only check after emission factors have been loaded
  const isActivitySupported = (): boolean => {
    if (!formData.category || !formData.activity) return false;
    if (Object.keys(emissionFactors).length === 0) return false; // Factors not loaded yet
    return emissionFactors[formData.category]?.[formData.activity] !== undefined;
  };

  // Get emission factor for current activity
  const getCurrentEmissionFactor = (): number | null => {
    if (!formData.category || !formData.activity) return null;
    return emissionFactors[formData.category]?.[formData.activity] ?? null;
  };

  // Auto-fill unit when activity is selected, or reset if current unit is incompatible
  useEffect(() => {
    if (formData.category && formData.activity && Object.keys(expectedUnits).length > 0) {
      const expectedUnit = expectedUnits[formData.category]?.[formData.activity];
      if (expectedUnit) {
        setFormData(prev => {
          // Get compatible units for the expected unit
          const compatibleUnits = getCompatibleUnits(expectedUnit);
          
          // Check if current unit is compatible with the activity
          const isCurrentUnitCompatible = compatibleUnits.includes(prev.unit);
          
          // If unit is not compatible or different from expected, update to expected unit
          if (!isCurrentUnitCompatible || prev.unit !== expectedUnit) {
            return { ...prev, unit: expectedUnit };
          }
          return prev;
        });
      }
    }
  }, [formData.category, formData.activity, expectedUnits]);

  // Auto-calculate CO2 equivalent when activity, amount, or unit changes
  // Only auto-calculate if user hasn't manually edited the values
  useEffect(() => {
    if (!formData.category || !formData.activity) {
      // Clear CO2 fields if no activity selected
      setFormData(prev => ({
        ...prev,
        co2_equivalent: undefined,
        emission_factor: undefined,
      }));
      setManualCO2Edit(false);
      return;
    }
    
    // Don't auto-calculate if user has manually edited
    if (manualCO2Edit) {
      return;
    }
    
    const factor = emissionFactors[formData.category]?.[formData.activity];
    if (factor !== undefined) {
      // Activity is supported - get expected unit and convert factor if needed
      const expectedUnit = expectedUnits[formData.category]?.[formData.activity] || 'km';
      const convertedFactor = convertEmissionFactor(factor, expectedUnit, formData.unit);
      
      // Calculate CO2 with converted factor
      const calculatedCO2 = formData.amount > 0 ? formData.amount * convertedFactor : 0;
      setFormData(prev => ({
        ...prev,
        co2_equivalent: calculatedCO2,
        emission_factor: convertedFactor,
      }));
    } else {
      // Activity is not supported - clear CO2 fields for manual entry
      setFormData(prev => ({
        ...prev,
        co2_equivalent: undefined,
        emission_factor: undefined,
      }));
    }
  }, [formData.category, formData.activity, formData.amount, formData.unit, emissionFactors, manualCO2Edit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Reset activity when category changes
      if (name === 'category') {
        newData.activity = '';
        newData.co2_equivalent = undefined;
        newData.emission_factor = undefined;
        // Unit will be auto-filled when activity is selected
      }
      
      // Reset CO2 fields when activity changes (will be recalculated by useEffect)
      if (name === 'activity') {
        newData.co2_equivalent = undefined;
        newData.emission_factor = undefined;
        setManualCO2Edit(false); // Reset manual edit flag when activity changes
        // Unit will be auto-filled by useEffect
      }
      
      // Handle unit change - always convert from base emission factor to new unit
      if (name === 'unit') {
        const newUnit = value;
        
        // Get expected unit for the activity (base unit)
        const expectedUnit = expectedUnits[formData.category]?.[formData.activity];
        
        // Get base emission factor from backend
        const baseFactor = emissionFactors[formData.category]?.[formData.activity];
        
        if (baseFactor !== undefined && expectedUnit) {
          // Always convert from base factor (expected unit) to new unit
          // This ensures consistent conversion regardless of current unit
          newData.emission_factor = convertEmissionFactor(baseFactor, expectedUnit, newUnit);
          
          // Recalculate CO2 equivalent with converted emission factor
          if (newData.amount > 0) {
            newData.co2_equivalent = newData.amount * newData.emission_factor;
          } else {
            newData.co2_equivalent = 0;
          }
          
          // Reset manual edit flag since we're using base values
          setManualCO2Edit(false);
        } else if (formData.emission_factor !== undefined && formData.emission_factor !== null && !isNaN(formData.emission_factor)) {
          // No base factor available (unsupported activity) - convert from old unit to new unit
          const oldUnit = formData.unit;
          newData.emission_factor = convertEmissionFactor(formData.emission_factor, oldUnit, newUnit);
          
          // Recalculate CO2 equivalent with converted emission factor
          if (newData.amount > 0 && newData.emission_factor !== undefined && !isNaN(newData.emission_factor)) {
            newData.co2_equivalent = newData.amount * newData.emission_factor;
          }
        }
      }
      
      // Convert numeric fields
      if (name === 'amount') {
        const amountValue = parseFloat(value) || 0;
        newData[name] = amountValue;
        
        // If emission factor is manually set, recalculate CO2 based on it
        if (manualCO2Edit && newData.emission_factor !== undefined && !isNaN(newData.emission_factor) && amountValue > 0) {
          newData.co2_equivalent = amountValue * newData.emission_factor;
        } else if (isActivitySupported()) {
          // Reset manual edit flag when amount changes so it can recalculate with auto factor
          setManualCO2Edit(false);
        }
      } else if (name === 'co2_equivalent') {
        // Always allow manual entry - user can override auto-calculated values
        // Handle empty string or invalid input
        if (value === '' || value === null || value === undefined) {
          newData[name] = undefined;
        } else {
          const numValue = parseFloat(value);
          newData[name] = isNaN(numValue) ? undefined : numValue;
        }
        // Mark as manually edited so auto-calculation doesn't override
        setManualCO2Edit(true);
        
        // Recalculate emission factor when CO2 equivalent changes
        // emission_factor = CO2_equivalent / amount
        if (newData[name] !== undefined && !isNaN(newData[name]) && newData.amount > 0) {
          newData.emission_factor = newData[name] / newData.amount;
        } else if (newData[name] === undefined) {
          newData.emission_factor = undefined;
        }
      } else if (name === 'emission_factor') {
        // Always allow manual entry - user can override auto-calculated values
        // Handle empty string or invalid input
        if (value === '' || value === null || value === undefined) {
          newData[name] = undefined;
        } else {
          const numValue = parseFloat(value);
          newData[name] = isNaN(numValue) ? undefined : numValue;
        }
        // Mark as manually edited so auto-calculation doesn't override
        setManualCO2Edit(true);
        
        // Recalculate CO2 equivalent when emission factor changes
        if (newData[name] !== undefined && !isNaN(newData[name]) && newData.amount > 0) {
          newData.co2_equivalent = newData.amount * newData[name];
        } else if (newData[name] === undefined) {
          newData.co2_equivalent = undefined;
        }
      }
      
      return newData;
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setSubmitError('');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.activity) {
      newErrors.activity = 'Activity is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.unit) {
      newErrors.unit = 'Unit is required';
    }

    // Validate CO2 fields - always validate if provided, but only require if activity is not supported
    if (formData.co2_equivalent !== undefined) {
      if (formData.co2_equivalent < 0) {
        newErrors.co2_equivalent = 'CO2 equivalent cannot be negative';
      }
    } else if (!isActivitySupported()) {
      newErrors.co2_equivalent = 'CO2 equivalent is required';
    }

    if (formData.emission_factor !== undefined) {
      if (formData.emission_factor < 0) {
        newErrors.emission_factor = 'Emission factor cannot be negative';
      }
    } else if (!isActivitySupported()) {
      newErrors.emission_factor = 'Emission factor is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!user?.id) {
      newErrors.user = 'You must be logged in to add emissions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent HTML5 validation
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      setSubmitError('You must be logged in to add emissions');
      return;
    }

    setIsLoading(true);

    try {
      // Build emission data - include CO2 fields if provided (user can override auto-calculated values)
      const emissionData: CreateEmissionRequest = {
        user_id: user.id,
        category: formData.category,
        activity: formData.activity,
        amount: formData.amount,
        unit: formData.unit,
        date: formData.date,
        description: formData.description,
      };

      // Include CO2 fields if provided (either auto-calculated or manually entered)
      // If not provided and activity is supported, backend will calculate automatically
      if (formData.co2_equivalent !== undefined && formData.emission_factor !== undefined) {
        emissionData.co2_equivalent = formData.co2_equivalent;
        emissionData.emission_factor = formData.emission_factor;
      }

      await createEmission(emissionData);
      
      // Success - redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating emission:', err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setSubmitError(err.response.data.error);
      } else {
        setSubmitError('Failed to create emission. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check activity support - only after emission factors have loaded
  const activitySupported = isActivitySupported();
  const currentFactor = getCurrentEmissionFactor();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Add New Emission</h2>
      
      <form onSubmit={handleSubmit} noValidate>
        {/* Category */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="category" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: errors.category ? '2px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <span style={{ color: 'red', fontSize: '14px' }}>{errors.category}</span>
          )}
        </div>

        {/* Activity */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="activity" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Activity *
          </label>
          <select
            id="activity"
            name="activity"
            value={formData.activity}
            onChange={handleChange}
            disabled={!formData.category}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: errors.activity ? '2px solid red' : '1px solid #ccc',
              borderRadius: '4px',
              opacity: formData.category ? 1 : 0.6,
            }}
            required
          >
            <option value="">Select an activity</option>
            {availableActivities.map(act => (
              <option key={act.value} value={act.value}>
                {act.label}
              </option>
            ))}
          </select>
          {errors.activity && (
            <span style={{ color: 'red', fontSize: '14px' }}>{errors.activity}</span>
          )}
        </div>

        {/* Amount and Unit */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 2 }}>
            <label htmlFor="amount" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Amount *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                border: errors.amount ? '2px solid red' : '1px solid #ccc',
                borderRadius: '4px',
              }}
              required
            />
            {errors.amount && (
              <span style={{ color: 'red', fontSize: '14px' }}>{errors.amount}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="unit" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Unit *
            </label>
            <select
              id="unit"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                border: errors.unit ? '2px solid red' : '1px solid #ccc',
                borderRadius: '4px',
              }}
              required
            >
              {availableUnits.map(unit => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
            {errors.unit && (
              <span style={{ color: 'red', fontSize: '14px' }}>{errors.unit}</span>
            )}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="date" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: errors.date ? '2px solid red' : '1px solid #ccc',
              borderRadius: '4px',
            }}
            required
          />
          {errors.date && (
            <span style={{ color: 'red', fontSize: '14px' }}>{errors.date}</span>
          )}
        </div>

        {/* CO2 Equivalent and Emission Factor - Always visible */}
        {/* Show if: activity selected (regardless of API loading state) */}
        {formData.category && formData.activity && (
          <>
            {isLoadingFactors && (
              <div style={{ marginBottom: '15px', padding: '10px', textAlign: 'center', color: '#666', fontStyle: 'italic', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                Loading emission factors...
              </div>
            )}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="co2_equivalent" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', minHeight: '44px', lineHeight: '1.4' }}>
                  CO₂ Equivalent (kg) {activitySupported ? '(Auto-calculated)' : '*'}
                </label>
                <input
                  type="number"
                  id="co2_equivalent"
                  name="co2_equivalent"
                  value={formData.co2_equivalent !== undefined && formData.co2_equivalent !== null ? formData.co2_equivalent : ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  disabled={isLoadingFactors}
                  readOnly={false}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    border: errors.co2_equivalent ? '2px solid red' : '1px solid #fff',
                    borderRadius: '4px',
                    backgroundColor: isLoadingFactors ? '#f5f5f5' : '#4a4a4a',
                    color: '#fff',
                    cursor: isLoadingFactors ? 'not-allowed' : 'text',
                    boxSizing: 'border-box',
                  }}
                  required={!activitySupported}
                />
                {errors.co2_equivalent && (
                  <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '4px' }}>{errors.co2_equivalent}</span>
                )}
                {activitySupported && formData.co2_equivalent !== undefined && !manualCO2Edit && (
                  <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
                    Calculated: {formData.amount} {formData.unit} × {currentFactor?.toFixed(4)} = {formData.co2_equivalent.toFixed(2)} kg CO₂
                  </span>
                )}
                {activitySupported && manualCO2Edit && (
                  <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
                    Manually entered value
                  </span>
                )}
              </div>
              <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <label htmlFor="emission_factor" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', minHeight: '44px', lineHeight: '1.4' }}>
                  Emission Factor (kg CO₂ per {formData.unit}) {activitySupported ? '(Auto-filled)' : '*'}
                </label>
                <input
                  type="number"
                  id="emission_factor"
                  name="emission_factor"
                  value={formData.emission_factor !== undefined && formData.emission_factor !== null ? formData.emission_factor : ''}
                  onChange={handleChange}
                  min="0"
                  step="0.0001"
                  disabled={isLoadingFactors}
                  readOnly={false}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '16px',
                    border: errors.emission_factor ? '2px solid red' : '1px solid #fff',
                    borderRadius: '4px',
                    backgroundColor: isLoadingFactors ? '#f5f5f5' : '#4a4a4a',
                    color: '#fff',
                    cursor: isLoadingFactors ? 'not-allowed' : 'text',
                    boxSizing: 'border-box',
                  }}
                  required={!activitySupported}
                />
                {errors.emission_factor && (
                  <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '4px' }}>{errors.emission_factor}</span>
                )}
                {activitySupported && currentFactor !== null && (
                  <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', display: 'block', marginTop: '4px' }}>
                    Standard emission factor for this activity
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {/* Description */}
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Error message */}
        {submitError && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#fee', 
            color: '#c33', 
            borderRadius: '4px',
            border: '1px solid #fcc'
          }}>
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={isLoading || isLoadingFactors}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: isLoading || isLoadingFactors ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || isLoadingFactors ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Submitting...' : 'Add Emission'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddEmission;
