import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AppShell } from '../layouts/AppShell';

import { LoginPage } from '../features/auth/pages/LoginPage';
import { ClassListPage } from '../features/classes/pages/ClassListPage';
import { ClassDetailPage } from '../features/classes/pages/ClassDetailPage';
import { ClassFormPage } from '../features/classes/pages/ClassFormPage';
import { StudentListPage } from '../features/students/pages/StudentListPage';
import { StudentDetailPage } from '../features/students/pages/StudentDetailPage';
import { StudentFormPage } from '../features/students/pages/StudentFormPage';
import { MatrixListPage } from '../features/matrix/pages/MatrixListPage';
import { MatrixDetailPage } from '../features/matrix/pages/MatrixDetailPage';
import { MatrixEditorPage } from '../features/matrix/pages/MatrixEditorPage';
import { TaskListPage } from '../features/matrix/pages/TaskListPage';
import { TaskAssignPage } from '../features/matrix/pages/TaskAssignPage';
import { TaskDetailPage } from '../features/matrix/pages/TaskDetailPage';
import { AcademicYearListPage } from '../features/academicYears/pages/AcademicYearListPage';
import { AcademicYearCreatePage } from '../features/academicYears/pages/AcademicYearCreatePage';
import { AcademicYearConfigPage } from '../features/academicYears/pages/AcademicYearConfigPage';
import { RoleListPage } from '../features/identity/pages/RoleListPage';
import { ModuleListPage } from '../features/identity/pages/ModuleListPage';
import { UserListPage } from '../features/identity/pages/UserListPage';
import { storage } from '../utils/storage';
import { getRoles, isDirectoryAdmin } from '../utils/jwt';

/**
 * Chặn theo vai trò chỉ để giấu màn không dùng được. Backend mới là nơi quyết định:
 * nó lọc theo chi nhánh và trả allowedActions cho từng ma trận.
 */
const RequireRole: React.FC<{ allow: string[]; fallback?: string }> = ({ allow, fallback = '/schools' }) => {
  if (!storage.getToken()) return <Navigate to="/login" replace />;
  if (getRoles().some((role) => allow.includes(role))) return <Outlet />;
  // Về /schools chứ không về /matrices: /matrices cũng dùng guard này nên sẽ vòng lặp vô hạn.
  return <Navigate to={fallback} replace />;
};

const PHT = ['PHT', 'HIEU_TRUONG', 'PRINCIPAL'];
const TEAM_LEAD = ['TEAM_LEAD', 'TO_TRUONG'];
const BOTH = [...PHT, ...TEAM_LEAD];
const TEACHER = ['GIAO_VIEN', 'TEACHER'];
const ADMIN = ['OperationalAdmin'];

/**
 * Lớp học / học sinh dùng chung một bộ màn cho nhà trường (chỉ xem) và admin (thêm/sửa/xoá):
 * admin ở trong khung AdminLayout, nhà trường ở khung AppShell.
 */
const DirectoryShell: React.FC = () => {
  if (!storage.getToken()) return <Navigate to="/login" replace />;
  return isDirectoryAdmin() ? <AdminLayout /> : <AppShell />;
};
import { SchoolListPage } from '../features/schools/pages/SchoolListPage';
import { BranchListPage } from '../features/schools/pages/BranchListPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Khung chung, sidebar theo vai trò */}
        <Route element={<AppShell />}>
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


        <Route element={<DirectoryShell />}>
          <Route element={<RequireRole allow={[...PHT, ...TEACHER, ...ADMIN]} />}>
            <Route path="/classes" element={<ClassListPage />} />
            <Route path="/classes/:id" element={<ClassDetailPage />} />
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
          </Route>
          {/* Nhà trường mở nhầm form thêm/sửa: về danh sách lớp của mình, không sang trang quản trị trường. */}
          <Route element={<RequireRole allow={ADMIN} fallback="/classes" />}>
            <Route path="/classes/new" element={<ClassFormPage />} />
            <Route path="/classes/:id/edit" element={<ClassFormPage />} />
            <Route path="/students/new" element={<StudentFormPage />} />
            <Route path="/students/:id/edit" element={<StudentFormPage />} />
          </Route>
        </Route>

        {/* Protected App routes with AdminLayout */}
        <Route element={<AdminLayout />}>
          <Route element={<RequireRole allow={['ADMIN', 'Admin', 'OperationalAdmin']} />}>
            <Route path="/roles" element={<RoleListPage />} />
            <Route path="/modules" element={<ModuleListPage />} />
            <Route path="/users" element={<UserListPage />} />
          </Route>
          {/* Sau khi login, admin được điều hướng đến trang danh sách trường */}
          <Route path="/" element={<Navigate to="/schools" replace />} />
          <Route path="/schools" element={<SchoolListPage />} />
          <Route path="/schools/:schoolId/branches" element={<BranchListPage />} />
          <Route path="/academic-years" element={<AcademicYearListPage />} />
          <Route path="/academic-years/new" element={<AcademicYearCreatePage />} />
          <Route path="/academic-years/:id" element={<AcademicYearConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/schools" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
