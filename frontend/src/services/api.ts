import axios from 'axios';
import type { EmissionFilters, CreateEmissionRequest, EmissionStats, User, Emission } from '../types';

// Create an axios instance with a base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;

// Get all users
export const getUsers = () => api.get<User[]>('/users');

// Get all emissions
export const getEmissions = (params?: EmissionFilters) => api.get<Emission[]>('/emissions', { params });

// Create an emission
export const createEmission = (data: CreateEmissionRequest) => api.post<Emission>('/emissions', data);

// Get statistics
export const getEmissionStats = (params?: EmissionFilters) => api.get<EmissionStats>('/emissions/stats', { params });

