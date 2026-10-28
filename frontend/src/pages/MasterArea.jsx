import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

export default function MasterArea() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAreas = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/areas');
      setAreas(data);
    } catch (error) {
      console.error('Error fetching areas:', error);
      Swal.fire('Error', 'Gagal memuat data area', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const filteredAreas = areas.filter(area => 
    area.nama_area?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    area.kode_area?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    Swal.fire({
      title: 'Tambah Area Baru',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kode Area</label>
            <input id="swal-kode" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Contoh: JKT-01">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Area</label>
            <input id="swal-nama" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Contoh: Jakarta Pusat">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea id="swal-desc" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Keterangan opsional"></textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const kode = document.getElementById('swal-kode').value;
        const nama = document.getElementById('swal-nama').value;
        const desc = document.getElementById('swal-desc').value;
        
        if (!kode || !nama) {
          Swal.showValidationMessage('Kode dan Nama Area wajib diisi!');
          return false;
        }
        return { kode, nama, desc };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { kode, nama, desc } = result.value;
          await api.post('/areas', {
            kode_area: kode,
            nama_area: nama,
            deskripsi: desc
          });
          Swal.fire('Tersimpan!', 'Area baru berhasil ditambahkan.', 'success');
          fetchAreas();
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Gagal menambahkan area.';
          Swal.fire('Error', errMsg, 'error');
        }
      }
    });
  };

  const handleEdit = (area) => {
    Swal.fire({
      title: 'Edit Area',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kode Area</label>
            <input id="swal-edit-kode" value="${area.kode_area}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Area</label>
            <input id="swal-edit-nama" value="${area.nama_area}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea id="swal-edit-desc" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">${area.deskripsi || ''}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const kode = document.getElementById('swal-edit-kode').value;
        const nama = document.getElementById('swal-edit-nama').value;
        const desc = document.getElementById('swal-edit-desc').value;
        
        if (!kode || !nama) {
          Swal.showValidationMessage('Kode dan Nama Area wajib diisi!');
          return false;
        }
        return { kode, nama, desc };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { kode, nama, desc } = result.value;
          await api.put(`/areas/${area.id}`, {
            kode_area: kode,
            nama_area: nama,
            deskripsi: desc
          });
          Swal.fire('Tersimpan!', 'Perubahan berhasil disimpan.', 'success');
          fetchAreas();
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Gagal mengubah area.';
          Swal.fire('Error', errMsg, 'error');
        }
      }
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Hapus Area?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/areas/${id}`);
          Swal.fire('Terhapus!', 'Data area telah dihapus.', 'success');
          fetchAreas();
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus area', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master Area</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data wilayah operasional</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button 
            onClick={fetchAreas}
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
            Tambah Area
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Daftar Area</h3>
          <div className="w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Cari kode atau nama area..." 
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
               <span className="ml-2 text-gray-500">Memuat data area...</span>
             </div>
          ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Kode</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Nama Area</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Deskripsi</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-transparent">
              {filteredAreas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {area.kode_area}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {area.nama_area}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {area.deskripsi || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center space-x-3">
                      <button 
                        onClick={() => handleEdit(area)}
                        className="text-secondary hover:text-opacity-80 transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(area.id)}
                        className="text-danger hover:text-opacity-80 transition-colors"
                        title="Hapus"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAreas.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <XCircleIcon className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg font-medium">Area tidak ditemukan</p>
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
