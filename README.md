# Panda Panel - Key Management System

A secure admin panel for generating and managing license keys with a RESTful API for key validation.

## Features

- 🔐 Secure authentication system with JWT
- 🔑 Generate and manage license keys
- 📊 Dashboard with key statistics
- ⏱️ Key expiry system
- 🔒 API for key validation
- 📱 Responsive UI built with React and Material UI

## Tech Stack

### Backend
- Node.js with Express
- MongoDB for data storage
- JWT for authentication
- Bcrypt for password hashing
- Rate limiting and security middleware

### Frontend
- React with Vite
- Material UI for components
- React Router for navigation
- Axios for API requests
- JWT decode for token handling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB installed locally or a MongoDB Atlas account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/panda-panel.git
cd panda-panel
```

2. Install dependencies for backend
```bash
cd backend
npm install
```

3. Install dependencies for frontend
```bash
cd ../frontend
npm install
```

4. Set up environment variables:
   - Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/key_management
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   NODE_ENV=development
   JWT_EXPIRY=7d
   ```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

3. Access the application at http://localhost:5173

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Key Management
- `GET /api/keys` - Get all keys (protected)
- `POST /api/keys` - Create a new key (protected)
- `GET /api/keys/:id` - Get a specific key (protected)
- `PUT /api/keys/:id` - Update a key (protected)
- `DELETE /api/keys/:id` - Delete a key (protected)
- `POST /api/keys/validate` - Validate a key (public)

## Deployment

### Frontend
Can be deployed to Vercel, Netlify, or other static hosting services.

### Backend
Can be deployed to AWS, Heroku, or other Node.js hosting services.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 

Live- https://panda-panel-frontend.vercel.app/login