import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { MatrixLayout } from '../layouts/MatrixLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { StudentsPage } from '../features/students/pages/StudentsPage';
import { MatrixListPage } from '../features/matrix/pages/MatrixListPage';
import { MatrixDetailPage } from '../features/matrix/pages/MatrixDetailPage';
import { MatrixEditorPage } from '../features/matrix/pages/MatrixEditorPage';
import { TaskListPage } from '../features/matrix/pages/TaskListPage';
import { TaskAssignPage } from '../features/matrix/pages/TaskAssignPage';
import { TaskDetailPage } from '../features/matrix/pages/TaskDetailPage';
import { storage } from '../utils/storage';
import { getRoles } from '../utils/jwt';

/**
 * Chặn theo vai trò chỉ để giấu màn không dùng được. Backend mới là nơi quyết định:
 * nó lọc theo chi nhánh và trả allowedActions cho từng ma trận.
 */
const RequireRole: React.FC<{ allow: string[] }> = ({ allow }) => {
  if (!storage.getToken()) return <Navigate to="/login" replace />;
  if (getRoles().some((role) => allow.includes(role))) return <Outlet />;
  // Về /dashboard chứ không về /matrices: /matrices cũng dùng guard này nên sẽ vòng lặp vô hạn.
  return <Navigate to="/dashboard" replace />;
};

const PHT = ['PHT', 'HIEU_TRUONG', 'PRINCIPAL'];
const TEAM_LEAD = ['TEAM_LEAD', 'TO_TRUONG'];
const BOTH = [...PHT, ...TEAM_LEAD];

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
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

        {/* Protected App routes with MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
