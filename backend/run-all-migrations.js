require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://postgres.hwrbmnbvlduoitmobeuk:Rama089650379710!@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
});

const runMigrations = async () => {
  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected!');

    const migrations = [
      '00000_initial_schema.sql',
      '00001_add_ac_parameters.sql',
      '00002_add_temuan_column.sql'
    ];

    for (const file of migrations) {
      const sqlPath = path.join(__dirname, 'supabase', 'migrations', file);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      try {
        console.log(`Executing ${file}...`);
        await client.query(sql);
        console.log(`${file} done!`);
      } catch (e) {
        if (e.code === '42701') {
          console.log(`${file} - already exists, skipping.`);
        } else {
          console.error(`${file} - ERROR: ${e.message}`);
        }
      }
    }

    await client.end();
    console.log('All migrations completed!');
  } catch (error) {
    console.error('Connection failed:', error.message);
    await client.end();
  }
};

runMigrations();
