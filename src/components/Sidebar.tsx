import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Wrench,
  Sparkles,
  Tv,
  Search,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Droplets,
  Sun,
  Moon,
  ShieldCheck,
  Smartphone,
  Layers,
  FileText,
  Settings,
  LogIn,
  LogOut,
  UserCheck,
  Radio
} from 'lucide-react';
import { UserRole, AdminView, CustomerView, AuthUser } from '../types.ts';

interface SidebarProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentView: string;
  setCurrentView: (view: any) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (val: boolean) => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (val: boolean) => void;
  waitingCount: number;
  waitingPaymentCount: number;
  authUser: AuthUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  isSupabaseConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  setRole,
  currentView,
  setCurrentView,
  isDarkMode,
  setIsDarkMode,
  sidebarCollapsed,
  setSidebarCollapsed,
  mobileDrawerOpen,
  setMobileDrawerOpen,
  waitingCount,
  waitingPaymentCount,
  authUser,
  onOpenLoginModal,
  onLogout,
  isSupabaseConnected
}) => {
  const isExpanded = !sidebarCollapsed || mobileDrawerOpen;

  const handleNavClick = (viewName: AdminView | CustomerView) => {
    setCurrentView(viewName);
    setMobileDrawerOpen(false);
  };

  const handleSwitchToAdmin = () => {
    if (!authUser?.is_logged_in) {
      onOpenLoginModal();
      return;
    }
    setRole('admin');
    setCurrentView('dashboard');
    setMobileDrawerOpen(false);
  };

  const handleSwitchToCustomer = () => {
    setRole('pelanggan');
    setCurrentView('check');
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileDrawerOpen && (
        <div
          id="mobile-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden no-print"
        />
      )}

      <aside
        id="app-sidebar"
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-[#0F121C] border-r border-slate-200 dark:border-[#23293D] transition-all duration-300 flex flex-col ${
          mobileDrawerOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] h-16 shrink-0">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white font-black shadow-md shrink-0">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            {isExpanded && (
              <div className="truncate">
                <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  Antrean
                </h1>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                  Sistem Cuci Kendaraan
                </span>
              </div>
            )}
          </div>

          <button
            id="btn-toggle-collapse"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-500 dark:text-slate-400 transition cursor-pointer"
            title={sidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            id="btn-close-mobile-drawer"
            onClick={() => setMobileDrawerOpen(false)}
            className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-500 dark:text-slate-400 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Portal Mode Switcher */}
        <div className="p-3 border-b border-slate-200 dark:border-[#23293D] bg-slate-50 dark:bg-[#08090E]/50">
          {isExpanded ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-mono tracking-wider">
                <span>Portal Akses</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  {role === 'admin' ? 'AREA ADMIN' : 'AREA PELANGGAN'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 bg-slate-200 dark:bg-[#161A28] p-1 rounded-xl">
                <button
                  id="btn-role-customer"
                  onClick={handleSwitchToCustomer}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    role === 'pelanggan'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Pelanggan</span>
                </button>
                <button
                  id="btn-role-admin"
                  onClick={handleSwitchToAdmin}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                    role === 'admin'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin/Kasir</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              id="btn-role-toggle-compact"
              onClick={() => {
                if (role === 'pelanggan') {
                  handleSwitchToAdmin();
                } else {
                  handleSwitchToCustomer();
                }
              }}
              className="w-full py-2.5 flex justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 rounded-xl cursor-pointer"
              title={`Beralih ke mode ${role === 'admin' ? 'Pelanggan' : 'Admin Kasir'}`}
            >
              {role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {role === 'admin' ? (
            <>
              <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isExpanded && <span>Menu Manajemen</span>}
              </div>
              <SidebarItem
                id="nav-dashboard"
                icon={<LayoutDashboard className="w-4 h-4 shrink-0" />}
                label="Dashboard Utama"
                active={currentView === 'dashboard'}
                onClick={() => handleNavClick('dashboard')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-queues"
                icon={<Clock className="w-4 h-4 shrink-0" />}
                label="Menu Antrean & Kasir"
                active={currentView === 'queues'}
                onClick={() => handleNavClick('queues')}
                collapsed={!isExpanded}
                badge={waitingPaymentCount > 0 ? waitingPaymentCount : waitingCount}
                badgeColor={waitingPaymentCount > 0 ? 'bg-orange-600 text-white' : 'bg-amber-500 text-slate-950 font-black'}
              />
              <SidebarItem
                id="nav-pit"
                icon={<Wrench className="w-4 h-4 shrink-0" />}
                label="Operator Pit Bay"
                active={currentView === 'pit'}
                onClick={() => handleNavClick('pit')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-pit-manage"
                icon={<Layers className="w-4 h-4 shrink-0" />}
                label="Kelola Pit Bay"
                active={currentView === 'pit_manage'}
                onClick={() => handleNavClick('pit_manage')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-services"
                icon={<Sparkles className="w-4 h-4 shrink-0" />}
                label="Layanan & Harga"
                active={currentView === 'services'}
                onClick={() => handleNavClick('services')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-reports"
                icon={<FileText className="w-4 h-4 shrink-0" />}
                label="Laporan & Rekap"
                active={currentView === 'reports'}
                onClick={() => handleNavClick('reports')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-settings"
                icon={<Settings className="w-4 h-4 shrink-0" />}
                label="Pengaturan & Supabase"
                active={currentView === 'settings'}
                onClick={() => handleNavClick('settings')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-tv"
                icon={<Tv className="w-4 h-4 shrink-0" />}
                label="Layar Display TV"
                active={currentView === 'tv'}
                onClick={() => handleNavClick('tv')}
                collapsed={!isExpanded}
              />
            </>
          ) : (
            <>
              <div className="px-2 pb-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isExpanded && <span>Menu Pelanggan</span>}
              </div>
              <SidebarItem
                id="nav-register"
                icon={<PlusCircle className="w-4 h-4 shrink-0" />}
                label="Ambil Antrean Baru"
                active={currentView === 'register'}
                onClick={() => handleNavClick('register')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-check"
                icon={<Search className="w-4 h-4 shrink-0" />}
                label="Cek Antrean Saya"
                active={currentView === 'check'}
                onClick={() => handleNavClick('check')}
                collapsed={!isExpanded}
              />
              <SidebarItem
                id="nav-tv-customer"
                icon={<Tv className="w-4 h-4 shrink-0" />}
                label="Layar Ruang Tunggu"
                active={currentView === 'tv'}
                onClick={() => handleNavClick('tv')}
                collapsed={!isExpanded}
              />

              {/* Login staff prompt for customer portal */}
              {isExpanded && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#1E2337]">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Petugas / Kasir?</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                      Masuk untuk membuka dashboard kasir, kontrol pit bay, dan laporan.
                    </p>
                    <button
                      type="button"
                      onClick={onOpenLoginModal}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login Admin / Kasir</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Real-time Status Card */}
        {isExpanded && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-[#23293D] bg-slate-50/50 dark:bg-[#0C0E17]">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Radio
                  className={`w-3.5 h-3.5 ${
                    isSupabaseConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
                  }`}
                />
                <span>{isSupabaseConnected ? 'Supabase Real-Time' : 'Database Offline'}</span>
              </div>
              <span
                className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded ${
                  isSupabaseConnected
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-[#1E2337] text-slate-600 dark:text-slate-400'
                }`}
              >
                {isSupabaseConnected ? 'LIVE' : 'LOCAL'}
              </span>
            </div>
          </div>
        )}

        {/* User Account / Login Status Footer */}
        {role === 'admin' && authUser?.is_logged_in && (
          <div className="p-3 border-t border-slate-200 dark:border-[#23293D] bg-slate-50 dark:bg-[#08090E]/60">
            {isExpanded ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      {authUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate text-left">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {authUser.name}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 capitalize">
                        {authUser.role} Antrean
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    title="Keluar / Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex justify-center p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Footer Dark/Light Toggle */}
        <div className="p-3 border-t border-slate-200 dark:border-[#23293D]">
          <button
            id="btn-theme-toggle"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center ${
              isExpanded ? 'justify-between px-3.5 py-2.5' : 'justify-center p-2.5'
            } bg-slate-100 dark:bg-[#161A28] hover:bg-slate-200 dark:hover:bg-[#1E2336] text-slate-800 dark:text-slate-200 rounded-xl transition text-xs font-semibold cursor-pointer`}
          >
            <div className="flex items-center space-x-2.5">
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              {isExpanded && <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>}
            </div>
            {isExpanded && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-bold">
                {isDarkMode ? 'DARK' : 'LIGHT'}
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

interface SidebarItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
  badge?: number;
  badgeColor?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  icon,
  label,
  active,
  onClick,
  collapsed,
  badge,
  badgeColor = 'bg-amber-500 text-slate-950 font-black'
}) => {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`w-full flex items-center ${
        collapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
      } rounded-xl transition font-semibold text-xs cursor-pointer ${
        active
          ? 'bg-emerald-600 text-white font-bold shadow-sm'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161A28] hover:text-slate-950 dark:hover:text-white'
      }`}
      title={collapsed ? label : undefined}
    >
      <div className="flex items-center space-x-3 min-w-0">
        {icon}
        {!collapsed && <span className="truncate">{label}</span>}
      </div>
      {!collapsed && typeof badge === 'number' && badge > 0 && (
        <span className={`px-2 py-0.5 text-[10px] font-mono font-extrabold rounded-full ${badgeColor} shrink-0`}>
          {badge}
        </span>
      )}
    </button>
  );
};
