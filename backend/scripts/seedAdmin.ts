/**
 * Creates (or updates) the administrator account from the ADMIN_* values in .env.
 * Safe to run more than once: it never creates a second admin with the same email.
 * Run with: npm run seed:admin
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database';
import { User } from '../models/User';
import { MIN_PASSWORD_LENGTH } from '../utils/validation';

async function seedAdmin() {
  const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    console.error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  await connectDatabase(MONGODB_URI);

  // One-time upgrade for accounts created by the first version of LostLink, which stored
  // the hash in "passwordHash" and used lowercase roles. Does nothing on a fresh database.
  const users = User.collection;
  await users.updateMany({ passwordHash: { $exists: true } }, { $rename: { passwordHash: 'password' } });
  await users.updateMany({ role: 'student' }, { $set: { role: 'STUDENT' } });
  await users.updateMany({ role: 'admin' }, { $set: { role: 'ADMIN' } });

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.name = ADMIN_NAME.trim();
    existing.password = hashedPassword;
    existing.role = 'ADMIN';
    await existing.save();
    console.log(`Updated existing account ${email} and set role to ADMIN.`);
  } else {
    await User.create({ name: ADMIN_NAME.trim(), email, password: hashedPassword, role: 'ADMIN' });
    console.log(`Created admin account ${email}.`);
  }

  await mongoose.disconnect();
}

seedAdmin().catch(async (error) => {
  console.error('Seeding failed:', (error as Error).message);
  await mongoose.disconnect();
  process.exit(1);
});
