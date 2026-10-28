const supabase = require('../config/supabase');

// Create Lokasi
const createLokasi = async (req, res) => {
    try {
        const { nama_lokasi, area_id } = req.body;

        // Cek duplikat berdasarkan nama + area
        const { data: existing } = await supabase
            .from('lokasi')
            .select('id')
            .ilike('nama_lokasi', nama_lokasi)
            .eq('area_id', area_id)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Lokasi dengan nama yang sama sudah ada di area ini', data: existing[0] });
        }

        const { data, error } = await supabase
            .from('lokasi')
            .insert([{ nama_lokasi, area_id }])
            .select(`*, areas(nama_area)`);

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Lokasi created successfully',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Get All Lokasi
const getLokasi = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lokasi')
            .select(`*, areas(nama_area)`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            message: 'Lokasi retrieved successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Get Lokasi by ID
const getLokasiById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('lokasi')
            .select(`*, areas(nama_area)`)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, message: 'Lokasi not found', data: null });

        res.json({
            success: true,
            message: 'Lokasi retrieved successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Update Lokasi
const updateLokasi = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_lokasi, area_id } = req.body;

        const { data, error } = await supabase
            .from('lokasi')
            .update({ nama_lokasi, area_id })
            .eq('id', id)
            .select(`*, areas(nama_area)`);

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ success: false, message: 'Lokasi not found', data: null });

        res.json({
            success: true,
            message: 'Lokasi updated successfully',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Delete Lokasi
const deleteLokasi = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('lokasi')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ success: false, message: 'Lokasi not found', data: null });

        res.json({
            success: true,
            message: 'Lokasi deleted successfully',
            data: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

module.exports = {
    createLokasi,
    getLokasi,
    getLokasiById,
    updateLokasi,
    deleteLokasi
};
