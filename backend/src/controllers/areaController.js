const supabase = require('../config/supabase');

// Create Area
const createArea = async (req, res) => {
    try {
        const { nama_area, kode_area, deskripsi } = req.body;

        const { data, error } = await supabase
            .from('areas')
            .insert([{ nama_area, kode_area, deskripsi }])
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Area created successfully',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Get All Areas
const getAreas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('areas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            message: 'Areas retrieved successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Get Area by ID
const getAreaById = async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('areas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ success: false, message: 'Area not found', data: null });

        res.json({
            success: true,
            message: 'Area retrieved successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Update Area
const updateArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_area, kode_area, deskripsi } = req.body;

        const { data, error } = await supabase
            .from('areas')
            .update({ nama_area, kode_area, deskripsi })
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ success: false, message: 'Area not found', data: null });

        res.json({
            success: true,
            message: 'Area updated successfully',
            data: data[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

// Delete Area
const deleteArea = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('areas')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        if (data.length === 0) return res.status(404).json({ success: false, message: 'Area not found', data: null });

        res.json({
            success: true,
            message: 'Area deleted successfully',
            data: null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

module.exports = {
    createArea,
    getAreas,
    getAreaById,
    updateArea,
    deleteArea
};
