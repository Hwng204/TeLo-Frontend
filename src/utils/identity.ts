import type { CreateUserRequest, SaveRoleRequest, SaveIdentityRequest, RoleItem, IdentityUser, UpdateUserRequest } from '../types/identity.ts';
import { problemLines, toProblem } from './problem.ts';
export const emptyScope: Pick<RoleItem, 'schoolId' | 'schoolName' | 'schoolBranchId' | 'schoolBranchName'> = {
  schoolId: null,
  schoolName: null,
  schoolBranchId: null,
  schoolBranchName: null
};

export const validateIdentity = (value: SaveIdentityRequest): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,99}$/.test(value.code.trim())) errors.code = 'Mã gồm 2–100 ký tự chữ không dấu, số, gạch ngang hoặc gạch dưới; bắt đầu bằng chữ hoặc số.';
  if (!value.name.trim() || value.name.trim().length > 150) errors.name = 'Tên bắt buộc, tối đa 150 ký tự.';
  if ((value.description?.trim().length ?? 0) > 500) errors.description = 'Mô tả tối đa 500 ký tự.';
  return errors;
};
export const validateRole = (value: SaveRoleRequest) => ({
  ...validateIdentity(value),
  ...(value.schoolBranchId && !value.schoolId ? { scope: 'Hãy chọn trường trước khi chọn phân hiệu.' } : {}),
});
export const roleScopeLabel = (role: Pick<RoleItem, 'schoolName' | 'schoolBranchName'>) => role.schoolBranchName ? `${role.schoolName} / ${role.schoolBranchName}` : role.schoolName || 'Toàn hệ thống';
export const canAssignRole = (role: RoleItem, user: IdentityUser) => role.status === 'ACTIVE'
  && (!role.schoolId || role.schoolId === user.schoolId)
  && (!role.schoolBranchId || role.schoolBranchId === user.schoolBranchId);
export const toggleSelection = (ids: number[], id: number) => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id];
export const identityPageWithinRange = (page: number, pageSize: number, totalCount: number) =>
  Math.min(page, Math.max(1, Math.ceil(totalCount / pageSize)));
export const identityError = (error: unknown): string => problemLines(toProblem(error)).join(' ');
export const identityConflict = (error: unknown) => {
  const problem = toProblem(error);
  return problem.status === 409 && problem.code === 'STALE_VERSION';
};

type UserFields = Pick<CreateUserRequest, 'username' | 'email' | 'fullName' | 'moetIdentifier' | 'schoolBranchId'>;
const containsControlCharacter = (value: string) => [...value].some(character => {
  const code = character.charCodeAt(0);
  return code <= 31 || code === 127;
});

export const validateUserFields = (value: UserFields): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,99}$/.test(value.username.trim())) {
    errors.username = 'Tài khoản dài 3–100 ký tự, chỉ gồm chữ Latin, số, dấu chấm, gạch ngang và gạch dưới.';
  }
  const email = value.email.trim();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email bắt buộc, đúng định dạng và tối đa 254 ký tự.';
  }
  if (!value.fullName.trim() || value.fullName.trim().length > 255 || containsControlCharacter(value.fullName)) {
    errors.fullName = 'Họ và tên bắt buộc, tối đa 255 ký tự.';
  }
  if ((value.moetIdentifier?.trim().length ?? 0) > 100 || containsControlCharacter(value.moetIdentifier ?? '')) {
    errors.moetIdentifier = 'Mã định danh Bộ GD tối đa 100 ký tự.';
  }
  if (value.schoolBranchId === 0) errors.schoolBranchId = 'Phân hiệu không hợp lệ.';
  return errors;
};

export const validatePassword = (password: string): string | undefined => {
  if (password.length < 12 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password)
    || !/\d/.test(password) || !/[^A-Za-z0-9\s]/.test(password)) {
    return 'Mật khẩu phải dài 12–128 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.';
  }
  return undefined;
};

export const validateCreateUser = (value: CreateUserRequest, confirmPassword: string) => {
  const errors = validateUserFields(value);
  const passwordError = validatePassword(value.password);
  if (passwordError) errors.password = passwordError;
  if (value.password !== confirmPassword) errors.confirmPassword = 'Mật khẩu nhập lại không khớp.';
  return errors;
};

export const validateUpdateUser = (value: UpdateUserRequest) => validateUserFields(value);
