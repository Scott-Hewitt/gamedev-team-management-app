'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    // Define model associations
    static associate(models) {
      Task.belongsTo(models.Project, {
        foreignKey: 'project_id',
        as: 'project'
      });

      Task.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator'
      });

      Task.belongsToMany(models.User, {
        through: 'user_tasks',
        foreignKey: 'task_id',
        otherKey: 'user_id',
        as: 'assignees'
      });

      Task.hasMany(models.Comment, {
        foreignKey: 'task_id',
        as: 'comments'
      });
    }
  }

  Task.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('backlog', 'todo', 'in_progress', 'review', 'done'),
      defaultValue: 'backlog'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    estimated_hours: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    actual_hours: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id'
      }
    },
    creator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
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
    modelName: 'Task',
    tableName: 'tasks',
    timestamps: true
  });

  return Task;
};
