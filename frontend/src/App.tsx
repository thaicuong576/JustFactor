import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { type User, UserRole } from './types';
import { LoginFormRedesign } from './features/auth/login-form-redesign';
import { RegisterSMEFormRedesign } from './features/auth/register-sme-form-redesign';
import SMEDashboard from './features/dashboard/sme-dashboard-redesign';
import { FILayoutRedesign, FIDashboardRedesign, FIMarketplaceRedesign, FIPortfolioRedesign, FISettingsRedesign } from './features/trading/fi-redesign';

// Admin Imports
import { AdminLayoutRedesign, AdminDashboardOverviewRedesign, UserApprovalPageRedesign, InvoiceAuditPageRedesign, TransactionMonitorPageRedesign } from './features/admin/admin-redesign-vn';
import { BrandMark } from './components/product-shell';

function AuthFrame({ children, mode }: { children: React.ReactNode; mode: 'login' | 'register' }) {
  return (
    <div className="jf-grid-bg min-h-[100dvh] bg-slate-100 p-4 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden jf-ledger-bg p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="relative">
            <BrandMark tone="dark" />
          </div>
          <div className="relative max-w-xl">
            <div className="mb-5 inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-teal-100">
              Nền tảng bao thanh toán cho doanh nghiệp Việt Nam
            </div>
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight">
              Biến khoản phải thu thành dòng tiền minh bạch.
            </h1>
            <p className="mt-5 max-w-md text-sm font-medium leading-6 text-slate-300">
              JustFactor kết nối SME, tổ chức tài chính và đội vận hành trong một luồng giao dịch đã xác thực.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            {[
              ['SME', 'Tải hóa đơn'],
              ['FI', 'Định giá giao dịch'],
              ['Admin', 'Phê duyệt luồng tiền'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
                <div className="mt-2 text-sm font-black text-white">{value}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-8 lg:min-h-0">
          <div className="w-full max-w-2xl">
            <div className="mb-8 lg:hidden">
              <BrandMark />
            </div>
            <div className="mb-8">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                {mode === 'login' ? 'Truy cập bảo mật' : 'Đăng ký SME'}
              </div>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {mode === 'login' ? 'Chào mừng quay lại JustFactor' : 'Tạo hồ sơ SME đã xác thực'}
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                {mode === 'login'
                  ? 'Đăng nhập để quản lý hóa đơn, đề nghị tài trợ, thanh toán và phê duyệt.'
                  : 'Tải hồ sơ KYC và thông tin doanh nghiệp để đội vận hành xét duyệt.'}
              </p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

const App: React.FC = () => {
  // Basic Auth State Management for Demo
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Admin Navigation State
  const [adminPage, setAdminPage] = useState<string>('dashboard');

  // FI Navigation State
  const [fiPage, setFiPage] = useState<string>('marketplace');

  useEffect(() => {
    if (token && !currentUser) {
      // Restore session logic would go here.
    }
  }, [token, currentUser]);

  const handleLoginSuccess = (accessToken: string, email: string, role: UserRole) => {
    setToken(accessToken);
    const user: User = {
      id: 1,
      email,
      full_name: email.split('@')[0],
      role,
      is_active: true
    };
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setCurrentUser(null);
    setView('LOGIN');
    setAdminPage('dashboard');
  };

  const renderContent = () => {
    if (!token || !currentUser) {
      if (view === 'REGISTER') {
        return (
          <AuthFrame mode="register">
            <RegisterSMEFormRedesign
              onSuccess={() => setView('LOGIN')}
              onCancel={() => setView('LOGIN')}
            />
          </AuthFrame>
        );
      }
      return (
        <AuthFrame mode="login">
          <LoginFormRedesign
            onLoginSuccess={handleLoginSuccess}
            onRegisterClick={() => setView('REGISTER')}
          />
        </AuthFrame>
      );
    }

    if (currentUser.role === UserRole.SME) {
      return <SMEDashboard onLogout={handleLogout} />;
    }

    if (currentUser.role === UserRole.FI) {
      return (
        <FILayoutRedesign
          currentPage={fiPage}
          onNavigate={setFiPage}
          onLogout={handleLogout}
        >
          {fiPage === 'dashboard' && <FIDashboardRedesign />}
          {fiPage === 'marketplace' && <FIMarketplaceRedesign />}
          {fiPage === 'portfolio' && <FIPortfolioRedesign />}
          {fiPage === 'settings' && <FISettingsRedesign />}
        </FILayoutRedesign>
      );
    }

    if (currentUser.role === UserRole.ADMIN) {
      return (
        <AdminLayoutRedesign
          currentPage={adminPage}
          onNavigate={setAdminPage}
          onLogout={handleLogout}
        >
          {adminPage === 'dashboard' && <AdminDashboardOverviewRedesign />}
          {adminPage === 'users' && <UserApprovalPageRedesign />}
          {adminPage === 'invoices' && <InvoiceAuditPageRedesign />}
          {adminPage === 'transactions' && <TransactionMonitorPageRedesign />}
        </AdminLayoutRedesign>
      )
    }

    return (
      <div className="flex min-h-[100dvh] w-screen items-center justify-center">
        Unknown Role: {currentUser.role} <button onClick={handleLogout}>Logout</button>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      {renderContent()}
    </>
  );
};


export default App;
