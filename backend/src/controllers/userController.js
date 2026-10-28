const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');

// GET /api/users
const getUsers = async (req, res, next) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id, fullname, email, phone, avatar, status,
                roles ( id, name )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ success: true, message: 'Users retrieved', data: users });
    } catch (error) {
        next(error);
    }
};

// POST /api/users
const createUser = async (req, res, next) => {
    try {
        const { fullname, email, password, phone, role, status } = req.body;

        // Fetch role_id by name
        const { data: rolesData, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', role || 'Viewer')
            .limit(1);

        if (roleError || !rolesData || rolesData.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid role provided', data: null });
        }
        const role_id = rolesData[0].id;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || 'password123', salt);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                fullname,
                email,
                password: hashedPassword,
                phone,
                role_id,
                status: status || 'ACTIVE'
            }])
            .select();

        if (error) {
            // Handle unique constraint on email
            if (error.code === '23505') {
                return res.status(400).json({ success: false, message: 'Email already exists', data: null });
            }
            throw error;
        }

        res.status(201).json({ success: true, message: 'User created successfully', data: data[0] });
    } catch (error) {
        next(error);
    }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fullname, email, phone, role, status, password } = req.body;

        const updates = { fullname, email, phone, status };

        if (role) {
            const { data: rolesData, error: roleError } = await supabase
                .from('roles')
                .select('id')
                .eq('name', role)
                .limit(1);
            if (!roleError && rolesData && rolesData.length > 0) {
                updates.role_id = rolesData[0].id;
            }
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(password, salt);
        }

        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        
        if (data.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found', data: null });
        }

        res.json({ success: true, message: 'User updated successfully', data: data[0] });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;

        if (data.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found', data: null });
        }

        res.json({ success: true, message: 'User deleted successfully', data: data[0] });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};
