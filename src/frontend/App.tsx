import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@frontend/store/auth";
import { MarketingLayout } from "@frontend/components/layout/MarketingLayout";
import { AdminLayout } from "@frontend/components/layout/AdminLayout";
import { StudentLayout } from "@frontend/components/layout/StudentLayout";
import { HomePage } from "@frontend/pages/marketing/HomePage";
import { CoursesPage } from "@frontend/pages/marketing/CoursesPage";
import { CourseDetailPage } from "@frontend/pages/marketing/CourseDetailPage";
import { ProgramsPage } from "@frontend/pages/marketing/ProgramsPage";
import { LoginPage } from "@frontend/pages/auth/LoginPage";
import { RegisterPage } from "@frontend/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@frontend/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@frontend/pages/auth/ResetPasswordPage";
import { AdminOverviewPage } from "@frontend/pages/admin/OverviewPage";
import { AdminProgramsPage } from "@frontend/pages/admin/ProgramsPage";
import { AdminModulePage } from "@frontend/pages/admin/ModulePage";
import { StudentDashboardPage } from "@frontend/pages/student/DashboardPage";
import { StudentMyCoursesPage } from "@frontend/pages/student/MyCoursesPage";
import { StudentModulePage } from "@frontend/pages/student/ModulePage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route index element={<HomePage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:slug" element={<CourseDetailPage />} />
            <Route path="programs" element={<ProgramsPage />} />
            <Route path="programs/:slug" element={<CourseDetailPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="programs" element={<AdminProgramsPage />} />
            <Route path="syllabus" element={<AdminModulePage kind="syllabus" />} />
            <Route path="assignments" element={<AdminModulePage kind="assignments" />} />
            <Route path="quizzes" element={<AdminModulePage kind="quizzes" />} />
            <Route path="announcements" element={<AdminModulePage kind="announcements" />} />
            <Route path="email-templates" element={<AdminModulePage kind="email-templates" />} />
            <Route path="forums" element={<AdminModulePage kind="forums" />} />
            <Route path="badges" element={<AdminModulePage kind="badges" />} />
            <Route path="coupons" element={<AdminModulePage kind="coupons" />} />
            <Route path="offers" element={<AdminModulePage kind="offers" />} />
            <Route path="payment-settings" element={<AdminModulePage kind="payment-settings" />} />
            <Route path="plugins/ai" element={<AdminModulePage kind="plugins" />} />
            <Route path="forms" element={<AdminModulePage kind="applications" />} />
            <Route path="applications" element={<AdminModulePage kind="applications" />} />
            <Route path="tickets" element={<AdminModulePage kind="tickets" />} />
            <Route path="roles" element={<AdminModulePage kind="roles" />} />
          </Route>

          <Route path="student" element={<StudentLayout />}>
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="my-courses" element={<StudentMyCoursesPage />} />
            <Route path="programs" element={<StudentModulePage kind="programs" />} />
            <Route path="applications" element={<StudentModulePage kind="applications" />} />
            <Route path="assignments" element={<StudentModulePage kind="assignments" />} />
            <Route path="quizzes" element={<StudentModulePage kind="quizzes" />} />
            <Route path="announcements" element={<StudentModulePage kind="announcements" />} />
            <Route path="forums" element={<StudentModulePage kind="forums" />} />
            <Route path="tickets" element={<StudentModulePage kind="tickets" />} />
            <Route path="certificates" element={<StudentModulePage kind="certificates" />} />
            <Route path="profile" element={<StudentModulePage kind="profile" />} />
            <Route path="settings" element={<StudentModulePage kind="settings" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
