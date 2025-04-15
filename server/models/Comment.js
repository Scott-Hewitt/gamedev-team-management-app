module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tasks',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'comments',
    timestamps: true
  });

  Comment.associate = (models) => {
    // Comment belongs to a Task
    Comment.belongsTo(models.Task, {
      foreignKey: 'task_id',
      as: 'task'
    });

    // Comment belongs to a User (the author)
    Comment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'author'
    });
  };

  return Comment;
};
