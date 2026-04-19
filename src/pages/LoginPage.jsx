import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Eye, EyeOff, ArrowRight } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'drtalal@alawidental.com', color: 'bg-teal-500' },
  { role: 'Manager', email: 'manager@gmail.com', color: 'bg-blue-500' },
  { role: 'Secretary', email: 'secretary@gmail.com', color: 'bg-emerald-500' },
  { role: 'Dentist', email: 'dentist@gmail.com', color: 'bg-purple-500' },
  { role: 'Assistant', email: 'assistant@gmail.com', color: 'bg-cyan-500' },
  { role: 'Accountant', email: 'accountant@gmail.com', color: 'bg-amber-500' },
];

export default function LoginPage() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = await login(email, password);
    setLoading(false);
    if (ok) navigate('/dashboard');
  };

  const quickLogin = async (demoEmail) => {
    setLoading(true);
    setError('');
    const demoPassword = demoEmail === 'drtalal@alawidental.com' ? 'drtalal@321' : 'pass123';
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    try {
      const ok = await login(demoEmail, demoPassword);
      if (ok) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Quick login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative">
      <div className="relative z-10 w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] pb-8 pt-10 px-8 border-t-[8px] border-t-[#253f8e]">
          {/* Logo */}
          <div className="mx-auto w-20 h-20 bg-[#f0f4f8] rounded-[18px] flex items-center justify-center p-3 mb-6">
             <img src="/dental-logo-removebg-preview.png" alt="Clinic Logo" className="h-full w-auto object-contain" />
          </div>

          <h2 className="text-[24px] font-bold text-[#0f172a] text-center mb-2">Welcome Back</h2>
          <p className="text-[#64748b] text-[15px] text-center mb-8">Sign in to your staff account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[14px] font-bold text-[#0f172a] mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="name@dentalcenter.com"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-[#eef2f9] border border-transparent text-[#0f172a] placeholder-[#64748b] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#253f8e]/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[14px] font-bold text-[#0f172a] mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-[#eef2f9] border border-transparent text-[#0f172a] placeholder-[#64748b] text-[15px] focus:outline-none focus:ring-2 focus:ring-[#253f8e]/30 transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm animate-slide-down">
                <span>⚠</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#253f8e] text-white font-bold text-[15px] hover:bg-[#1e3477] transition-colors mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts section removed for production */}
      </div>
    </div>
  );
}
