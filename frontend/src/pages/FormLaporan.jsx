import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CameraIcon, MapPinIcon, QrCodeIcon, ArrowLeftIcon, PhotoIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import api from '../utils/api';
import axios from 'axios';

export default function FormLaporan() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const editData = location.state?.laporan || null;
  const [loading, setLoading] = useState(false);
  
  const DRAFT_KEY = 'laporan_draft';
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };
  const draft = editMode ? null : loadDraft();

  // Extract photo from editData
  let editPhoto = editData?.photo || null;
  let editAddress = '';
  let editACParams = null;
  let editShowAC = false;
  if (editData?.deskripsi) {
    let desc = editData.deskripsi;
    if (desc.includes('[PHOTO_BASE64]')) {
      const parts = desc.split('[PHOTO_BASE64]');
      editPhoto = parts[1]?.trim() || editPhoto;
      desc = parts[0];
    }
    if (desc.includes('[ALAMAT]')) {
      const parts = desc.split('[ALAMAT]');
      editAddress = parts[1]?.trim() || '';
      desc = parts[0];
    }
    if (desc.includes('--- Parameter AC ---')) {
      editShowAC = true;
      const acParts = desc.split('--- Parameter AC ---');
      desc = acParts[0].trim();
      try { editACParams = JSON.parse(acParts[1].trim()); } catch {}
    }
  }

  const [photoPreview, setPhotoPreview] = useState(editPhoto || draft?.photoPreview || null);
  
  const [areas, setAreas] = useState([]);
  const [lokasi, setLokasi] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [users, setUsers] = useState([]);
  
  const raw = editData?._raw || {};
  const [formData, setFormData] = useState(editMode && editData ? {
    tanggal: editData.tanggal || new Date().toISOString().slice(0, 10),
    judul: raw.judul || editData.judul || '',
    area_id: raw.areas?.id || raw.area_id || '',
    lokasi_id: raw.lokasi_id || '',
    kategori_id: raw.kategori?.id || raw.kategori_id || '',
    petugas_id: raw.petugas?.id || raw.petugas_id || '',
    deskripsi: editData.deskripsi?.split('[PHOTO_BASE64]')[0].split('[ALAMAT]')[0].split('--- Parameter AC')[0].trim() || '',
    temuan: raw.temuan || editData.temuan || '',
    latitude: '',
    longitude: '',
    address: editAddress
  } : draft?.formData || {
    tanggal: new Date().toISOString().slice(0, 10),
    judul: '',
    area_id: '',
    lokasi_id: '',
    kategori_id: '',
    petugas_id: '',
    deskripsi: '',
    temuan: '',
    latitude: '',
    longitude: '',
    address: ''
  });
  const [customLokasiName, setCustomLokasiName] = useState(draft?.customLokasiName || '');

  const [showACParams, setShowACParams] = useState(editShowAC || draft?.showACParams || false);
  const [acParams, setAcParams] = useState(editACParams ? {
    voltaseRS: editACParams.voltaseRS || '', voltaseRT: editACParams.voltaseRT || '', voltaseST: editACParams.voltaseST || '',
    ampereR: editACParams.ampereR || '', ampereS: editACParams.ampereS || '', ampereT: editACParams.ampereT || '',
    suhu: editACParams.suhu || '', pressLow: editACParams.pressLow || '', pressHigh: editACParams.pressHigh || '',
    inPCB: editACParams.inPCB || '', inMotor: editACParams.inMotor || '', inSensor: editACParams.inSensor || '', inVanbelt: editACParams.inVanbelt || '',
    outKompresor: editACParams.outKompresor || '', outProtect: editACParams.outProtect || '', outKontraktor: editACParams.outKontraktor || '', outMotor: editACParams.outMotor || ''
  } : {
    voltaseRS: '', voltaseRT: '', voltaseST: '',
    ampereR: '', ampereS: '', ampereT: '',
    suhu: '', pressLow: '', pressHigh: '',
    inPCB: '', inMotor: '', inSensor: '', inVanbelt: '',
    outKompresor: '', outProtect: '', outKontraktor: '', outMotor: ''
  });
  const [acPhotos, setAcPhotos] = useState(editACParams?.acPhotos || {
    voltaseRS: null, voltaseRT: null, voltaseST: null,
    ampereR: null, ampereS: null, ampereT: null,
    suhu: null, pressLow: null, pressHigh: null
  });
  const acPhotoRefs = {
    voltaseRS: useRef(null), voltaseRT: useRef(null), voltaseST: useRef(null),
    ampereR: useRef(null), ampereS: useRef(null), ampereT: useRef(null),
    suhu: useRef(null), pressLow: useRef(null), pressHigh: useRef(null)
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [areaRes, lokasiRes, kategoriRes, userRes] = await Promise.all([
          api.get('/areas'),
          api.get('/lokasi'),
          api.get('/kategori'),
          api.get('/users')
        ]);
        setAreas(areaRes.data);
        setLokasi(lokasiRes.data);
        setKategori(kategoriRes.data);
        setUsers(userRes.data);
      } catch (error) {
        console.error('Error fetching form options', error);
      }
    };
    fetchOptions();
  }, []);

  // Sync edit data setelah options ke-load
  useEffect(() => {
    if (!editMode || !editData || areas.length === 0) return;
    const raw = editData._raw || {};
    console.log('Edit data raw:', raw);
    console.log('lokasi_id:', raw.lokasi_id, 'area:', raw.areas);
    setFormData(prev => ({
      ...prev,
      area_id: raw.areas?.id || prev.area_id,
      lokasi_id: raw.lokasi_id || prev.lokasi_id,
      kategori_id: raw.kategori?.id || prev.kategori_id,
      petugas_id: raw.petugas?.id || prev.petugas_id,
      temuan: raw.temuan || prev.temuan,
      judul: raw.judul || prev.judul,
    }));
  }, [areas, lokasi, editMode, editData]);

  // Auto-save draft to localStorage (only when not in edit mode)
  useEffect(() => {
    if (editMode) return;
    const draft = { formData, customLokasiName, photoPreview, showACParams };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [formData, customLokasiName, photoPreview, showACParams, editMode]);

  const handleACInputChange = (e) => {
    const { name, value } = e.target;
    setAcParams({ ...acParams, [name]: value });
  };

  const handleACPhotoChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setAcPhotos(prev => ({ ...prev, [field]: compressedDataUrl }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const processImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
        setPhotoPreview(compressedDataUrl);
      };
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          processImageFile(file);
          Swal.fire({ icon: 'success', title: 'Gambar Ditempel', text: 'Gambar dari clipboard berhasil ditambahkan.', timer: 1200, showConfirmButton: false });
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processImageFile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.5 quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
        setPhotoPreview(compressedDataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire('Error', 'Browser Anda tidak mendukung fitur Geolocation.', 'error');
      return;
    }

    Swal.fire({
      title: 'Mencari Lokasi...',
      text: 'Mohon tunggu sebentar',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=id`);
          const data = await res.json();
          const alamat = data.display_name || '';
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: alamat
          }));
        } catch (e) {
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: ''
          }));
        }

        Swal.fire('Berhasil!', 'Titik koordinat GPS telah didapatkan.', 'success');
      },
      (error) => {
        let errorMsg = 'Tidak dapat mengambil lokasi.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Akses lokasi ditolak oleh pengguna/browser. Pastikan Izin Lokasi (Location Services) aktif untuk browser ini di Pengaturan HP.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Informasi lokasi tidak tersedia. Pastikan GPS HP menyala dan Anda tidak berada di ruang tertutup.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Waktu pencarian lokasi habis (Timeout). Sinyal GPS mungkin lemah.';
            break;
          default:
            errorMsg = `Gagal mengambil lokasi: ${error.message}`;
        }
        Swal.fire('Gagal', errorMsg, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleScanQR = () => {
    Swal.fire({
      title: 'Scan QR Code Mesin',
      text: 'Fitur pemindai kamera (Camera Scanner) sedang diaktifkan...',
      icon: 'info',
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#2563EB',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.area_id || !formData.kategori_id || !formData.petugas_id) {
        Swal.fire('Error', 'Pilih Area, Kategori, dan Petugas terlebih dahulu', 'error');
        return;
    }
    if (!formData.lokasi_id) {
        Swal.fire('Error', 'Pilih Lokasi / Mesin terlebih dahulu', 'error');
        return;
    }
    if (formData.lokasi_id === '__custom__' && !customLokasiName.trim()) {
        Swal.fire('Error', 'Masukkan nama lokasi / mesin kustom', 'error');
        return;
    }
    
    setLoading(true);

    try {
      let finalLokasiId = formData.lokasi_id;

      if (formData.lokasi_id === '__custom__') {
        const trimmedName = customLokasiName.trim();
        const existingLokasi = lokasi.find(l => 
          l.nama_lokasi?.toLowerCase() === trimmedName.toLowerCase() && l.area_id === formData.area_id
        );
        if (existingLokasi) {
          finalLokasiId = existingLokasi.id;
        } else {
          let lokasiRes;
          try {
            lokasiRes = await api.post('/lokasi', {
              area_id: formData.area_id,
              nama_lokasi: trimmedName,
              deskripsi: ''
            });
          } catch (err) {
            if (err.message?.includes('sudah ada') && err.data?.id) {
              lokasiRes = { data: err.data };
            } else {
              throw err;
            }
          }
          finalLokasiId = lokasiRes.data?.id || lokasiRes.id;
          if (!lokasi.find(l => l.id === finalLokasiId)) {
            setLokasi(prev => [...prev, lokasiRes.data || lokasiRes]);
          }
        }
        setFormData(prev => ({ ...prev, lokasi_id: finalLokasiId }));
      }

      let finalDeskripsi = formData.deskripsi;
      if (formData.address) {
        finalDeskripsi += '\n\n[ALAMAT]\n' + formData.address;
      }
      if (photoPreview) {
        finalDeskripsi += '\n\n[PHOTO_BASE64]\n' + photoPreview;
      }

      const now = new Date();
      const jamFormat = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const payload = {
        tanggal: formData.tanggal,
        judul: formData.judul,
        deskripsi: finalDeskripsi,
        temuan: formData.temuan || '',
        kategori_id: formData.kategori_id,
        area_id: formData.area_id,
        lokasi_id: finalLokasiId,
        petugas_id: formData.petugas_id,
        acParams: showACParams ? { ...acParams, acPhotos } : null
      };

      if (editMode && editData?.db_id) {
        // Edit mode: update laporan
        await api.patch(`/laporan/${editData.db_id}`, payload);
        Swal.fire({
          icon: 'success',
          title: 'Laporan Berhasil Diperbarui',
          text: 'Laporan Anda telah diperbarui.',
          confirmButtonColor: '#10B981'
        }).then(() => {
          navigate('/dashboard/laporan');
        });
      } else {
        // Create mode
        const now = new Date();
        const jamFormat = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        payload.jam = jamFormat;
        payload.status = 'Pending';

        await api.post('/laporan', payload).catch(async (err) => {
          if (err.status === 401 || err.status === 403) {
            try {
              const { data } = await axios.post(
                `${api.defaults.baseURL}/auth/refresh`,
                {},
                { withCredentials: true }
              );
              if (data?.data?.accessToken) {
                localStorage.setItem('accessToken', data.data.accessToken);
                return api.post('/laporan', payload);
              }
            } catch {}
          }
          throw err;
        });
        localStorage.removeItem(DRAFT_KEY);
        Swal.fire({
          icon: 'success',
          title: 'Laporan Berhasil Dibuat',
          text: 'Laporan Anda telah masuk ke dalam sistem dan menunggu persetujuan.',
          confirmButtonColor: '#10B981'
        }).then(() => {
          navigate('/dashboard/laporan');
        });
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Gagal mengirim laporan';
      Swal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLokasi = formData.area_id 
    ? lokasi.filter(l => l.area_id === formData.area_id)
    : lokasi;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/dashboard/laporan')}
          className="p-2 bg-white dark:bg-gray-900 bg-opacity-50 hover:bg-opacity-100 rounded-full shadow-sm transition-all text-gray-700 dark:text-gray-300"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{editMode ? 'Edit Laporan (Revisi)' : 'Buat Laporan Baru'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{editMode ? 'Perbarui data laporan yang perlu direvisi' : 'Formulir pelaporan kerusakan atau preventive maintenance'}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 border border-white border-opacity-40 dark:bg-gray-900 dark:border-gray-800 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button 
              type="button" 
              onClick={handleScanQR}
              className="flex items-center justify-center py-4 px-4 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-20 rounded-xl hover:bg-opacity-20 transition-all font-semibold"
            >
              <QrCodeIcon className="w-6 h-6 mr-2" />
              Scan QR Mesin / Lokasi
            </button>
            <button 
              type="button"
              onClick={getLocation}
              className="flex items-center justify-center py-4 px-4 bg-success bg-opacity-10 text-success border border-success border-opacity-20 rounded-xl hover:bg-opacity-20 transition-all font-semibold"
            >
              <MapPinIcon className="w-6 h-6 mr-2" />
              Ambil Titik Koordinat (GPS)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Area</label>
              <select 
                name="area_id"
                value={formData.area_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              >
                <option value="">-- Pilih Area --</option>
                {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.nama_area}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Lokasi / Mesin</label>
              <select 
                name="lokasi_id"
                value={formData.lokasi_id}
                onChange={(e) => {
                  setFormData({ ...formData, lokasi_id: e.target.value });
                  if (e.target.value !== '__custom__') setCustomLokasiName('');
                }}
                className="w-full px-4 py-2.5 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              >
                <option value="">-- Pilih Lokasi --</option>
                {filteredLokasi.map(l => (
                    <option key={l.id} value={l.id}>{l.nama_lokasi}</option>
                ))}
                <option value="__custom__">+ Lainnya (Kustom)</option>
              </select>
              {formData.lokasi_id === '__custom__' && (
                <input 
                  type="text"
                  value={customLokasiName}
                  onChange={(e) => setCustomLokasiName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all mt-2"
                  placeholder="Masukkan nama lokasi / mesin baru"
                  required
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Tanggal Pekerjaan</label>
              <input 
                type="date" 
                name="tanggal"
                value={formData.tanggal}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Kategori Pekerjaan</label>
              <select 
                name="kategori_id"
                value={formData.kategori_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              >
                <option value="">-- Pilih Kategori --</option>
                {kategori.map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Petugas (Teknisi)</label>
              <select 
                name="petugas_id"
                value={formData.petugas_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              >
                <option value="">-- Pilih Petugas --</option>
                {users.filter(u => u.roles?.name === 'Teknisi').map(u => (
                    <option key={u.id} value={u.id}>{u.fullname}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Judul Pekerjaan</label>
              <input 
                type="text" 
                name="judul"
                value={formData.judul}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Contoh: Pembersihan Chiller"
                required
              />
            </div>
          </div>

          {/* Toggle AC Params */}
          <div className="flex items-center space-x-3 py-2 border-t border-b border-gray-100 dark:border-gray-800">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={showACParams} onChange={() => setShowACParams(!showACParams)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              <span className="ml-3 text-sm font-bold text-gray-700 dark:text-gray-300">Tambahkan Parameter AC Split Duct</span>
            </label>
          </div>

          {showACParams && (
            <div className="bg-primary/5 p-5 sm:p-6 rounded-2xl border border-primary/20 space-y-6 animate-fade-in">
              <h3 className="text-lg font-bold text-primary border-b border-primary/20 pb-2">Data Pengukuran & Kondisi Komponen</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voltase */}
                <div className="space-y-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Voltase RST</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['voltaseRS', 'voltaseRT', 'voltaseST'].map((field) => (
                      <div key={field} className="space-y-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{field.replace('voltase', '')} (V)</label>
                        <input type="text" name={field} value={acParams[field]} onChange={handleACInputChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                        <div className="flex items-center gap-1 mt-1">
                          <button type="button" onClick={() => acPhotoRefs[field].current.click()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5">
                            <CameraIcon className="w-3 h-3" />
                            Foto
                          </button>
                          {acPhotos[field] && (
                            <button type="button" onClick={() => setAcPhotos(prev => ({ ...prev, [field]: null }))} className="text-xs text-red-400 hover:text-red-600 ml-1">Hapus</button>
                          )}
                        </div>
                        <input type="file" ref={acPhotoRefs[field]} onChange={(e) => handleACPhotoChange(e, field)} accept="image/*" className="hidden" />
                        {acPhotos[field] && (
                          <img src={acPhotos[field]} alt={field} className="w-full h-16 object-cover rounded-lg border border-gray-200 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ampere */}
                <div className="space-y-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Ampere</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['ampereR', 'ampereS', 'ampereT'].map((field) => (
                      <div key={field} className="space-y-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{field.replace('ampere', '')} (A)</label>
                        <input type="text" name={field} value={acParams[field]} onChange={handleACInputChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                        <div className="flex items-center gap-1 mt-1">
                          <button type="button" onClick={() => acPhotoRefs[field].current.click()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5">
                            <CameraIcon className="w-3 h-3" />
                            Foto
                          </button>
                          {acPhotos[field] && (
                            <button type="button" onClick={() => setAcPhotos(prev => ({ ...prev, [field]: null }))} className="text-xs text-red-400 hover:text-red-600 ml-1">Hapus</button>
                          )}
                        </div>
                        <input type="file" ref={acPhotoRefs[field]} onChange={(e) => handleACPhotoChange(e, field)} accept="image/*" className="hidden" />
                        {acPhotos[field] && (
                          <img src={acPhotos[field]} alt={field} className="w-full h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Suhu (°C)</label>
                  <input type="text" name="suhu" value={acParams.suhu} onChange={handleACInputChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                  <div className="flex items-center gap-1 mt-1">
                    <button type="button" onClick={() => acPhotoRefs.suhu.current.click()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5">
                      <CameraIcon className="w-3 h-3" />
                      Foto
                    </button>
                    {acPhotos.suhu && (
                      <button type="button" onClick={() => setAcPhotos(prev => ({ ...prev, suhu: null }))} className="text-xs text-red-400 hover:text-red-600 ml-1">Hapus</button>
                    )}
                  </div>
                  <input type="file" ref={acPhotoRefs.suhu} onChange={(e) => handleACPhotoChange(e, 'suhu')} accept="image/*" className="hidden" />
                  {acPhotos.suhu && (
                    <img src={acPhotos.suhu} alt="suhu" className="w-full h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 mt-1" />
                  )}
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tekanan Refrigerant (psi)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['pressLow', 'pressHigh'].map((field) => (
                      <div key={field} className="space-y-1">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{field === 'pressLow' ? 'Low Pressure' : 'High Pressure'}</label>
                        <input type="text" name={field} value={acParams[field]} onChange={handleACInputChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                        <div className="flex items-center gap-1 mt-1">
                          <button type="button" onClick={() => acPhotoRefs[field].current.click()} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5">
                            <CameraIcon className="w-3 h-3" />
                            Foto
                          </button>
                          {acPhotos[field] && (
                            <button type="button" onClick={() => setAcPhotos(prev => ({ ...prev, [field]: null }))} className="text-xs text-red-400 hover:text-red-600 ml-1">Hapus</button>
                          )}
                        </div>
                        <input type="file" ref={acPhotoRefs[field]} onChange={(e) => handleACPhotoChange(e, field)} accept="image/*" className="hidden" />
                        {acPhotos[field] && (
                          <img src={acPhotos[field]} alt={field} className="w-full h-16 object-cover rounded-lg border border-gray-200 mt-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Unit Indoor */}
                <div className="space-y-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Kondisi Komponen Unit Indoor</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">PCB</label>
                      <input type="text" name="inPCB" value={acParams.inPCB} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Motor Fan Indoor</label>
                      <input type="text" name="inMotor" value={acParams.inMotor} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sensor Thermist</label>
                      <input type="text" name="inSensor" value={acParams.inSensor} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Vanbelt</label>
                      <input type="text" name="inVanbelt" value={acParams.inVanbelt} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                  </div>
                </div>

                {/* Unit Outdoor */}
                <div className="space-y-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Kondisi Komponen Unit Outdoor</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Kompressor</label>
                      <input type="text" name="outKompresor" value={acParams.outKompresor} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Protect Phase</label>
                      <input type="text" name="outProtect" value={acParams.outProtect} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Kontraktor</label>
                      <input type="text" name="outKontraktor" value={acParams.outKontraktor} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Motor Fan</label>
                      <input type="text" name="outMotor" value={acParams.outMotor} onChange={handleACInputChange} placeholder="Baik/Rusak" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm outline-none focus:border-primary" required />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Deskripsi Pekerjaan / Kerusakan</label>
            <textarea 
              name="deskripsi"
              value={formData.deskripsi}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-3 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              placeholder="Jelaskan detail kerusakan atau pekerjaan yang dilakukan..."
              required
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Temuan</label>
            <textarea 
              name="temuan"
              value={formData.temuan}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-3 bg-white bg-opacity-60 border border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
              placeholder="Temuan selama pemeriksaan/pekerjaan..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Foto Bukti (Before/After)</label>
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center bg-white dark:bg-gray-900 bg-opacity-50 cursor-pointer hover:border-primary hover:bg-opacity-80 transition-all relative overflow-hidden"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <CameraIcon className="w-10 h-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Klik untuk upload foto</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">atau paste (Ctrl+V) gambar dari clipboard</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden" 
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary text-xs font-semibold rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <PhotoIcon className="w-4 h-4" />
                  Ambil Foto
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.read().then(items => {
                      for (const item of items) {
                        for (const type of item.types) {
                          if (type.startsWith('image/')) {
                            item.getType(type).then(blob => processImageFile(blob));
                            Swal.fire({ icon: 'success', title: 'Gambar Ditempel', timer: 1200, showConfirmButton: false });
                            return;
                          }
                        }
                      }
                      Swal.fire({ icon: 'info', title: 'Tidak ada gambar', text: 'Salin (copy) gambar terlebih dahulu, lalu klik tombol ini.', timer: 2000, showConfirmButton: false });
                    }).catch(() => {
                      Swal.fire({ icon: 'warning', title: 'Akses Clipboard', text: 'Izinkan akses clipboard untuk menempel gambar.' });
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <ClipboardIcon className="w-4 h-4" />
                  Tempel Foto
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="px-3 py-2 bg-danger/10 text-danger text-xs font-semibold rounded-xl hover:bg-danger/20 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <input 
                type="file" 
                ref={cameraInputRef}
                onChange={handlePhotoChange}
                accept="image/*"
                capture="environment"
                className="hidden" 
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Koordinat GPS</label>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Latitude</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={formData.latitude}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none"
                      placeholder="Latitude"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Longitude</span>
                    <input 
                      type="text" 
                      readOnly 
                      value={formData.longitude}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none"
                      placeholder="Longitude"
                    />
                  </div>
                </div>
                {formData.address && (
                  <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-xs font-semibold text-blue-700">Alamat: </span>
                    <span className="text-xs text-blue-600">{formData.address}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 border-opacity-50 dark:border-gray-800">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-opacity-90 hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center float-right"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                editMode ? 'Simpan Perubahan' : 'Kirim Laporan'
              )}
            </button>
            <div className="clear-both"></div>
          </div>
        </form>
      </div>
    </div>
  );
}
