# Game Development Team Management System

## Features

- User authentication and authorization
- Project management
- Task tracking and assignment
- Progress monitoring
- Team collaboration

## Database Schema

### Entity Relationship Diagram (ERD)

```
+-------------+       +-------------+       +-------------+
|    Users    |       |   Projects  |       |    Tasks    |
+-------------+       +-------------+       +-------------+
| id          |<----->| id          |<----->| id          |
| username    |       | title       |       | title       |
| email       |       | description |       | description |
| password    |       | status      |       | status      |
| role        |       | start_date  |       | priority    |
| createdAt   |       | end_date    |       | est_hours   |
| updatedAt   |       | manager_id  |       | actual_hours|
+-------------+       | createdAt   |       | due_date    |
      ^               | updatedAt   |       | project_id  |
      |               +-------------+       | creator_id  |
      |                                     | createdAt   |
      |                                     | updatedAt   |
      |                                     +-------------+
      |                                           ^
      |                                           |
      |               +-------------+             |
      +-------------->|  UserTasks  |<------------+
                      +-------------+
                      | user_id     |
                      | task_id     |
                      | assign_date |
                      | status      |
                      | createdAt   |
                      | updatedAt   |
                      +-------------+
```

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd game-dev-management
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     NODE_ENV=development
     PORT=5000
     
     # Database Configuration
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=game_dev_management
     DB_PORT=3306
     
     # JWT Configuration
     JWT_SECRET=your_jwt_secret_key_here
     JWT_EXPIRES_IN=1d
     ```

4. Create the database:
   ```
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE game_dev_management;
   EXIT;
   ```

5. Run database migrations:
   ```
   npx sequelize-cli db:migrate
   ```

6. Seed the database with initial data:
   ```
   npx sequelize-cli db:seed:all
   ```

7. Start the server:
   ```
   npm run dev
   ```

## API Documentation

### Authentication

- **Register User**
  - `POST /api/users/register`
  - Body: `{ username, email, password, role }`

- **Login User**
  - `POST /api/users/login`
  - Body: `{ email, password }`

### Users

- **Get All Users**
  - `GET /api/users`
  - Auth: Required

- **Get User by ID**
  - `GET /api/users/:id`
  - Auth: Required

- **Update User**
  - `PUT /api/users/:id`
  - Body: `{ username, email, password, role }`
  - Auth: Required (Admin or own account)

- **Delete User**
  - `DELETE /api/users/:id`
  - Auth: Required (Admin only)

- **Get User's Tasks**
  - `GET /api/users/:id/tasks`
  - Auth: Required

- **Get User's Projects**
  - `GET /api/users/:id/projects`
  - Auth: Required

### Projects

- **Create Project**
  - `POST /api/projects`
  - Body: `{ title, description, status, start_date, end_date }`
  - Auth: Required

- **Get All Projects**
  - `GET /api/projects`
  - Auth: Required

- **Get Project by ID**
  - `GET /api/projects/:id`
  - Auth: Required

- **Update Project**
  - `PUT /api/projects/:id`
  - Body: `{ title, description, status, start_date, end_date, manager_id }`
  - Auth: Required (Admin, Project Manager)

- **Delete Project**
  - `DELETE /api/projects/:id`
  - Auth: Required (Admin, Project Manager)

- **Get Project Tasks**
  - `GET /api/projects/:id/tasks`
  - Auth: Required

- **Get Project Statistics**
  - `GET /api/projects/:id/stats`
  - Auth: Required

### Tasks

- **Create Task**
  - `POST /api/tasks`
  - Body: `{ title, description, status, priority, estimated_hours, due_date, project_id, assignee_ids }`
  - Auth: Required

- **Get All Tasks**
  - `GET /api/tasks`
  - Auth: Required

- **Get Task by ID**
  - `GET /api/tasks/:id`
  - Auth: Required

- **Update Task**
  - `PUT /api/tasks/:id`
  - Body: `{ title, description, status, priority, estimated_hours, actual_hours, due_date, project_id }`
  - Auth: Required (Admin, Project Manager, Task Creator, Assignee)

- **Delete Task**
  - `DELETE /api/tasks/:id`
  - Auth: Required (Admin, Project Manager, Task Creator)

- **Assign Task**
  - `POST /api/tasks/:id/assign`
  - Body: `{ user_ids }`
  - Auth: Required (Admin, Project Manager, Task Creator)

- **Update Task Status**
  - `PUT /api/tasks/:id/status`
  - Body: `{ status }`
  - Auth: Required (Assignee)

