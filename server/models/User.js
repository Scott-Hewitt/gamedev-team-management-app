'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Define associations here
      User.hasMany(models.Project, {
        foreignKey: 'manager_id',
        as: 'managedProjects'
      });

      User.hasMany(models.Task, {
        foreignKey: 'creator_id',
        as: 'createdTasks'
      });

      User.belongsToMany(models.Task, {
        through: 'user_tasks',
        foreignKey: 'user_id',
        otherKey: 'task_id',
        as: 'assignedTasks'
      });

      // User has many Comments
      User.hasMany(models.Comment, {
        foreignKey: 'user_id',
        as: 'comments'
      });

      // Optional: Team associations
      // User.belongsToMany(models.Team, {
      //   through: 'TeamMembers',
      //   foreignKey: 'user_id',
      //   otherKey: 'team_id',
      //   as: 'teams'
      // });
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 100]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'developer', 'designer', 'tester'),
      defaultValue: 'developer'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  });

  return User;
};
