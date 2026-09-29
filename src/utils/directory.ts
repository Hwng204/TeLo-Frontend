/**
 * Nhãn tiếng Việt + tông màu nhãn cho các mã trạng thái của danh bạ lớp / học sinh.
 * Tông màu theo quy tắc chung (DESIGN.md, Status Field Rule): xanh lá = đang/đã xong bình thường,
 * vàng = tạm dừng/cần để ý, xám = đã rời/đã cất, xanh dương = đã hoàn tất một chặng.
 */
import type { ClassStatus, DirectoryBranchOption, EnrollmentStatus, StudentDetail, StudentStatus } from '../types';

export type StatusTone = 'green' | 'amber' | 'gray' | 'blue';

export const STUDENT_STATUS: Record<StudentStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: 'Đang học', tone: 'green' },
  TEMPORARY_LEAVE: { label: 'Tạm nghỉ', tone: 'amber' },
  TRANSFERRED: { label: 'Chuyển đi', tone: 'gray' },
  // Xoá logic: hồ sơ còn để giữ lịch sử và điểm, nhưng không còn trong danh sách lớp đang học.
  INACTIVE: { label: 'Đã xoá', tone: 'gray' },
};

export const CLASS_STATUS: Record<ClassStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: 'Đang hoạt động', tone: 'green' },
  INACTIVE: { label: 'Ngừng hoạt động', tone: 'gray' },
};

export const ENROLLMENT_STATUS: Record<EnrollmentStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: 'Đang học', tone: 'green' },
  COMPLETED: { label: 'Hoàn thành', tone: 'blue' },
  TRANSFERRED_OUT: { label: 'Đã chuyển lớp', tone: 'gray' },
};

/** Mã chưa biết (backend thêm trạng thái mới) vẫn hiện nguyên mã với tông trung tính. */
export const statusOf = <T extends string>(map: Record<T, { label: string; tone: StatusTone }>, code: string) =>
  map[code as T] ?? { label: code, tone: 'gray' as StatusTone };

/**
 * Lớp học sinh đang thực sự học. `currentClass` của backend lùi về lớp gần nhất khi không có lượt học
 * của năm đang mở (để giữa hai năm học vẫn thấy lớp), nên phải đối chiếu lượt ghi danh còn ACTIVE:
 * học sinh đã xoá, đã chuyển đi hay chưa xếp lớp năm nay thì không có lớp để chuyển.
 */
export const liveClass = (student: StudentDetail) =>
  student.currentClass &&
  student.academicHistory.some((row) => row.classId === student.currentClass!.classId && row.enrollmentStatus === 'ACTIVE')
    ? student.currentClass
    : null;

/** "2016-03-14" → "14/03/2016". Chuỗi ngày (DateOnly) không qua Date để khỏi lệch múi giờ. */
export const formatDay = (value: string | null | undefined) => {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
};

/** Nhãn ô lọc phân hiệu: tên, "(ngừng hoạt động)" nếu đã ngừng, và số lớp hoặc học sinh của năm học đang xem. */
export const branchLabel = (branch: DirectoryBranchOption, unit: 'class' | 'student') =>
  `${branch.name}${branch.status === 'ACTIVE' ? '' : ' (ngừng hoạt động)'} · ${
    unit === 'class' ? `${branch.classCount} lớp` : `${branch.studentCount} học sinh`
  }`;
