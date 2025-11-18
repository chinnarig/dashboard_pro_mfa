// Script to hash passwords in the database
const bcrypt = require('bcryptjs');

const passwords = {
  'admin@acme.com': 'Admin@123',
  'writer@acme.com': 'Writer@123',
  'reader@acme.com': 'Reader@123',
  'admin@techstart.io': 'TechAdmin@123'
};

async function hashPasswords() {
  console.log('Generating bcrypt hashes for passwords...\n');
  
  for (const [email, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`-- ${email} (Password: ${password})`);
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE email = '${email}';`);
    console.log('');
  }
  
  console.log('\n-- All password hashes generated!');
}

hashPasswords().catch(console.error);
