const supabase = require('../config/supabase');

// GET /api/laporan
const getLaporan = async (req, res, next) => {
    try {
        const userRole = (req.user.role || '').toLowerCase();

        let query = supabase
            .from('laporan')
            .select(`
                id, laporan_no, tanggal, jam, judul, deskripsi, status, created_at,
                kategori ( id, nama ),
                areas ( id, nama_area ),
                lokasi_id,
                petugas:users!laporan_petugas_id_fkey ( id, fullname, email )
            `)
            .order('created_at', { ascending: false });

        // Teknisi hanya bisa lihat laporannya sendiri
        if (userRole === 'teknisi') {
            query = query.eq('petugas_id', req.user.id);
        }

        const { data: laporan, error } = await query;

        if (error) throw error;

        // Fetch lokasi separately
        const lokasiIds = [...new Set((laporan || []).map(l => l.lokasi_id).filter(Boolean))];
        let lokasiMap = {};
        if (lokasiIds.length > 0) {
            const { data: lokasiData } = await supabase
                .from('lokasi')
                .select('id, nama_lokasi')
                .in('id', lokasiIds);
            if (lokasiData) {
                lokasiMap = Object.fromEntries(lokasiData.map(l => [l.id, l]));
            }
        }

        const enriched = (laporan || []).map(l => ({
            ...l,
            lokasi: lokasiMap[l.lokasi_id] || null
        }));

        res.json({ success: true, message: 'Laporan retrieved', data: enriched });
    } catch (error) {
        next(error);
    }
};

// POST /api/laporan
const createLaporan = async (req, res, next) => {
    try {
        const { 
            tanggal, jam, judul, deskripsi, temuan,
            kategori_id, area_id, lokasi_id, petugas_id, status,
            acParams // Optional object containing AC parameters
        } = req.body;

        // Generate Laporan No
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const laporan_no = `LAP-${dateStr}-${randomNum}`;

        let finalDeskripsi = deskripsi;
        if (acParams && Object.keys(acParams).length > 0) {
            finalDeskripsi += '\n\n--- Parameter AC ---\n' + JSON.stringify(acParams, null, 2);
        }

        // 1. Insert ke tabel Laporan
        const { data: newLaporan, error: laporanError } = await supabase
            .from('laporan')
            .insert([{
                laporan_no, tanggal, jam, judul, deskripsi: finalDeskripsi,
                temuan: temuan || '',
                kategori_id, area_id, lokasi_id, petugas_id, 
                status: status || 'PENDING',
                created_by: req.user.id
            }])
            .select();

        if (laporanError) {
            console.error('Supabase insert error:', JSON.stringify(laporanError));
            throw new Error(`Database error: ${laporanError.message || JSON.stringify(laporanError)}`);
        }
        
        res.status(201).json({ success: true, message: 'Laporan created', data: newLaporan[0] });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/laporan/:id
const deleteLaporan = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Delete (Cascade takes care of related ac_parameters)
        const { data, error } = await supabase
            .from('laporan')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) {
            return res.status(404).json({ success: false, message: 'Laporan not found', data: null });
        }

        res.json({ success: true, message: 'Laporan deleted', data: data[0] });
    } catch (error) {
        next(error);
    }
};

// PUT /api/laporan/:id/status
const updateLaporanStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('laporan')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) {
            return res.status(404).json({ success: false, message: 'Laporan not found', data: null });
        }

        res.json({ success: true, message: 'Status updated', data: data[0] });
    } catch (error) {
        next(error);
    }
};

// PUT /api/laporan/:id
const updateLaporan = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tanggal, judul, deskripsi, temuan, kategori_id, area_id, lokasi_id, petugas_id, status, acParams } = req.body;

        // Cek apakah laporan milik user ini atau user adalah admin
        const userRole = (req.user.role || '').toLowerCase();
        if (userRole === 'teknisi') {
            const { data: existing } = await supabase
                .from('laporan')
                .select('petugas_id, status')
                .eq('id', id)
                .single();
            if (!existing || existing.petugas_id !== req.user.id) {
                return res.status(403).json({ success: false, message: 'Anda hanya bisa mengedit laporan sendiri', data: null });
            }
            if ((existing.status || '').toLowerCase() !== 'revision') {
                return res.status(403).json({ success: false, message: 'Laporan hanya bisa diedit saat status Revisi', data: null });
            }
        }

        let finalDeskripsi = deskripsi;
        if (acParams && Object.keys(acParams).length > 0) {
            finalDeskripsi += '\n\n--- Parameter AC ---\n' + JSON.stringify(acParams, null, 2);
        }

        const updateData = {};
        if (tanggal !== undefined) updateData.tanggal = tanggal;
        if (judul !== undefined) updateData.judul = judul;
        if (finalDeskripsi !== undefined) updateData.deskripsi = finalDeskripsi;
        if (temuan !== undefined) updateData.temuan = temuan;
        if (kategori_id !== undefined) updateData.kategori_id = kategori_id;
        if (area_id !== undefined) updateData.area_id = area_id;
        if (lokasi_id !== undefined) updateData.lokasi_id = lokasi_id;
        if (petugas_id !== undefined) updateData.petugas_id = petugas_id;
        if (status !== undefined) updateData.status = status;

        const { data, error } = await supabase
            .from('laporan')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) {
            return res.status(404).json({ success: false, message: 'Laporan not found', data: null });
        }

        res.json({ success: true, message: 'Laporan updated', data: data[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLaporan,
    createLaporan,
    updateLaporan,
    deleteLaporan,
    updateLaporanStatus
};
