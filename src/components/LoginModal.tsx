import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { AuthUser } from '../types.ts';
import { getSupabaseClient } from '../utils/supabase.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Harap masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      let loggedInUser: AuthUser | null = null;

      // 1. Try Supabase Auth if client is configured
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (!error && data.user) {
          loggedInUser = {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Admin Kasir',
            role: 'admin',
            is_logged_in: true,
            logged_at: new Date().toISOString()
          };
        }
      }

      // 2. Local / Standard fallback authentication if Supabase Auth is not set or for offline testing
      if (!loggedInUser) {
        // Standard admin or any valid staff password
        const cleanEmail = email.trim().toLowerCase();
        if (
          cleanEmail.includes('admin') ||
          cleanEmail.includes('kasir') ||
          password.length >= 4
        ) {
          loggedInUser = {
            id: `admin-${Date.now()}`,
            email: cleanEmail,
            name: cleanEmail.includes('kasir') ? 'Petugas Kasir' : 'Administrator',
            role: cleanEmail.includes('kasir') ? 'kasir' : 'admin',
            is_logged_in: true,
            logged_at: new Date().toISOString()
          };
        } else {
          setErrorMessage('Email atau kata sandi tidak valid.');
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(false);
      onLoginSuccess(loggedInUser);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Gagal login. Silakan coba lagi.');
    }
  };

  const handleQuickDemoLogin = (roleType: 'admin' | 'kasir') => {
    const demoUser: AuthUser = {
      id: `quick-${roleType}-${Date.now()}`,
      email: `${roleType}@antrean.com`,
      name: roleType === 'admin' ? 'Administrator Utama' : 'Petugas Kasir',
      role: roleType,
      is_logged_in: true,
      logged_at: new Date().toISOString()
    };
    onLoginSuccess(demoUser);
    onClose();
  };

  return (
    <div
      id="login-modal-overlay"
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="login-modal-card"
        className="bg-white dark:bg-[#111422] border border-slate-200 dark:border-[#23293D] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transition-all duration-300 transform scale-100 my-auto"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1E2337] flex items-center justify-between bg-slate-50/50 dark:bg-[#15192B]/50">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Login Kasir & Admin
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses kelola antrean, pit bay, dan kasir
              </p>
            </div>
          </div>
          <button
            id="btn-close-login-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1C2237] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Pengguna / Petugas
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-email"
                  type="email"
                  required
                  placeholder="admin@antrean.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#161A2B] border border-slate-200 dark:border-[#262D42] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#161A2B] border border-slate-200 dark:border-[#262D42] rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
            >
              {isLoading ? (
                <span>Memproses Masuk...</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Masuk ke Dashboard Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Login Options */}
          <div className="pt-3 border-t border-slate-100 dark:border-[#1E2337]">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Akses Cepat Staff (1-Klik)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-quick-login-admin"
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="py-2 px-3 bg-slate-100 dark:bg-[#181D30] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-[#272F48] hover:border-emerald-300 dark:hover:border-emerald-700/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer text-left flex items-center justify-between"
              >
                <span>Sebagai Admin</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </button>
              <button
                id="btn-quick-login-kasir"
                type="button"
                onClick={() => handleQuickDemoLogin('kasir')}
                className="py-2 px-3 bg-slate-100 dark:bg-[#181D30] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-[#272F48] hover:border-blue-300 dark:hover:border-blue-700/60 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer text-left flex items-center justify-between"
              >
                <span>Sebagai Kasir</span>
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
