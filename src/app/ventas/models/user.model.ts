export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User;
}
