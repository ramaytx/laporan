require('dotenv').config();
const bcrypt = require('bcrypt');
const supabase = require('./src/config/supabase');

const seedAdmin = async () => {
    try {
        console.log('Fetching Administrator role...');
        const { data: roles, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'Administrator')
            .limit(1);

        if (roleError) throw roleError;
        
        if (!roles || roles.length === 0) {
            console.log('Roles not found. Please run SQL migrations in Supabase Dashboard first.');
            return;
        }

        const roleId = roles[0].id;
        
        const email = 'admin@example.com';
        const password = 'admin';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Creating Admin user...');
        const { data, error } = await supabase
            .from('users')
            .insert([{
                fullname: 'Super Admin',
                email: email,
                password: hashedPassword,
                role_id: roleId,
                status: 'ACTIVE'
            }])
            .select();

        if (error) {
            if (error.code === '23505') {
                console.log('Admin user already exists!');
            } else {
                throw error;
            }
        } else {
            console.log('Admin user created successfully!');
            console.log('Email:', email);
            console.log('Password:', password);
        }

    } catch (error) {
        console.error('Seed error:', error);
    }
};

seedAdmin();
