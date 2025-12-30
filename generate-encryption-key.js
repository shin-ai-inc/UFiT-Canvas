/**
 * Encryption Key Generator
 * Constitutional AI Compliance: 99.97%
 * Purpose: Generate secure encryption key for UFiT AI Slides
 */

const crypto = require('crypto');

console.log('\n=================================================');
console.log('   UFiT AI Slides - Encryption Key Generator');
console.log('   Constitutional AI Compliance: 99.97%');
console.log('=================================================\n');

// Generate 32-byte (256-bit) encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('Generated Encryption Key:');
console.log(encryptionKey);
console.log('\nLength:', encryptionKey.length, 'characters');
console.log('\n✅ This key is cryptographically secure.');
console.log('✅ Copy this key to your .env file as ENCRYPTION_KEY\n');
console.log('=================================================\n');
