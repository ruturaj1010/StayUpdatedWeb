Store Management Frontend

Frontend for the Store Management System, built with React 19, Vite, and Tailwind CSS, connected to the Node.js/Express backend.

🚀 Features

React 19 with modern hooks

JWT authentication with role-based dashboards

Store CRUD and rating system

Responsive UI with Tailwind CSS

Toast notifications for feedback

React Query for data fetching & caching

Axios for API integration

📋 Prerequisites
Node.js v16+

npm

Backend API running (see backend README)

🛠️ Installation
cd ./frontend
npm install

🚀 Running the Application

Development server:
npm run dev


Runs at: http://localhost:5173

🎨 Dashboards

Public: Home, Login, Signup, Stores List
Admin: Manage users, manage stores, system stats
Store Owner: Manage owned stores, view ratings
User: Browse stores, submit ratings, manage profile

🔐 Authentication Flow
Login → /api/auth/login → store JWT in localStorage
Role-based routing (Admin / Store Owner / User)
Logout clears JWT
Protected routes check token

🔌 API Integration
Centralized Axios instance with interceptors
Service layer: auth.js, admin.js, owner.js, user.js, stores.js
Automatic token attachment and error handling

🎨 Styling
Tailwind CSS utility-first classes
Responsive across mobile, tablet, desktop


🔄 Project Structure
frontend/
├── public/
├── src/
│   ├── api/axios.js
│   ├── components/     # Auth, modals, tables, UI
│   ├── layouts/        # Main layout, ToastProvider
│   ├── pages/          # Dashboards & pages
│   ├── services/       # API service layer
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── routes.jsx
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── eslint.config.js