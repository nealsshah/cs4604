# Job Applicant Tracking System

A Next.js web application for managing job applications and recruitment.

## Features

### Job Applicants
- Create and manage personal profile
- Upload resume
- Browse job postings
- Apply to job postings
- Track application status
- Withdraw applications
- Accept offer letters

### Recruiters
- Post and manage job openings
- Filter applicants by criteria
- Shortlist candidates
- Schedule interviews
- Manage interviews (reschedule, cancel)
- Manage offer letters

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
DB_HOST=localhost
DB_USER=jat_user
DB_PASSWORD=jat_pass_123
DB_NAME=jat_db
JWT_SECRET=your-secret-key-change-in-production
```

3. Initialize the Users table:
Run the SQL script `create_first_admin.sql` to create the Users table (if not already created).

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses the existing database schema from `Dump20251201.sql`. The Users table is created automatically with the following structure:

- UserID (INT, AUTO_INCREMENT, PRIMARY KEY)
- Username (VARCHAR(50), UNIQUE)
- PasswordHash (VARCHAR(64))
- UserType (ENUM: 'JobApplicant', 'Recruiter')
- CreatedAt (DATETIME)

## User Types

- **JobApplicant**: Can browse jobs, apply, and manage their profile
- **Recruiter**: Can post jobs, manage applicants, schedule interviews, and manage offers

## API Routes

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Applicant Routes
- `GET /api/applicant/profile` - Get profile
- `POST /api/applicant/profile` - Create/update profile
- `POST /api/applicant/resume` - Upload resume
- `GET /api/applicant/jobs` - Browse open jobs
- `GET /api/applicant/applications` - Get applications
- `POST /api/applicant/applications` - Apply to job
- `DELETE /api/applicant/applications` - Withdraw application
- `PUT /api/applicant/applications` - Accept offer

### Recruiter Routes
- `GET /api/recruiter/jobs` - Get job postings
- `POST /api/recruiter/jobs` - Create job posting
- `PUT /api/recruiter/jobs` - Update job posting
- `DELETE /api/recruiter/jobs` - Delete job posting
- `GET /api/recruiter/applicants` - Get applicants
- `GET /api/recruiter/applications` - Get applications
- `PUT /api/recruiter/applications` - Update application status
- `GET /api/recruiter/interviews` - Get interviews
- `POST /api/recruiter/interviews` - Schedule interview
- `PUT /api/recruiter/interviews` - Reschedule interview
- `DELETE /api/recruiter/interviews` - Cancel interview
- `GET /api/recruiter/offers` - Get offers
- `POST /api/recruiter/offers` - Create offer
- `DELETE /api/recruiter/offers` - Withdraw offer

