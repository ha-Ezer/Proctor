import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './components/theme-provider';
import { LoginPage } from './pages/LoginPage';
import { ExamPage } from './pages/ExamPage';
import { CompletePage } from './pages/CompletePage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ExamsPage } from './pages/admin/ExamsPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { SessionsPage } from './pages/admin/SessionsPage';
import { SessionDetailPage } from './pages/admin/SessionDetailPage';
import { ExamReportsPage } from './pages/admin/ExamReportsPage';
import { GroupsPage } from './pages/admin/GroupsPage';
import { SnapshotsPage } from './pages/admin/SnapshotsPage';
import { storage, STORAGE_KEYS } from './lib/storage';
import { useAdminStore } from './stores/adminStore';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = storage.get(STORAGE_KEYS.TOKEN);
  const student = storage.get(STORAGE_KEYS.STUDENT);

  if (!token || !student) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/**
 * Public Route Component
 * Redirects to exam if user is already authenticated
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = storage.get(STORAGE_KEYS.TOKEN);
  const student = storage.get(STORAGE_KEYS.STUDENT);

  if (token && student) {
    return <Navigate to="/exam" replace />;
  }

  return <>{children}</>;
}

/**
 * Admin Protected Route Component
 * Redirects to admin login if not authenticated as admin
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated());

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="proctor-ui-theme">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/exam"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/complete"
            element={
              <ProtectedRoute>
                <CompletePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <DashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <AdminRoute>
                <ExamsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <AdminRoute>
                <StudentsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sessions"
            element={
              <AdminRoute>
                <SessionsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/sessions/:sessionId"
            element={
              <AdminRoute>
                <SessionDetailPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/groups"
            element={
              <AdminRoute>
                <GroupsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <ExamReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/snapshots"
            element={
              <AdminRoute>
                <SnapshotsPage />
              </AdminRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 - Redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
