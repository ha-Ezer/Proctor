/**
 * Script to create the default admin user
 * Run with: npm run create-admin
 */

import { authService } from '../src/services/auth.service';
import { pool } from '../src/config/database';

async function createAdmin() {
  try {
    console.log('Creating default admin user...');

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM admin_users WHERE email = $1',
      ['admin@example.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('❌ Admin user already exists!');
      console.log('Email: admin@example.com');
      process.exit(0);
    }

    // Create admin user
    const admin = await authService.createAdmin(
      'admin@example.com',
      'Admin@123',
      'System Administrator',
      'super_admin'
    );

    console.log('✅ Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password: Admin@123');
    console.log('Role:', admin.role);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();
