import { useState, useEffect } from 'react';
import { 
  ArrowTrendingUpIcon, 
  MapPinIcon, 
  DocumentCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Chart from 'react-apexcharts';
import api from '../utils/api';

export default function Dashboard() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/laporan');
        const formatted = data.map(item => ({
          ...item,
          id: item.laporan_no,
          db_id: item.id,
          area: item.areas?.nama_area || '-',
          lokasi: item.lokasi?.nama_lokasi || '-',
          kategori: item.kategori?.nama || '-',
          petugas: item.petugas?.fullname || '-',
        }));
        setLaporan(formatted);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const totalLaporan = laporan.length;
  const totalArea = new Set(laporan.map(l => l.area).filter(a => a && a !== '-')).size;
  const pendingCount = laporan.filter(l => l.status?.toLowerCase() === 'pending').length;
  const selesaiCount = laporan.filter(l => (l.status || '').toLowerCase() === 'completed' || (l.status || '').toLowerCase() === 'approved').length;

  // Laporan hari ini
  const laporanHariIni = laporan.filter(l => {
    if (!l.tanggal) return false;
    let t = l.tanggal;
    if (t.includes('/')) { const [d, m, y] = t.split('/'); t = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`; }
    return t === today;
  });

  const stats = [
    { title: 'Total Laporan', value: totalLaporan, icon: DocumentCheckIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'Area Aktif', value: totalArea, icon: MapPinIcon, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Menunggu Review', value: pendingCount, icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { title: 'Selesai', value: selesaiCount, icon: ArrowTrendingUpIcon, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  // Kategori distribution - total dan per area
  const allPrev = laporan.filter(l => l.kategori?.toLowerCase().includes('preventive')).length;
  const allCorr = laporan.filter(l => l.kategori?.toLowerCase().includes('corrective')).length;
  const allEmer = laporan.filter(l => l.kategori?.toLowerCase().includes('emergency')).length;
  const allInsp = laporan.filter(l => l.kategori?.toLowerCase().includes('inspection')).length;

  const uniqueAreas = [...new Set(laporan.map(l => l.area).filter(a => a && a !== '-'))];
  const areaKategoriData = [{ area: 'Semua Area', prev: allPrev, corr: allCorr, emer: allEmer, insp: allInsp, total: totalLaporan }]
    .concat(uniqueAreas.map(area => {
      const areaLaporan = laporan.filter(l => l.area === area);
      return {
        area,
        prev: areaLaporan.filter(l => l.kategori?.toLowerCase().includes('preventive')).length,
        corr: areaLaporan.filter(l => l.kategori?.toLowerCase().includes('corrective')).length,
        emer: areaLaporan.filter(l => l.kategori?.toLowerCase().includes('emergency')).length,
        insp: areaLaporan.filter(l => l.kategori?.toLowerCase().includes('inspection')).length,
        total: areaLaporan.length,
      };
    }));

  const makePieOptions = (name, prev, corr, emer, insp, total) => ({
    chart: { type: 'donut', fontFamily: 'Inter, system-ui, sans-serif', background: 'transparent' },
    labels: ['Preventive', 'Corrective', 'Emergency', 'Inspection'].filter((_, i) => [prev, corr, emer, insp][i] > 0),
    colors: ['#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'].filter((_, i) => [prev, corr, emer, insp][i] > 0),
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: { show: false },
            value: { show: true, fontSize: '24px', fontWeight: 'bold', color: '#1F2937', offsetY: 8 },
            total: { show: true, label: '', fontSize: '0px', formatter: () => total }
          }
        }
      }
    },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '11px', fontWeight: 500, itemMargin: { horizontal: 8, vertical: 4 }, markers: { width: 8, height: 8, radius: 2 } },
    stroke: { width: 2, colors: ['#ffffff'] },
    grid: { padding: { top: 0, bottom: 0 } }
  });

  // Line chart - data real 7 hari terakhir
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const lineData = dayNames.map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().slice(0, 10);
    return laporan.filter(l => {
      if (!l.tanggal) return false;
      let lDate = l.tanggal;
      if (lDate.includes('/')) {
        const [d, m, y] = lDate.split('/');
        lDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
      return lDate === dateStr;
    }).length;
  });
  const dayLabels = dayNames.map((name, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return `${name} ${date.getDate()}`;
  });

  const lineOptions = {
    chart: { type: 'area', fontFamily: 'Inter, system-ui, sans-serif', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 500 } },
    colors: ['#3B82F6'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, colorStops: [{ offset: 0, color: '#3B82F6', opacity: 0.25 }, { offset: 100, color: '#3B82F6', opacity: 0.02 }] } },
    markers: { size: 4, colors: ['#3B82F6'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
    xaxis: { categories: dayLabels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94A3B8', fontSize: '11px', fontWeight: 500 } } },
    yaxis: { labels: { style: { colors: '#94A3B8', fontSize: '11px' } }, min: 0, forceNiceScale: true, tickAmount: 4 },
    dataLabels: { enabled: false },
    grid: { show: true, borderColor: '#F1F5F9', strokeDashArray: 4, padding: { left: 10, right: 10 } },
    tooltip: { theme: 'light', style: { fontSize: '13px' }, marker: { show: true }, x: { show: true, format: null, formatter: undefined } }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-emerald-50 text-emerald-700';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'completed': return 'bg-blue-50 text-blue-700';
      case 'revision': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'Disetujui';
      case 'pending': return 'Pending';
      case 'completed': return 'Selesai';
      case 'revision': return 'Revisi';
      default: return status || 'Pending';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Beranda</h1>
        <p className="text-sm text-gray-400 mt-1">Ringkasan data laporan maintenance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 border ${item.border} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.title}</p>
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`w-4.5 h-4.5 ${item.color}`} strokeWidth={2} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Donut Charts per Area */}
        {areaKategoriData.map((areaData, i) => {
          const series = [areaData.prev, areaData.corr, areaData.emer, areaData.insp].filter(c => c > 0);
          const options = makePieOptions(areaData.area, areaData.prev, areaData.corr, areaData.emer, areaData.insp, areaData.total);
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-800">{areaData.area}</h3>
                <span className="text-[11px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">{areaData.total} Laporan</span>
              </div>
              <div className="h-48 flex justify-center items-center">
                <Chart options={options} series={series} type="donut" height="100%" />
              </div>
            </div>
          );
        })}

        {areaKategoriData.length === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-3">
            <DocumentCheckIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium text-center">Belum ada data</p>
          </div>
        )}
      </div>

      {/* Line Chart + Laporan Hari Ini */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Line Chart */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Laporan 7 Hari Terakhir</h3>
              <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-3 py-1 rounded-full">Mingguan</span>
            </div>
            <div className="h-80">
              <Chart options={lineOptions} series={[{ name: 'Laporan', data: lineData }]} type="area" height="100%" />
            </div>
          </div>

          {/* Laporan Hari Ini */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-800">Laporan Hari Ini</h3>
                <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-600 font-semibold px-3 py-1 rounded-full">{laporanHariIni.length} Laporan</span>
            </div>
            {laporanHariIni.length > 0 ? (
              <div className="flex-1 overflow-y-auto min-h-0" style={{ maxHeight: '400px' }}>
                {laporanHariIni.map((item, i) => (
                  <div key={i} className="px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {item.petugas?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-gray-800 truncate">{item.lokasi || '-'}</p>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusStyle(item.status)}`}>{getStatusLabel(item.status)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{item.area} &bull; {item.kategori}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.petugas}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="text-center">
                  <ClockIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">Belum ada laporan hari ini</p>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Laporan Terbaru</h3>
          <span className="text-[11px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">5 Terakhir</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Lokasi / Area</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Petugas</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {laporan.slice(0, 5).map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-600 font-medium">{item.tanggal}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-semibold text-gray-800">{item.lokasi}</div>
                    <div className="text-xs text-gray-400">{item.area}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      item.kategori === 'Preventive' ? 'bg-blue-50 text-blue-600' : 
                      item.kategori === 'Corrective' ? 'bg-amber-50 text-amber-600' : 
                      item.kategori === 'Emergency' ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {item.kategori}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-bold">
                        {item.petugas?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm text-gray-700">{item.petugas}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusStyle(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {laporan.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-sm">Belum ada laporan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}