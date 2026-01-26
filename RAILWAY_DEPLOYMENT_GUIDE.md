# Railway Deployment Guide: Proctored Exam System

## Prerequisites

- Railway account (sign up at railway.app)
- GitHub repository (recommended) or direct project upload
- Database connection strings ready
- Environment variables prepared

---

## Architecture Overview

```
┌──────────────────┐
│   Railway.app    │
├──────────────────┤
│  PostgreSQL DB   │  <-- Service 1
│  (Port 5432)     │
└──────────────────┘
         ↑
         │
┌──────────────────┐
│  Backend API     │  <-- Service 2
│  Node.js/Express │
│  (Port 3000)     │
└──────────────────┘
         ↑
         │
┌──────────────────┐
│   Frontend       │  <-- Service 3
│  React/Vite      │
│  (Static Files)  │
└──────────────────┘
```

---

## Step 1: Prepare the Codebase

### 1.1 Create Railway-Specific Files

Create `railway.json` in project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.2 Update Backend Package.json

Add these scripts to `backend/package.json`:

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "nodemon src/server.ts",
    "railway:build": "npm install && npm run build",
    "railway:start": "node dist/server.js"
  }
}
```

### 1.3 Update Frontend Package.json

Add build script to `frontend/package.json`:

```json
{
  "scripts": {
    "build": "tsc && vite build",
    "preview": "vite preview",
    "railway:build": "npm install && npm run build"
  }
}
```

### 1.4 Create .railwayignore Files

Create `backend/.railwayignore`:
```
node_modules/
.env
.env.local
dist/
*.log
.DS_Store
```

Create `frontend/.railwayignore`:
```
node_modules/
.env
.env.local
.env.production
dist/
*.log
.DS_Store
```

---

## Step 2: Set Up Railway Project

### 2.1 Create New Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Choose "Deploy from GitHub repo" (recommended) or "Empty Project"

### 2.2 Add PostgreSQL Database

1. Click "+ New" in your project
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provision the database
4. Note: Database URL will be available as `${{Postgres.DATABASE_URL}}`

### 2.3 Run Database Migrations

Once PostgreSQL is created, connect and run migrations:

```bash
# Get database URL from Railway dashboard
export DATABASE_URL="postgresql://user:pass@host:port/dbname"

# Run all migration scripts
psql $DATABASE_URL < backend/database-schema.sql
psql $DATABASE_URL < backend/database-migration-student-groups.sql
psql $DATABASE_URL < backend/database-migration-exam-report-colors.sql
psql $DATABASE_URL < backend/database-migration-exam-report-colors-use-session-id.sql
psql $DATABASE_URL < backend/database-migration-session-question-notes.sql
```

Or use Railway's built-in PostgreSQL client in the dashboard.

---

## Step 3: Deploy Backend Service

### 3.1 Add Backend Service

1. Click "+ New" → "GitHub Repo" or "Empty Service"
2. If using GitHub:
   - Select your repository
   - Set root directory to `/backend`
3. If using empty service:
   - Deploy via Railway CLI (see below)

### 3.2 Configure Backend Environment Variables

In Railway dashboard, go to Backend service → Variables:

```bash
NODE_ENV=production
PORT=3000

# Database (auto-populated from Postgres service)
DATABASE_HOST=${{Postgres.PGHOST}}
DATABASE_PORT=${{Postgres.PGPORT}}
DATABASE_NAME=${{Postgres.PGDATABASE}}
DATABASE_USER=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}

# Or use single DATABASE_URL
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret (generate strong secret)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# CORS (update after frontend deployment)
ALLOWED_ORIGINS=https://your-frontend.railway.app

# Server
SERVER_PORT=3000
```

**Generate JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Configure Build Settings

In Settings tab:
- **Build Command**: `npm run railway:build`
- **Start Command**: `npm run railway:start`
- **Root Directory**: `/backend` (if monorepo)
- **Watch Paths**: `/backend/**`

### 3.4 Deploy Backend

Railway will automatically build and deploy. Check logs for any errors.

**Verify Deployment**:
```bash
curl https://your-backend.railway.app/api/health
```

---

## Step 4: Deploy Frontend Service

### 4.1 Add Frontend Service

1. Click "+ New" → "GitHub Repo" or "Empty Service"
2. Select your repository
3. Set root directory to `/frontend`

### 4.2 Configure Frontend Environment Variables

In Railway dashboard, go to Frontend service → Variables:

```bash
# Backend API URL (use your backend Railway URL)
VITE_API_URL=https://your-backend.railway.app/api

# Feature flags (optional)
VITE_ENABLE_PROCTORING=true
```

### 4.3 Configure Build Settings

In Settings tab:
- **Build Command**: `npm run railway:build`
- **Start Command**: `npx serve -s dist -l $PORT`
- **Root Directory**: `/frontend` (if monorepo)
- **Install Command**: `npm install && npm install -g serve`

### 4.4 Add serve Package

Update `frontend/package.json`:

```json
{
  "scripts": {
    "railway:build": "npm install && npm run build",
    "railway:start": "npx serve -s dist -l $PORT"
  }
}
```

### 4.5 Deploy Frontend

Railway will build and deploy automatically.

**Verify Deployment**:
```bash
curl https://your-frontend.railway.app
```

---

## Step 5: Configure CORS

### 5.1 Update Backend CORS Settings

After frontend is deployed, update `ALLOWED_ORIGINS` in backend:

```bash
ALLOWED_ORIGINS=https://your-frontend.railway.app,https://your-custom-domain.com
```

### 5.2 Update Frontend API URL

Ensure frontend environment variable points to backend:

```bash
VITE_API_URL=https://your-backend.railway.app/api
```

---

## Step 6: Custom Domains (Optional)

### 6.1 Add Custom Domain to Frontend

1. Go to Frontend service → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `exam.yourdomain.com`)
4. Add DNS records at your domain provider:

```
Type: CNAME
Name: exam
Value: your-frontend.railway.app
```

### 6.2 Add Custom Domain to Backend (Optional)

1. Go to Backend service → Settings → Domains
2. Add custom API domain (e.g., `api.yourdomain.com`)
3. Update DNS:

```
Type: CNAME
Name: api
Value: your-backend.railway.app
```

4. Update frontend `VITE_API_URL` to use custom domain:

```bash
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Step 7: Initialize Database with Admin User

### 7.1 Create First Admin User

Connect to Railway PostgreSQL:

```sql
-- Create admin user
INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
VALUES (
  'admin@yourdomain.com',
  '$2b$12$hashedpassword', -- Use bcrypt to hash password
  'Admin User',
  'super_admin',
  true
);
```

**Generate Password Hash**:
```bash
node -e "console.log(require('bcryptjs').hashSync('YourPassword123', 12))"
```

### 7.2 Add Initial Students (Optional)

```sql
INSERT INTO students (email, full_name, is_authorized)
VALUES
  ('student1@example.com', 'Student One', true),
  ('student2@example.com', 'Student Two', true);
```

---

## Step 8: Health Checks and Monitoring

### 8.1 Configure Health Check Endpoint

Railway automatically monitors `/` endpoint. Create health check:

In `backend/src/server.ts`, add:

```typescript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 8.2 Set Up Monitoring

1. Go to project → Settings → Observability
2. Enable metrics collection
3. Set up alerts for:
   - High CPU usage (> 80%)
   - High memory usage (> 80%)
   - Service crashes
   - Database connection failures

---

## Step 9: Scaling Configuration

### 9.1 Vertical Scaling

In Service → Settings → Resources:
- **Memory**: 512MB (default) to 2GB (for larger loads)
- **CPU**: Shared (default) or Dedicated

### 9.2 Horizontal Scaling (Pro Plan Required)

For production, consider:
- **Backend**: 2-3 replicas for high availability
- **Database**: Read replicas for performance
- **Frontend**: CDN caching

---

## Step 10: Backup and Recovery

### 10.1 Database Backups

Railway automatically backs up PostgreSQL daily (on paid plans).

Manual backup:
```bash
# Download from Railway CLI
railway run pg_dump $DATABASE_URL > backup.sql

# Or via pg_dump locally
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 10.2 Restore from Backup

```bash
railway run psql $DATABASE_URL < backup.sql
```

---

## Deployment Checklist

### Pre-Deployment:
- [ ] All TypeScript errors fixed ✅
- [ ] Environment variables documented
- [ ] Database migrations prepared
- [ ] Build scripts tested locally
- [ ] CORS settings configured
- [ ] JWT secret generated

### Post-Deployment:
- [ ] Health check endpoint responds
- [ ] Database migrations ran successfully
- [ ] Admin user created
- [ ] Frontend can connect to backend
- [ ] CORS allows frontend requests
- [ ] All API endpoints functional
- [ ] File uploads working (if applicable)
- [ ] Proctoring features active

### Testing:
- [ ] Student can log in
- [ ] Student can take exam
- [ ] Admin can log in
- [ ] Admin can view sessions
- [ ] Admin can create exams
- [ ] Violations are logged
- [ ] Auto-save works
- [ ] Progress recovery works

---

## Common Issues and Solutions

### Issue: Database Connection Failed

**Error**: `Error: connect ETIMEDOUT`

**Solution**:
1. Check `DATABASE_URL` format
2. Verify database service is running
3. Ensure backend service has access to Postgres service
4. Check Railway service linking

### Issue: CORS Error in Browser

**Error**: `Access-Control-Allow-Origin header is missing`

**Solution**:
1. Update `ALLOWED_ORIGINS` in backend
2. Ensure frontend URL is included
3. Restart backend service
4. Clear browser cache

### Issue: Build Fails

**Error**: `npm ERR! code ELIFECYCLE`

**Solution**:
1. Check build logs in Railway dashboard
2. Verify `package.json` scripts
3. Ensure all dependencies are in `dependencies` (not `devDependencies`)
4. Check Node version compatibility

### Issue: Environment Variables Not Loading

**Error**: `process.env.VARIABLE is undefined`

**Solution**:
1. Check Railway dashboard → Service → Variables
2. Restart service after adding variables
3. Use Railway's `${{ServiceName.VARIABLE}}` syntax for service references
4. Verify variable names match code

---

## Cost Estimate (Railway Pricing)

**Hobby Plan** (Free):
- $5/month credit
- Good for development/staging
- Shared CPU, 512MB RAM
- Auto-sleep after inactivity

**Pro Plan** ($20/month):
- Includes $20 usage
- Production-ready
- No auto-sleep
- Custom domains
- Priority support

**Estimated Monthly Cost**:
- PostgreSQL: $5-10/month (500MB-1GB)
- Backend: $5-10/month (512MB RAM, light traffic)
- Frontend: $5/month (static hosting)
- **Total**: ~$15-25/month on Pro plan

---

## Alternative: Single Service Deployment

For smaller deployments, combine frontend and backend:

```bash
# Serve frontend from backend
backend/
  src/
  public/  <-- Build frontend here
```

Update `backend/src/server.ts`:

```typescript
import path from 'path';

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
```

This reduces cost to 1 service + database (~$10-15/month).

---

## Security Checklist

- [ ] JWT secret is strong (32+ characters)
- [ ] Database has strong password
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] SQL injection protection (using parameterized queries) ✅
- [ ] XSS protection enabled
- [ ] HTTPS enforced (Railway provides this automatically) ✅
- [ ] Environment variables are not committed to git ✅
- [ ] Admin passwords are hashed ✅
- [ ] Session tokens expire appropriately

---

## Next Steps After Deployment

1. **Monitor Performance**
   - Set up alerts for downtime
   - Monitor response times
   - Track error rates

2. **Optimize Costs**
   - Review usage after first month
   - Adjust resources as needed
   - Consider caching strategies

3. **Improve Reliability**
   - Add database connection pooling
   - Implement retry logic
   - Set up automated backups

4. **Enhance Features**
   - Add email notifications
   - Implement analytics
   - Create admin reports

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Status Page**: https://status.railway.app
- **Pricing**: https://railway.app/pricing

---

**Deployment Status**: Ready ✅
**Estimated Setup Time**: 1-2 hours
**Difficulty**: Intermediate

**Date**: January 2026
