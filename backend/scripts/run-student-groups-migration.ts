/**
 * Run the student groups migration using the same DB as the backend.
 * Run from repo root: cd backend && npm run migrate:groups
 * Or from backend: npm run migrate:groups
 */

import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../src/config/database';

const MIGRATION_PATH = path.resolve(__dirname, '../../database-migration-student-groups.sql');

async function run() {
  try {
    if (!fs.existsSync(MIGRATION_PATH)) {
      console.error('Migration file not found:', MIGRATION_PATH);
      process.exit(1);
    }
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
    console.log('Running student groups migration...');
    await pool.query(sql);
    console.log('✅ Student groups migration completed.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
