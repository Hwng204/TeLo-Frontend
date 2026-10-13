import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { isDirectoryAdmin } from '../utils/jwt';
import { storage } from '../utils/storage';
import { useAsync } from './useAsync';

/**
 * Màn lớp học / học sinh dùng chung cho hai phía:
 * - Nhà trường (PHT, Hiệu trưởng, Tổ trưởng, giáo viên): chỉ xem; phạm vi do backend tự lấy theo tài khoản.
 * - Admin vận hành: chọn một trường rồi xem + thêm/sửa/xoá. Trường đang chọn nằm trên URL (`?schoolId=`)
 *   để F5, mở tab mới hay quay lại từ màn chi tiết vẫn đúng trường.
 */
export const useDirectoryScope = () => {
  const admin = isDirectoryAdmin();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const schools = useAsync(async () => (admin ? api.directory.schools() : null), [admin]);

  const selected = storage.getSelectedBranch();
  const fromUrl = Number(params.get('schoolId')) || undefined;
  const storedSchoolId = Number(selected.schoolId) || undefined;
  const schoolId = admin ? (fromUrl ?? storedSchoolId ?? schools.data?.items[0]?.id) : undefined;

  const fromUrlBranch = Number(params.get('schoolBranchId')) || undefined;
  const storedBranchId = Number(selected.branchId) || undefined;
  const branchId = admin ? (fromUrlBranch ?? storedBranchId) : undefined;

  const schoolCode = selected.schoolCode || '';
  const branchCode = selected.branchCode || '';
  const schoolName = selected.schoolName || '';
  const branchName = selected.branchName || '';

  const setSchool = (id: number) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('schoolId', String(id));
        return next;
      },
      { replace: true },
    );

  /** Giữ trường đang chọn khi điều hướng sang màn khác của admin. */
  const withSchool = (path: string) => (admin && schoolId ? `${path}${path.includes('?') ? '&' : '?'}schoolId=${schoolId}` : path);

  const withBranch = (path: string) => {
    let result = path;
    if (admin && schoolId) {
      result = `${result}${result.includes('?') ? '&' : '?'}schoolId=${schoolId}`;
    }
    if (admin && branchId) {
      result = `${result}${result.includes('?') ? '&' : '?'}schoolBranchId=${branchId}`;
    }
    return result;
  };

  /** Vào từ trong app thì lùi đúng một bước (giữ bộ lọc/trang của màn trước); mở thẳng link/F5 thì về `fallback`. */
  const canGoBack = location.key !== 'default';
  const back = (fallback: string) => (canGoBack ? navigate(-1) : navigate(withSchool(fallback)));

  return {
    admin,
    canGoBack,
    back,
    schoolId,
    schoolCode,
    schoolName,
    branchId,
    branchCode,
    branchName,
    /** Admin cần biết trường trước khi gọi API; phía trường thì luôn sẵn sàng. */
    ready: !admin || schoolId !== undefined,
    schools: schools.data?.items ?? [],
    schoolsError: schools.error,
    setSchool,
    withSchool,
    withBranch,
  };
};
