import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthService } from './services/authService';
import { RealLoginForm } from './components/RealLoginForm';
import { Layout } from './components/Layout';
import { WelcomeMessage } from './components/WelcomeMessage';
import { ProfileModal } from './components/ProfileModal';

// تحميل الصفحات عند الطلب فقط بدلاً من تحميلها جميعاً عند البداية
const Dashboard        = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const InquiryPage      = lazy(() => import('./components/InquiryPage').then(m => ({ default: m.InquiryPage })));
const OperationsPage   = lazy(() => import('./components/OperationsPage').then(m => ({ default: m.OperationsPage })));
const ViolationsPage   = lazy(() => import('./components/ViolationsPage').then(m => ({ default: m.ViolationsPage })));
const ImportPage       = lazy(() => import('./components/ImportPage'));
const UserManagementPage = lazy(() => import('./components/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const ExportDataPage     = lazy(() => import('./components/ExportDataPage').then(m => ({ default: m.ExportDataPage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-moe-600" />
    </div>
  );
}

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 دقيقة

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const inactivityTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = React.useCallback(async () => {
    await AuthService.logout();
    setIsAuthenticated(false);
    setUserPermissions([]);
  }, []);

  const resetInactivityTimer = React.useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [handleLogout]);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await AuthService.isAuthenticated();
      setIsAuthenticated(isAuth);
      if (isAuth) {
        loadPermissions();
        resetInactivityTimer();
      }
      setLoading(false);
    };
    checkAuth();
  }, [resetInactivityTimer]);

  // مراقبة نشاط المستخدم لإعادة ضبط مؤقت الخمول
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const onActivity = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // دالة مشتركة لتحميل الصلاحيات وتحديث الـ state
  const loadPermissions = () => {
    try {
      const stored = sessionStorage.getItem('userPermissions');
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        setUserPermissions(parsed);
      } else {
        setUserPermissions([]);
      }
    } catch {
      setUserPermissions([]);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    loadPermissions();
    resetInactivityTimer();
    sessionStorage.removeItem('hasShownWelcome');
  };

  // ✅ تُستدعى من أي مكان يغيّر الصلاحيات (UserPermissionsModal مثلاً)
  const handlePermissionsChange = () => {
    loadPermissions();
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inquiry':
        return <InquiryPage />;
      case 'operations':
        return <OperationsPage />;
      case 'violations':
        return <ViolationsPage />;
      case 'import':
        return <ImportPage />;
      case 'users':
        return <UserManagementPage onPermissionsChange={handlePermissionsChange} />;
      case 'export':
        return <ExportDataPage />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moe-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <RealLoginForm onLogin={handleLogin} />;
  }

  return (
    <>
      <Layout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onProfileClick={handleProfileClick}
        userPermissions={userPermissions}
        onPermissionsChange={handlePermissionsChange}
      >
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </Layout>

      <WelcomeMessage />

      {showProfile && (
        <ProfileModal onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

export default App;