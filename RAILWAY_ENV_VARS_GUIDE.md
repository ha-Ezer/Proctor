# Railway Environment Variables Guide

## Variable Placement Strategy

### ✅ Backend Service Variables (Set at Backend Service Level)

Set these in: **Backend Service → Variables**

```
NODE_ENV=production

# Database (Railway automatically provides these from PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}
# OR use individual variables:
DATABASE_HOST=${{Postgres.PGHOST}}
DATABASE_PORT=${{Postgres.PGPORT}}
DATABASE_NAME=${{Postgres.PGDATABASE}}
DATABASE_USER=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}

# JWT Configuration
JWT_SECRET=<your-generated-secret>
JWT_EXPIRATION=2h
ADMIN_JWT_EXPIRATION=24h

# CORS (Update after frontend deploys)
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

**⚠️ IMPORTANT**: 
- **DO NOT** set `PORT` manually - Railway provides this automatically
- If you see `PORT` in your variables, **DELETE IT**

---

### ✅ Frontend Service Variables (Set at Frontend Service Level)

Set these in: **Frontend Service → Variables**

```
VITE_API_URL=https://your-backend-service.railway.app/api
```

---

### ❌ Project-Level Variables (Don't Use for Service-Specific Vars)

**Do NOT** set backend-specific variables at the project level if you've already set them at the service level. This can cause confusion.

**Exception**: If you have multiple backend services (unlikely), you could use project-level for shared variables, but service-level is preferred.

---

## Variable Precedence in Railway

1. **Service-level variables** (highest priority)
2. **Project-level variables** (lower priority)
3. **Railway-provided variables** (like PORT, DATABASE_URL from linked services)

---

## Common Mistakes to Avoid

### ❌ Setting PORT Manually
```bash
# DON'T DO THIS
PORT=3000
```
Railway automatically provides PORT - setting it manually can cause the "PORT must be integer" error.

### ❌ Duplicating Variables
If you set variables at both project and service level:
- Service-level takes precedence
- But it's confusing and error-prone
- **Solution**: Keep all backend vars at backend service level only

### ❌ Using Wrong Variable Names
```bash
# WRONG - Railway uses ${{Service.Variable}} syntax
DATABASE_URL=$DATABASE_URL

# CORRECT - Use Railway's reference syntax
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

---

## Recommended Setup

### Step 1: Backend Service Variables
Go to: **Backend Service → Variables tab**
- Set all backend-specific variables here
- Use Railway's `${{Postgres.DATABASE_URL}}` syntax for database connection

### Step 2: Frontend Service Variables  
Go to: **Frontend Service → Variables tab**
- Set `VITE_API_URL` pointing to your backend URL

### Step 3: Verify
- Check that PORT is NOT in your backend variables (Railway provides it)
- Check that variables are set at service level, not duplicated at project level

---

## Troubleshooting PORT Error

If you're getting "PORT variable must be integer between 0 and 65535":

1. **Check Backend Service Variables**:
   - Look for any `PORT=` entry
   - **DELETE IT** if found
   - Railway provides PORT automatically

2. **Check Project-Level Variables**:
   - If PORT is set at project level, remove it
   - Backend service will use Railway's automatic PORT

3. **Verify**:
   - After removing PORT, redeploy backend service
   - The error should be resolved

---

## Quick Checklist

- [ ] Backend variables set at **Backend Service** level only
- [ ] Frontend variables set at **Frontend Service** level only  
- [ ] **PORT variable NOT set** (Railway provides it)
- [ ] Database variables use Railway reference syntax: `${{Postgres.DATABASE_URL}}`
- [ ] No duplicate variables at project level
