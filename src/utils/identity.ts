import type { SaveRoleRequest, SaveIdentityRequest, RoleItem, IdentityUser } from '../types/identity.ts';
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
