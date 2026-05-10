#!/usr/bin/env node
// Generates a scrypt hash for the academy admin password.
// Usage: npm run academy:hash YOUR_PASSWORD

import crypto from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run academy:hash YOUR_PASSWORD');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(password, salt, 64);
const hash = 'scrypt:' + salt.toString('hex') + ':' + derived.toString('hex');

console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log('ACADEMY_ADMIN_PASSWORD_HASH=' + hash);
console.log('');
