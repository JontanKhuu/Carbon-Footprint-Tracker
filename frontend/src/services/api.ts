import axios from 'axios';

// Create an axios instance with a base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;

// Get all users
export const getUsers = () => api.get('/users');

// Get all emissions
export const getEmissions = (params?: any) => api.get('/emissions', { params });

// Create an emission
export const createEmission = (data: any) => api.post('/emissions', data);

// Get statistics
export const getEmissionStats = (params?: any) => api.get('/emissions/stats', { params });

