const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ success: false, message: 'Access denied. No role provided.', data: null });
        }

        const userRole = String(req.user.role).trim().toLowerCase();

        if (userRole === 'administrator') {
            return next();
        }

        const isAllowed = allowedRoles.some(r => String(r).trim().toLowerCase() === userRole);
        if (isAllowed) {
            return next();
        }

        console.error(`[AUTH FAIL] ${req.method} ${req.originalUrl} role="${req.user.role}" roleHex=${Buffer.from(userRole).toString('hex')} allowed=${JSON.stringify(allowedRoles)}`);
        return res.status(403).json({ success: false, message: `Access denied. Role "${req.user.role}" tidak memiliki izin.`, data: null });
    };
};

module.exports = { authorize };
