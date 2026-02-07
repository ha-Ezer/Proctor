/**
 * Script to add a new admin user
 * Usage: ts-node scripts/add-admin.ts [email] [password] [fullName] [role]
 * Example: ts-node scripts/add-admin.ts admin@example.com MyPassword123 "Admin Name" super_admin
 */

import bcrypt from 'bcryptjs';
import { pool } from '../src/config/database';

async function addAdmin() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    const fullName = process.argv[4] || 'Administrator';
    const role = (process.argv[5] || 'super_admin') as 'super_admin' | 'admin' | 'viewer';

    if (!email || !password) {
      console.log('❌ Usage: ts-node scripts/add-admin.ts [email] [password] [fullName] [role]');
      console.log('Example: ts-node scripts/add-admin.ts admin@example.com MyPassword123 "Admin Name" super_admin');
      await pool.end();
      process.exit(1);
    }

    console.log(`Adding new admin user: ${email}\n`);

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT id, email, full_name, role, is_active FROM admin_users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('❌ Admin user with this email already exists!');
      console.log('Admin User Details:');
      console.log('- Email:', existingAdmin.rows[0].email);
      console.log('- Full Name:', existingAdmin.rows[0].full_name);
      console.log('- Role:', existingAdmin.rows[0].role);
      console.log('- Is Active:', existingAdmin.rows[0].is_active);
      console.log('\nUse reset-admin-password.ts to change the password instead.');
      await pool.end();
      process.exit(1);
    }

    console.log('Generating password hash...');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert new admin
    const result = await pool.query(
      `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, full_name, role, is_active`,
      [email, passwordHash, fullName, role]
    );

    const admin = result.rows[0];

    console.log('✅ Admin user created successfully!');
    console.log('\nNew Admin Credentials:');
    console.log('- Email:', admin.email);
    console.log('- Full Name:', admin.full_name);
    console.log('- Role:', admin.role);
    console.log('- Password:', password);
    console.log('- Is Active:', admin.is_active);
    console.log('\n⚠️  Please save these credentials securely!');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await pool.end();
    process.exit(1);
  }
}

addAdmin();
