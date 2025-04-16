const bcrypt = require('bcryptjs');
const { User, sequelize } = require('../server/models');
const dotenv = require('dotenv');
const { QueryTypes } = require('sequelize');

// Load environment variables
dotenv.config();

// Set environment to production unless specified otherwise
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Default admin credentials
const DEFAULT_ADMIN = {
  username: 'admin',
  email: 'admin@gamedev.com',
  password: 'password123',
  role: 'admin'
};

async function seedUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { username: DEFAULT_ADMIN.username } });

    // Check if we should force a password reset based on environment variable
    const forcePasswordReset = process.env.FORCE_ADMIN_PASSWORD_RESET === 'true';

    if (existingAdmin) {
      if (forcePasswordReset) {
        console.log(`Resetting password for ${existingAdmin.username} as requested by environment variable`);

        // Generate new password hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, salt);

        // Update the user with direct SQL to bypass any model hooks
        await sequelize.query(
          'UPDATE users SET password = ? WHERE username = ?',
          {
            replacements: [hashedPassword, DEFAULT_ADMIN.username],
            type: QueryTypes.UPDATE
          }
        );

        console.log('Admin password has been reset');
      } else {
        console.log(`Admin user already exists: ${existingAdmin.username}`);
        console.log('Preserving existing password hash for consistency across builds');
      }

      console.log('You can login with:');
      console.log(`Email: ${DEFAULT_ADMIN.email}`);
      console.log(`Password: ${DEFAULT_ADMIN.password}`);
      process.exit(0);
      return;
    }

    console.log('Creating admin user...');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, salt);

    // Create admin user with direct SQL
    await sequelize.query(
      'INSERT INTO users (username, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
      {
        replacements: [DEFAULT_ADMIN.username, DEFAULT_ADMIN.email, hashedPassword, DEFAULT_ADMIN.role],
        type: QueryTypes.INSERT
      }
    );

    // Get the created admin user
    const [adminUser] = await sequelize.query(
      'SELECT * FROM users WHERE username = ?',
      {
        replacements: [DEFAULT_ADMIN.username],
        type: QueryTypes.SELECT
      }
    );

    console.log(`Admin user created successfully: ${adminUser.username}`);
    console.log('You can login with:');
    console.log(`Email: ${DEFAULT_ADMIN.email}`);
    console.log(`Password: ${DEFAULT_ADMIN.password}`);

    // Create additional test users if in development environment
    console.log(`NODE_ENV: ${process.env.NODE_ENV}, CREATE_TEST_USERS: ${process.env.CREATE_TEST_USERS}`);
    console.log(`NODE_ENV type: ${typeof process.env.NODE_ENV}, CREATE_TEST_USERS type: ${typeof process.env.CREATE_TEST_USERS}`);
    console.log(`Condition result: ${process.env.NODE_ENV === 'development' && process.env.CREATE_TEST_USERS === 'true'}`);

    // Force test user creation for debugging
    console.log('Creating test users for development...');
    await createTestUsers();

    process.exit(0);
  } catch (error) {
    console.error('Error managing admin user:', error);
    process.exit(1);
  }
}

/**
 * Creates test users for development environment
 */
async function createTestUsers() {
  const testUsers = [
    { username: 'developer1', email: 'developer1@example.com', password: 'password123', role: 'developer' },
    { username: 'manager1', email: 'manager1@example.com', password: 'password123', role: 'manager' },
    { username: 'designer1', email: 'designer1@example.com', password: 'password123', role: 'designer' },
    { username: 'tester1', email: 'tester1@example.com', password: 'password123', role: 'tester' },
    { username: 'developer3', email: 'developer3@example.com', password: 'password123', role: 'developer' }
  ];

  let existingCount = 0;
  let createdCount = 0;

  for (const user of testUsers) {
    const existingUser = await User.findOne({ where: { username: user.username } });

    if (!existingUser) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      // Create user with direct SQL
      await sequelize.query(
        'INSERT INTO users (username, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())',
        {
          replacements: [user.username, user.email, hashedPassword, user.role],
          type: QueryTypes.INSERT
        }
      );

      console.log(`Test user created: ${user.username} (${user.role})`);
      createdCount++;
    } else {
      console.log(`Test user already exists: ${user.username} (${user.role})`);
      existingCount++;
    }
  }

  console.log(`Test users summary: ${createdCount} created, ${existingCount} already existed`);
}

seedUser();
