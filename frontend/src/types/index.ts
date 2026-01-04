// User types
export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

// Emission types
export interface Emission {
  id: number;
  user_id: number;
  category: string;
  activity: string;
  amount: number;
  unit: string;
  co2_equivalent: number;
  emission_factor: number;
  date: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Filter/Query parameter types
// Note: user_id is no longer needed - it comes from JWT token automatically
export interface EmissionFilters {
  category?: string;
  start_date?: string;
  end_date?: string;
}

// Create emission request type
// Note: user_id is no longer required - it comes from the JWT token
export interface CreateEmissionRequest {
  category: string;
  activity: string;
  amount: number;
  unit: string;
  co2_equivalent?: number; // Optional - will be calculated if not provided
  emission_factor?: number; // Optional - will be calculated if not provided
  date: string;
  description?: string;
}

// Activities and emission factors response type
export interface ActivitiesResponse {
  [category: string]: {
    activities: string[];
    emission_factors: {
      [activity: string]: number;
    };
    expected_units: {
      [activity: string]: string;
    };
  };
}

// Statistics response type
export interface EmissionStats {
  total_co2_equivalent: number;
  total_records: number;
  by_category: Array<{
    category: string;
    total_co2_equivalent: number;
    count: number;
  }>;
}

export interface RegisterUserRequest {
  username: string,
  email: string, 
  password: string,
}

export interface LoginUser {
  usernameOrEmail: string,
  password: string,
}

// Authentication token types
export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  csrf_token: string;
  expires_in: number;
  token_type: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  csrf_token: string;
  expires_in: number;
  token_type: string;
}

// Emission history types
export interface EmissionHistoryChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

export interface EmissionHistoryEntry {
  id: number;
  emission_id: number;
  changed_at: string;
  changes: EmissionHistoryChange[];
}