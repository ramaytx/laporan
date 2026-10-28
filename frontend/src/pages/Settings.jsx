import { useState, useEffect, useRef } from 'react';
import { 
  UserCircleIcon, 
  BellAlertIcon, 
  MoonIcon,
  SunIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  MapIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PhotoIcon,
  FolderIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import api from '../utils/api';

const resetItems = [
  { key: 'areas', label: 'Master Area', icon: MapIcon, desc: 'Hapus semua data area' },
  { key: 'lokasi', label: 'Master Lokasi', icon: MapPinIcon, desc: 'Hapus semua data lokasi' },
  { key: 'users', label: 'Master User', icon: UsersIcon, desc: 'Hapus semua data user' },
  { key: 'laporan', label: 'Laporan', icon: DocumentTextIcon, desc: 'Hapus semua data laporan' },
  { key: 'laporan_ac_parameters', label: 'Pemantauan', icon: ChartBarIcon, desc: 'Hapus semua data pemantauan' },
  { key: 'kategori', label: 'Kategori', icon: FolderIcon, desc: 'Hapus semua data kategori' },
];

export default function Settings() {
  const [user, setUser] = useState({ fullname: 'Admin User', role: 'Administrator', email: 'admin@example.com' });
  const [formData, setFormData] = useState({ fullname: '', email: '' });
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [resettingAll, setResettingAll] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setFormData({ fullname: parsedUser.fullname, email: parsedUser.email });
    }
    
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
    
    const savedNotif = localStorage.getItem('sound_notifications');
    if (savedNotif) setNotifications(JSON.parse(savedNotif));
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, fullname: formData.fullname, email: formData.email };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    Swal.fire({
      icon: 'success',
      title: 'Tersimpan!',
      text: 'Profil Anda berhasil diperbarui.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleNotifications = () => {
    const newNotif = !notifications;
    setNotifications(newNotif);
    localStorage.setItem('sound_notifications', JSON.stringify(newNotif));
    
    if (newNotif) {
      const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const handleResetTable = async (table, label) => {
    const result = await Swal.fire({
      title: `Reset ${label}?`,
      text: `Semua data ${label} akan dihapus permanen. Tindakan ini tidak dapat dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Reset!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    setResetting(table);
    try {
      const res = await api.post(`/admin/reset/${table}`);
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: res.message, timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal mereset data.' });
    } finally {
      setResetting(null);
    }
  };

  const handleResetAll = async () => {
    const result = await Swal.fire({
      title: 'Reset Semua Data?',
      html: '<p class="text-left text-sm text-gray-600">Semua data berikut akan dihapus permanen:</p><ul class="text-left text-sm text-red-600 mt-2 ml-4 list-disc"><li>Master Area</li><li>Master Lokasi</li><li>Master User</li><li>Laporan</li><li>Pemantauan</li><li>Kategori</li></ul><p class="text-left text-sm font-bold text-red-700 mt-3">Akun admin tidak akan terhapus.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Reset Semua!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    setResettingAll(true);
    try {
      const res = await api.post('/admin/reset-all');
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: res.message, timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal mereset semua data.' });
    } finally {
      setResettingAll(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const response = await api.post('/admin/backup', {}, { responseType: 'blob' });
      const blob = new Blob([response], { type: 'application/x-sqlite3' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0,10)}.sqlite`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      Swal.fire({ icon: 'success', title: 'Backup Berhasil!', text: 'File database berhasil diunduh.', timer: 1500, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal membuat backup database.' });
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.sqlite') && !file.name.endsWith('.db')) {
      Swal.fire({ icon: 'error', title: 'Format Salah', text: 'File harus berformat .sqlite atau .db' });
      e.target.value = '';
      return;
    }

    const result = await Swal.fire({
      title: 'Pulihkan Database?',
      html: '<p class="text-left text-sm text-gray-600">Database saat ini akan diganti dengan file backup. Pastikan file backup benar.</p>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Pulihkan!',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) {
      e.target.value = '';
      return;
    }

    setRestoring(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('database', file);
      const res = await api.post('/admin/restore', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil!', text: res.message }).then(() => {
          window.location.reload();
        });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: error.response?.data?.message || 'Gagal memulihkan database.' });
    } finally {
      setRestoring(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Pengaturan Tampilan & Akun</h1>
        <p className="text-sm text-gray-500 mt-1">Sesuaikan preferensi antarmuka, kelola data, dan backup database</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Preferensi Tampilan */}
        <div className="glass rounded-2xl p-6 md:col-span-1 border border-white border-opacity-40 shadow-sm dark:bg-gray-800 dark:bg-opacity-50 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-6">
            <MoonIcon className="w-5 h-5 mr-2 text-primary" /> Preferensi Sistem
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Mode Gelap (Dark Mode)</p>
                <p className="text-xs text-gray-500">Ubah tema menjadi gelap</p>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex ${darkMode ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">
                  {darkMode ? <MoonIcon className="w-3 h-3 text-primary" /> : <SunIcon className="w-3 h-3 text-warning" />}
                </div>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notifikasi Suara</p>
                <p className="text-xs text-gray-500">Ting saat laporan masuk</p>
              </div>
              <button 
                onClick={toggleNotifications}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out flex ${notifications ? 'bg-success justify-end' : 'bg-gray-300 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <BellAlertIcon className={`w-3 h-3 ${notifications ? 'text-success' : 'text-gray-400'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Profil Akun */}
        <div className="glass rounded-2xl p-6 md:col-span-2 border border-white border-opacity-40 shadow-sm dark:bg-gray-800 dark:bg-opacity-50 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-6">
            <UserCircleIcon className="w-5 h-5 mr-2 text-primary" /> Informasi Akun
          </h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={formData.fullname}
                  onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white bg-opacity-60 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Akses</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white bg-opacity-60 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Peran Sistem (Role)</label>
              <div className="flex items-center px-4 py-2.5 bg-primary bg-opacity-10 border border-primary border-opacity-20 rounded-xl">
                <ShieldCheckIcon className="w-5 h-5 text-primary mr-2" />
                <span className="text-primary font-bold">{user.role}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-opacity-90 transition-all"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reset Data Section */}
      {user.role === 'Administrator' && (
        <div className="glass rounded-2xl p-6 border border-white border-opacity-40 shadow-sm dark:bg-gray-800 dark:bg-opacity-50 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-2">
            <TrashIcon className="w-5 h-5 mr-2 text-danger" /> Reset Data
          </h2>
          <p className="text-sm text-gray-500 mb-6">Hapus data master dan transaksi secara permanen. Hanya untuk Administrator.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {resetItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleResetTable(item.key, item.label)}
                disabled={resetting !== null}
                className="flex items-center gap-3 p-4 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-danger/50 hover:bg-danger/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-600 group-hover:bg-danger/10 transition-colors">
                  <item.icon className="w-5 h-5 text-gray-500 group-hover:text-danger transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-400 truncate">{item.desc}</p>
                </div>
                {resetting === item.key && (
                  <ArrowPathIcon className="w-4 h-4 text-danger animate-spin" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 p-4 bg-danger/5 border border-danger/20 rounded-xl">
            <ExclamationTriangleIcon className="w-5 h-5 text-danger flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-danger">Reset Semua Data</p>
              <p className="text-xs text-gray-500">Hapus semua data sekaligus kecuali data admin</p>
            </div>
            <button
              onClick={handleResetAll}
              disabled={resettingAll}
              className="px-4 py-2 bg-danger text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {resettingAll ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <TrashIcon className="w-4 h-4" />}
              Reset Semua
            </button>
          </div>
        </div>
      )}

      {/* Backup & Restore Section */}
      {user.role === 'Administrator' && (
        <div className="glass rounded-2xl p-6 border border-white border-opacity-40 shadow-sm dark:bg-gray-800 dark:bg-opacity-50 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mb-2">
            <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary" /> Backup & Restore Database
          </h2>
          <p className="text-sm text-gray-500 mb-6">Cadangkan atau pulihkan database SQLite.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Backup */}
            <div className="p-5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowDownTrayIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">Backup Database</p>
                  <p className="text-xs text-gray-400">Unduh file .sqlite</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">File backup akan diunduh dalam format .sqlite. Simpan di tempat yang aman.</p>
              <button
                onClick={handleBackup}
                disabled={backingUp}
                className="w-full px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {backingUp ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowDownTrayIcon className="w-4 h-4" />}
                {backingUp ? 'Membuat Backup...' : 'Backup Sekarang'}
              </button>
            </div>

            {/* Restore */}
            <div className="p-5 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <ArrowUpTrayIcon className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">Restore Database</p>
                  <p className="text-xs text-gray-400">Upload file .sqlite atau .db</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-4">Database saat ini akan diganti. Muat ulang halaman setelah restore berhasil.</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestore}
                accept=".sqlite,.db"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={restoring}
                className="w-full px-4 py-2.5 bg-warning text-white text-sm font-bold rounded-xl hover:bg-warning/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {restoring ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ArrowUpTrayIcon className="w-4 h-4" />}
                {restoring ? 'Memulihkan...' : 'Pilih File & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
