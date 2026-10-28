const { db } = require('../config/db');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database.sqlite');

const ALLOWED_TABLES = ['areas', 'lokasi', 'users', 'laporan', 'laporan_ac_parameters', 'kategori'];

const resetTable = (req, res) => {
    const { table } = req.params;

    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(400).json({ success: false, message: 'Tabel tidak valid.', data: null });
    }

    db.run(`DELETE FROM ${table}`, function (err) {
        if (err) {
            console.error('Reset error:', err);
            return res.status(500).json({ success: false, message: `Gagal mereset tabel ${table}.`, data: null });
        }
        res.json({ success: true, message: `Semua data ${table} berhasil dihapus.`, data: { deleted: this.changes } });
    });
};

const resetAll = (req, res) => {
    db.serialize(() => {
        db.run('PRAGMA foreign_keys = OFF');
        const tables = ['laporan_ac_parameters', 'laporan', 'lokasi', 'areas', 'users'];
        let completed = 0;
        let hasError = false;

        tables.forEach((table) => {
            db.run(`DELETE FROM ${table}`, function (err) {
                if (err && !hasError) {
                    hasError = true;
                    db.run('PRAGMA foreign_keys = ON');
                    return res.status(500).json({ success: false, message: `Gagal mereset tabel ${table}.`, data: null });
                }
                completed++;
                if (completed === tables.length) {
                    db.run('PRAGMA foreign_keys = ON');
                    res.json({ success: true, message: 'Semua data berhasil direset.', data: null });
                }
            });
        });
    });
};

const backupDatabase = (req, res) => {
    if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ success: false, message: 'File database tidak ditemukan.', data: null });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.sqlite`;

    res.setHeader('Content-Disposition', `attachment; filename="${backupName}"`);
    res.setHeader('Content-Type', 'application/x-sqlite3');

    const stream = fs.createReadStream(dbPath);
    stream.pipe(res);
};

const restoreDatabase = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'File backup tidak ditemukan.', data: null });
    }

    const uploadedPath = req.file.path;

    try {
        const backupExists = fs.existsSync(uploadedPath);
        if (!backupExists) {
            return res.status(400).json({ success: false, message: 'File upload tidak valid.', data: null });
        }

        fs.copyFileSync(uploadedPath, dbPath);
        fs.unlinkSync(uploadedPath);

        res.json({ success: true, message: 'Database berhasil dipulihkan. Silakan muat ulang halaman.', data: null });
    } catch (err) {
        console.error('Restore error:', err);
        if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
        res.status(500).json({ success: false, message: 'Gagal memulihkan database.', data: null });
    }
};

module.exports = { resetTable, resetAll, backupDatabase, restoreDatabase };
