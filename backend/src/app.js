require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: true, // Allow all origins to bypass CORS issues on VPS
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Static files
app.use('/public', express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
const authRoutes = require('./routes/authRoutes');
const areaRoutes = require('./routes/areaRoutes');
const lokasiRoutes = require('./routes/lokasiRoutes');
const userRoutes = require('./routes/userRoutes');
const laporanRoutes = require('./routes/laporanRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Base Route
app.use('/api/auth', authRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/lokasi', lokasiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Enterprise Maintenance Management API is running',
        data: null
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        data: null
    });
});

module.exports = app;
