/**
 * Hybrid DB Adapter
 * Uses `pg` Pool if POSTGRES_URL or DATABASE_URL is available (e.g., Vercel Prod).
 * Uses local `better-sqlite3` and SQL translation if disabled (Local Dev).
 */
const { Pool } = require('pg');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { schema, alterStatements } = require('./schema');

// --- POSTGRES CONFIG (Vercel Prod) ---
const pgUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
let pgPool = null;
let usePg = false;

if (pgUrl) {
  usePg = true;
  pgPool = new Pool({
    connectionString: pgUrl,
    ssl: pgUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });
}

// --- SQLITE CONFIG (Local Dev) ---
const DB_DIR = process.env.VERCEL
  ? '/tmp/ecommerce-planner'
  : path.join(__dirname, '../../../data');
const DB_PATH = path.join(DB_DIR, 'ecommerce.sqlite');

let _db = null;
let _schemaInitialized = false;

function getDbSQLite() {
  if (!_db) {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    _db.function('gen_random_uuid', () => uuidv4());
  }
  return _db;
}

function shouldIgnoreAlterError(err) {
  const message = String(err && err.message ? err.message : '').toLowerCase();
  return message.includes('duplicate column') || message.includes('already exists');
}

async function initializePgSchema() {
  try {
    await pgPool.query(schema);
    for (const alter of alterStatements) {
      try {
        await pgPool.query(alter);
      } catch (err) {
        if (!shouldIgnoreAlterError(err)) console.error('PG Alter Error:', err.message);
      }
    }
  } catch (err) {
    console.error('PG Schema Init Error:', err.message);
  }
}

function initializeSqliteSchema(db) {
  const translatedSchema = pgToSqlite(schema, []).sql;
  db.exec(translatedSchema);
  for (const alter of alterStatements) {
    try {
      const translatedAlter = pgToSqlite(alter, []).sql;
      db.exec(translatedAlter);
    } catch (err) {
      if (!shouldIgnoreAlterError(err)) throw err;
    }
  }
}

function pgToSqlite(sql, pgValues = []) {
  let out = sql;
  out = out.replace(/\bTIMESTAMPTZ\b/gi, 'TEXT');
  out = out.replace(/\bDECIMAL\(\d+,\s*\d+\)/gi, 'REAL');
  out = out.replace(/\bVARCHAR\(\d+\)/gi, 'TEXT');
  out = out.replace(/\bBOOLEAN\b/gi, 'INTEGER');
  out = out.replace(/\bDEFAULT\s+TRUE\b/gi, 'DEFAULT 1');
  out = out.replace(/\bDEFAULT\s+FALSE\b/gi, 'DEFAULT 0');
  out = out.replace(/\bTEXT\[\]/g, 'TEXT');
  out = out.replace(/\bUUID\b/gi, 'TEXT');
  out = out.replace(/DEFAULT\s+gen_random_uuid\(\)/gi, '');
  out = out.replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');
  out = out.replace(/EXTRACT\s*\(\s*YEAR\s+FROM\s+([A-Za-z_][A-Za-z0-9_.".]*)\s*\)/gi, "CAST(strftime('%Y', $1) AS INTEGER)");
  out = out.replace(/TO_CHAR\s*\(\s*([A-Za-z_][A-Za-z0-9_.".]*)\s*,\s*'YYYY-MM'\s*\)/gi, "strftime('%Y-%m', $1)");

  const newValues = [];
  out = out.replace(/\$(\d+)/g, (_, n) => {
    const val = pgValues[parseInt(n, 10) - 1];
    if (Array.isArray(val)) newValues.push(JSON.stringify(val));
    else if (val === true)  newValues.push(1);
    else if (val === false) newValues.push(0);
    else newValues.push(val == null ? null : val);
    return '?';
  });
  return { sql: out, values: newValues };
}

function injectUUID(sql, values) {
  const colsMatch = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/i);
  if (!colsMatch) return { sql, values };
  const originalColumns = colsMatch[2].trim();
  const cols = originalColumns.split(',').map(c => c.trim().toLowerCase());
  if (cols.includes('id')) return { sql, values };

  const tbl = colsMatch[1];
  const newSQL = sql
    .replace(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/i, `INSERT INTO ${tbl} (id, ${originalColumns})`)
    .replace(/VALUES\s*\(/, 'VALUES (?, ');
  return { sql: newSQL, values: [uuidv4(), ...values] };
}

function decodeRow(row) {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    if (k === 'is_active') { out[k] = v === 1 || v === true; continue; }
    if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
      try { out[k] = JSON.parse(v); continue; } catch {}
    }
    out[k] = v;
  }
  return out;
}

const pool = {
  async query(sql, values = []) {
    if (usePg) {
      if (!_schemaInitialized) {
        _schemaInitialized = true;
        await initializePgSchema();
      }
      const pgRes = await pgPool.query(sql, values);
      return { rows: pgRes.rows || [] }; 
    }

    // --- SQLite Path ---
    const db = getDbSQLite();
    if (!_schemaInitialized) {
      _schemaInitialized = true;
      initializeSqliteSchema(db);
    }
    const upper = sql.trim().toUpperCase();

    // Multi-statement DDL (CREATE TABLE, CREATE INDEX, etc.)
    if (/^\s*(CREATE|DROP|PRAGMA)/i.test(sql) || (upper.includes('CREATE TABLE') && sql.includes(';'))) {
      const { sql: ddl } = pgToSqlite(sql, []);
      db.exec(ddl);
      return { rows: [] };
    }

    let { sql: stmt, values: vals } = pgToSqlite(sql, values);

    // SELECT / WITH
    if (/^\s*(SELECT|WITH)/i.test(stmt)) {
      const rows = db.prepare(stmt).all(...vals);
      return { rows: rows.map(decodeRow) };
    }

    // INSERT — auto-inject UUID if id not provided
    if (/^\s*INSERT/i.test(stmt)) {
      const injected = injectUUID(stmt, vals);
      stmt = injected.sql;
      vals = injected.values;
      if (/RETURNING/i.test(stmt)) {
        const rows = db.prepare(stmt).all(...vals);
        return { rows: rows.map(decodeRow) };
      }
      db.prepare(stmt).run(...vals);
      return { rows: [] };
    }

    // UPDATE / DELETE
    if (/^\s*(UPDATE|DELETE)/i.test(stmt)) {
      if (/RETURNING/i.test(stmt)) {
        const rows = db.prepare(stmt).all(...vals);
        return { rows: rows.map(decodeRow) };
      }
      db.prepare(stmt).run(...vals);
      return { rows: [] };
    }

    // Fallback
    db.exec(stmt);
    return { rows: [] };
  },

  async connect() {
    if (usePg) return pgPool.connect();
    return { query: (sql, vals) => pool.query(sql, vals), release: () => {} };
  },

  async end() {
    if (usePg) return pgPool.end();
  },
  
  on(event, listener) {
    if (usePg) pgPool.on(event, listener);
  }
};

module.exports = pool;
