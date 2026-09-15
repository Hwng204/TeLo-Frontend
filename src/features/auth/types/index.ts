export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Teacher' | 'Student';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
