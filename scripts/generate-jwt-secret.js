#!/usr/bin/env node
/**
 * Generate a secure JWT secret for production use
 * Usage: node scripts/generate-jwt-secret.js
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');

console.log('');
console.log('========================================');
console.log('🔐 JWT Secret Generated');
console.log('========================================');
console.log('');
console.log('Add this to your Railway environment variables:');
console.log('');
console.log(`JWT_SECRET=${secret}`);
console.log('');
console.log('⚠️  Keep this secret secure and never commit it to git!');
console.log('========================================');
console.log('');
