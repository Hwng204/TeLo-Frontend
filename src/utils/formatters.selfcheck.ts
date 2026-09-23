/** Kiểm tra dueState. Chạy trong chế độ dev của Vite (dự án chưa có test runner). */
import { dueState } from './formatters';

export const formattersSelfCheck = () => {
  const today = new Date(2026, 8, 23, 15, 30);
  console.assert(dueState('2026-09-22T00:00:00', 'ASSIGNED', today) === 'overdue', 'dueState 1: hạn hôm qua phải là quá hạn');
  console.assert(dueState('2026-09-23T00:00:00', 'ASSIGNED', today) === null, 'dueState 2: hạn hôm nay (dù đã quá 0h) chưa là quá hạn');
  console.assert(dueState('2026-09-24T00:00:00', 'ASSIGNED', today) === null, 'dueState 3: hạn ngày mai không cảnh báo');
  console.assert(dueState('2026-09-01T00:00:00', 'SUBMITTED', today) === null, 'dueState 4: đã nộp thì không còn quá hạn');
  console.assert(dueState(null, 'ASSIGNED', today) === null, 'dueState 5: không có hạn thì không cảnh báo');
  console.info('[formatters] self-check xong');
};
