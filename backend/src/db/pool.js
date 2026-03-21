/**
 * SQLite adapter that provides a pg-compatible pool.query() interface.
 * Translates PostgreSQL syntax (placeholders, types, date functions) to SQLite.
 * Uses better-sqlite3 which bundles SQLite 3.45+ (supports RETURNING clause).
 */
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { schema, alterStatements } = require('./schema');

const DB_DIR = process.env.VERCEL
  ? '/tmp/ecommerce-planner'
  : path.join(__dirname, '../../../data');
const DB_PATH = path.join(DB_DIR, 'ecommerce.sqlite');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

let _db = null;
let _schemaInitialized = false;

function getDB() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    // Register gen_random_uuid() so any stray DDL references don't crash
    _db.function('gen_random_uuid', () => uuidv4());
  }
  return _db;
}

function shouldIgnoreAlterError(err) {
  const message = String(err && err.message ? err.message : '').toLowerCase();
  return message.includes('duplicate column') || message.includes('already exists');
}

/**
 * Translate a PostgreSQL query + values to SQLite-compatible equivalents.
 * Returns { sql, values }.
 */
function pgToSqlite(sql, pgValues = []) {
  let out = sql;

  // --- DDL type translations ---
  out = out.replace(/\bTIMESTAMPTZ\b/gi, 'TEXT');
  out = out.replace(/\bDECIMAL\(\d+,\s*\d+\)/gi, 'REAL');
  out = out.replace(/\bVARCHAR\(\d+\)/gi, 'TEXT');
  out = out.replace(/\bBOOLEAN\b/gi, 'INTEGER');
  out = out.replace(/\bDEFAULT\s+TRUE\b/gi, 'DEFAULT 1');
  out = out.replace(/\bDEFAULT\s+FALSE\b/gi, 'DEFAULT 0');
  out = out.replace(/\bTEXT\[\]/g, 'TEXT');
  out = out.replace(/\bUUID\b/gi, 'TEXT');
  // Remove gen_random_uuid() column defaults (injected in JS instead)
  out = out.replace(/DEFAULT\s+gen_random_uuid\(\)/gi, '');

  // --- Function translations ---
  // NOW() -> CURRENT_TIMESTAMP (works as DEFAULT and in DML SET clauses)
  out = out.replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');
  out = out.replace(/EXTRACT\s*\(\s*YEAR\s+FROM\s+([A-Za-z_][A-Za-z0-9_.".]*)\s*\)/gi,
    "CAST(strftime('%Y', $1) AS INTEGER)");
  out = out.replace(/TO_CHAR\s*\(\s*([A-Za-z_][A-Za-z0-9_.".]*)\s*,\s*'YYYY-MM'\s*\)/gi,
    "strftime('%Y-%m', $1)");

  // --- Parameter placeholders: $1,$2,... -> ? (in order of appearance) ---
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

/** Auto-inject a UUID id column for INSERTs that omit it */
function injectUUID(sql, values) {
  const colsMatch = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/i);
  if (!colsMatch) return { sql, values };
  const originalColumns = colsMatch[2].trim();
  const cols = originalColumns.split(',').map(c => c.trim().toLowerCase());
  if (cols.includes('id')) return { sql, values };

  const tbl = colsMatch[1];
  const newSQL = sql
    .replace(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/i,
      `INSERT INTO ${tbl} (id, ${originalColumns})`)
    .replace(/VALUES\s*\(/, 'VALUES (?, ');
  return { sql: newSQL, values: [uuidv4(), ...values] };
}

function initializeSchema(db) {
  if (_schemaInitialized) return;

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

  _schemaInitialized = true;
}

/** Decode a SQLite row back to JS-friendly types */
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
    const db = getDB();
    initializeSchema(db);
    const upper = sql.trim().toUpperCase();

    // Multi-statement DDL (CREATE TABLE, CREATE INDEX, etc.)
    if (/^\s*(CREATE|DROP|PRAGMA)/i.test(sql) ||
        (upper.includes('CREATE TABLE') && sql.includes(';'))) {
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
    return {
      query: (sql, vals) => pool.query(sql, vals),
      release: () => {}
    };
  },

  async end() {},
  on() {}
};

module.exports = pool;
