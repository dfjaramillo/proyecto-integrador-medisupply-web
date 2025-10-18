export interface AuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;  
  email?: string;
  name?: string;
  role?: string;
}

export interface LoginRequest {
  user: string;
  password: string;
}

export interface StoredUser {
  email?: string | null;
  name?: string | null;
  role?: string | null;
}
