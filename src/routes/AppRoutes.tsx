import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { MatrixLayout } from '../layouts/MatrixLayout';

import { LoginPage } from '../features/auth/pages/LoginPage';
import { StudentsPage } from '../features/students/pages/StudentsPage';
import { MatrixListPage } from '../features/matrix/pages/MatrixListPage';
import { MatrixDetailPage } from '../features/matrix/pages/MatrixDetailPage';
import { MatrixEditorPage } from '../features/matrix/pages/MatrixEditorPage';
import { TaskListPage } from '../features/matrix/pages/TaskListPage';
import { TaskAssignPage } from '../features/matrix/pages/TaskAssignPage';
import { TaskDetailPage } from '../features/matrix/pages/TaskDetailPage';
import { AcademicYearListPage } from '../features/academicYears/pages/AcademicYearListPage';
import { AcademicYearCreatePage } from '../features/academicYears/pages/AcademicYearCreatePage';
import { AcademicYearConfigPage } from '../features/academicYears/pages/AcademicYearConfigPage';
import { storage } from '../utils/storage';
import { getRoles } from '../utils/jwt';

/**
 * Chặn theo vai trò chỉ để giấu màn không dùng được. Backend mới là nơi quyết định:
 * nó lọc theo chi nhánh và trả allowedActions cho từng ma trận.
 */
const RequireRole: React.FC<{ allow: string[] }> = ({ allow }) => {
  if (!storage.getToken()) return <Navigate to="/login" replace />;
  if (getRoles().some((role) => allow.includes(role))) return <Outlet />;
  // Về /schools chứ không về /matrices: /matrices cũng dùng guard này nên sẽ vòng lặp vô hạn.
  return <Navigate to="/schools" replace />;
};

const PHT = ['PHT', 'HIEU_TRUONG', 'PRINCIPAL'];
const TEAM_LEAD = ['TEAM_LEAD', 'TO_TRUONG'];
const BOTH = [...PHT, ...TEAM_LEAD];
import { SchoolListPage } from '../features/schools/pages/SchoolListPage';
import { BranchListPage } from '../features/schools/pages/BranchListPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Màn ma trận dùng sidebar theo vai trò */}
        <Route element={<MatrixLayout />}>
          <Route element={<RequireRole allow={PHT} />}>
            <Route path="/matrices" element={<MatrixListPage />} />
            <Route path="/matrices/new" element={<MatrixEditorPage />} />
            <Route path="/matrix-tasks/new" element={<TaskAssignPage />} />
          </Route>

          {/* Mở cho cả hai vai: Tổ trưởng phải xem lại được ma trận mình vừa nộp. */}
          <Route element={<RequireRole allow={BOTH} />}>
            <Route path="/matrices/:id" element={<MatrixDetailPage />} />
            <Route path="/matrices/:id/edit" element={<MatrixEditorPage />} />
            <Route path="/matrix-tasks" element={<TaskListPage />} />
            <Route path="/matrix-tasks/:id" element={<TaskDetailPage />} />
            <Route path="/matrix-tasks/:taskId/matrix/new" element={<MatrixEditorPage />} />
          </Route>
        </Route>


        {/* Protected App routes with AdminLayout */}
        <Route element={<AdminLayout />}>
          {/* Sau khi login, admin được điều hướng đến trang danh sách trường */}
          <Route path="/" element={<Navigate to="/schools" replace />} />
          <Route path="/schools" element={<SchoolListPage />} />
          <Route path="/schools/:schoolId/branches" element={<BranchListPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/academic-years" element={<AcademicYearListPage />} />
          <Route path="/academic-years/new" element={<AcademicYearCreatePage />} />
          <Route path="/academic-years/:id" element={<AcademicYearConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/schools" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
