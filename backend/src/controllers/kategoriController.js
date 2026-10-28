const supabase = require('../config/supabase');

// Get All Kategori
const getKategori = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('kategori')
            .select('*')
            .order('nama', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            message: 'Kategori retrieved successfully',
            data
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
};

module.exports = {
    getKategori
};
