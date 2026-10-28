import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

export default function MasterUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      // Map 'roles' object to a flat 'role' string for easier handling
      const mappedUsers = data.map(u => ({
        ...u,
        role: u.roles?.name || 'Viewer'
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Swal.fire('Error', 'Gagal memuat data pengguna', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    Swal.fire({
      title: 'Tambah User Baru',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input id="swal-name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="John Doe">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="swal-email" type="email" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="john@example.com">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kata Sandi</label>
            <input id="swal-password" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Minimal 6 karakter">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select id="swal-role" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
              <option value="Administrator">Administrator</option>
              <option value="Manager">Manager</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Teknisi">Teknisi</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const name = document.getElementById('swal-name').value;
        const email = document.getElementById('swal-email').value;
        const password = document.getElementById('swal-password').value;
        const role = document.getElementById('swal-role').value;
        
        if (!name || !email || !password) {
          Swal.showValidationMessage('Nama, Email, dan Kata Sandi wajib diisi!');
          return false;
        }
        return { name, email, password, role };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { name, email, password, role } = result.value;
          await api.post('/users', {
            fullname: name,
            email,
            password,
            role,
            status: 'ACTIVE'
          });
          Swal.fire('Tersimpan!', 'User baru berhasil ditambahkan.', 'success');
          fetchUsers();
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Gagal menambahkan user.';
          Swal.fire('Error', errMsg, 'error');
        }
      }
    });
  };

  const handleEdit = (user) => {
    Swal.fire({
      title: 'Edit User',
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input id="swal-edit-name" value="${user.fullname}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="swal-edit-email" type="email" value="${user.email}" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Ganti Kata Sandi (Opsional)</label>
            <input id="swal-edit-password" type="password" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="Kosongkan jika tidak ingin diubah">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select id="swal-edit-role" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
              <option value="Administrator" ${user.role === 'Administrator' ? 'selected' : ''}>Administrator</option>
              <option value="Manager" ${user.role === 'Manager' ? 'selected' : ''}>Manager</option>
              <option value="Supervisor" ${user.role === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
              <option value="Teknisi" ${user.role === 'Teknisi' ? 'selected' : ''}>Teknisi</option>
              <option value="Viewer" ${user.role === 'Viewer' ? 'selected' : ''}>Viewer</option>
            </select>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan Perubahan',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const name = document.getElementById('swal-edit-name').value;
        const email = document.getElementById('swal-edit-email').value;
        const password = document.getElementById('swal-edit-password').value;
        const role = document.getElementById('swal-edit-role').value;
        
        if (!name || !email) {
          Swal.showValidationMessage('Nama dan Email wajib diisi!');
          return false;
        }
        return { name, email, password, role };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { name, email, password, role } = result.value;
          const payload = {
            fullname: name,
            email,
            role
          };
          if (password) payload.password = password; // Only send if changed

          await api.put(`/users/${user.id}`, payload);
          Swal.fire('Tersimpan!', 'Perubahan berhasil disimpan.', 'success');
          fetchUsers();
        } catch (error) {
          const errMsg = error.response?.data?.message || 'Gagal mengubah user.';
          Swal.fire('Error', errMsg, 'error');
        }
      }
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.put(`/users/${id}`, { status: newStatus });
      fetchUsers(); // Refresh data to show changes
    } catch (error) {
      Swal.fire('Error', 'Gagal mengubah status', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Hapus User?',
      text: "Data user ini akan dihapus secara permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Ya, hapus!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/users/${id}`);
          Swal.fire('Terhapus!', 'User telah dihapus dari sistem.', 'success');
          fetchUsers();
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus user', 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Master User</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola akses dan data pengguna sistem</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button 
            onClick={fetchUsers}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-200 transition-all"
            title="Muat Ulang"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-opacity-90 hover:shadow-lg transition-all"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Tambah User
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Daftar Pengguna</h3>
          <div className="w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Cari nama, email, atau role..." 
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
               <span className="ml-2 text-gray-500">Memuat data pengguna...</span>
             </div>
          ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tl-lg">Pengguna</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50 rounded-tr-lg">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-transparent">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full border-2 border-white shadow-sm" src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=2563EB&color=fff`} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{user.fullname}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700 font-medium">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors ${
                        user.status === 'ACTIVE' 
                          ? 'bg-success/20 text-success hover:bg-success/30' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {user.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center space-x-3">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="text-secondary hover:text-opacity-80 transition-colors cursor-pointer" 
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-danger hover:text-opacity-80 transition-colors"
                        title="Hapus"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <XCircleIcon className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-lg font-medium">Pengguna tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 px-2">
          <span>Menampilkan {filteredUsers.length} entri</span>
        </div>
      </div>
    </div>
  );
}
