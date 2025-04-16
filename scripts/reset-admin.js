const bcrypt = require('bcryptjs');
const { User } = require('./server/models');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Set environment to production
process.env.NODE_ENV = 'production';

async function resetAdmin() {
  try {
    console.log('Resetting admin user...');
    
    // Delete existing admin user if it exists
    await User.destroy({ where: { username: 'admin' } });
    console.log('Removed existing admin user (if any)');
    
    // Create a new admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@gamedev.com',
      password: hashedPassword,
      role: 'admin'
    });
    
    console.log('Created new admin user:');
    console.log(`- ID: ${adminUser.id}`);
    console.log(`- Username: ${adminUser.username}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Role: ${adminUser.role}`);
    
    console.log('\nYou can now login with:');
    console.log('Email: admin@gamedev.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error resetting admin user:', error);
  } finally {
    process.exit(0);
  }
}

resetAdmin();
