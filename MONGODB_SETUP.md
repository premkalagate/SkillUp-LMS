# MongoDB Setup Guide

## Quick Start

Your application is trying to connect to MongoDB but it's not running. Here are the quickest ways to get MongoDB running:

### Option 1: Docker (Easiest - Recommended)

If you have Docker installed:

```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

This will:
- Download MongoDB image (if not already downloaded)
- Start MongoDB on port 27017
- Run in the background

To stop MongoDB:
```bash
docker stop mongodb
```

To start it again:
```bash
docker start mongodb
```

To remove the container:
```bash
docker rm mongodb
```

### Option 2: MongoDB Community Edition (Local Installation)

1. **Download MongoDB:**
   - Windows: https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: Follow instructions at https://docs.mongodb.com/manual/installation/

2. **Start MongoDB Service:**
   - Windows: MongoDB should start automatically as a service
   - Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`

3. **Verify it's running:**
   ```bash
   mongosh
   # or
   mongo
   ```

### Option 3: MongoDB Atlas (Cloud - Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (free tier M0)
4. Get your connection string
5. Update your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillup
   ```

## Verify MongoDB is Running

### Check Connection

1. **Test with mongosh/mongo:**
   ```bash
   mongosh
   # or
   mongo
   ```

2. **Check if port is open:**
   ```bash
   # Windows
   netstat -an | findstr 27017
   
   # Mac/Linux
   lsof -i :27017
   ```

3. **Test from your app:**
   Visit: http://localhost:5000/api/health
   
   You should see:
   ```json
   {
     "status": "OK",
     "database": {
       "status": "connected",
       "readyState": 1
     }
   }
   ```

## Common Issues

### "Connection refused" or "ECONNREFUSED"

**Cause:** MongoDB is not running

**Solution:**
- Start MongoDB using one of the methods above
- Check if MongoDB service is running: `sudo systemctl status mongod` (Linux) or check Services (Windows)

### "Operation buffering timed out"

**Cause:** MongoDB is not accessible or connection string is wrong

**Solution:**
1. Verify MongoDB is running (see above)
2. Check your `.env` file has the correct `MONGODB_URI`
3. For local MongoDB, use: `mongodb://localhost:27017/skillup`
4. For MongoDB Atlas, ensure your IP is whitelisted in Network Access

### "Authentication failed"

**Cause:** Wrong credentials (for MongoDB Atlas)

**Solution:**
- Check your MongoDB Atlas username and password
- Ensure your IP address is whitelisted in MongoDB Atlas Network Access

## Environment Variables

Make sure your `.env` file contains:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/skillup

# For MongoDB Atlas (cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillup

PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## After MongoDB is Running

1. Restart your Node.js server:
   ```bash
   npm run server
   ```

2. You should see in the console:
   ```
   ✅ Connected to MongoDB successfully
   Server running on port 5000
   ```

3. Test the API:
   - Health check: http://localhost:5000/api/health
   - Try signing up: http://localhost:5000/api/auth/signup

## Need Help?

- Check server console for error messages
- Visit `/api/health` endpoint to see database status
- Verify MongoDB is running with `mongosh` or `mongo` command
- Check firewall settings if using remote MongoDB
