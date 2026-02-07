/**
 * Run the exam_report_cell_colors migration using the same DB as the backend.
 * Run from backend: npm run migrate:report-colors
 */

import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../src/config/database';

const MIGRATION_PATH = path.resolve(__dirname, '../database-migration-exam-report-colors-use-session-id.sql');

async function run() {
  try {
    if (!fs.existsSync(MIGRATION_PATH)) {
      console.error('Migration file not found:', MIGRATION_PATH);
      process.exit(1);
    }
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
    console.log('Running exam_report_cell_colors migration...');
    await pool.query(sql);
    console.log('✅ Exam report colors migration completed.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
