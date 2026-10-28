import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { DocumentTextIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

export default function Monitoring() {
  const [slaSeries, setSlaSeries] = useState([0]);
  const [downtimeSeries, setDowntimeSeries] = useState([{ name: 'Downtime (Jam)', data: [] }]);
  const [slaData, setSlaData] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, active: 0 });

  useEffect(() => {
    const fetchMonitoring = async () => {
      try {
        const { data } = await api.get('/laporan');
        const laporan = data.map(item => ({
          ...item,
          kategori: item.kategori?.nama || '-',
          petugas: item.petugas?.fullname || '-',
        }));

        const completed = laporan.filter(l => {
          const s = (l.status || '').toLowerCase();
          return s === 'completed' || s === 'approved' || s === 'selesai';
        }).length;
        const pending = laporan.filter(l => (l.status || '').toLowerCase() === 'pending').length;
        const uniqueTeknisi = [...new Set(laporan.map(l => l.petugas).filter(p => p && p !== '-'))];
        const globalSla = laporan.length > 0 ? Math.round((completed / laporan.length) * 100) : 0;

        setStats({ total: laporan.length, completed, pending, active: uniqueTeknisi.length });
        setSlaSeries([globalSla]);

        // Downtime
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthlyDowntime = new Array(12).fill(0);
        laporan.forEach(l => {
          let month = -1;
          if (l.tanggal && l.tanggal.includes('/')) month = parseInt(l.tanggal.split('/')[1]) - 1;
          else if (l.tanggal && l.tanggal.includes('-')) month = parseInt(l.tanggal.split('-')[1]) - 1;
          if (month >= 0 && month <= 11) {
            const k = (l.kategori || '').toLowerCase();
            monthlyDowntime[month] += (k === 'corrective' || k === 'emergency') ? 4.5 : 1.5;
          }
        });
        const activeMonths = [], activeData = [];
        monthNames.forEach((name, i) => {
          if (monthlyDowntime[i] > 0) { activeMonths.push(name); activeData.push(Math.round(monthlyDowntime[i] * 10) / 10); }
        });
        if (activeMonths.length === 0) { activeMonths.push(monthNames[new Date().getMonth()]); activeData.push(0); }

        setDowntimeOptions(prev => ({ ...prev, xaxis: { ...prev.xaxis, categories: activeMonths } }));
        setDowntimeSeries([{ name: 'Downtime (Jam)', data: activeData }]);

        // KPI Teknisi
        const teknisiMap = {};
        laporan.forEach(l => {
          const name = l.petugas || 'Teknisi Anonim';
          const s = (l.status || '').toLowerCase();
          if (!teknisiMap[name]) teknisiMap[name] = { total: 0, completed: 0 };
          teknisiMap[name].total += 1;
          if (s === 'completed' || s === 'approved' || s === 'selesai') teknisiMap[name].completed += 1;
        });
        const kpiArr = Object.keys(teknisiMap).map(petugas => {
          const d = teknisiMap[petugas];
          const actualSla = Math.round((d.completed / d.total) * 100);
          return { petugas, total: d.total, completed: d.completed, target: 90, actual: actualSla, status: actualSla >= 90 ? 'Tercapai' : 'Di Bawah Target' };
        }).sort((a, b) => b.actual - a.actual);
        setSlaData(kpiArr);
      } catch (error) { console.error('Error fetching monitoring data:', error); }
    };
    fetchMonitoring();
  }, []);

  const [downtimeOptions, setDowntimeOptions] = useState({
    chart: { type: 'bar', fontFamily: 'Inter, system-ui, sans-serif', toolbar: { show: false }, background: 'transparent', animations: { enabled: true, speed: 500 } },
    colors: ['#3B82F6'],
    plotOptions: { bar: { borderRadius: 8, columnWidth: '50%' } },
    fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', shadeIntensity: 0.3, opacityFrom: 1, opacityTo: 0.7 } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4, padding: { left: 10, right: 10, top: 10 } },
    xaxis: { categories: [], axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94A3B8', fontSize: '12px', fontWeight: 500 } } },
    yaxis: { title: { text: 'Jam Downtime', style: { color: '#94A3B8', fontSize: '12px' } }, labels: { style: { colors: '#94A3B8', fontSize: '11px' } }, min: 0 },
    tooltip: { theme: 'light', style: { fontSize: '13px' }, marker: { show: false } }
  });
  
  const slaOptions = {
    chart: { type: 'radialBar', fontFamily: 'Inter, system-ui, sans-serif', background: 'transparent' },
    plotOptions: {
      radialBar: {
        hollow: { size: '65%', background: 'transparent' },
        track: { background: '#F1F5F9', strokeWidth: '100%', margin: 0 },
        dataLabels: {
          name: { show: false },
          value: { show: true, fontSize: '28px', fontWeight: 'bold', color: '#111827', offsetY: 5, formatter: (val) => val + '%' }
        }
      }
    },
    stroke: { lineCap: 'round' },
    labels: ['Global SLA'],
    colors: ['#10B981']
  };

  const statCards = [
    { label: 'Total Laporan', value: stats.total, icon: DocumentTextIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Selesai', value: stats.completed, icon: CheckCircleIcon, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Pending', value: stats.pending, icon: ClockIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Teknisi Aktif', value: stats.active, icon: UserGroupIcon, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Monitoring & KPI</h1>
        <p className="text-sm text-gray-500 mt-1">Pantau SLA, Downtime, dan Ranking Kinerja Teknisi</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-400 font-medium">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* SLA Radial */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-base font-bold text-gray-800 w-full text-left mb-1">Service Level Agreement</h3>
          <p className="text-xs text-gray-400 w-full text-left mb-4">Persentase laporan selesai</p>
          <Chart options={slaOptions} series={slaSeries} type="radialBar" height={260} />
          <div className="mt-2 px-4 py-2 bg-gray-50 rounded-xl w-full text-center">
            <p className="text-xs text-gray-500">Target SLA &gt; <span className="font-bold text-gray-800">90%</span></p>
          </div>
        </div>

        {/* Downtime Chart */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-800">Grafik Downtime</h3>
              <p className="text-xs text-gray-400 mt-0.5">Estimasi jam berdasarkan jenis pekerjaan</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Preventive (1.5h)</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span> Corrective (4.5h)</span>
            </div>
          </div>
          <div className="h-64">
            <Chart options={downtimeOptions} series={downtimeSeries} type="bar" height="100%" />
          </div>
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <h3 className="text-base font-bold text-gray-800">KPI & Ranking Teknisi</h3>
          <p className="text-xs text-gray-400 mt-0.5">Berdasarkan persentase laporan selesai per teknisi</p>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Teknisi</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Selesai</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Target</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Actual SLA</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Progress</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {slaData.map((data, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 text-center">
                    <span className={`w-8 h-8 inline-flex items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-600' : 
                      idx === 1 ? 'bg-gray-200 text-gray-600' : 
                      idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'
                    }`}>
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {data.petugas?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{data.petugas}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-600">{data.total}</td>
                  <td className="px-4 py-3.5 text-center text-sm font-semibold text-gray-800">{data.completed}</td>
                  <td className="px-4 py-3.5 text-center text-sm text-gray-500">{data.target}%</td>
                  <td className="px-4 py-3.5 text-center text-sm font-bold text-gray-900">{data.actual}%</td>
                  <td className="px-4 py-3.5">
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${data.actual >= 90 ? 'bg-emerald-500' : data.actual >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(data.actual, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                      data.status === 'Tercapai' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {data.status === 'Tercapai' ? '✓ Tercapai' : '✗ Di Bawah Target'}
                    </span>
                  </td>
                </tr>
              ))}
              {slaData.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <ExclamationTriangleIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm font-medium">Belum ada data teknisi yang tercatat.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}