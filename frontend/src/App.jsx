import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';

import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import MasterArea from './pages/MasterArea';
import MasterLokasi from './pages/MasterLokasi';
import MasterUser from './pages/MasterUser';
import Laporan from './pages/Laporan';
import FormLaporan from './pages/FormLaporan';
import Monitoring from './pages/Monitoring';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="areas" element={<MasterArea />} />
          <Route path="lokasi" element={<MasterLokasi />} />
          <Route path="users" element={<MasterUser />} />
          <Route path="laporan" element={<Laporan />} />
          <Route path="laporan/baru" element={<FormLaporan />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
