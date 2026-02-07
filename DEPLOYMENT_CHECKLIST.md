# Deployment Checklist - Proctored Exam System

## ✅ Pre-Deployment Verification

### Code Quality
- [x] Backend TypeScript compiles successfully
- [x] Frontend TypeScript compiles successfully  
- [x] No linter errors
- [x] All recent fixes applied (student status, session counts, group counts, PDF export)

### Security
- [x] Authentication middleware in place
- [x] JWT validation configured
- [x] CORS properly configured
- [x] Rate limiting enabled
- [x] Helmet security headers enabled

---

## 🚀 Railway Deployment Steps

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** (recommended)
   - Connect your GitHub account if not already connected
   - Select this repository: `relaxed-mirzakhani`

### Step 2: Deploy PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait for PostgreSQL to provision
4. Once ready, note the **DATABASE_URL** from the service variables

### Step 3: Deploy Backend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** → Select this repository
3. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run railway:build`
   - **Start Command**: `npm run railway:start`

4. **Set Environment Variables** (in Railway dashboard → Variables):
   ```
   NODE_ENV=production
   # PORT is automatically provided by Railway - DO NOT set it manually
   # If you need to override, use: PORT=3000 (must be integer 0-65535)
   
   # Database (use the PostgreSQL service reference)
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   
   # OR use individual variables:
   DATABASE_HOST=${{Postgres.PGHOST}}
   DATABASE_PORT=${{Postgres.PGPORT}}
   DATABASE_NAME=${{Postgres.PGDATABASE}}
   DATABASE_USER=${{Postgres.PGUSER}}
   DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
   
   # JWT Configuration (IMPORTANT: Generate a secure secret!)
   JWT_SECRET=<generate-a-secure-64-character-random-string>
   JWT_EXPIRATION=2h
   ADMIN_JWT_EXPIRATION=24h
   
   # CORS (Update with your frontend URL after deployment)
   ALLOWED_ORIGINS=https://your-frontend.railway.app
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   VIOLATION_RATE_LIMIT=20
   AUTH_RATE_LIMIT=5
   
   # Admin Email (Optional)
   ADMIN_EMAIL=admin@yourdomain.com
   
   # Logging
   LOG_LEVEL=info
   ```

5. **Generate JWT Secret** (run locally):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and use it as `JWT_SECRET`

### Step 4: Initialize Database Schema

Once backend is deployed, run the database schema:

**Option A: Using Railway CLI**
```bash
railway link
railway run psql $DATABASE_URL < database-schema.sql
```

**Option B: Using Railway Dashboard**
1. Go to PostgreSQL service → **"Connect"** → Copy connection string
2. Run locally:
   ```bash
   psql <your-railway-database-url> < database-schema.sql
   ```

**Option C: Using Railway SQL Editor**
1. Go to PostgreSQL service → **"Data"** tab
2. Copy contents of `database-schema.sql`
3. Paste and execute in SQL editor

### Step 5: Run Database Migrations

Run these migrations in order (if not already in schema):

1. **Student Groups Migration**:
   ```bash
   psql $DATABASE_URL < database-migration-student-groups.sql
   ```

2. **Exam Report Colors Migration**:
   ```bash
   psql $DATABASE_URL < backend/database-migration-exam-report-colors-use-session-id.sql
   ```

3. **Session Question Notes Migration**:
   ```bash
   psql $DATABASE_URL < backend/database-migration-session-question-notes.sql
   ```

### Step 6: Create Admin User

**Option A: Using Railway SQL Editor**
```sql
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@example.com',
  '$2b$12$yHsib2bOEvFq09p7Ur61XelK3RXF.Db1o58cKuv6NGv4X6Pd8DwaG', -- Password: Admin@123
  'System Administrator',
  'super_admin',
  true
);
```

**Option B: Using Script (run locally)**
```bash
cd backend
DATABASE_URL=<your-railway-database-url> npm run create-admin
```

**Option C: Generate Custom Password Hash**
```bash
cd backend
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourSecurePassword123', 12).then(h => console.log(h))"
```
Then insert into database with the generated hash.

### Step 7: Deploy Frontend Service

1. In your Railway project, click **"+ New"**
2. Select **"GitHub Repo"** → Select this repository
3. Configure the service:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run railway:build`
   - **Start Command**: `npx serve -s dist -l $PORT`

4. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-service.railway.app/api
   ```

5. **Update Backend CORS**: After frontend deploys, update backend `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://your-frontend-service.railway.app
   ```

### Step 8: Verify Deployment

1. **Backend Health Check**:
   ```bash
   curl https://your-backend.railway.app/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Test Admin Login**:
   - Go to frontend URL
   - Navigate to admin login
   - Use credentials: `admin@example.com` / `Admin@123` (or your custom password)

3. **Test Database Connection**:
   - Backend logs should show: `✅ Database connection: OK`

---

## 🔧 Post-Deployment Tasks

### 1. Update Admin Password
Change the default admin password immediately:
```bash
cd backend
DATABASE_URL=<your-url> npm run reset-admin-password admin@example.com YourNewSecurePassword
```

### 2. Configure Custom Domain (Optional)
1. In Railway dashboard → Service → Settings → Networking
2. Add custom domain
3. Update `ALLOWED_ORIGINS` in backend to include custom domain

### 3. Set Up Monitoring
- Enable Railway metrics
- Set up alerts for:
  - High CPU usage (> 80%)
  - High memory usage (> 80%)
  - Service crashes
  - Database connection failures

### 4. Backup Configuration
Railway automatically backs up PostgreSQL on paid plans. For manual backup:
```bash
railway run pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## ⚠️ Important Notes

1. **JWT_SECRET**: Must be changed from default in production (enforced by code)
2. **Database Migrations**: Run all migrations before first use
3. **CORS**: Must include your frontend URL(s)
4. **Admin User**: Create at least one admin user before use
5. **Environment Variables**: All required variables must be set

---

## 🐛 Troubleshooting

### Backend won't start
- Check environment variables are set correctly
- Verify database connection string
- Check Railway logs for errors

### Database connection fails
- Verify PostgreSQL service is running
- Check `DATABASE_URL` or individual `DATABASE_*` variables
- Ensure backend service is linked to PostgreSQL service

### CORS errors
- Verify `ALLOWED_ORIGINS` includes your frontend URL
- Check frontend `VITE_API_URL` points to backend URL
- Ensure URLs match exactly (including https/http)

### Admin login fails
- Verify admin user exists in database
- Check password hash matches
- Verify `is_active = true` in database

---

## ✅ Deployment Complete Checklist

- [ ] Backend service deployed and healthy
- [ ] Database schema initialized
- [ ] All migrations run
- [ ] Admin user created
- [ ] Frontend service deployed
- [ ] CORS configured correctly
- [ ] Admin can log in
- [ ] Health check endpoint responds
- [ ] Test student login works
- [ ] Test exam creation works
- [ ] Test session creation works

---

**Ready to deploy!** Follow the steps above in order. If you encounter any issues, check the troubleshooting section or Railway logs.
