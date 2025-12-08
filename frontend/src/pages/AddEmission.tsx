import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { createEmission } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { CreateEmissionRequest } from '../types';

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

// Helper function to format date in local timezone as YYYY-MM-DD
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    co2_equivalent: 0,
    emission_factor: 0,
    date: formatDateLocal(new Date()), // Today's date in YYYY-MM-DD format (local timezone)
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Get available activities for selected category
  const availableActivities = formData.category ? ACTIVITIES[formData.category] || [] : [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Reset activity when category changes
      if (name === 'category') {
        newData.activity = '';
      }
      
      // Convert numeric fields
      if (name === 'amount' || name === 'co2_equivalent' || name === 'emission_factor') {
        newData[name] = parseFloat(value) || 0;
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

    if (formData.co2_equivalent < 0) {
      newErrors.co2_equivalent = 'CO2 equivalent cannot be negative';
    }

    if (formData.emission_factor < 0) {
      newErrors.emission_factor = 'Emission factor cannot be negative';
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
      const emissionData: CreateEmissionRequest = {
        ...formData,
        user_id: user.id,
      };

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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Add New Emission</h2>
      
      <form onSubmit={handleSubmit}>
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
              {UNITS.map(unit => (
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

        {/* CO2 Equivalent and Emission Factor */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="co2_equivalent" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              CO₂ Equivalent (kg) *
            </label>
            <input
              type="number"
              id="co2_equivalent"
              name="co2_equivalent"
              value={formData.co2_equivalent || ''}
              onChange={handleChange}
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                border: errors.co2_equivalent ? '2px solid red' : '1px solid #ccc',
                borderRadius: '4px',
              }}
              required
            />
            {errors.co2_equivalent && (
              <span style={{ color: 'red', fontSize: '14px' }}>{errors.co2_equivalent}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="emission_factor" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Emission Factor *
            </label>
            <input
              type="number"
              id="emission_factor"
              name="emission_factor"
              value={formData.emission_factor || ''}
              onChange={handleChange}
              min="0"
              step="0.0001"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '16px',
                border: errors.emission_factor ? '2px solid red' : '1px solid #ccc',
                borderRadius: '4px',
              }}
              required
            />
            {errors.emission_factor && (
              <span style={{ color: 'red', fontSize: '14px' }}>{errors.emission_factor}</span>
            )}
          </div>
        </div>

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
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: isLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
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

