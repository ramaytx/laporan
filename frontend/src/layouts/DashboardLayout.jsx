import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  HomeIcon, 
  MapPinIcon, 
  MapIcon, 
  UsersIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  PhotoIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  DocumentCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Beranda', icon: HomeIcon, href: '/dashboard', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
  { name: 'Master Area', icon: MapIcon, href: '/dashboard/areas', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
  { name: 'Master Lokasi', icon: MapPinIcon, href: '/dashboard/lokasi', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
  { name: 'Master User', icon: UsersIcon, href: '/dashboard/users', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
  { name: 'Laporan', icon: DocumentTextIcon, href: '/dashboard/laporan', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
  { name: 'Pemantauan', icon: ChartBarIcon, href: '/dashboard/monitoring', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
  { name: 'Galeri', icon: PhotoIcon, href: '/dashboard/gallery', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
  { name: 'Pengaturan', icon: Cog6ToothIcon, href: '/dashboard/settings', roles: ['Administrator', 'Manager', 'Supervisor', 'Teknisi', 'Viewer'] },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ fullname: 'Admin User', role: 'Administrator' });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotif(true);
    try {
      const res = await api.get('/admin/notifications');
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Gagal memuat notifikasi:', err);
    } finally {
      setLoadingNotif(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', next);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    const current = navigation.find(n => location.pathname === n.href);
    return current?.name || 'Dashboard';
  };

  const getBreadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      name: part.charAt(0).toUpperCase() + part.slice(1),
      isLast: i === parts.length - 1
    }));
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 shadow-sidebar transform transition-all duration-300 ease-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
        ${collapsed ? 'md:w-[72px]' : 'md:w-72'}
        w-72
      `}>
        {/* Sidebar Header / Brand */}
        <div className={`relative h-16 flex items-center bg-gradient-primary overflow-hidden ${collapsed ? 'justify-center px-2' : 'justify-center px-4'}`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/20 rounded-full"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
          </div>
          <div className="relative z-10 min-w-0">
            {collapsed ? (
              <span className="text-white font-bold text-lg">NKP</span>
            ) : (
              <span className="text-white font-bold text-sm tracking-widest uppercase">PT. New Karya Properti</span>
            )}
          </div>
        </div>

        {/* Collapse toggle button */}
        <button 
          className="absolute -right-3 top-16 z-20 hidden md:flex w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-md items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors" 
          onClick={toggleCollapsed}
        >
          <ChevronLeftIcon className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${collapsed ? 'px-2.5' : 'px-3'}`}>
          {navigation
            .filter(item => item.roles.includes(user.role))
            .map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`
                    sidebar-link
                    ${collapsed ? 'justify-center px-2 py-2.5' : ''}
                    ${isActive 
                      ? 'sidebar-link-active' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
                  `}
                >
                  <div className={`p-1.5 rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary/15' : 'bg-gray-100/60 dark:bg-gray-800 group-hover:bg-primary/10'}`}>
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`} strokeWidth={2} />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft"></div>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Sidebar Footer */}
        <div className={`border-t border-gray-100 ${collapsed ? 'p-2.5' : 'p-3'}`}>
          <button 
            onClick={handleLogout}
            title={collapsed ? 'Keluar' : undefined}
            className={`sidebar-link w-full text-gray-500 hover:bg-danger/10 hover:text-danger group ${collapsed ? 'justify-center px-2 py-2.5' : ''}`}
          >
            <div className="p-1.5 rounded-lg bg-gray-100/60 group-hover:bg-danger/15 transition-colors">
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </div>
            {!collapsed && <span className="font-medium">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-header z-30 sticky top-0">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">{getPageTitle()}</h2>
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                {getBreadcrumbs().map((bc, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ChevronRightIcon className="w-3 h-3" />}
                    <span className={bc.isLast ? 'text-primary font-medium' : ''}>{bc.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                className="relative p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all focus:outline-none"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-danger text-white text-[10px] font-bold px-1 ring-2 ring-white">{unreadCount}</span>
                )}
              </button>
              
              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-dropdown py-2 z-20 border border-gray-100 dark:border-gray-800 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white">Notifikasi</h3>
                      {unreadCount > 0 && <span className="badge bg-primary/10 text-primary">{unreadCount} Baru</span>}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {loadingNotif && (
                        <div className="px-5 py-8 text-center">
                          <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Memuat notifikasi...</p>
                        </div>
                      )}
                      {!loadingNotif && notifications.length === 0 && (
                        <div className="px-5 py-8 text-center">
                          <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Belum ada notifikasi</p>
                        </div>
                      )}
                      {!loadingNotif && notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-l-4 transition-colors ${notif.isRead ? 'border-transparent' : notif.status === 'PENDING' ? 'border-primary bg-primary/5' : notif.status === 'Completed' ? 'border-success bg-success/5' : 'border-warning bg-warning/5'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-800 dark:text-white font-semibold">{notif.title}</p>
                            {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5"></div>}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1.5">{new Date(notif.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>

            {/* Profile Menu */}
            <div className="relative">
              <button 
                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-all focus:outline-none"
              >
                <img
                  className="h-9 w-9 rounded-xl object-cover ring-2 ring-primary/20"
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=2563EB&color=fff&bold=true&font-size=0.4`}
                  alt="Profile"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-bold text-gray-800 leading-tight">{user.fullname}</p>
                  <p className="text-[11px] text-primary font-semibold leading-tight">{user.role}</p>
                </div>
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-dropdown py-2 z-20 border border-gray-100 dark:border-gray-800 animate-scale-in" onClick={(e) => e.stopPropagation()}>
                    <div className="px-5 py-3 border-b border-gray-100 sm:hidden">
                      <p className="text-sm font-bold text-gray-800">{user.fullname}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email || 'user@example.com'}</p>
                    </div>
                    <div className="px-2 py-1.5">
                      <button 
                        onClick={() => { setIsProfileOpen(false); navigate('/dashboard/settings'); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                      >
                        Pengaturan Profil
                      </button>
                      <button 
                        onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-xl transition-colors"
                      >
                        Keluar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main section */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background dark:bg-gray-950 relative">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}