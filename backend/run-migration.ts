import { pool } from './src/config/database';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, '../database-migration-student-groups.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔄 Running student groups migration...');
    await pool.query(sql);
    console.log('✅ Student groups migration completed successfully!');

    // Show created tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('student_groups', 'student_group_members', 'exam_group_access')
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
