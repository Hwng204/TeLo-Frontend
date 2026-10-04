export type IdentityStatus = 'ACTIVE' | 'INACTIVE';
export interface IdentityQuery {
  search?: string;
  status?: string;
  schoolId?: number;
  schoolBranchId?: number;
  roleId?: number;
  eligibleForRoleId?: number;
  page?: number;
  pageSize?: number;
}
export interface SaveIdentityRequest {
  code: string;
  name: string;
  description: string | null;
}
export interface SaveRoleRequest extends SaveIdentityRequest {
  schoolId: number | null;
  schoolBranchId: number | null;
}
export interface IdentityItem extends SaveIdentityRequest {
  id: number;
  status: IdentityStatus;
  version: number;
  canDelete: boolean;
}
export interface RoleItem extends IdentityItem {
  schoolId: number | null;
  schoolName: string | null;
  schoolBranchId: number | null;
  schoolBranchName: string | null;
  isSystem: boolean;
  userCount: number;
}
export interface ModuleItem extends IdentityItem { navbarCount: number; }
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';
export interface IdentityUser {
  id: number;
  username: string;
  fullName: string;
  email: string;
  status: UserStatus;
  schoolId: number | null;
  schoolName: string | null;
  schoolBranchId: number | null;
  schoolBranchName: string | null;
  version: number;
}
export interface UserDetail extends IdentityUser {
  moetIdentifier: string | null;
  createdAt: string;
  isTeacher: boolean;
  isStudent: boolean;
  roles: RoleItem[];
}
export interface CreateUserRequest {
  username: string;
  email: string;
  fullName: string;
  password: string;
  moetIdentifier: string | null;
  schoolBranchId: number | null;
  status: UserStatus;
  roleIds: number[];
}
export interface UpdateUserRequest {
  username: string;
  email: string;
  fullName: string;
  moetIdentifier: string | null;
  schoolBranchId: number | null;
  version: number;
}
export interface UserRoles {
  user: IdentityUser;
  roles: RoleItem[];
}
export interface IdentityScope {
  id: number;
  code: string;
  name: string;
  status: string;
}
