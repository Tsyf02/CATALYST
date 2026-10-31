// Jalankan: npm run hash-password -- "passwordkamu"
// Hasilnya tempel ke env var AUTH_PASSWORD_HASH (di .env.local dan di Vercel).
const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Cara pakai: npm run hash-password -- "passwordkamu"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nAUTH_PASSWORD_HASH=" + hash + "\n");
