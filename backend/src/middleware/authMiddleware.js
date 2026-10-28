const { verifyAccessToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Authentication required. Token missing.', data: null });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        
        req.user = decoded;
        req.user._method = req.method;
        req.user._path = req.originalUrl;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired.', data: null });
        }
        console.error('Auth error:', error.message);
        return res.status(401).json({ success: false, message: 'Invalid token.', data: null });
    }
};

module.exports = { authenticate };
