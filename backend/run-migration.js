const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = 'postgresql://postgres.hwrbmnbvlduoitmobeuk:Rama089650379710!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

const runMigration = async () => {
    const client = new Client({
        connectionString,
    });

    try {
        console.log('Connecting to Supabase PostgreSQL...');
        await client.connect();
        console.log('Connected!');

        const sqlPath = path.join(__dirname, 'supabase', 'migrations', '00002_add_temuan_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing migration script...');
        await client.query(sql);
        console.log('Migration executed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.end();
        console.log('Connection closed.');
    }
};

runMigration();
