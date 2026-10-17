import React from 'react';
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route, Navigate, Outlet } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import { AppShell } from '../layouts/AppShell';
import { StudentLayout } from '../layouts/StudentLayout';

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
import { TaskListPage } from '../features/tasks/pages/TaskListPage';
import { TaskTypePage } from '../features/tasks/pages/TaskTypePage';
import { MatrixTaskFormPage } from '../features/tasks/pages/MatrixTaskFormPage';
import { ExamTaskFormPage } from '../features/tasks/pages/ExamTaskFormPage';
import { QuestionTaskFormPage } from '../features/tasks/pages/QuestionTaskFormPage';
import { QuestionPackagePage } from '../features/questions/pages/QuestionPackagePage';
import { QuestionBankPage } from '../features/questions/pages/QuestionBankPage';
import { PaperQuestionsPage } from '../features/questions/pages/PaperQuestionsPage';
import { ExamPackageListPage } from '../features/examPackages/pages/ExamPackageListPage';
import { ExamPackageCreatePage } from '../features/examPackages/pages/ExamPackageCreatePage';
import { ExamPackageDetailPage } from '../features/examPackages/pages/ExamPackageDetailPage';
import { ExamPackagePreviewPage } from '../features/examPackages/pages/ExamPackagePreviewPage';
import { TaskDetailPage } from '../features/tasks/pages/TaskDetailPage';
import { TaskEditPage } from '../features/tasks/pages/TaskEditPage';
import { CurriculumPage } from '../features/curriculum/pages/CurriculumPage';
import { AcademicYearListPage } from '../features/academicYears/pages/AcademicYearListPage';
import { AcademicYearCreatePage } from '../features/academicYears/pages/AcademicYearCreatePage';
import { AcademicYearConfigPage } from '../features/academicYears/pages/AcademicYearConfigPage';
import { RoleListPage } from '../features/identity/pages/RoleListPage';
import { ModuleListPage } from '../features/identity/pages/ModuleListPage';
import { EmailManagementPage } from '../features/emails/pages/EmailManagementPage';
import { NotificationProvider } from '../features/notifications/NotificationProvider';
import { NotificationInboxPage } from '../features/notifications/NotificationInboxPage';
import { UserListPage } from '../features/identity/pages/UserListPage';
import { UserFormPage } from '../features/identity/pages/UserFormPage';
import { ExamListPage } from '../features/exams/pages/ExamListPage';
import { ExamFormPage } from '../features/exams/pages/ExamFormPage';
import { ExamRoomListPage } from '../features/exams/pages/ExamRoomListPage';
import { storage } from '../utils/storage';
import { getRoles, isDirectoryAdmin, isStudent } from '../utils/jwt';

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
const VICE_PRINCIPAL = ['PHT'];
const TEAM_LEAD = ['TEAM_LEAD', 'TO_TRUONG'];
const BOTH = [...PHT, ...TEAM_LEAD];
const TEACHER = ['GIAO_VIEN', 'TEACHER'];
const ADMIN = ['OperationalAdmin', 'ADMIN'];

/**
 * Lớp học / học sinh dùng chung một bộ màn cho nhà trường (chỉ xem) và admin (thêm/sửa/xoá):
 * admin ở trong khung AdminLayout, học sinh ở khung StudentLayout, nhà trường ở khung AppShell.
 */
const DirectoryShell: React.FC = () => {
  if (!storage.getToken()) return <Navigate to="/login" replace />;
  if (isDirectoryAdmin()) return <AdminLayout />;
  if (isStudent()) return <StudentLayout />;
  return <AppShell />;
};
import { SchoolListPage } from '../features/schools/pages/SchoolListPage';
import { BranchListPage } from '../features/schools/pages/BranchListPage';
import { OverviewPage } from '../features/schools/pages/OverviewPage';
import { TeacherListPage as AdminTeacherListPage } from '../features/schools/pages/TeacherListPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';
import { ChangePasswordPage } from '../features/profile/pages/ChangePasswordPage';
import { StudentDashboardPage } from '../features/student/pages/StudentDashboardPage';

const STUDENT = ['STUDENT', 'HOC_SINH'];

const router = createBrowserRouter(createRoutesFromElements(
      <Route element={<NotificationProvider><Outlet /></NotificationProvider>}>
        <Route>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Khung chung, sidebar theo vai trò */}
        <Route element={<AppShell />}>
          <Route element={<RequireRole allow={PHT} fallback="/matrix-tasks" />}>
            <Route path="/matrices" element={<MatrixListPage />} />
            <Route path="/matrices/new" element={<MatrixEditorPage />} />
            <Route path="/exams" element={<ExamListPage />} />
            <Route path="/exams/create" element={<ExamFormPage mode="create" />} />
            <Route path="/exams/detail/:id" element={<ExamFormPage mode="view" />} />
            <Route path="/exams/update/:id" element={<ExamFormPage mode="edit" />} />
          </Route>
          <Route element={<RequireRole allow={VICE_PRINCIPAL} fallback="/matrix-tasks" />}>
            {/* PHT sinh đề trước, rồi giao giáo viên/tổ trưởng review từ chi tiết đề. */}
            <Route path="/matrix-tasks/new" element={<TaskTypePage />} />
            <Route path="/matrix-tasks/new/matrix" element={<MatrixTaskFormPage />} />
            <Route path="/matrix-tasks/new/exam" element={<ExamTaskFormPage />} />
            <Route path="/exam-packages/new" element={<ExamPackageCreatePage />} />
          </Route>
          <Route element={<RequireRole allow={VICE_PRINCIPAL} fallback="/exams" />}>
            <Route path="/exam-rooms" element={<ExamRoomListPage />} />
          </Route>

          {/* Mở cho cả hai vai: Tổ trưởng phải xem lại được ma trận mình vừa nộp. */}
          <Route element={<RequireRole allow={BOTH} fallback="/matrix-tasks" />}>
            <Route path="/matrices/:id" element={<MatrixDetailPage />} />
            <Route path="/matrices/:id/edit" element={<MatrixEditorPage />} />
          </Route>
          {/* Chỉ Tổ trưởng được giao mới lập ma trận cho nhiệm vụ; PHT giao việc không lập thay. */}
          <Route element={<RequireRole allow={TEAM_LEAD} fallback="/matrix-tasks" />}>
            <Route path="/matrix-tasks/:taskId/matrix/new" element={<MatrixEditorPage />} />
            <Route path="/matrix-tasks/new/question" element={<QuestionTaskFormPage />} />
          </Route>

          {/* Nhiệm vụ: PHT, Tổ trưởng, Giáo viên; mỗi người chỉ thấy việc mình giao, làm hoặc kiểm duyệt. */}
          <Route element={<RequireRole allow={[...BOTH, ...TEACHER]} />}>
            <Route path="/exam-packages" element={<ExamPackageListPage />} />
            <Route path="/exam-packages/:id" element={<ExamPackageDetailPage />} />
            <Route path="/exam-packages/:id/preview" element={<ExamPackagePreviewPage />} />
            <Route path="/matrix-tasks" element={<TaskListPage />} />
            <Route path="/matrix-tasks/:id" element={<TaskDetailPage />} />
            <Route path="/matrix-tasks/:id/questions" element={<QuestionPackagePage />} />
            <Route path="/question-bank" element={<QuestionBankPage />} />
            <Route path="/matrix-tasks/:id/papers/:paperId/questions" element={<PaperQuestionsPage />} />
            <Route path="/matrix-tasks/:id/edit" element={<TaskEditPage />} />
          </Route>

          {/* PHT quản lý, Tổ trưởng và Giáo viên chỉ xem; backend trả canManage và tự chặn quyền. */}
          <Route element={<RequireRole allow={[...VICE_PRINCIPAL, ...TEAM_LEAD, ...TEACHER]} />}>
            <Route path="/curriculum" element={<CurriculumPage />} />
          </Route>
        </Route>

        {/* Khung dành cho học sinh */}
        <Route element={<StudentLayout />}>
          <Route element={<RequireRole allow={STUDENT} />}>
            <Route path="/student-dashboard" element={<StudentDashboardPage />} />
            <Route path="/student-exams" element={<StudentDashboardPage />} />
            <Route path="/student-results" element={<StudentDashboardPage />} />
            <Route path="/student-practice" element={<StudentDashboardPage />} />
          </Route>
        </Route>


        <Route element={<DirectoryShell />}>
          <Route path="/notifications" element={<NotificationInboxPage />} />
          <Route element={<RequireRole allow={ADMIN} />}>
            <Route path="/emails" element={<EmailManagementPage />} />
          </Route>
          <Route element={<RequireRole allow={[...PHT, ...TEACHER, ...ADMIN]} />}>
            <Route path="/classes" element={<ClassListPage />} />
            <Route path="/classes/:id" element={<ClassDetailPage />} />
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
          </Route>
          {/* Nhà trường mở nhầm form thêm/sửa: về danh sách lớp của mình, không sang trang quản trị trường. */}
          <Route element={<RequireRole allow={ADMIN} fallback="/classes" />}>
            <Route path="/teachers" element={<AdminTeacherListPage />} />
            <Route path="/classes/new" element={<ClassFormPage />} />
            <Route path="/classes/:id/edit" element={<ClassFormPage />} />
            <Route path="/students/new" element={<StudentFormPage />} />
            <Route path="/students/:id/edit" element={<StudentFormPage />} />
          </Route>
          
          <Route element={<RequireRole allow={[...PHT, ...TEAM_LEAD, ...TEACHER, ...ADMIN, ...STUDENT]} />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        {/* Protected App routes with AdminLayout */}
        <Route element={<AdminLayout />}>
          <Route element={<RequireRole allow={['ADMIN', 'Admin', 'OperationalAdmin']} />}>
            <Route path="/roles" element={<RoleListPage />} />
            <Route path="/modules" element={<ModuleListPage />} />
            <Route path="/users" element={<UserListPage />} />
            <Route path="/users/create" element={<UserFormPage mode="create" />} />
            <Route path="/users/create-admin" element={<UserFormPage mode="create" admin />} />
            <Route path="/users/:id/edit" element={<UserFormPage mode="edit" />} />
          </Route>
          {/* Sau khi login, admin được điều hướng đến trang danh sách trường */}
          <Route path="/" element={<Navigate to="/schools" replace />} />
          <Route path="/schools" element={<SchoolListPage />} />
          <Route path="/schools/:schoolId/branches" element={<BranchListPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/permissions" element={<Navigate to="/roles" replace />} />
          <Route path="/navbars" element={<Navigate to="/modules" replace />} />
          <Route path="/academic-years" element={<AcademicYearListPage />} />
          <Route path="/academic-years/new" element={<AcademicYearCreatePage />} />
          <Route path="/academic-years/:id" element={<AcademicYearConfigPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/schools" replace />} />
      </Route>
));

export const AppRoutes: React.FC = () => <RouterProvider router={router} />;
