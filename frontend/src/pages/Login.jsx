import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../utils/api';
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.success) {
        const { user, accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify({
          fullname: user.fullname,
          email: user.email,
          role: user.role
        }));
        
        Swal.fire({
          icon: 'success',
          title: 'Login Berhasil',
          text: `Selamat datang kembali, ${user.fullname}!`,
          timer: 1500,
          showConfirmButton: false,
        });
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Koneksi ke backend gagal atau kredensial salah.';
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white font-sans overflow-hidden">
      
      {/* Left Panel - Branding (Desktop) */}
      <div className="hidden lg:flex lg:w-[55%] relative items-end p-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl"></div>
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        </div>
        
        <div className="relative z-10 w-full max-w-xl animate-fade-in-up">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2.5 shadow-lg shadow-black/10">
              <img src="/logo.png" alt="PT. New Karya PROperti" className="h-12 w-auto" />
            </div>
            <span className="text-sm text-slate-400 font-semibold tracking-widest uppercase">Maintenance System</span>
          </div>
          <h1 className="text-4xl md:text-[3.2rem] font-black text-white mb-6 leading-[1.12] tracking-tight">
            Sistem Cerdas<br/>Untuk Manajemen<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Maintenance</span> Anda.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-md">
            Platform terpadu untuk memantau, mencatat, dan menganalisis kinerja aset perusahaan dengan laporan real-time.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { label: 'Real-time', desc: 'Monitoring' },
              { label: 'GPS', desc: 'Tracking' },
              { label: 'PDF', desc: 'Export' },
            ].map((feat, i) => (
              <div key={i} className="bg-white/[0.04] backdrop-blur-sm rounded-xl p-4 border border-white/[0.06]">
                <p className="text-white font-bold text-sm">{feat.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[45%] flex flex-col lg:items-center lg:justify-center relative bg-white overflow-y-auto">

        {/* Mobile: Full hero header */}
        <div className="lg:hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 pt-12 pb-14 flex-shrink-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 -left-10 w-40 h-40 bg-indigo-500/8 rounded-full blur-2xl"></div>
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="relative z-10">
            <div className="mb-6">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2 shadow-lg shadow-black/20 w-fit">
                <img src="/logo.png" alt="PT. New Karya PROperti" className="h-9 w-auto" />
              </div>
            </div>
            <h1 className="text-[1.7rem] font-black text-white leading-[1.15] tracking-tight mb-3">
              Sistem Cerdas<br/>Untuk Manajemen<br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">Maintenance</span> Anda.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Platform terpadu untuk memantau dan menganalisis kinerja aset.
            </p>
          </div>
          
          {/* Curved bottom */}
          <div className="absolute -bottom-1 left-0 right-0">
            <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 48h1440V24C1440 24 1200 0 720 0S0 24 0 24v24z" fill="white"/>
            </svg>
          </div>
        </div>

        {/* Mobile: Form directly below hero */}
        <div className="lg:hidden flex-1 flex flex-col justify-center px-6 pt-6 pb-8 bg-white">
          <h2 className="text-2xl font-black text-gray-900 mb-1.5 tracking-tight">Selamat Datang</h2>
          <p className="text-gray-400 text-sm mb-7">Masukkan kredensial Anda untuk mengakses dashboard.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Alamat Email</label>
              <input 
                type="email" 
                className="input-field"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Kata Sandi</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-0.5">
              <input 
                id="remember-mobile" 
                type="checkbox" 
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
              />
              <label htmlFor="remember-mobile" className="text-sm font-medium text-gray-500 cursor-pointer">Ingat saya selama 30 hari</label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="group relative w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-bold text-white bg-gradient-primary shadow-btn transition-all duration-200 hover:shadow-btn-hover hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0 overflow-hidden mt-2"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span className="relative z-10 flex items-center gap-2">
                  Masuk Sekarang <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </button>
            
            <p className="text-center text-sm text-gray-400 mt-5">
              Belum punya akun? <a href="#" className="font-bold text-primary hover:text-primary-600 transition-colors">Hubungi Admin IT</a>
            </p>
          </form>
        </div>

        {/* Desktop: Form */}
        <div className="hidden lg:block p-12 relative w-full max-w-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>

          <div className="animate-fade-in">
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Selamat Datang</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-10">
              Masukkan kredensial Anda untuk mengakses dashboard.
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Alamat Email</label>
                <input 
                  type="email" 
                  className="input-field"
                  placeholder="email@contoh.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Kata Sandi</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <input 
                  id="remember-desktop" 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                />
                <label htmlFor="remember-desktop" className="text-sm font-medium text-gray-500 cursor-pointer">Ingat saya selama 30 hari</label>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-bold text-white bg-gradient-primary shadow-btn transition-all duration-200 hover:shadow-btn-hover hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0 overflow-hidden"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className="relative z-10 flex items-center gap-2">
                    Masuk Sekarang <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </button>
              
              <p className="text-center text-sm text-gray-400 mt-8">
                Belum punya akun? <a href="#" className="font-bold text-primary hover:text-primary-600 transition-colors">Hubungi Admin IT</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}