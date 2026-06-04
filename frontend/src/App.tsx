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
import { RoleThemeContext, roleThemes } from './lib/role-theme';
import { cn } from './lib/utils';

function AuthFrame({
  children,
  mode,
  role = 'sme'
}: {
  children: React.ReactNode;
  mode: 'login' | 'register';
  role?: 'sme' | 'fi' | 'admin';
}) {
  const theme = roleThemes[role];

  const sidebarContent = {
    sme: {
      badge: "Hạn mức sẵn sàng & Tối ưu dòng tiền",
      headline: "Biến khoản phải thu thành dòng tiền nhanh.",
      description: "Tải hóa đơn đã ký số, đối soát tự động và nhận giải ngân từ các định chế tài chính trong vòng 24 giờ."
    },
    fi: {
      badge: "Quản lý vốn & Tối đa hóa lợi suất",
      headline: "Đầu tư hóa đơn đã xác thực với lợi suất cao.",
      description: "Tiếp cận danh mục hóa đơn SME chất lượng cao đã qua kiểm toán alternative data độc quyền, đấu thầu minh bạch và quản trị rủi ro tối ưu."
    },
    admin: {
      badge: "Kiểm soát rủi ro & Vận hành dòng vốn",
      headline: "Điều hành luồng vốn và an toàn giao dịch.",
      description: "Xét duyệt hồ sơ KYC, kiểm toán trạng thái hóa đơn điện tử và giám sát các giao dịch SePay liên ngân hàng theo thời gian thực."
    }
  }[role];

  return (
    <RoleThemeContext.Provider value={theme}>
      <div className="jf-grid-bg min-h-[100dvh] bg-slate-100 p-4 text-slate-950">
        <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50 lg:grid-cols-[0.95fr_1.05fr]">
          <section className={cn(
            "relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            theme.sidebarBgClass
          )}>
            <div className="relative">
              <BrandMark tone="dark" />
            </div>
            <div className="relative max-w-xl transition-all duration-300">
              <div className={cn("mb-5 inline-flex rounded-xl border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold", theme.badgeTextColorClass)}>
                {sidebarContent.badge}
              </div>
              <h1 className="text-5xl font-black leading-[0.98] tracking-tight">
                {sidebarContent.headline}
              </h1>
              <p className="mt-5 max-w-md text-sm font-medium leading-6 text-slate-300">
                {sidebarContent.description}
              </p>
            </div>
            <div className="relative grid grid-cols-3 gap-3">
              {[
                ['SME', 'Tải hóa đơn', 'sme'],
                ['FI', 'Định giá giao dịch', 'fi'],
                ['Admin', 'Phê duyệt luồng tiền', 'admin'],
              ].map(([label, value, r]) => {
                const isActive = role === r;
                let activeBorderClass = "border-white";
                if (isActive) {
                  if (r === "sme") activeBorderClass = "border-teal-400";
                  else if (r === "fi") activeBorderClass = "border-amber-400";
                  else if (r === "admin") activeBorderClass = "border-slate-400";
                }
                return (
                  <div
                    key={label}
                    className={cn(
                      "rounded-2xl border p-4 transition-all duration-300",
                      isActive
                        ? `${activeBorderClass} bg-white/20 shadow-lg`
                        : "border-white/10 bg-white/5 opacity-40"
                    )}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">{label}</div>
                    <div className="mt-2 text-sm font-black text-white">{value}</div>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="flex min-h-[100dvh] items-center justify-center p-4 sm:p-8 lg:min-h-0">
            <div className="w-full max-w-2xl">
              <div className="mb-8 lg:hidden">
                <BrandMark />
              </div>
              <div className="mb-8">
                <div className={cn("text-xs font-bold uppercase tracking-[0.16em]", theme.eyebrowClass)}>
                  {mode === 'login' ? 'Truy cập bảo mật' : 'Đăng ký SME'}
                </div>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {mode === 'login' ? `Chào mừng quay lại ${theme.roleName}` : 'Tạo hồ sơ SME đã xác thực'}
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {mode === 'login'
                    ? `Đăng nhập vào không gian làm việc của ${theme.roleName} để tiếp tục giao dịch.`
                    : 'Tải hồ sơ KYC và thông tin doanh nghiệp để đội vận hành xét duyệt.'}
                </p>
              </div>
              {children}
            </div>
          </section>
        </div>
      </div>
    </RoleThemeContext.Provider>
  );
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loginRole, setLoginRole] = useState<'sme' | 'fi' | 'admin'>('sme');
  const [adminPage, setAdminPage] = useState<string>('dashboard');
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
          <AuthFrame mode="register" role="sme">
            <RegisterSMEFormRedesign
              onSuccess={() => setView('LOGIN')}
              onCancel={() => setView('LOGIN')}
            />
          </AuthFrame>
        );
      }
      return (
        <AuthFrame mode="login" role={loginRole}>
          <LoginFormRedesign
            selectedRole={loginRole}
            onRoleSelect={setLoginRole}
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
