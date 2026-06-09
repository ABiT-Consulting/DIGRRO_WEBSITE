#!/usr/bin/env node
// Generates a portable PBKDF2 hash for the academy admin password.
// Usage: npm run academy:hash YOUR_PASSWORD

import crypto from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run academy:hash YOUR_PASSWORD');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const iterations = 210000;
const derived = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha256');
const hash = 'pbkdf2:sha256:' + iterations + ':' + salt.toString('hex') + ':' + derived.toString('hex');

console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log('ACADEMY_ADMIN_PASSWORD_HASH=' + hash);
console.log('');
