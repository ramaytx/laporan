const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Enable foreign keys
            db.run("PRAGMA foreign_keys = ON;");

            // Roles
            db.run(`CREATE TABLE IF NOT EXISTS roles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Users
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                fullname TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                phone TEXT,
                avatar TEXT,
                role_id TEXT REFERENCES roles(id) ON DELETE RESTRICT,
                status TEXT DEFAULT 'ACTIVE',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Areas
            db.run(`CREATE TABLE IF NOT EXISTS areas (
                id TEXT PRIMARY KEY,
                nama_area TEXT NOT NULL,
                kode_area TEXT UNIQUE NOT NULL,
                deskripsi TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Lokasi
            db.run(`CREATE TABLE IF NOT EXISTS lokasi (
                id TEXT PRIMARY KEY,
                area_id TEXT REFERENCES areas(id) ON DELETE CASCADE,
                nama_lokasi TEXT NOT NULL,
                lantai TEXT,
                deskripsi TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Kategori
            db.run(`CREATE TABLE IF NOT EXISTS kategori (
                id TEXT PRIMARY KEY,
                nama TEXT NOT NULL UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Laporan
            db.run(`CREATE TABLE IF NOT EXISTS laporan (
                id TEXT PRIMARY KEY,
                laporan_no TEXT UNIQUE NOT NULL,
                tanggal TEXT NOT NULL,
                jam TEXT NOT NULL,
                judul TEXT NOT NULL,
                deskripsi TEXT,
                kategori_id TEXT REFERENCES kategori(id) ON DELETE RESTRICT,
                area_id TEXT REFERENCES areas(id) ON DELETE RESTRICT,
                lokasi_id TEXT REFERENCES lokasi(id) ON DELETE RESTRICT,
                petugas_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
                status TEXT DEFAULT 'DRAFT',
                created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Laporan AC Parameters
            db.run(`CREATE TABLE IF NOT EXISTS laporan_ac_parameters (
                id TEXT PRIMARY KEY,
                laporan_id TEXT REFERENCES laporan(id) ON DELETE CASCADE,
                voltase_rs TEXT, voltase_rt TEXT, voltase_st TEXT,
                ampere_r TEXT, ampere_s TEXT, ampere_t TEXT,
                suhu TEXT, tekanan_low TEXT, tekanan_high TEXT,
                indoor_pcb TEXT, indoor_motor_fan TEXT, indoor_sensor_thermist TEXT, indoor_vanbelt TEXT,
                outdoor_kompressor TEXT, outdoor_protect_phase TEXT, outdoor_kontraktor TEXT, outdoor_motor_fan TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            resolve();
        });
    });
};

module.exports = { db, initDb };
