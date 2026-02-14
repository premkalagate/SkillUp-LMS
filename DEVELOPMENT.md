# Development Guide

## Running the Application

This project has separate client (React/Vite) and server (Node.js/Express) components that can be run independently.

### Option 1: Run Separately (Recommended for Development)

**Terminal 1 - Start the Backend Server:**
```bash
npm run server
```
This starts the Express server on port 5000 (default).

For development with auto-reload:
```bash
npm run dev:server
```

**Terminal 2 - Start the Frontend Client:**
```bash
npm run dev
```
This starts the Vite dev server on port 8080 (default).

### Option 2: Run Both Together

If you want to run both client and server in a single terminal:
```bash
npm run dev:all
```

This uses `concurrently` to run both processes simultaneously.

## Ports

- **Frontend (Vite)**: http://localhost:8080
- **Backend (Express)**: http://localhost:5000
- **API Base URL**: http://localhost:5000/api

## Environment Variables

Make sure you have a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/skillup
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend development server (Vite) |
| `npm run server` | Start backend server (Node.js) |
| `npm run dev:server` | Start backend with auto-reload (nodemon) |
| `npm run dev:all` | Start both frontend and backend together |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |

## Development Workflow

1. **Start MongoDB** (if using local MongoDB):
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo
   ```

2. **Start Backend** (Terminal 1):
   ```bash
   npm run dev:server
   ```

3. **Start Frontend** (Terminal 2):
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

## Troubleshooting

### Port Already in Use

If port 5000 or 8080 is already in use:

**Backend (port 5000):**
- Change `PORT` in `.env` file
- Or kill the process using the port

**Frontend (port 8080):**
- Edit `vite.config.ts` and change the port
- Or use: `npm run dev -- --port 3000`

### MongoDB Connection Issues

See `MONGODB_SETUP.md` for detailed MongoDB setup instructions.

### CORS Issues

If you see CORS errors, make sure:
- Backend is running on port 5000
- Frontend is running on port 8080
- CORS is enabled in `server/server.js` (it should be)

## Production Build

To build for production:

```bash
# Build frontend
npm run build

# The built files will be in the `dist` directory
# You can serve them with any static file server
```

For production, you'll typically:
- Deploy the backend separately (e.g., on Heroku, Railway, or AWS)
- Deploy the frontend separately (e.g., on Vercel, Netlify, or AWS S3)
- Update `VITE_API_BASE_URL` in your frontend build to point to your production API
