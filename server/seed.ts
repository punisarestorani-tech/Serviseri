import 'dotenv/config';
import { db } from './db';
import { organizations, profiles } from '@shared/schema';
import crypto from 'crypto';

async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function seed() {
  console.log('Starting database seed...');

  try {
    // Check if super_admin already exists
    const existingUsers = await db.select().from(profiles);
    if (existingUsers.length > 0) {
      console.log('Database already has users. Skipping seed.');
      process.exit(0);
    }

    // Create default organization
    const orgId = 'org_default';
    console.log('Creating default organization...');
    await db.insert(organizations).values({
      id: orgId,
      name: 'Default Organization',
      isActive: true,
    });
    console.log('Organization created: Default Organization');

    // Create super_admin user
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword('admin123');

    console.log('Creating super_admin user...');
    await db.insert(profiles).values({
      id: userId,
      username: 'admin',
      passwordHash: passwordHash,
      fullName: 'Super Administrator',
      email: 'admin@servicemanager.com',
      userRole: 'super_admin',
      organizationId: orgId,
    });

    console.log('');
    console.log('='.repeat(50));
    console.log('Seed completed successfully!');
    console.log('='.repeat(50));
    console.log('');
    console.log('Login credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('');
    console.log('IMPORTANT: Change the password after first login!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
