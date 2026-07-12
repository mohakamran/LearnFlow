import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AdminRoute from '@/components/auth/AdminRoute'
import AuthLayout from '@/layouts/AuthLayout'
import AppLayout from '@/layouts/AppLayout'
import AdminLayout from '@/layouts/AdminLayout'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import OAuthCallbackPage from '@/pages/auth/OAuthCallbackPage'

// App Pages
import DashboardPage from '@/pages/app/DashboardPage'
import OnboardingPage from '@/pages/app/OnboardingPage'
import RoadmapPage from '@/pages/app/RoadmapPage'
import LessonPage from '@/pages/app/LessonPage'
import QuizPage from '@/pages/app/QuizPage'
import ProjectsPage from '@/pages/app/ProjectsPage'
import AIMentorPage from '@/pages/app/AIMentorPage'
import ProfilePage from '@/pages/app/ProfilePage'
import ProgressPage from '@/pages/app/ProgressPage'

// Admin Pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminAIUsagePage from '@/pages/admin/AdminAIUsagePage'
import AdminLogsPage from '@/pages/admin/AdminLogsPage'

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public / Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/auth/callback" element={<OAuthCallbackPage />} />
              </Route>

              {/* Protected App routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/roadmap" element={<RoadmapPage />} />
                  <Route path="/lessons/:id" element={<LessonPage />} />
                  <Route path="/quiz/:id" element={<QuizPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/mentor" element={<AIMentorPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                </Route>

                {/* Admin routes */}
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/settings" element={<AdminSettingsPage />} />
                    <Route path="/admin/ai-usage" element={<AdminAIUsagePage />} />
                    <Route path="/admin/logs" element={<AdminLogsPage />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
