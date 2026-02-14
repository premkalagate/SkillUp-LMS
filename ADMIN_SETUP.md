# Admin User Setup Guide

## Creating the Admin User

An admin user has been set up with the following credentials:

- **Email**: `admin@test.com`
- **Password**: `test123`
- **Role**: `admin`

## How to Create the Admin User

### Step 1: Make sure MongoDB is running

Before creating the admin user, ensure MongoDB is running:

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Or start your local MongoDB service
```

### Step 2: Run the create admin script

```bash
npm run create-admin
```

This script will:
- Connect to your MongoDB database
- Check if an admin user with email `admin@test.com` already exists
- If it exists, update it with the new password and ensure role is `admin`
- If it doesn't exist, create a new admin user

### Step 3: Verify the admin user was created

You should see output like:
```
✅ Connected to MongoDB
✅ Admin user created successfully!
Email: admin@test.com
Password: test123
✅ Database connection closed
```

## Logging in as Admin

1. **Start your backend server** (if not already running):
   ```bash
   npm run server
   ```

2. **Start your frontend** (if not already running):
   ```bash
   npm run dev
   ```

3. **Navigate to the admin login page**:
   - Go to: http://localhost:8080/admin
   - Or click "Admin" in the navigation (if available)

4. **Enter credentials**:
   - Email: `admin@test.com`
   - Password: `test123`

5. **You'll be redirected to** `/admin/dashboard` upon successful login

## Admin Features

Once logged in as admin, you can:
- View dashboard analytics
- Manage users
- Manage courses
- Manage coupons
- View payments and enrollments
- Access all admin routes

## Troubleshooting

### "Admin user not found" or "Invalid credentials"

1. Make sure you ran `npm run create-admin`
2. Check that MongoDB is running and connected
3. Verify the email is exactly `admin@test.com` (case-sensitive)
4. Verify the password is exactly `test123`

### "Access denied" or "This account does not have admin privileges"

1. The user exists but doesn't have `role: 'admin'`
2. Run `npm run create-admin` again to update the user's role
3. Or manually update in MongoDB:
   ```javascript
   db.users.updateOne(
     { email: "admin@test.com" },
     { $set: { role: "admin" } }
   )
   ```

### "Database not connected"

1. Make sure MongoDB is running
2. Check your `.env` file has the correct `MONGODB_URI`
3. See `MONGODB_SETUP.md` for detailed MongoDB setup instructions

## Security Notes

⚠️ **Important**: The default admin credentials (`admin@test.com` / `test123`) are for development only!

For production:
1. Change the admin password immediately
2. Use a strong, unique password
3. Consider implementing additional security measures (2FA, IP whitelisting, etc.)
4. Never commit admin credentials to version control

## Changing Admin Password

To change the admin password, you can:

1. **Update the script** (`server/scripts/createAdmin.js`) with a new password
2. **Run the script again**: `npm run create-admin`
3. **Or use the API** (if you have a password change endpoint)

## Creating Additional Admin Users

To create additional admin users, you can:

1. **Modify the script** to accept parameters
2. **Or use the signup API** with `role: 'admin'`:
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newadmin@example.com",
       "password": "securepassword",
       "full_name": "New Admin",
       "role": "admin"
     }'
   ```

Note: In production, you may want to restrict who can create admin users.
