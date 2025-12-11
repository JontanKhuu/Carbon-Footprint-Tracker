import axios from 'axios';
import type { EmissionFilters, CreateEmissionRequest, EmissionStats, User, Emission, RegisterUserRequest, LoginUser, ActivitiesResponse } from '../types';

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

// Get a single emission by ID
export const getEmission = (emissionId: number) => api.get<Emission>(`/emissions/${emissionId}`);

// Create an emission
export const createEmission = (data: CreateEmissionRequest) => api.post<Emission>('/emissions', data);

// Get statistics
export const getEmissionStats = (params?: EmissionFilters) => api.get<EmissionStats>('/emissions/stats', { params });

export const registerUser = (data: RegisterUserRequest) => api.post<User>('/users', data);

export const loginUser = (data: LoginUser) => api.post<User>('/users/login', data);

// Get supported activities and emission factors
export const getActivities = (category?: string) => 
  api.get<ActivitiesResponse>('/emissions/activities', { params: category ? { category } : undefined });

// Update an emission
export const updateEmission = (emissionId: number, data: Partial<CreateEmissionRequest>) => 
  api.put<Emission>(`/emissions/${emissionId}`, data);

// Delete an emission
export const deleteEmission = (emissionId: number) => 
  api.delete(`/emissions/${emissionId}`);

// Get emission history
export const getEmissionHistory = (emissionId: number) => 
  api.get(`/emissions/${emissionId}/history`);

