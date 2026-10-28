import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilSquareIcon, 
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../utils/api';

export default function Laporan() {
  const navigate = useNavigate();
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canEditStatus = ['Administrator', 'Manager'].includes(user.role);
  const isTeknisi = user.role === 'Teknisi';
  const canDelete = user.role !== 'Viewer' && !isTeknisi;
  const canCreate = user.role !== 'Viewer';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Selection States
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal Export States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPeriode, setExportPeriode] = useState('bulanan');
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportArea, setExportArea] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/laporan');
      // format data to match previous structure somewhat
      const formatted = data.map(item => {
        let rawDeskripsi = item.deskripsi || '-';
        let cleanDeskripsi = rawDeskripsi;
        let extractedPhoto = null;
        let acParamsJSON = null;
        
        // 1. Extract AC Params if present at the end
        if (cleanDeskripsi.includes('--- Parameter AC ---')) {
          const acParts = cleanDeskripsi.split('--- Parameter AC ---');
          cleanDeskripsi = acParts[0].trim();
          try {
            acParamsJSON = JSON.parse(acParts[1].trim());
          } catch(e) {}
        }

        // 2. Extract Photo if present
        if (cleanDeskripsi.includes('[PHOTO_BASE64]')) {
          const photoParts = cleanDeskripsi.split('[PHOTO_BASE64]');
          cleanDeskripsi = photoParts[0].trim();
          extractedPhoto = photoParts[1].trim();
        }

        return {
          ...item,
          laporan_ac_parameters: acParamsJSON ? [acParamsJSON] : (item.laporan_ac_parameters || []),
          id: item.laporan_no,
          db_id: item.id,
          area: item.areas?.nama_area || '-',
          lokasi: item.lokasi?.nama_lokasi || '-',
          kategori: item.kategori?.nama || '-',
          petugas: item.petugas?.fullname || '-',
          deskripsi: cleanDeskripsi,
          temuan: item.temuan || '',
          photo: extractedPhoto,
          _raw: { ...item, lokasi_id: item.lokasi_id || item.lokasi?.id || '' }
        };
      });
      setLaporan(formatted);
    } catch (error) {
      console.error('Error fetching laporan:', error);
      Swal.fire('Error', 'Gagal memuat data laporan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [location.key]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterKategori, filterStatus]);

  // Filter Logic
  const filteredLaporan = laporan.filter(item => {
    const matchesSearch = 
      item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lokasi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.petugas?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesKategori = filterKategori === 'All' || item.kategori?.toLowerCase() === filterKategori.toLowerCase();
    const matchesStatus = filterStatus === 'All' || (item.status || '').toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesKategori && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLaporan.length / itemsPerPage);
  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedLaporan = filteredLaporan.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const handleBuatLaporan = () => {
    navigate('/dashboard/laporan/baru');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
    
    // Parse helper
    const parseDate = (dString) => {
      if (!dString) return new Date();
      if (dString.includes('/')) {
        const [d, m, y] = dString.split('/');
        return new Date(`${y}-${m}-${d}`);
      }
      return new Date(dString);
    };

    // Filter Data By Date Range
    let dataToExport = filteredLaporan;
    const now = new Date();
    let titlePDF = 'LAPORAN_PEKERJAAN';
    let periodText = '';
    
    if (exportPeriode === 'harian') {
       const today = now.toISOString().slice(0, 10);
       dataToExport = dataToExport.filter(l => {
          const dStr = parseDate(l.tanggal).toISOString().slice(0, 10);
          return dStr === today;
       });
       titlePDF += '_HARIAN';
       periodText = `Periode: Hari Ini (${today})`;
    } else if (exportPeriode === 'mingguan') {
       const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
       dataToExport = dataToExport.filter(l => parseDate(l.tanggal) >= lastWeek);
       titlePDF += '_MINGGUAN';
       periodText = `Periode: 7 Hari Terakhir`;
    } else if (exportPeriode === 'bulanan') {
       const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
       dataToExport = dataToExport.filter(l => parseDate(l.tanggal) >= lastMonth);
       titlePDF += '_BULANAN';
       periodText = `Periode: 30 Hari Terakhir`;
    } else if (exportPeriode === 'kustom' && exportStartDate && exportEndDate) {
       const start = new Date(exportStartDate);
       const end = new Date(exportEndDate);
       end.setHours(23, 59, 59, 999);
       dataToExport = dataToExport.filter(l => {
          const d = parseDate(l.tanggal);
          return d >= start && d <= end;
       });
       titlePDF += `_${exportStartDate}_sd_${exportEndDate}`;
       periodText = `Periode: ${exportStartDate} s/d ${exportEndDate}`;
    } else {
       titlePDF += '_SEMUA';
       periodText = 'Periode: Semua Waktu';
    }

    // Filter By Area
    if (exportArea !== 'All') {
       dataToExport = dataToExport.filter(l => l.area === exportArea);
       titlePDF += `_${exportArea.replace(/\s+/g, '_')}`;
    }

    if (dataToExport.length === 0) {
       Swal.fire('Info', 'Tidak ada data laporan untuk filter yang dipilih.', 'info');
       return;
    }

    // Tambah tanggal tarik ke nama file
    const tarikDate = now.toISOString().slice(0, 10);
    titlePDF += `_${tarikDate}`;

    // Kop Surat
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PT NEW KARYA PROPERTI', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Jalan Kruing 1 No 29 BAS RT 001/RW 006, Cirebon Girang', pageWidth / 2, 25, { align: 'center' });
    doc.text('Kec. Talun, Kab. Cirebon Jawa Barat 45171', pageWidth / 2, 30, { align: 'center' });
    doc.text('Telp (085720302972) Email : KaryaInnovationProperty', pageWidth / 2, 35, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(14, 38, 196, 38);
    
    // Judul
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN PEKERJAAN (MAINTENANCE)', 14, 48);
    
    // Surat Pembuka
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Kepada Yth.', 14, 58);
    doc.text('PT MULTIPRATAMA INDAHRAYA', 14, 63);
    
    doc.text('Dengan hormat,', 14, 73);
    doc.text('Bersama surat ini kami sampaikan laporan kegiatan pekerjaan yang telah dilaksanakan', 14, 83);
    doc.text(periodText + '. Dengan rincian sebagai berikut:', 14, 88);
    
    // I. RINGKASAN
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246); // Blue
    doc.text('I. RINGKASAN PEKERJAAN', 14, 98);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Kegiatan pekerjaan telah dilaksanakan mencakup pemeliharaan preventif serta tindakan', 14, 105);
    doc.text('korektif, baik yang terjadwal maupun berdasarkan laporan kerusakan di lapangan.', 14, 110);
    
    // II. RINCIAN PREVENTIF
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    const areaLabel = exportArea !== 'All' ? exportArea.toUpperCase() : 'GRAGE CITY MALL';
    doc.text(`II. RINCIAN PEKERJAAN PREVENTIF AREA ${areaLabel}`, 14, 125);
    
    // Prepare Data for AutoTable - sort by date ascending
    const sortedData = [...dataToExport].sort((a, b) => parseDate(a.tanggal) - parseDate(b.tanggal));
    const preventifData = sortedData.filter(l => l.kategori?.toLowerCase().includes('preventive')).map((l, i) => [
      i + 1, l.tanggal, l.deskripsi || l.judul || '-', 'Preventif', l.lokasi, l.temuan || '-', l.photo || '', getStatusLabel(l.status)
    ]);
    const korektifData = sortedData.filter(l => l.kategori?.toLowerCase().includes('corrective')).map((l, i) => [
      i + 1, l.tanggal, l.deskripsi || l.judul || '-', 'Korektif', l.lokasi, l.temuan || '-', l.photo || '', getStatusLabel(l.status)
    ]);
    
    // Preventif Table
    autoTable(doc, {
      startY: 130,
      head: [['NO', 'Tanggal Pekerjaan', 'Uraian Pekerjaan', 'Jenis Pekerjaan', 'Lokasi', 'Temuan', 'Dokumentasi', 'Keterangan']],
      body: preventifData.length > 0 ? preventifData.map(row => [row[0], row[1], row[2], row[3], row[4], row[5] || '-', '', row[7]]) : [['-', '-', '-', '-', '-', '-', '-', '-']],
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0,0,0], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { minCellHeight: 35 },
      columnStyles: { 6: { cellWidth: 28 } },
      didDrawCell: function(data) {
        if (data.section === 'body' && data.column.index === 6 && preventifData.length > 0) {
          const rowData = preventifData[data.row.index];
          if (rowData && rowData[6] && rowData[6].length > 50) {
            try { 
              let imgFormat = 'JPEG';
              if (rowData[6].includes('image/png')) imgFormat = 'PNG';
              let base64str = rowData[6];
              if (base64str.includes(',')) base64str = base64str.split(',')[1];
              const cellW = data.cell.width - 6;
              const cellH = data.cell.height - 6;
              const imgSize = Math.min(cellW, cellH, 28);
              const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
              const imgY = data.cell.y + (data.cell.height - imgSize) / 2;
              doc.addImage(base64str, imgFormat, imgX, imgY, imgSize, imgSize); 
            } catch(e) { 
              console.error(e);
            }
          }
        }
      }
    });

    // Korektif Table
    let nextY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 15 : 150;
    
    // Check if space left
    if (nextY > 250) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(`III. RINCIAN PEKERJAAN KOREKTIF AREA ${areaLabel}`, 14, nextY);
    
    autoTable(doc, {
      startY: nextY + 5,
      head: [['NO', 'Tanggal Pekerjaan', 'Uraian Pekerjaan', 'Jenis Pekerjaan', 'Lokasi', 'Temuan', 'Dokumentasi', 'Keterangan']],
      body: korektifData.length > 0 ? korektifData.map(row => [row[0], row[1], row[2], row[3], row[4], row[5] || '-', '', row[7]]) : [['-', '-', '-', '-', '-', '-', '-', '-']],
      styles: { fontSize: 8, cellPadding: 3, valign: 'middle', halign: 'center', lineColor: [0, 0, 0], lineWidth: 0.1 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0,0,0], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { minCellHeight: 35 },
      columnStyles: { 6: { cellWidth: 28 } },
      didDrawCell: function(data) {
        if (data.section === 'body' && data.column.index === 6 && korektifData.length > 0) {
          const rowData = korektifData[data.row.index];
          if (rowData && rowData[6] && rowData[6].length > 50) {
            try { 
              let imgFormat = 'JPEG';
              if (rowData[6].includes('image/png')) imgFormat = 'PNG';
              let base64str = rowData[6];
              if (base64str.includes(',')) base64str = base64str.split(',')[1];
              const cellW = data.cell.width - 6;
              const cellH = data.cell.height - 6;
              const imgSize = Math.min(cellW, cellH, 28);
              const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
              const imgY = data.cell.y + (data.cell.height - imgSize) / 2;
              doc.addImage(base64str, imgFormat, imgX, imgY, imgSize, imgSize); 
            } catch(e) { 
              console.error(e);
            }
          }
        }
      }
    });

    // Page 2: Rencana & Kesimpulan
    doc.addPage();
    let page2Y = 20;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('IV. RENCANA KERJA PREVENTIF', 14, page2Y);
    page2Y += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('1. Pemeriksaan Komponen Utama', 14, page2Y); page2Y += 5;
    doc.text('   Indoor: Evaporator coil, blower fan & motor, sensor suhu (thermistor), dan kelistrikan.', 14, page2Y); page2Y += 5;
    doc.text('   Outdoor: Kondensor coil, kipas & motor outdoor, komponen kelistrikan, service valve.', 14, page2Y); page2Y += 5;
    doc.text('2. Pembersihan Unit AC', 14, page2Y); page2Y += 5;
    doc.text('   Membersihkan komponen indoor (filter, evaporator coil, drainase) dan outdoor.', 14, page2Y); page2Y += 5;
    doc.text('   Prosedur aman: matikan listrik, hindari air ke komponen listrik.', 14, page2Y); page2Y += 5;
    doc.text('3. Pengecekan Sistem Listrik & Refrigerant', 14, page2Y); page2Y += 5;
    doc.text('   Cek voltase, ampere, dan tekanan refrigerant dengan alat ukur.', 14, page2Y); page2Y += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('V. RENCANA KERJA KOREKTIF', 14, page2Y);
    page2Y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('1. Pergantian insulation pipa refrigerant untuk seluruh unit tipe split duct', 14, page2Y); page2Y += 5;
    doc.text('2. Perapihan kabel tumpur dan komunikasi untuk seluruh unit tipe split duct', 14, page2Y); page2Y += 5;
    doc.text('3. Pengecetan aksesoris korosi atau bodi ac yang berkarat untuk seluruh unit tipe split duct', 14, page2Y); page2Y += 5;
    doc.text('4. Pemasangan dan perbaikan filter udara untuk seluruh unit tipe split duct', 14, page2Y); page2Y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('VI. KESIMPULAN', 14, page2Y);
    page2Y += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('- Pekerjaan preventif telah berjalan sesuai jadwal dan prosedur standar.', 14, page2Y); page2Y += 5;
    doc.text('- Pekerjaan korektif telah diselesaikan berdasarkan laporan kerusakan.', 14, page2Y); page2Y += 10;
    
    doc.text('Demikian laporan bulanan ini kami buat sebagai bentuk pertanggungjawaban pelaksanaan', 14, page2Y); page2Y += 5;
    doc.text('pekerjaan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.', 14, page2Y); page2Y += 25;

    // Signatures
    doc.text('PIHAK KEDUA', 14, page2Y);
    doc.text('MENYETUJUI', 120, page2Y); page2Y += 5;
    doc.text('PT NEW KARYA PROPERTI', 14, page2Y);
    doc.text('PT MULTIPRATAMA INDAHRAYA', 120, page2Y); page2Y += 30;
    
    doc.text('Akhmad Mujahiddin Alwi, S.T.', 14, page2Y);
    doc.text('Sutrisno', 120, page2Y); page2Y += 5;
    doc.text('Direktur', 14, page2Y);
    doc.text('Ops. Manager', 120, page2Y);

      doc.save(titlePDF + '.pdf');
      setIsExportModalOpen(false);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: `Laporan (${periodText}) telah dicetak!`, timer: 2000, showConfirmButton: false });
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: 'error', title: 'Gagal Export', text: 'Terjadi kesalahan sistem: ' + e.message });
    }
  };

  const handleView = (item) => {
    let paramsHtml = '';
    if (item.laporan_ac_parameters && item.laporan_ac_parameters.length > 0) {
      const p = item.laporan_ac_parameters[0];
      
      const photoThumb = (src) => {
        if (!src) return '';
        return `<img src="${src}" class="w-10 h-10 object-cover rounded border border-gray-200 mt-1" />`;
      };
      const ph = p.acPhotos || {};

      paramsHtml = `
        <div class="mt-4 border-t pt-4">
          <h4 class="font-bold mb-3">Parameter AC:</h4>
          
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="bg-gray-50 p-2 rounded">
              <strong>Voltase RS:</strong> ${p.voltaseRS || p.voltase_rs || '-'} ${photoThumb(ph.voltaseRS)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Voltase RT:</strong> ${p.voltaseRT || p.voltase_rt || '-'} ${photoThumb(ph.voltaseRT)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Voltase ST:</strong> ${p.voltaseST || p.voltase_st || '-'} ${photoThumb(ph.voltaseST)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Ampere R:</strong> ${p.ampereR || p.ampere_r || '-'} ${photoThumb(ph.ampereR)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Ampere S:</strong> ${p.ampereS || p.ampere_s || '-'} ${photoThumb(ph.ampereS)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Ampere T:</strong> ${p.ampereT || p.ampere_t || '-'} ${photoThumb(ph.ampereT)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Suhu:</strong> ${p.suhu || '-'} ${photoThumb(ph.suhu)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Tekanan Low:</strong> ${p.pressLow || p.tekanan_low || '-'} ${photoThumb(ph.pressLow)}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Tekanan High:</strong> ${p.pressHigh || p.tekanan_high || '-'} ${photoThumb(ph.pressHigh)}
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div class="bg-gray-50 p-2 rounded">
              <strong>Indoor PCB:</strong> ${p.inPCB || p.indoor_pcb || '-'}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Indoor Motor Fan:</strong> ${p.inMotor || p.indoor_motor_fan || '-'}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Indoor Sensor:</strong> ${p.inSensor || p.indoor_sensor_thermist || '-'}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Indoor Vanbelt:</strong> ${p.inVanbelt || p.indoor_vanbelt || '-'}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Outdoor Kompressor:</strong> ${p.outKompresor || p.outdoor_kompressor || '-'}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Outdoor Protect Phase:</strong> ${p.outProtect || p.outdoor_protect_phase || '-'}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Outdoor Kontraktor:</strong> ${p.outKontraktor || p.outdoor_kontraktor || '-'}
            </div>
            <div class="bg-gray-50 p-2 rounded">
              <strong>Outdoor Motor Fan:</strong> ${p.outMotor || p.outdoor_motor_fan || '-'}
            </div>
          </div>
        </div>
      `;
    }

    Swal.fire({
      title: `Detail Laporan ${item.id}`,
      html: `
        <div class="text-left space-y-2 mt-4 text-sm">
          <p><strong>Judul:</strong> ${item.judul || '-'}</p>
          <p><strong>Tanggal:</strong> ${item.tanggal}</p>
          <p><strong>Jam:</strong> ${item.jam || '-'}</p>
          <p><strong>Area:</strong> ${item.area}</p>
          <p><strong>Lokasi/Mesin:</strong> ${item.lokasi}</p>
          <p><strong>Kategori:</strong> <span class="text-primary font-bold">${item.kategori}</span></p>
          <p><strong>Petugas:</strong> ${item.petugas}</p>
          <p><strong>Status:</strong> ${item.status}</p>
          <p><strong>Deskripsi:</strong> ${item.deskripsi || '-'}</p>
          <p><strong>Temuan:</strong> ${item.temuan || '-'}</p>
          ${paramsHtml}
          ${item.photo ? `
            <div class="mt-4 border-t pt-4">
              <h4 class="font-bold mb-2">Foto Bukti:</h4>
              <img src="${item.photo}" alt="Bukti Laporan" class="w-full max-h-64 object-contain rounded-lg border border-gray-200" />
            </div>
          ` : ''}
        </div>
      `,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#2563EB',
      width: '700px',
      customClass: { popup: 'swal2-popup-custom' }
    });
  };

  const handleEdit = async (item) => {
    if (isTeknisi || canEditStatus) {
      navigate('/dashboard/laporan/baru', { state: { editMode: true, laporan: item } });
      return;
    }
  };

  const handleChangeStatus = async (item) => {
    const { value: status } = await Swal.fire({
      title: `Ubah Status ${item.id}`,
      input: 'select',
      inputOptions: {
        'Pending': 'Pending',
        'Approved': 'Disetujui',
        'Revision': 'Revisi',
        'Completed': 'Selesai'
      },
      inputPlaceholder: 'Pilih status baru',
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      confirmButtonColor: '#2563EB',
      cancelButtonText: 'Batal'
    });

    if (status) {
      try {
        await api.put(`/laporan/${item.db_id}/status`, { status });
        Swal.fire('Berhasil', 'Status laporan telah diperbarui.', 'success');
        fetchLaporan();
      } catch (error) {
        Swal.fire('Error', 'Gagal memperbarui status', 'error');
      }
    }
  };

  const handleDelete = (item) => {
    Swal.fire({
      title: 'Hapus Laporan?',
      text: `Anda yakin ingin menghapus laporan ${item.id}? Data yang dihapus tidak dapat dikembalikan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/laporan/${item.db_id}`);
          Swal.fire('Terhapus!', `Laporan ${item.id} telah dihapus.`, 'success');
          fetchLaporan();
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus laporan', 'error');
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Swal.fire({
      title: `Hapus ${selectedIds.length} Laporan?`,
      text: 'Data yang dihapus secara massal tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#9CA3AF',
      confirmButtonText: 'Ya, Hapus Semua!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await Promise.all(selectedIds.map(db_id => api.delete(`/laporan/${db_id}`)));
          Swal.fire('Terhapus!', `${selectedIds.length} laporan telah dihapus.`, 'success');
          setSelectedIds([]);
          fetchLaporan();
        } catch (error) {
          Swal.fire('Error', 'Gagal menghapus beberapa laporan', 'error');
          fetchLaporan();
        }
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredLaporan.map(item => item.db_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (db_id) => {
    if (selectedIds.includes(db_id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== db_id));
    } else {
      setSelectedIds([...selectedIds, db_id]);
    }
  };

  const handleDownload = (item) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PT NEW KARYA PROPERTI', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Jalan Kruing 1 No 29 BAS RT 001/RW 006, Cirebon Girang', 14, 25);
    doc.text('Kec. Talun, Kab. Cirebon Jawa Barat 45171', 14, 30);
    doc.setLineWidth(0.5);
    doc.line(14, 33, 196, 33);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detail Laporan Pekerjaan', 14, 43);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID Laporan: ${item.id}`, 14, 55);
    doc.text(`Judul: ${item.judul || '-'}`, 14, 62);
    doc.text(`Tanggal: ${item.tanggal}`, 14, 69);
    doc.text(`Jam: ${item.jam || '-'}`, 14, 76);
    doc.text(`Area: ${item.area}`, 14, 83);
    doc.text(`Lokasi / Mesin: ${item.lokasi}`, 14, 90);
    doc.text(`Kategori: ${item.kategori}`, 14, 97);
    doc.text(`Petugas: ${item.petugas}`, 14, 104);
    doc.text(`Status: ${item.status}`, 14, 111);
    
    let finalY = 118;
    if (item.deskripsi) {
      doc.setFont('helvetica', 'bold');
      doc.text('Deskripsi:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(item.deskripsi, 90);
      doc.text(descLines, 14, finalY + 5);
      finalY += 5 + descLines.length * 5;
    }
    
    if (item.temuan) {
      finalY += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Temuan:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      const temuanLines = doc.splitTextToSize(item.temuan, 90);
      doc.text(temuanLines, 14, finalY + 5);
      finalY += 5 + temuanLines.length * 5;
    }
    
    if (item.photo) {
      try {
        let imgFormat = 'JPEG';
        if (item.photo.includes('image/png')) imgFormat = 'PNG';
        let base64str = item.photo;
        if (base64str.includes(',')) base64str = base64str.split(',')[1];
        doc.addImage(base64str, imgFormat, 110, 55, 80, 80);
      } catch (e) {
        doc.text('(Foto gagal dimuat)', 110, 55);
      }
    }
    
    doc.setLineWidth(0.5);
    doc.line(14, 210, 196, 210);
    
    doc.setFontSize(10);
    doc.text('Dicetak otomatis oleh Sistem Enterprise Maintenance', 14, 220);

    doc.save(`${item.id}.pdf`);
    
    Swal.fire({
      icon: 'success',
      title: 'Berhasil Diunduh',
      text: `File ${item.id}.pdf berhasil disimpan di perangkat Anda.`,
      timer: 2000,
      showConfirmButton: false
    });
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

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-success/20 text-success';
      case 'pending': return 'bg-warning/20 text-warning';
      case 'completed': return 'bg-primary/20 text-primary';
      case 'revision': return 'bg-danger/20 text-danger';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getKategoriStyle = (kategori) => {
    switch (kategori?.toLowerCase()) {
      case 'preventive': return 'border-primary text-primary';
      case 'corrective': return 'border-warning text-warning';
      case 'emergency': return 'border-danger text-danger';
      default: return 'border-gray-500 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Laporan Maintenance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola, filter, dan ekspor data laporan pekerjaan</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={fetchLaporan}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            title="Muat Ulang"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canDelete && selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center px-4 py-2 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-20 font-bold rounded-lg shadow-sm hover:bg-opacity-20 transition-all animate-fade-in"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Hapus ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 font-medium rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
            Tarik Data Laporan
          </button>
          {canCreate && (
            <button 
              onClick={handleBuatLaporan}
              className="flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-opacity-90 hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Buat Laporan
            </button>
          )}
        </div>
      </div>

      <div className="glass rounded-xl border border-gray-100 dark:bg-gray-900 dark:border-gray-800 shadow-sm overflow-hidden">
        
        {/* Filters Section */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 bg-opacity-40 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 md:flex-none">
              <FunnelIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
              <select 
                className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 w-full"
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
              >
                <option value="All">Semua Kategori</option>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
            
            <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 flex-1 md:flex-none">
              <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 mr-2"></span>
              <select 
                className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Disetujui</option>
                <option value="Revision">Revisi</option>
                <option value="Completed">Selesai</option>
              </select>
            </div>
          </div>

          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 w-full md:w-72 shadow-sm">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
            <input 
              type="text" 
              placeholder="Cari ID, Area, Lokasi..." 
              className="bg-transparent border-none outline-none text-sm w-full text-gray-700 dark:text-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center items-center py-12">
               <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
               <span className="ml-2 text-gray-500 dark:text-gray-400">Memuat data laporan...</span>
             </div>
          ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-left">
                  {canDelete && (
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      onChange={handleSelectAll}
                      checked={filteredLaporan.length > 0 && selectedIds.length === filteredLaporan.length}
                    />
                  )}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID Laporan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Area / Lokasi</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Petugas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-transparent">
              {paginatedLaporan.map((item) => (
                <tr key={item.db_id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150 ${selectedIds.includes(item.db_id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canDelete && (
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={selectedIds.includes(item.db_id)}
                        onChange={() => handleSelectOne(item.db_id)}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{item.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {item.tanggal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">{item.lokasi}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.area}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-semibold border rounded-full ${getKategoriStyle(item.kategori)}`}>
                      {item.kategori}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                        {item.petugas ? item.petugas.charAt(0) : '?'}
                      </div>
                      {item.petugas}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex justify-center space-x-3">
                      <button 
                        onClick={() => handleView(item)}
                        className="text-gray-400 hover:text-primary transition-colors cursor-pointer" 
                        title="Lihat Detail"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      {canEditStatus && (
                        <button 
                          onClick={() => handleEdit(item)}
                          className="text-gray-400 hover:text-secondary transition-colors cursor-pointer" 
                          title="Edit Laporan"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      {canEditStatus && (
                        <button 
                          onClick={() => handleChangeStatus(item)}
                          className="text-gray-400 hover:text-amber-500 transition-colors cursor-pointer" 
                          title="Ubah Status"
                        >
                          <ArrowPathIcon className="w-5 h-5" />
                        </button>
                      )}
                      {isTeknisi && (item.status || '').toLowerCase() === 'revision' && (
                        <button 
                          onClick={() => handleEdit(item)}
                          className="text-gray-400 hover:text-secondary transition-colors cursor-pointer" 
                          title="Edit Laporan"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDownload(item)}
                        className="text-gray-400 hover:text-success transition-colors cursor-pointer" 
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                      </button>
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(item)}
                          className="text-gray-400 hover:text-danger transition-colors cursor-pointer" 
                          title="Hapus Laporan"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLaporan.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada laporan yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>
        
        {/* Pagination Section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 bg-opacity-40 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <span>Menampilkan {filteredLaporan.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} hingga {Math.min(currentPage * itemsPerPage, filteredLaporan.length)} dari {filteredLaporan.length} data</span>
          <div className="flex items-center gap-1 mt-4 sm:mt-0">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-xs font-medium"
            >Sebelumnya</button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors ${currentPage === page ? 'border-primary bg-primary text-white' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >{page}</button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="text-gray-400 text-xs px-1">...</span>;
              }
              return null;
            })}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-xs font-medium"
            >Selanjutnya</button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <ArrowDownTrayIcon className="w-6 h-6 mr-2 text-primary" />
                Tarik Data (Export PDF)
              </h3>
              <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Periode Tarikan Data</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setExportPeriode('harian')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${exportPeriode === 'harian' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    Hari Ini (Harian)
                  </button>
                  <button 
                    onClick={() => setExportPeriode('mingguan')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${exportPeriode === 'mingguan' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    7 Hari (Mingguan)
                  </button>
                  <button 
                    onClick={() => setExportPeriode('bulanan')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${exportPeriode === 'bulanan' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    30 Hari (Bulanan)
                  </button>
                  <button 
                    onClick={() => setExportPeriode('kustom')}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${exportPeriode === 'kustom' ? 'bg-primary/10 border-primary text-primary' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    Rentang Kustom
                  </button>
                </div>
              </div>

              {exportPeriode === 'kustom' && (
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Dari Tanggal</label>
                    <input 
                      type="date" 
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Sampai Tanggal</label>
                    <input 
                      type="date" 
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Area</label>
                <select 
                  value={exportArea}
                  onChange={(e) => setExportArea(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-primary"
                >
                  <option value="All">Semua Area</option>
                  {[...new Set(laporan.map(l => l.area).filter(l => l && l !== '-'))].sort().map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-md hover:bg-opacity-90 hover:shadow-lg transition-all"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
