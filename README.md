# Task Tracking & Management System

A backend API for task tracking and team collaboration built with Node.js, Express, MySQL, and Socket.io.

## Features

- User authentication with session management
- Task CRUD operations with filtering and search
- Team/project collaboration
- Comments and file attachments
- Real-time WebSocket notifications
- RESTful API design

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL, Sequelize ORM
- **Authentication**: express-session, bcrypt
- **Real-time**: Socket.io
- **File Upload**: multer
- **Validation**: express-validator

## Installation

### Prerequisites

- Node.js (v14+)
- MySQL (v5.7+)

### Setup

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd AirTribeModule6
npm install
```

2. **Set up MySQL database**
```bash
mysql -u root -p
CREATE DATABASE task_tracking_db;
exit;
```

3. **Configure environment**
```bash
cp env.example .env
```

Edit `.env` and update:
```env
DB_PASSWORD=your_mysql_password
SESSION_SECRET=your_random_secret_key
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks` - Get all tasks (supports filters: status, assignedTo, teamId, search)
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/complete` - Mark as completed
- `PATCH /api/tasks/:id/assign` - Assign to user

### Teams
- `POST /api/teams` - Create team
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add member
- `DELETE /api/teams/:id/members/:userId` - Remove member
- `GET /api/teams/:id/tasks` - Get team tasks

### Collaboration
- `POST /api/tasks/:taskId/comments` - Add comment
- `GET /api/tasks/:taskId/comments` - Get comments
- `DELETE /api/tasks/:taskId/comments/:commentId` - Delete comment
- `POST /api/tasks/:taskId/attachments` - Upload file
- `GET /api/tasks/:taskId/attachments` - Get attachments
- `GET /api/tasks/:taskId/attachments/:id/download` - Download file
- `DELETE /api/tasks/:taskId/attachments/:id` - Delete attachment

## Usage Examples

### Register a user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Create a task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Implement feature",
    "description": "Build new feature",
    "priority": "high",
    "dueDate": "2024-12-31"
  }'
```

### Get tasks with filters
```bash
curl -X GET "http://localhost:3000/api/tasks?status=open&search=feature" \
  -b cookies.txt
```

## WebSocket Connection

```javascript
const socket = io('http://localhost:3000');

// Register user for notifications
socket.emit('register', userId);

// Listen for notifications
socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

## Project Structure

```
├── config/              # Database & session config
├── controllers/         # Business logic
├── middleware/          # Auth, validation, errors
├── models/             # Sequelize models
├── routes/             # API routes
├── utils/              # Helper functions
├── uploads/            # File storage
└── server.js           # Main app
```

## Environment Variables

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=task_tracking_db
DB_USER=root
DB_PASSWORD=your_password

SESSION_SECRET=your_secret_key
SESSION_MAX_AGE=86400000

MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

CORS_ORIGIN=http://localhost:3000
```

## License

ISC
