# MongoDB Migration Guide

This guide explains the migration from Supabase to MongoDB with Node.js and Express.

## What Was Changed

### 1. User Authentication
- **User Model**: Added password field with bcrypt hashing
- **Auth Routes**: Created `/api/auth/signup` and `/api/auth/signin` endpoints
- **JWT Middleware**: Created authentication middleware for protected routes
- **AuthContext**: Updated to use real API endpoints instead of mocks

### 2. Database Population
- **Issue**: Models use string IDs instead of MongoDB ObjectIds, so `.populate()` doesn't work
- **Solution**: Created manual population helpers in `server/utils/populateHelper.js`
- **Updated Routes**: Fixed `enrollments.js`, `reviews.js`, and `certificates.js` to use manual population

### 3. API Integration
- **API Service**: Added authentication endpoints and automatic token injection
- **Auth Endpoints**: 
  - `POST /api/auth/signup` - Register new user
  - `POST /api/auth/signin` - Login user
  - `GET /api/auth/me` - Get current user (protected)

## Setup Instructions

### 1. Install MongoDB
You need MongoDB installed and running. Options:
- **Local**: Install MongoDB Community Edition
- **Docker**: `docker run -d -p 27017:27017 --name mongodb mongo`
- **Cloud**: Use MongoDB Atlas (free tier available)

### 2. Environment Variables
Create a `.env` file in the root directory with:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/skillup
# For MongoDB Atlas (cloud), use:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillup

# Server Port
PORT=5000

# JWT Secret Key (change this to a random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Razorpay Configuration (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend API URL (optional, defaults to http://localhost:5000/api)
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start the Server
```bash
# Install dependencies (if not already done)
npm install

# Start the server
npm run server

# Or with auto-reload
npm run dev:server
```

### 4. Start the Frontend
```bash
# In a separate terminal
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "full_name": "John Doe",
    "role": "user" // optional: "user", "instructor", "admin"
  }
  ```

- `POST /api/auth/signin` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `GET /api/auth/me` - Get current user (requires Bearer token)

### Protected Routes
Most routes now support JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Testing the Migration

1. **Test Signup**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","full_name":"Test User"}'
   ```

2. **Test Signin**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

3. **Test Protected Route**:
   ```bash
   curl http://localhost:5000/api/auth/me \
     -H "Authorization: Bearer <your-token>"
   ```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongosh` or check service status
- Verify connection string in `.env`
- Check firewall settings if using remote MongoDB

### Authentication Issues
- Verify JWT_SECRET is set in `.env`
- Check token expiration (default: 7 days)
- Ensure token is included in Authorization header

### Population Issues
- If you see empty objects in populated fields, check the `populateHelper.js` functions
- Verify that referenced IDs exist in the database

## Next Steps

1. **Add Authentication to Routes**: Protect routes that require authentication using the `authenticate` middleware
2. **Add Role-Based Access**: Use `requireRole` or `requireAdmin` middleware for admin routes
3. **Error Handling**: Add better error handling and validation
4. **Testing**: Add unit and integration tests
5. **Production**: 
   - Use strong JWT_SECRET
   - Enable HTTPS
   - Add rate limiting
   - Set up proper CORS for production domain

## Files Modified/Created

### Created:
- `server/routes/auth.js` - Authentication routes
- `server/middleware/auth.js` - JWT authentication middleware
- `server/utils/populateHelper.js` - Manual population helpers
- `MIGRATION_GUIDE.md` - This file

### Modified:
- `server/models/User.js` - Added password field and hashing
- `server/server.js` - Added auth routes
- `server/routes/enrollments.js` - Fixed population
- `server/routes/reviews.js` - Fixed population
- `server/routes/certificates.js` - Fixed population
- `src/contexts/AuthContext.tsx` - Connected to real API
- `src/services/api.js` - Added auth endpoints and token handling
