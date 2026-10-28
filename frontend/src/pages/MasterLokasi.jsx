import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { PlusIcon, PencilSquareIcon, TrashIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

export default function MasterLokasi() {
  const [lokasi, setLokasi] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lokasiRes, areaRes] = await Promise.all([
        api.get('/lokasi'),
        api.get('/areas')
      ]);
      setLokasi(lokasiRes.data);
      setAreas(areaRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'Gagal memuat data lokasi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLokasi = lokasi.filter(l => 
    l.nama_lokasi?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.areas?.nama_area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    if (areas.length === 0) {
      Swal.fire('Peringatan', 'Silakan tambahkan Master Area terlebih dahulu', 'warning');
      return;
    }

    let areaOptions = areas.map(a => `<option value="${a.id}">${a.nama_area}</option>`).join('');

    Swal.fire({
      title: 'Tambah Lokasi Baru',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Area Induk</label>
            <select id="swal-area" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
              ${areaOptions}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi / Equipment</label>
            <input id="swal-nama" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Contoh: Chiller 1">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const area_id = document.getElementById('swal-area').value;
        const nama = document.getElementById('swal-nama').value;
        
        if (!nama || !area_id) {
          Swal.showValidationMessage('Area dan Nama Lokasi wajib diisi!');
          return false;
        }
        return { area_id, nama };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { area_id, nama } = result.value;
          await api.post('/lokasi', {
            nama_lokasi: nama,
            area_id: area_id
          });
          Swal.fire('Tersimpan!', 'Lokasi baru berhasil ditambahkan.', 'success');
          fetchData();
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Gagal menambahkan lokasi.';
          Swal.fire('Error', errMsg, 'error');
        }
      }
    });
  };

  const handleEdit = (item) => {
    let areaOptions = areas.map(a => 
      `<option value="${a.id}" ${a.id === item.area_id ? 'selected' : ''}>${a.nama_area}</option>`
    ).join('');

    Swal.fire({
      title: 'Edit Lokasi',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Area Induk</label>
            <select id="swal-edit-area" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
              ${areaOptions}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lokasi / Equipment</label>
            <input id="swal-edit-nama" value="${item.nama_lokasi}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const area_id = document.getElementById('swal-edit-area').value;
        const nama = document.getElementById('swal-edit-nama').value;
        
        if (!nama || !area_id) {
          Swal.showValidationMessage('Area dan Nama Lokasi wajib diisi!');
          return false;
        }
        return { area_id, nama };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { area_id, nama } = result.value;
          await api.put(`/lokasi/${item.id}`, {
            nama_lokasi: nama,
            area_id: area_id
          });
          Swal.fire('Tersimpan!', 'Perubahan berhasil disimpan.', 'success');
          fetchData();
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Gagal mengubah lokasi.';
          Swal.fire('Error', errMsg, 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Hapus Lokasi?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/lokasi/${id}`);
          Swal.fire('Terhapus!', 'Data lokasi telah dihapus.', 'success');
          fetchData();
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus lokasi', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master Lokasi</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data lokasi dan equipment per area</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button 
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-200 transition-all"
            title="Muat Ulang"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-opacity-90 transition-all"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Tambah Lokasi
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Daftar Lokasi</h3>
          <div className="w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Cari nama lokasi atau area..." 
              className="w-full px-4 py-2 border border-gray-200 bg-white bg-opacity-70 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center items-center py-12">
               <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
               <span className="ml-2 text-gray-500">Memuat data lokasi...</span>
             </div>
          ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tl-lg">Area Induk</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Nama Lokasi / Equipment</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-transparent">
              {filteredLokasi.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.areas?.nama_area || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {item.nama_lokasi}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center space-x-3">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-secondary hover:text-opacity-80 transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-danger hover:text-opacity-80 transition-colors"
                        title="Hapus"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLokasi.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <XCircleIcon className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg font-medium">Lokasi tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}
