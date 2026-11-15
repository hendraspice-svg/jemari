export type UserRole = 'operator' | 'pengguna';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  unit: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  expectedRole?: UserRole;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  unit?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  unit?: string;
  active?: boolean;
  password?: string;
}
