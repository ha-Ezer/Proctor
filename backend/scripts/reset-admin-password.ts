/**
 * Script to reset admin password
 * Usage: ts-node scripts/reset-admin-password.ts [email] [newPassword]
 * Example: ts-node scripts/reset-admin-password.ts admin@example.com MyNewPassword123
 */

import bcrypt from 'bcryptjs';
import { pool } from '../src/config/database';

async function resetAdminPassword() {
  try {
    const email = process.argv[2] || 'admin@example.com';
    const newPassword = process.argv[3] || 'Admin@123';

    console.log(`Resetting password for admin: ${email}\n`);

    // Check if admin exists
    const result = await pool.query(
      'SELECT id, email, full_name, role, is_active FROM admin_users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Admin user with email "${email}" not found!`);
      await pool.end();
      process.exit(1);
    }

    const admin = result.rows[0];
    console.log('Admin User Found:');
    console.log('- Email:', admin.email);
    console.log('- Full Name:', admin.full_name);
    console.log('- Role:', admin.role);
    console.log('- Is Active:', admin.is_active);
    console.log('\nGenerating new password hash...');

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, admin.id]
    );

    console.log('✅ Password reset successfully!');
    console.log('\nNew Credentials:');
    console.log('- Email:', admin.email);
    console.log('- Password:', newPassword);
    console.log('\n⚠️  Please save these credentials securely!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();
