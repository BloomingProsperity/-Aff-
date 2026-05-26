import { loadConfig } from "../src/lib/config.js";
import { createPool } from "../src/lib/db.js";
import { hashPassword } from "../src/lib/auth.js";

const config = loadConfig();
const password = String(process.env.ADMIN_PASSWORD || "");

if (!config.adminEmail) {
  throw new Error("ADMIN_EMAIL is required");
}
if (password.length < 8) {
  throw new Error("ADMIN_PASSWORD must be at least 8 characters");
}

const db = createPool(config);
const hashed = hashPassword(password);

try {
  await db.query("BEGIN");
  await db.query(
    "UPDATE users SET role = 'user', updated_at = now() WHERE lower(email) <> lower($1) AND role = 'admin'",
    [config.adminEmail],
  );
  await db.query(
    `INSERT INTO users (email, password_hash, password_salt, role)
     VALUES (lower($1), $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       password_salt = EXCLUDED.password_salt,
       role = 'admin',
       updated_at = now()`,
    [config.adminEmail, hashed.hash, hashed.salt],
  );
  await db.query("COMMIT");
  console.log(`admin account ready: ${config.adminEmail}`);
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
} finally {
  await db.end();
}
