# Backend Setup Guide

This guide will help you set up and run the proctored exam system backend.

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+ database
- Git

## Local Development Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL

Install PostgreSQL on your machine and create a database:

```bash
# Create database
createdb proctor_db

# Or using psql
psql -U postgres
CREATE DATABASE proctor_db;
\q
```

#### Option B: Railway PostgreSQL (Recommended)

1. Go to [Railway](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy connection details from Railway dashboard

### 3. Run Database Schema

```bash
# Connect to your database and run the schema
psql -U postgres -d proctor_db -f database-schema.sql

# Or if using Railway
psql postgresql://postgres:password@host:port/railway -f database-schema.sql
```

### 4. Configure Environment Variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_HOST=localhost           # Or Railway host
DATABASE_PORT=5432               # Or Railway port
DATABASE_NAME=proctor_db         # Or Railway database name
DATABASE_USER=postgres           # Or Railway user
DATABASE_PASSWORD=your_password  # Or Railway password

# JWT Configuration (Generate secure secrets)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRATION=2h
ADMIN_JWT_EXPIRATION=24h

# CORS Configuration (Frontend URLs)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Rate Limiting (Optional - defaults shown)
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
VIOLATION_RATE_LIMIT=20
AUTH_RATE_LIMIT=5

# Admin Email (Optional)
ADMIN_EMAIL=admin@yourdomain.com

# Logging
LOG_LEVEL=info
```

### 5. Create Admin User

You'll need to create an admin user manually in the database:

```sql
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@example.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5v4UmKw5bvZF2', -- password: 'admin123'
  'Admin User',
  'super_admin',
  true
);
```

**Note:** The above password hash is for `admin123`. For production, generate a secure hash:

```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('your_secure_password', 12);
console.log(hash);
```

### 6. Run Migration Script (Initial Data)

This will populate the database with questions and authorized students from your existing system:

```bash
npm run migrate
```

This is a **ONE-TIME** operation. After initial setup, manage questions and students through the admin dashboard.

### 7. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

Test the health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "environment": "development"
}
```

## Production Deployment (Railway)

### 1. Create Railway Project

1. Go to [Railway](https://railway.app)
2. Create new project
3. Add PostgreSQL service
4. Add new service → Connect GitHub repository

### 2. Configure Environment Variables in Railway

Add these variables in Railway dashboard:

```env
NODE_ENV=production
PORT=${{PORT}}  # Railway provides this automatically

# Database (Railway provides these automatically)
DATABASE_HOST=${{Postgres.PGHOST}}
DATABASE_PORT=${{Postgres.PGPORT}}
DATABASE_NAME=${{Postgres.PGDATABASE}}
DATABASE_USER=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}

# JWT Configuration (Use secure random strings)
JWT_SECRET=<generate-secure-64-char-string>
JWT_EXPIRATION=2h
ADMIN_JWT_EXPIRATION=24h

# CORS (Your frontend domains)
ALLOWED_ORIGINS=https://exam.yourdomain.com,https://admin.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
VIOLATION_RATE_LIMIT=20
AUTH_RATE_LIMIT=5

# Admin Email
ADMIN_EMAIL=admin@yourdomain.com

# Logging
LOG_LEVEL=info
```

### 3. Configure Build & Start Commands

In Railway settings:

- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Healthcheck Path**: `/health`

### 4. Deploy Database Schema

Connect to Railway PostgreSQL:

```bash
# Get connection string from Railway dashboard
psql postgresql://postgres:password@host:port/railway

# Run schema
\i database-schema.sql

# Create admin user
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES ('admin@example.com', '<bcrypt-hash>', 'Admin User', 'super_admin', true);
```

### 5. Run Migration (Initial Data)

Connect via Railway CLI or run migration script locally pointing to Railway database:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL=postgresql://postgres:password@host:port/railway

# Run migration
npm run migrate
```

### 6. Deploy

Push to GitHub and Railway will automatically deploy:

```bash
git push origin main
```

### 7. Verify Deployment

Test the deployed API:

```bash
curl https://your-backend.up.railway.app/health
```

## Testing the API

### 1. Test Student Login

```bash
curl -X POST http://localhost:3000/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "fullName": "Test Student"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "student": {
      "id": "uuid",
      "email": "student@example.com",
      "fullName": "Test Student"
    }
  }
}
```

### 2. Test Admin Login

```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 3. Test Get Active Exam

```bash
# Save the token from student login
TOKEN="your_student_token_here"

curl -X GET http://localhost:3000/api/exams/active \
  -H "Authorization: Bearer $TOKEN"
```

## Common Issues

### Issue: Database Connection Failed

**Solution:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_* environment variables
- Test connection: `psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME`

### Issue: UNAUTHORIZED_EMAIL Error

**Solution:**
- Student email not in authorized list
- Add student via admin API or directly in database:
  ```sql
  INSERT INTO students (email, full_name, is_authorized)
  VALUES ('student@example.com', 'Student Name', true);
  ```

### Issue: NO_ACTIVE_EXAM Error

**Solution:**
- No exam is marked as active
- Activate an exam via admin API or database:
  ```sql
  UPDATE exams SET is_active = true WHERE id = 'your-exam-id';
  ```

### Issue: CORS Error in Browser

**Solution:**
- Add your frontend URL to ALLOWED_ORIGINS in .env
- Restart the server after changing .env

### Issue: Rate Limit Exceeded

**Solution:**
- Wait for the rate limit window to expire (1-15 minutes)
- Adjust rate limits in .env if needed for development

## Development Scripts

```bash
# Run development server with auto-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production server
npm run start

# Run tests
npm test

# Run migration script (one-time initial setup)
npm run migrate

# Seed additional questions
npm run db:seed
```

## Database Management

### Backup Database

```bash
# Local
pg_dump -U postgres proctor_db > backup.sql

# Railway
pg_dump postgresql://postgres:password@host:port/railway > backup.sql
```

### Restore Database

```bash
# Local
psql -U postgres proctor_db < backup.sql

# Railway
psql postgresql://postgres:password@host:port/railway < backup.sql
```

### View Database Tables

```bash
psql -U postgres proctor_db

\dt                    # List all tables
\d students           # Describe students table
\d+ exam_sessions     # Detailed table info

SELECT * FROM students WHERE is_authorized = true;
SELECT * FROM exams WHERE is_active = true;
```

## Monitoring

### Check Server Logs (Railway)

Railway dashboard → Service → Logs

### Check Database Connections

```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'proctor_db';
```

### Check Active Sessions

```sql
SELECT COUNT(*) FROM exam_sessions WHERE status = 'in_progress';
```

## Security Checklist

Before deploying to production:

- [ ] Generate strong JWT_SECRET (64+ characters)
- [ ] Change default admin password
- [ ] Set NODE_ENV=production
- [ ] Configure proper ALLOWED_ORIGINS
- [ ] Enable Railway PostgreSQL backups
- [ ] Set up SSL/TLS (Railway handles this)
- [ ] Review rate limits
- [ ] Set up monitoring/alerts

## Next Steps

1. Set up frontend application (React)
2. Set up admin dashboard (React)
3. Configure custom domains
4. Set up monitoring (Railway provides metrics)
5. Test end-to-end flow

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Support

For issues or questions:
1. Check database connection and logs
2. Verify environment variables
3. Review API documentation
4. Check Railway service status
