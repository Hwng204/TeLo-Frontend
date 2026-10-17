/**
 * Regression checks for context resolution. Runs only in Vite development mode.
 *
 * ponytail: use console.assert because this project has no test runner.
 */
import type { AcademicContextOption } from '../types';
import { applyContextChange, resolveContextId, type ContextSelection } from './academicContext';

const context = (id: number, schoolBranchId: number): AcademicContextOption => ({
  id,
  label: `Toán - Lớp 5 - 2026-2027 - Trường / Chi nhánh ${schoolBranchId}`,
  schoolBranchId,
  subjectId: 2,
  gradeLevelId: 1,
  subjectName: 'Toán',
  gradeLevelName: 'Lớp 5',
});

export const academicContextSelfCheck = () => {
  const only = [context(10, 1)];
  console.assert(
    resolveContextId(only, {}) === null,
    'academicContext self-check 1: không được tự chọn context khi người dùng chưa chọn gì',
  );

  const complete: ContextSelection = {
    subjectId: 2,
    gradeLevelId: 1,
  };
  console.assert(
    resolveContextId(only, complete) === 10,
    'academicContext self-check 2: đủ ba chiều phải resolve được context duy nhất',
  );

  const duplicated = [context(10, 1), context(20, 2)];
  console.assert(
    resolveContextId(duplicated, { ...complete, schoolBranchId: 2 }) === 20,
    'academicContext self-check 3: chọn chi nhánh phải phân biệt được context trùng ba chiều',
  );

  const picked = applyContextChange(only, {}, 'subjectId', 2);
  console.assert(
    picked.gradeLevelId === 1,
    'academicContext self-check 4: Khối lớp duy nhất tự điền',
  );

  console.assert(
    resolveContextId(only, { subjectId: 2, gradeLevelId: 1 }) === 10,
    'academicContext self-check 5: ma trận không có năm học, Môn học + Khối lớp phải đủ ra context',
  );

  console.info('[academicContext] self-check xong');
};
