const crypto = require('crypto');

// Generate a secure random string for NEXTAUTH_SECRET
const secret = crypto.randomBytes(32).toString('hex');

console.log('🔐 Generated NEXTAUTH_SECRET for production:');
console.log('');
console.log(secret);
console.log('');
console.log('📋 Copy this value and add it to your Vercel environment variables:');
console.log('   NEXTAUTH_SECRET=' + secret);
console.log('');
console.log('⚠️  Keep this secret secure and don\'t share it publicly!');
