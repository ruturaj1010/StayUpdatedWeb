Store Management REST API

A Node.js/Express REST API for managing stores, users, and ratings with role-based authentication.

🚀 Features
JWT authentication with role-based access

Admin, Store Owner, and User roles

Store CRUD with ownership validation

Store rating system with pagination & statistics

Input validation using express-validator

MySQL with connection pooling

Secure password hashing with bcrypt


🛠️ Installation
cd ./backend
npm install

Create .env file:

PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=systemdb
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development

Setup Database:

mysql -u root -p
CREATE DATABASE systemdb;
mysql -u root -p systemdb < schema.sql

Run server:
npm run dev

Server: http://localhost:5000

📚 API Endpoints
Auth (/api/auth)

POST /register

POST /login

POST /logout

Admin (/api/admin)

GET /users

POST /users

PATCH /users/:id

DELETE /users/:id

GET /stores

POST /stores

Store Owner (/api/owner)

GET /stores

GET /stores/:id/ratings

PATCH /stores/:id

User (/api/user)

GET /stores

POST /stores/:id/ratings

GET /profile

PATCH /profile

Stores (/api/stores)

GET /

GET /:id

GET /:id/ratings

🗄️ Database Schema
Users
id, email, name, address, password, role, created_at

Stores
id, name, address, owner_id, created_at

Ratings
id, user_id, store_id, score, created_at, UNIQUE(user_id, store_id)

📊 API Response Format

Success
{ "success": true, "data": { ... } }

Error
{ "success": false, "message": "Error description" }

🔧 Project Structure
backend/
├── config/database.js
├── controllers/
├── middleware/auth.js
├── models/
├── routes/
├── utils/validation.js
├── index.js
├── schema.sql
└── package.json
