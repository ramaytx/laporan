const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required', data: null });
        }

        // Fetch user from Supabase using service role key
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id, fullname, email, password, status,
                roles ( name )
            `)
            .eq('email', email)
            .limit(1);

        if (error) throw error;

        const user = users && users.length > 0 ? users[0] : null;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
        }

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ success: false, message: 'Account is not active', data: null });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials', data: null });
        }

        // Generate tokens
        const tokenUser = {
            id: user.id,
            email: user.email,
            role_name: user.roles?.name || 'Viewer'
        };

        const { accessToken, refreshToken } = generateTokens(tokenUser);

        // Store refresh token in HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Save Audit Log
        await supabase.from('audit_logs').insert([{
            user_id: user.id,
            activity: 'User logged in',
            ip: req.ip || req.connection.remoteAddress,
            browser: req.headers['user-agent']
        }]);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                    role: tokenUser.role_name
                },
                accessToken
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: 'Internal server error', data: null });
    }
};

const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token not found', data: null });
        }

        const decoded = verifyRefreshToken(refreshToken);
        
        // Generate new tokens
        const tokenUser = {
            id: decoded.id,
            email: decoded.email,
            role_name: decoded.role
        };
        const tokens = generateTokens(tokenUser);

        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: { accessToken: tokens.accessToken }
        });

    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid refresh token', data: null });
    }
};

const logout = async (req, res) => {
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logout successful', data: null });
};

module.exports = {
    login,
    refresh,
    logout
};
