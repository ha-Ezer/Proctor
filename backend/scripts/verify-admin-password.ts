/**
 * Script to verify admin password
 * Run with: npm run verify-admin
 */

import bcrypt from 'bcrypt';
import { pool } from '../src/config/database';

async function verifyAdminPassword() {
  try {
    console.log('Checking admin user password...\n');

    // Get admin user
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, is_active FROM admin_users WHERE email = $1',
      ['admin@example.com']
    );

    if (result.rows.length === 0) {
      console.log('❌ Admin user not found!');
      await pool.end();
      process.exit(1);
    }

    const admin = result.rows[0];
    console.log('Admin User Details:');
    console.log('- Email:', admin.email);
    console.log('- Full Name:', admin.full_name);
    console.log('- Role:', admin.role);
    console.log('- Is Active:', admin.is_active);
    console.log('- Password Hash:', admin.password_hash.substring(0, 20) + '...\n');

    // Test password
    const testPassword = 'Admin@123';
    const isValid = await bcrypt.compare(testPassword, admin.password_hash);

    if (isValid) {
      console.log('✅ Password "Admin@123" is CORRECT');
    } else {
      console.log('❌ Password "Admin@123" is INCORRECT');
      console.log('\nGenerating new hash for "Admin@123"...');
      const newHash = await bcrypt.hash(testPassword, 12);

      console.log('\nTo update the password, run:');
      console.log(`UPDATE admin_users SET password_hash = '${newHash}' WHERE email = 'admin@example.com';`);
    }

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verifyAdminPassword();
