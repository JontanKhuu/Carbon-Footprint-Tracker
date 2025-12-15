import axios, { AxiosError } from 'axios';
import type { EmissionFilters, CreateEmissionRequest, EmissionStats, User, Emission, RegisterUserRequest, LoginUser, LoginResponse, RefreshTokenResponse, ActivitiesResponse } from '../types';
import { getAccessToken, getRefreshToken, updateTokens, removeAuthUser } from '../utils/auth';

// Create an axios instance with a base URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: string) => void;
    reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as { _retry?: boolean; headers?: Record<string, string> } & typeof error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                // No refresh token, logout user
                removeAuthUser();
                processQueue(error, null);
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post<RefreshTokenResponse>(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/refresh`,
                    { refresh_token: refreshToken }
                );

                const { access_token, refresh_token } = response.data;
                updateTokens(access_token, refresh_token);

                // Update the original request with new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                processQueue(null, access_token);
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout user
                processQueue(refreshError as AxiosError, null);
                removeAuthUser();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

// Get all users
export const getUsers = () => api.get<User[]>('/users');

// Get all emissions
export const getEmissions = (params?: EmissionFilters) => api.get<Emission[]>('/emissions', { params });

// Get a single emission by ID
export const getEmission = (emissionId: number) => api.get<Emission>(`/emissions/${emissionId}`);

// Create an emission (user_id is now taken from JWT token)
export const createEmission = (data: CreateEmissionRequest) => api.post<Emission>('/emissions', data);

// Get statistics
export const getEmissionStats = (params?: EmissionFilters) => api.get<EmissionStats>('/emissions/stats', { params });

export const registerUser = (data: RegisterUserRequest) => api.post<User>('/users', data);

export const loginUser = (data: LoginUser) => api.post<LoginResponse>('/users/login', data);

// Refresh token
export const refreshToken = (refreshToken: string) => 
  api.post<RefreshTokenResponse>('/users/refresh', { refresh_token: refreshToken });

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

