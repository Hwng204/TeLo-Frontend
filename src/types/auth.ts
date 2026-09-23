export interface LoginRequest {
  username: string;
  password: string;
}

/** Body của POST /api/auth/login. */
export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAtUtc: string;
}
