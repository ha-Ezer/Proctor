# Proctored Exam System - Backend API

Backend API server for the Proctored Exam System built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL 14+ (Railway or local)
- npm >= 9.0.0

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create PostgreSQL database on Railway:**
   - Go to [railway.app](https://railway.app)
   - Create new project → Add PostgreSQL
   - Copy connection details to `.env`

4. **Initialize database schema:**
   ```bash
   # Connect to your Railway PostgreSQL
   psql <your-railway-database-url>

   # Run the schema file
   \i ../database-schema.sql
   ```

5. **Migrate data:**
   ```bash
   npm run db:seed
   ```

6. **Start development server:**
   ```bash
   npm run dev
   ```

Server runs at: `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL connection pool
│   │   └── environment.ts       # Environment variable validation
│   ├── services/
│   │   ├── auth.service.ts      # Authentication logic
│   │   ├── session.service.ts   # Session management
│   │   ├── violation.service.ts # Violation logging
│   │   ├── exam.service.ts      # Exam operations
│   │   └── response.service.ts  # Response handling
│   ├── app.ts                   # Express app configuration
│   └── server.ts                # Server entry point
├── scripts/
│   └── migrate-questions.ts     # Data migration script
├── package.json
├── tsconfig.json
└── .env.example
```

## 🗄️ Database Schema

### Core Tables

- **students** - Authorized student emails
- **exams** - Exam configurations
- **questions** - 50 exam questions
- **question_options** - Multiple-choice options
- **exam_sessions** - Student exam attempts
- **responses** - Student answers
- **violations** - Proctoring violations
- **session_snapshots** - Auto-save progress
- **proctoring_reports** - Summary reports
- **admin_users** - Dashboard access

### Key Features

- UUID primary keys
- Foreign key relationships with CASCADE deletes
- 20+ indexes for performance
- JSONB for flexible metadata
- Automatic updated_at triggers
- 3 views for common queries

## 🔐 Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database (Railway PostgreSQL)
DATABASE_HOST=<railway-host>
DATABASE_PORT=5432
DATABASE_NAME=railway
DATABASE_USER=postgres
DATABASE_PASSWORD=<railway-password>

# JWT
JWT_SECRET=<generate-secure-secret>
JWT_EXPIRATION=2h
ADMIN_JWT_EXPIRATION=24h

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

## 📡 API Endpoints (Coming Soon)

### Student APIs
```
POST   /api/auth/student/login          # Authenticate student
GET    /api/exams/active                # Get exam with questions
POST   /api/sessions/start              # Start new exam session
POST   /api/sessions/:id/resume         # Resume with recovery data
POST   /api/responses/save              # Save answer (auto-save)
POST   /api/violations/log              # Log violation
POST   /api/sessions/:id/snapshot       # Save progress snapshot
POST   /api/sessions/:id/submit         # Submit exam
```

### Admin APIs
```
POST   /api/auth/admin/login            # Admin authentication
GET    /api/admin/sessions              # List all sessions (filtered)
GET    /api/admin/sessions/:id/details  # Detailed session view
GET    /api/admin/reports/export        # Export CSV/Excel
GET    /api/admin/dashboard/stats       # Dashboard statistics
POST   /api/admin/students/authorize    # Manage authorized students
```

## 🛠️ Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Compile TypeScript
npm start            # Run compiled code

# Database
npm run db:seed      # Migrate questions from index.html

# Testing
npm test             # Run tests
```

## 🔒 Security Features

- **JWT Authentication**: Separate tokens for students and admins
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Zod schemas for all requests
- **SQL Injection Prevention**: Parameterized queries
- **CORS**: Whitelist-based origin control
- **Helmet**: Security headers

## 📊 Migration

The `migrate-questions.ts` script extracts all 50 questions from `index.html` and populates the database:

- 30 multiple-choice questions with options
- 20 text/textarea questions
- All 10 authorized student emails
- Proper foreign key relationships

## 🚢 Deployment to Railway

1. **Create Railway project:**
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL:**
   ```bash
   railway add postgresql
   ```

3. **Set environment variables:**
   ```bash
   railway variables set JWT_SECRET=<your-secret>
   railway variables set ALLOWED_ORIGINS=https://yourfrontend.com
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

## 📝 Default Credentials

**Admin Dashboard:**
- Email: `admin@proctor.system`
- Password: `Admin@123`

⚠️ **CHANGE THIS PASSWORD IMMEDIATELY IN PRODUCTION**

## 🐛 Troubleshooting

### Database Connection Failed
- Check DATABASE_* variables in `.env`
- Verify Railway PostgreSQL is running
- Check firewall rules

### Migration Failed
- Ensure schema is applied first
- Check EXAM_ID matches database seed
- Verify PostgreSQL version >= 14

### Port Already in Use
```bash
# Change PORT in .env or kill process
lsof -ti:3000 | xargs kill -9
```

## 📚 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+
- **ORM**: Native pg driver with connection pooling
- **Auth**: JWT + bcrypt
- **Validation**: Zod
- **Security**: Helmet + CORS + Rate limiting

## 🎯 Next Steps

1. ✅ Backend structure complete
2. ✅ Database schema created
3. ✅ Core services implemented
4. ✅ Migration script ready
5. ⏳ Add API controllers and routes
6. ⏳ Build React frontend
7. ⏳ Create admin dashboard
8. ⏳ Deploy to production

## 📞 Support

For issues or questions:
- Check the migration plan: `/Users/pilgrim_13_1/.claude/plans/nested-prancing-parnas.md`
- Review database schema: `../database-schema.sql`
- Contact: ntimeben@gmail.com

## 📄 License

MIT
