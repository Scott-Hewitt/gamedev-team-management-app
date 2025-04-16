# Game Development Team Management System

## Features

- User authentication and authorization with role-based access control
- Project management with status tracking and team assignment
- Task tracking with priority, status, and assignment capabilities
- Progress monitoring and reporting
- Team collaboration and communication
- Comments system for tasks and projects
- Comprehensive API for integration with other tools
- Monitoring and observability with Prometheus/Grafana
- Database migrations and seeding for easy setup
- Docker support for development and production environments

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
                            ^
                            |
                      +-------------+
                      |   Comments  |
                      +-------------+
                      | id          |
                      | content     |
                      | user_id     |
                      | task_id     |
                      | createdAt   |
                      | updatedAt   |
                      +-------------+
```

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MySQL 8.0
- **ORM**: Sequelize
- **Authentication**: JWT
- **Frontend**: React, Vite
- **Monitoring**: Prometheus, Grafana
- **Containerization**: Docker, Docker Compose

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Docker and Docker Compose (for containerized setup)

## Installation

### Option 1: Running with Docker

1. Clone the repository:
   ```
   git clone <repository-url>
   cd game-dev-management
   ```

2. Create secrets directory and files:
   ```
   mkdir -p secrets
   echo "your_db_password" > secrets/db_password.txt
   echo "your_root_password" > secrets/db_root_password.txt
   echo "your_jwt_secret" > secrets/jwt_secret.txt
   ```

3. Configure Docker environment (optional):
   - The default configuration should work out of the box
   - If you need to customize, copy `docker/.env.docker` to the root directory as `.env`:
     ```
     cp docker/.env.docker .env
     ```
   - Edit the `.env` file to change database names, passwords, etc.

4. Start the application:
   ```
   docker-compose up
   ```
   - This will start the MySQL database, backend API, and frontend application
   - The first run will take longer as it builds the containers and installs dependencies
   - Database migrations and initial setup will run automatically

5. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Database: localhost:3307 (accessible from your host machine)

6. For production deployment:
   ```
   docker-compose -f docker/compose/docker-compose.prod.yml up -d
   ```

7. To enable monitoring with Prometheus and Grafana:
   ```
   docker-compose -f docker-compose.yml -f docker/compose/docker-compose.monitoring.yml up
   ```
   - Grafana: http://localhost:3000 (default credentials: admin/admin)
   - Prometheus: http://localhost:9090

### Option 2: Running Locally (without Docker)

1. Clone the repository:
   ```
   git clone <repository-url>
   cd game-dev-management
   ```

2. Install backend dependencies:
   ```
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd client
   npm install
   cd ..
   ```

4. Configure environment variables:
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

     # User Creation Options
     CREATE_TEST_USERS=true
     FORCE_ADMIN_PASSWORD_RESET=false
     ```

5. Create the database:
   ```
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE game_dev_management;
   EXIT;
   ```

6. Run database setup:
   ```
   npm run setup-db
   ```
   - This will create the database if it doesn't exist
   - Run migrations to create tables
   - Note: This doesn't create users yet

7. Create the admin user and test users:
   ```
   npm run seed-user
   ```
   - This will create the admin user and test users if they don't exist
   - Default admin credentials: admin@gamedev.com / password123

8. Start the backend server (with nodemon for development):
   ```
   npm run dev
   ```
   - This will start the backend API server on http://localhost:5000
   - The server will automatically restart when you make changes

9. In a separate terminal, start the frontend:
   ```
   cd client
   npm run dev
   ```
   - This will start the Vite development server on http://localhost:5173
   - The frontend will automatically reload when you make changes

10. Access the application:
    - Frontend: http://localhost:5173
    - Backend API: http://localhost:5000
    - API documentation is available in the presentation_materials/api-demo.http file

## Default Users

After setup, the following users are available:

| Username   | Email                  | Password    | Role      |
|------------|------------------------|-------------|-----------|
| admin      | admin@gamedev.com      | password123 | admin     |
| developer1 | developer1@example.com | password123 | developer |
| manager1   | manager1@example.com   | password123 | manager   |
| designer1  | designer1@example.com  | password123 | designer  |
| tester1    | tester1@example.com    | password123 | tester    |

## User Roles and Permissions

| Role      | Permissions                                                                |
|-----------|----------------------------------------------------------------------------|
| admin     | Full access to all features, user management, system configuration         |
| manager   | Create/manage projects, assign tasks, view reports, manage team members    |
| developer | View assigned tasks, update task status, add comments, track time          |
| designer  | Similar to developer, focused on design tasks                              |
| tester    | Create/manage test cases, report bugs, verify fixes                        |

## Project Structure

```
game-dev-management/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js application
│   ├── controllers/        # API controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   └── utils/              # Utility functions
├── scripts/                # Database and setup scripts
├── logs/                   # Application logs
├── docker/                 # Docker configuration files
│   ├── compose/            # Docker compose files
│   │   ├── docker-compose.prod.yml      # Production configuration
│   │   └── docker-compose.monitoring.yml # Monitoring configuration
│   └── dockerfiles/        # Dockerfiles
├── secrets/                # Secret files (not in git)
├── .env                    # Environment variables (not in git)
└── docker-compose.yml      # Docker compose configuration
```

## Development Tools

### API Testing

The project includes a REST client file (`presentation_materials/api-demo.http`) that can be used with VS Code's REST Client extension or similar tools to test API endpoints.

### Database Management

- **Migrations**: `npx sequelize-cli db:migrate`
- **Rollback**: `npx sequelize-cli db:migrate:undo`
- **Seeding**: `npx sequelize-cli db:seed:all`

### Monitoring

To enable monitoring with Prometheus and Grafana:

```
docker-compose -f docker-compose.yml -f docker/compose/docker-compose.monitoring.yml up
```

Access Grafana at http://localhost:3000 (default credentials: admin/admin)

## Production Deployment

For production deployment:

1. Configure production environment variables
2. Use the production Docker Compose file:
   ```
   docker-compose -f docker/compose/docker-compose.prod.yml up -d
   ```
3. Set `CREATE_TEST_USERS=false` and `FORCE_ADMIN_PASSWORD_RESET=true` for security

## API Documentation

### Authentication

- **Register User**
  - `POST /api/users/register`
  - Body: `{ username, email, password, role }`

- **Login User**
  - `POST /api/users/login`
  - Body: `{ email, password }`

- **Reset Password**
  - `POST /api/users/reset-password`
  - Body: `{ email }`
  - Auth: Not required

- **Change Password**
  - `PUT /api/users/change-password`
  - Body: `{ currentPassword, newPassword }`
  - Auth: Required

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

### Comments

- **Add Comment**
  - `POST /api/comments`
  - Body: `{ content, task_id }`
  - Auth: Required

- **Get Task Comments**
  - `GET /api/tasks/:id/comments`
  - Auth: Required

- **Update Comment**
  - `PUT /api/comments/:id`
  - Body: `{ content }`
  - Auth: Required (Comment Creator)

- **Delete Comment**
  - `DELETE /api/comments/:id`
  - Auth: Required (Admin, Comment Creator)

### Health Check

- **API Health Check**
  - `GET /api/health`
  - Auth: Not required

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Environment variable management
- Secrets management with Docker secrets
- CORS protection
- Rate limiting on authentication endpoints

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check MySQL service is running
   - Verify credentials in .env file
   - Ensure database exists

2. **Authentication Issues**
   - Check JWT_SECRET is properly set
   - Verify user credentials
   - Check token expiration

3. **Docker Issues**
   - Ensure Docker and Docker Compose are installed
   - Check port conflicts
   - Verify volume permissions