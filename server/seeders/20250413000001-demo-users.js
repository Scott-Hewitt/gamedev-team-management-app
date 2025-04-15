'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Using a pre-generated hash for 'password123'
    const hashedPassword = '$2a$10$rrCvVeuUeCBGO9XiALVP2.1E.H1VQs8qiAA7Ug5EYUvj/WqbJ1BpC';

    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@gamedev.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'manager1',
        email: 'manager1@gamedev.com',
        password: hashedPassword,
        role: 'manager',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'developer1',
        email: 'developer1@gamedev.com',
        password: hashedPassword,
        role: 'developer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'designer1',
        email: 'designer1@gamedev.com',
        password: hashedPassword,
        role: 'designer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'tester1',
        email: 'tester1@gamedev.com',
        password: hashedPassword,
        role: 'tester',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
