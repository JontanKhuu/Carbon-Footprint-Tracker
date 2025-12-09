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
export interface EmissionFilters {
  user_id?: number;
  category?: string;
  start_date?: string;
  end_date?: string;
}

// Create emission request type
export interface CreateEmissionRequest {
  user_id: number;
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