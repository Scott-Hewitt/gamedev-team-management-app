const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Set environment to production
process.env.NODE_ENV = 'production';

async function setupDatabase() {
  try {
    console.log('Setting up database...');

        // Try to read password from Docker secret, fall back to env var
    let dbPassword = process.env.DB_PASSWORD || 'changeme';
    let dbUser = process.env.DB_USER || 'dbuser';
    const secretPath = '/run/secrets/db_password';
    const rootSecretPath = '/run/secrets/db_root_password';

    // For initial setup, we need to use the root password
    if (fs.existsSync(rootSecretPath)) {
      dbPassword = fs.readFileSync(rootSecretPath, 'utf8').trim();
      dbUser = 'root';
      console.log('Using root password from Docker secret');
    } else if (fs.existsSync(secretPath)) {
      dbPassword = fs.readFileSync(secretPath, 'utf8').trim();
      console.log('Using database password from Docker secret');
    } else {
      console.log('Using database password from environment variable');
      // For the standard docker-compose.yml, we need to use root
      dbUser = 'root';
      dbPassword = 'root';
    }

    console.log(`Connecting as user: ${dbUser}`);

    // Create connection without database name
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'db',
      user: dbUser,
      password: dbPassword,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`Database '${process.env.DB_NAME}' created or already exists`);

    // Close connection
    await connection.end();

    // Run migrations
    console.log('Running migrations...');
    execSync('npx sequelize-cli db:migrate --env production', { stdio: 'inherit' });

    console.log('Database setup completed successfully!');
    console.log('To seed the database with an admin user, run: npm run seed-user');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
