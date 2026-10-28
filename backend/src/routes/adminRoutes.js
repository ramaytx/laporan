const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { resetTable, resetAll, backupDatabase, restoreDatabase } = require('../controllers/adminController');
const supabase = require('../config/supabase');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `restore-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// GET /api/admin/notifications
const getNotifications = async (req, res, next) => {
    try {
        const { data: laporan, error } = await supabase
            .from('laporan')
            .select(`
                id, laporan_no, judul, status, created_at,
                kategori ( nama ),
                lokasi ( nama_lokasi ),
                petugas:users!laporan_petugas_id_fkey ( fullname )
            `)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const notifications = (laporan || []).map((l, i) => ({
            id: l.id,
            title: l.status === 'PENDING' ? 'Laporan Baru' : `Status: ${l.status}`,
            message: `${l.petugas?.fullname || 'Teknisi'} mengajukan laporan "${l.judul || l.laporan_no}" - ${l.lokasi?.nama_lokasi || ''}`,
            kategori: l.kategori?.nama || '',
            status: l.status,
            created_at: l.created_at,
            isRead: i > 2,
        }));

        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.json({ success: true, message: 'Notifications retrieved', data: { notifications, unreadCount } });
    } catch (error) {
        next(error);
    }
};

router.get('/notifications', authenticate, getNotifications);
router.post('/reset/:table', authenticate, authorize('Administrator'), resetTable);
router.post('/reset-all', authenticate, authorize('Administrator'), resetAll);
router.post('/backup', authenticate, authorize('Administrator'), backupDatabase);
router.post('/restore', authenticate, authorize('Administrator'), upload.single('database'), restoreDatabase);

module.exports = router;
