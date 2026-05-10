#!/usr/bin/env node
// Generates a random 256-bit hex secret for signing admin tokens.
// Usage: npm run academy:secret

import crypto from 'node:crypto';

const secret = crypto.randomBytes(32).toString('hex');
console.log('');
console.log('Add this to your .env file:');
console.log('');
console.log('ACADEMY_ADMIN_TOKEN_SECRET=' + secret);
console.log('');
