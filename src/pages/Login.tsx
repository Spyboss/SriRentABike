import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <Helmet>
        <title>Admin Login - SriRentABike</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-10">
          <Logo width={180} className="mb-8" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="w-3 h-3" /> Secure Access
          </div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tight">Admin Login</h2>
          <p className="mt-2 text-stone-500 font-medium">Sri Rent A Bike Management</p>
        </div>
        
        <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 border border-stone-100 p-8 sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-stone-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-stone-300 text-stone-900 font-medium min-h-[56px]"
                    placeholder="admin@srirentabike.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-orange-500 text-stone-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 rounded-2xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder-stone-300 text-stone-900 font-medium min-h-[56px]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 p-4 border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-stone-200 min-h-[56px] flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <span>Sign in to Dashboard</span>
              )}
            </button>
          </form>
        </div>
        
        <p className="mt-10 text-center text-stone-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} Sri Rent A Bike Tangalle. All rights reserved.
        </p>
      </div>
    </div>
  );
};
