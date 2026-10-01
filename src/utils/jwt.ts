import { storage } from './storage';

const ROLE_KEYS = ['role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

// Khớp MatrixAuth trong WebAPI/appsettings.json. Gom một chỗ để sidebar,
// route guard và điều hướng sau đăng nhập không bao giờ lệch nhau.
const TEAM_LEAD_ROLES = ['TEAM_LEAD', 'TO_TRUONG'];
const PHT_ROLES = ['PHT', 'HIEU_TRUONG', 'PRINCIPAL'];
// Khớp SchoolDirectoryAuth trong appsettings.json.
const TEACHER_ROLES = ['GIAO_VIEN', 'TEACHER'];
const DIRECTORY_ADMIN_ROLES = ['OperationalAdmin'];

export const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
};

/** Đọc mã vai trò từ access token. Chỉ để hiển thị — backend luôn kiểm tra lại. */
export const getRoles = (): string[] => {
  const token = storage.getToken();
  if (!token) return [];
  const payload = parseJwt(token);
  return ROLE_KEYS.flatMap((key) => payload[key] ?? []);
};

/** Id người dùng trong token (claim `sub`), dùng làm khoá cho dữ liệu cục bộ theo từng tài khoản. */
export const getUserId = (): string | null => {
  const token = storage.getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const id = payload.sub ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    return id === undefined || id === null ? null : String(id);
  } catch {
    return null;
  }
};

/** Tên đăng nhập (claim `name`), chỉ để hiển thị trên thanh trên cùng. */
export const getUsername = (): string => {
  const token = storage.getToken();
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return String(payload.unique_name ?? payload.name ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? '');
  } catch {
    return '';
  }
};

export const isTeamLead = () => getRoles().some((role) => TEAM_LEAD_ROLES.includes(role));
export const isPht = () => getRoles().some((role) => PHT_ROLES.includes(role));
/**
 * Chỉ là giáo viên (mọi vai đều là vai giáo viên), khớp SchoolDirectoryAuth:HomeroomOnlyRoleCodes:
 * backend chỉ cho xem lớp mình chủ nhiệm. Giáo viên kiêm tổ trưởng / PHT vẫn xem cả trường.
 */
export const isTeacher = () => {
  const roles = getRoles();
  return roles.length > 0 && roles.every((role) => TEACHER_ROLES.includes(role));
};
/** Quản trị vận hành: xem và thêm/sửa/xoá lớp, học sinh của mọi trường. */
export const isDirectoryAdmin = () => getRoles().some((role) => DIRECTORY_ADMIN_ROLES.includes(role));

/** Matches the backend OperationalAdmin policy for calendar writes. */
export const canManageAcademicYears = () => {
  const token = storage.getToken();
  if (!token) return false;
  const permissions: unknown = parseJwt(token).permission;
  return getRoles().some((role) => role === 'OperationalAdmin' || role === 'ADMIN') ||
    permissions === 'academic_calendar.manage' ||
    (Array.isArray(permissions) && permissions.includes('academic_calendar.manage'));
};

/** Nhãn vai trò để hiển thị. Hiệu trưởng có cùng quyền với PHT nhưng không phải là PHT. */
export const roleLabel = (): string => {
  const roles = getRoles();
  if (roles.some((role) => ['HIEU_TRUONG', 'PRINCIPAL'].includes(role))) return 'Hiệu trưởng';
  if (roles.includes('PHT')) return 'Phó Hiệu trưởng';
  if (roles.some((role) => TEAM_LEAD_ROLES.includes(role))) return 'Tổ trưởng';
  if (roles.some((role) => TEACHER_ROLES.includes(role))) return 'Giáo viên';
  if (roles.some((role) => DIRECTORY_ADMIN_ROLES.includes(role))) return 'Quản trị viên';
  return '';
};
