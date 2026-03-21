const pool = require('./pool');
const { schema, alterStatements } = require('./schema');

async function safeAlter(sql) {
  try {
    await pool.query(sql);
  } catch (err) {
    const message = String(err.message || '').toLowerCase();
    if (message.includes('duplicate column') || message.includes('already exists')) {
      return;
    }
    throw err;
  }
}

async function migrate() {
  try {
    console.log('Running database migrations...');
    await pool.query(schema);
    for (const stmt of alterStatements) {
      await safeAlter(stmt);
    }
    console.log('Migrations complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
